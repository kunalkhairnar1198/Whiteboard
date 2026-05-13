import { Tool } from './Tool';

/**
 * PanTool — explicit pan mode. Every mousedown starts a pan; no
 * selection while active.
 */
export class PanTool extends Tool {
  activate() {
    const fabric = this.engine.canvas.fabric;
    if (!fabric) return;
    fabric.selection = false;
    fabric.isDrawingMode = false;
    fabric.defaultCursor = 'grab';
  }

  deactivate() {
    const fabric = this.engine.canvas.fabric;
    if (fabric) fabric.defaultCursor = 'default';
  }

  onMouseDown(opt) {
    this.engine.canvas.tryStartPan(opt, { keyOnly: false });
  }

  onMouseMove(opt) {
    this.engine.canvas.panMove(opt);
  }

  onMouseUp() {
    this.engine.canvas.endPan();
  }
}

export default PanTool;
