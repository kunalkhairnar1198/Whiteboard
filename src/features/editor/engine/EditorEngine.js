import { EventBus } from './EventBus';
import { RenderManager } from './RenderManager';
import { CanvasManager } from './CanvasManager';
import { LayerManager } from './LayerManager';
import { SelectionManager } from './SelectionManager';
import { ToolManager } from './ToolManager';
import { HistoryManager } from './HistoryManager';
import { PersistenceService } from './PersistenceService';
import { PenStateMachine } from './PenStateMachine';
import { PenRenderer } from './PenRenderer';
import { SelectTool } from './tools/SelectTool';
import { PanTool } from './tools/PanTool';
import { ShapeTool } from './tools/ShapeTool';
import { TextTool } from './tools/TextTool';
import { BrushTool } from './tools/BrushTool';
import { EraserTool } from './tools/EraserTool';
import { PenTool } from './tools/PenTool';

const SHAPE_TYPES = [
  'rectangle',
  'circle',
  'triangle',
  'star',
  'arrow',
  'line',
  'polygon',
  'frame',
];

/**
 * EditorEngine — facade that owns the per-editor managers.
 *
 * Phase B: bus / render / canvas.
 * Phase C: layers + selection.
 * Phase D: tools (ToolManager + tool classes).
 * Phase E: pen state machine + pen renderer; PenTool replaces the
 * Phase D PenToolBridge proxy.
 * Phase F: history (byte-budgeted snapshot buffer).
 * Phase G: persistence service (worker-backed serialization,
 * localStorage backend).
 */
export class EditorEngine {
  constructor() {
    this.bus = new EventBus();
    this._instanceId = Math.random().toString(36).slice(2, 8);
    console.warn('🔧 [EditorEngine] NEW instance', this._instanceId);
    this.render = new RenderManager(this);
    this.canvas = new CanvasManager(this);
    this.layers = new LayerManager(this);
    this.selection = new SelectionManager(this);
    this.tools = new ToolManager(this);
    this.history = new HistoryManager(this);
    this.persistence = new PersistenceService(this);
    this.pen = new PenStateMachine(this);
    this.penRenderer = new PenRenderer(this);
    this._registerBuiltinTools();
    this._disposed = false;
  }

  _registerBuiltinTools() {
    this.tools.register('select', new SelectTool(this));
    this.tools.register('pan', new PanTool(this));
    this.tools.register('text', new TextTool(this));
    this.tools.register('brush', new BrushTool(this));
    this.tools.register('eraser', new EraserTool(this));
    this.tools.register('pen', new PenTool(this));
    SHAPE_TYPES.forEach((type) => {
      this.tools.register(type, new ShapeTool(this, type));
    });
  }

  attachFabricCanvas(fabricCanvas) {
    console.warn('🔧 [EditorEngine.attachFabricCanvas] called, disposed?', this._disposed);
    if (this._disposed) return;
    this.canvas.attach(fabricCanvas);
    this.layers.attach(fabricCanvas);
    this.selection.attach(fabricCanvas);
    this.tools.attach(fabricCanvas);
    this._attachEngineListeners(fabricCanvas);
    this.bus.emit('engine:ready', { fabric: fabricCanvas });
    console.warn('🔧 [EditorEngine.attachFabricCanvas] DONE - all managers attached');
  }

  detachFabricCanvas() {
    this._detachEngineListeners();
    this.tools.detach();
    this.selection.detach();
    this.layers.detach();
    this.canvas.detach();
    this.bus.emit('engine:detached');
  }

  /**
   * Engine-level listeners that don't belong to any single tool:
   *  - object:added/modified/removed → debounced auto-save
   *  - object:moving                 → re-route attached connector lines
   *  - mouse:dblclick                → text edit entry / pen edit-mode entry
   *
   * Tool-scoped listeners (e.g. BrushTool's `path:created`) live on
   * the tool itself.
   */
  _attachEngineListeners(fabricCanvas) {
    const isTextObject = (obj) => obj?.type === 'textbox' || obj?.type === 'i-text';

    this._onObjectAdded = (opt) => {
      if (this.persistence.isLoading()) return;
      const target = opt?.target;
      if (!target?.data?.id) return;
      if (this.tools.activeTool?.shouldDeferSaveOnAdd?.(target)) return;
      this.persistence.scheduleSave();
    };
    this._onObjectModified = () => {
      if (this.persistence.isLoading()) return;
      this.persistence.scheduleSave();
    };
    this._onObjectRemoved = () => {
      if (this.persistence.isLoading()) return;
      this.persistence.scheduleSave();
    };
    this._onObjectMoving = (opt) => {
      this.layers.updateConnections(opt?.target);
    };
    this._onMouseDblClick = (opt) => {
      const target = opt?.target;
      if (!target) return;
      if (isTextObject(target)) {
        fabricCanvas.setActiveObject(target);
        target.enterEditing?.();
        target.selectAll?.();
        this.render.schedule();
        return;
      }
      if (target.data?.type === 'path' && target.data?.points) {
        // Tell React to flip the active tool, then hand the path to the
        // pen state machine (which hides the original + schedules render).
        this.bus.emit('pen:edit-requested', { id: target.data.id });
        this.pen.enterEditMode({
          ...target.data,
          id: target.data.id,
          points: target.data.points,
          closed: target.data.closed,
          stroke: target.stroke,
          strokeWidth: target.strokeWidth,
          strokeCap: target.strokeLinecap,
          strokeLinejoin: target.strokeLinejoin,
          fill: target.fill,
        });
      }
    };

    fabricCanvas.on('object:added', this._onObjectAdded);
    fabricCanvas.on('object:modified', this._onObjectModified);
    fabricCanvas.on('object:removed', this._onObjectRemoved);
    fabricCanvas.on('object:moving', this._onObjectMoving);
    fabricCanvas.on('mouse:dblclick', this._onMouseDblClick);
  }

  _detachEngineListeners() {
    const fabricCanvas = this.canvas.fabric;
    if (!fabricCanvas) return;
    if (this._onObjectAdded) fabricCanvas.off('object:added', this._onObjectAdded);
    if (this._onObjectModified) fabricCanvas.off('object:modified', this._onObjectModified);
    if (this._onObjectRemoved) fabricCanvas.off('object:removed', this._onObjectRemoved);
    if (this._onObjectMoving) fabricCanvas.off('object:moving', this._onObjectMoving);
    if (this._onMouseDblClick) fabricCanvas.off('mouse:dblclick', this._onMouseDblClick);
    this._onObjectAdded = null;
    this._onObjectModified = null;
    this._onObjectRemoved = null;
    this._onObjectMoving = null;
    this._onMouseDblClick = null;
  }

  isDisposed() {
    return this._disposed;
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this.bus.emit('engine:disposing');
    this.penRenderer.dispose();
    this.persistence.dispose();
    this.history.dispose();
    this.tools.dispose();
    this.selection.dispose();
    this.layers.dispose();
    this.canvas.dispose();
    this.render.dispose();
    this.bus.clear();
  }
}

export default EditorEngine;
