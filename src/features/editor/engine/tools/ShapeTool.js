import { Tool } from './Tool';
import { Circle as FabricCircle } from '@/features/editor/utils/fabricFactory';
import {
  createInteractiveShape,
  updateInteractiveShape,
  getShapeAnchors,
} from '@/features/editor/lib/canvasUtils';

const ANCHOR_PICK_RADIUS = 15;

const distance = (a, b) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * ShapeTool — instantiated per shape type (rectangle, circle, …,
 * line). Drag to draw, click an existing object to select. The
 * `line` variant also renders anchor helpers on layer objects and
 * promotes the drawn line to a connector when both endpoints snap.
 */
export class ShapeTool extends Tool {
  constructor(engine, type) {
    super(engine);
    this.type = type;
    this._drawingShape = null;
    this._startPoint = null;
    this._anchorHelpers = [];
  }

  activate() {
    const fabric = this.engine.canvas.fabric;
    if (!fabric) return;
    fabric.selection = false;
    fabric.isDrawingMode = false;
    if (this.type === 'line') this._showAnchors();
  }

  deactivate() {
    this._clearAnchors();
    this._drawingShape = null;
    this._startPoint = null;
  }

  // -------------------------
  // Anchor helpers (line connector)
  // -------------------------
  _showAnchors() {
    this._clearAnchors();
    const fabric = this.engine.canvas.fabric;
    if (!fabric) return;

    fabric.getObjects().forEach((obj) => {
      if (!obj?.data?.id) return;
      if (obj.type === 'line' || obj.type === 'i-text' || obj.excludeFromExport) return;

      const anchors = getShapeAnchors(obj);
      anchors.forEach((a) => {
        const helper = new FabricCircle({
          left: a.x,
          top: a.y,
          radius: 5,
          fill: '#ffffff',
          stroke: '#10b981',
          strokeWidth: 2,
          selectable: false,
          evented: true,
          originX: 'center',
          originY: 'center',
          hoverCursor: 'crosshair',
          excludeFromExport: true,
          data: { anchor: true, ownerId: a.ownerId, anchorName: a.name },
        });
        helper.on('mouseover', () => {
          helper.set({ fill: '#10b981', radius: 7 });
          this.engine.render.schedule();
        });
        helper.on('mouseout', () => {
          helper.set({ fill: '#ffffff', radius: 5 });
          this.engine.render.schedule();
        });
        fabric.add(helper);
        this._anchorHelpers.push(helper);
      });
    });
    this.engine.render.schedule();
  }

  _clearAnchors() {
    const fabric = this.engine.canvas.fabric;
    this._anchorHelpers.forEach((h) => {
      try {
        if (fabric) fabric.remove(h);
      } catch (_err) {
        /* ignore */
      }
    });
    this._anchorHelpers = [];
    if (fabric) this.engine.render.schedule();
  }

  // -------------------------
  // Mouse handlers
  // -------------------------
  onMouseDown(opt) {
    if (this.engine.canvas.tryStartPan(opt, { keyOnly: true })) return;

    const fabric = this.engine.canvas.fabric;
    if (!fabric) return;
    const target = opt.target;

    // Click on existing layer object → select it.
    if (target?.data?.id && target.selectable !== false) {
      fabric.setActiveObject(target);
      this.engine.render.schedule();
      return;
    }

    const pointer = fabric.getPointer(opt.e);
    const ctx = this.context;
    const counter = ctx.elementCounterRef?.current ?? 0;
    const id = `element-${counter}`;
    const shape = createInteractiveShape({
      type: this.type,
      id,
      x: pointer.x,
      y: pointer.y,
      textColor: ctx.textColor,
    });
    if (!shape) return;

    this._startPoint = pointer;
    this._drawingShape = shape;

    // Line tool: if mousedown landed on an anchor helper, seed the
    // connector with sourceId/sourceAnchor.
    if (this.type === 'line' && target?.data?.anchor) {
      shape.set({
        x1: target.left,
        y1: target.top,
        x2: target.left,
        y2: target.top,
        data: {
          ...shape.data,
          connector: true,
          sourceId: target.data.ownerId,
          sourceAnchor: target.data.anchorName,
        },
      });
    }

    fabric.discardActiveObject();
    fabric.add(shape);
    this.engine.render.schedule();
  }

  onMouseMove(opt) {
    if (this.engine.canvas.panMove(opt)) return;
    if (!this._drawingShape || !this._startPoint) return;

    const fabric = this.engine.canvas.fabric;
    const pointer = fabric.getPointer(opt.e);
    updateInteractiveShape({
      shape: this._drawingShape,
      type: this.type,
      startX: this._startPoint.x,
      startY: this._startPoint.y,
      currentX: pointer.x,
      currentY: pointer.y,
    });
    this.engine.render.schedule();
  }

  onMouseUp(opt) {
    if (this.engine.canvas.endPan()) {
      const fabric = this.engine.canvas.fabric;
      if (fabric) fabric.selection = false;
      return;
    }
    if (!this._drawingShape || !this._startPoint) return;

    const fabric = this.engine.canvas.fabric;
    const shape = this._drawingShape;
    const start = this._startPoint;

    const width =
      this.type === 'line'
        ? Math.abs((shape.x2 ?? start.x) - (shape.x1 ?? start.x))
        : (shape.getScaledWidth?.() ?? shape.width ?? 0);
    const height =
      this.type === 'line'
        ? Math.abs((shape.y2 ?? start.y) - (shape.y1 ?? start.y))
        : (shape.getScaledHeight?.() ?? shape.height ?? 0);

    this._drawingShape = null;
    this._startPoint = null;

    if (width < 5 && height < 5) {
      fabric.remove(shape);
      this.engine.render.schedule();
      return;
    }

    shape.set({ selectable: true, evented: true });

    // Snap line endpoint to nearby anchor → promote to connector.
    if (this.type === 'line' && shape.data?.connector) {
      const pointer = fabric.getPointer(opt.e);
      const targetAnchor = this._anchorHelpers.find(
        (h) => distance({ x: h.left, y: h.top }, pointer) < ANCHOR_PICK_RADIUS,
      );
      if (targetAnchor) {
        shape.set({
          x2: targetAnchor.left,
          y2: targetAnchor.top,
          data: {
            ...shape.data,
            targetId: targetAnchor.data.ownerId,
            targetAnchor: targetAnchor.data.anchorName,
          },
        });
      }
    }

    fabric.discardActiveObject();
    fabric.setActiveObject(shape);
    this.engine.render.schedule();
    this.engine.layers.refresh();
    this.engine.selection.setSelection([shape.data.id]);

    this.context.incrementElementCounter?.();
    this.context.setShowFilters?.(false);
    this.context.setShowLayers?.(true);
    this.context.setShowRightSidebar?.(true);
    this.context.safeSaveState?.();
  }
}

export default ShapeTool;
