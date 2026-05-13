import { Tool } from './Tool';

/**
 * PenToolBridge — temporary adapter that forwards mouse events to the
 * existing React-driven pen tool hook. Replaced in Phase E by a
 * native PenTool that owns its state inside the engine.
 *
 * Usage: FabricEditor calls `engine.tools.setPenHandlers({ handleMouseDown,
 * handleMouseMove, handleMouseUp })` after each render so the bridge
 * has the current handlers.
 */
export class PenToolBridge extends Tool {
  constructor(engine) {
    super(engine);
    this._handlers = null;
  }

  setHandlers(handlers) {
    this._handlers = handlers || null;
  }

  activate() {
    const f = this.engine.canvas.fabric;
    if (!f) return;
    f.selection = false;
    f.isDrawingMode = false;
  }

  onMouseDown(opt) {
    this._handlers?.handleMouseDown?.(opt);
  }

  onMouseMove(opt) {
    this._handlers?.handleMouseMove?.(opt);
  }

  onMouseUp(opt) {
    this._handlers?.handleMouseUp?.(opt);
  }
}

export default PenToolBridge;
