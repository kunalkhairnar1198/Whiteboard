import { Tool } from './Tool';

/**
 * PenTool — native pen tool driven by `engine.pen` (PenStateMachine).
 * Replaces the Phase D PenToolBridge proxy. On deactivate, auto-
 * finalizes any in-progress path so the user can switch away without
 * losing work.
 */
export class PenTool extends Tool {
  activate() {
    const f = this.engine.canvas.fabric;
    if (!f) return;
    f.selection = false;
    f.isDrawingMode = false;
  }

  deactivate() {
    if (this.engine.pen.state.activePath) {
      this.engine.pen.finalize();
    } else {
      this.engine.pen.reset();
    }
  }

  onMouseDown(opt) {
    if (this.engine.canvas.tryStartPan(opt, { keyOnly: true })) return;
    this.engine.pen.onMouseDown(opt);
  }

  onMouseMove(opt) {
    if (this.engine.canvas.panMove(opt)) return;
    this.engine.pen.onMouseMove(opt);
  }

  onMouseUp(opt) {
    if (this.engine.canvas.endPan()) return;
    this.engine.pen.onMouseUp(opt);
  }
}

export default PenTool;
