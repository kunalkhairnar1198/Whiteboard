import { Tool } from './Tool';
import { fabric } from '@/features/editor/utils/fabricFactory';

/**
 * BrushTool — wraps Fabric's free drawing mode. Configures the
 * brush class + properties on activate, and on context updates
 * applies live slider changes by mutating the existing brush when
 * possible (recreating only if the brush class itself changed).
 */
export class BrushTool extends Tool {
  constructor(engine) {
    super(engine);
    this._currentBrushType = null;
    this._onPathCreated = (opt) => {
      const path = opt?.path;
      if (!path) return;
      const ctx = this.engine.tools.context;
      const counter = ctx.elementCounterRef?.current ?? 0;
      const id = `element-${counter}`;
      path.set({ data: { id, type: 'path' }, name: `drawing-${counter}` });
      this.engine.layers.refresh();
      this.engine.selection.setSelection([id]);
      ctx.incrementElementCounter?.();
      ctx.setShowFilters?.(false);
      ctx.setShowLayers?.(true);
      ctx.setShowRightSidebar?.(true);
      // Auto-save fires via the engine-level object:added listener;
      // explicit scheduleSave here keeps a freehand stroke under the
      // same debounce window as the add it triggered.
      this.engine.persistence.scheduleSave();
    };
  }

  activate() {
    const f = this.engine.canvas.fabric;
    if (!f) return;
    f.selection = false;
    f.isDrawingMode = true;
    f.on('path:created', this._onPathCreated);
    this._applyBrushFromContext();
  }

  deactivate() {
    const f = this.engine.canvas.fabric;
    if (!f) return;
    f.off('path:created', this._onPathCreated);
    f.isDrawingMode = false;
  }

  onContextUpdate() {
    const f = this.engine.canvas.fabric;
    if (!f || !f.isDrawingMode) return;
    const ctx = this.context;
    const wantedType = ctx.penBrushType || 'Pencil';
    if (wantedType !== this._currentBrushType || !f.freeDrawingBrush) {
      this._applyBrushFromContext();
      return;
    }
    this._mutateBrushFromContext(f.freeDrawingBrush);
  }

  _mutateBrushFromContext(brush) {
    const ctx = this.context;
    if (ctx.penColor !== undefined) brush.color = ctx.penColor;
    if (ctx.penWidth !== undefined) brush.width = ctx.penWidth;
    if ('opacity' in brush && ctx.penOpacity !== undefined) brush.opacity = ctx.penOpacity;
    if (brush.shadow) {
      if (ctx.penShadowColor !== undefined) brush.shadow.color = ctx.penShadowColor;
      if (ctx.penShadowBlur !== undefined) brush.shadow.blur = ctx.penShadowBlur;
      if (ctx.penShadowOffset !== undefined) {
        brush.shadow.offsetX = ctx.penShadowOffset;
        brush.shadow.offsetY = ctx.penShadowOffset;
      }
    }
  }

  _applyBrushFromContext() {
    const f = this.engine.canvas.fabric;
    if (!f) return;
    const ctx = this.context;
    const brushType = ctx.penBrushType || 'Pencil';
    const BrushClass = (fabric && fabric[brushType + 'Brush']) || fabric.PencilBrush;

    let brush;
    try {
      brush = new BrushClass(f);
    } catch (err) {
      console.warn('BrushTool: failed to create brush, falling back to PencilBrush', err);
      brush = new fabric.PencilBrush(f);
    }

    brush.color = ctx.penColor ?? '#1f2937';
    brush.width = ctx.penWidth ?? 4;
    if ('opacity' in brush) brush.opacity = ctx.penOpacity ?? 1;

    try {
      brush.shadow = new fabric.Shadow({
        blur: ctx.penShadowBlur ?? 0,
        offsetX: ctx.penShadowOffset ?? 0,
        offsetY: ctx.penShadowOffset ?? 0,
        affectStroke: true,
        color: ctx.penShadowColor ?? '#000000',
      });
    } catch (err) {
      // Shadow optional.
    }

    f.freeDrawingBrush = brush;
    this._currentBrushType = brushType;
  }
}

export default BrushTool;
