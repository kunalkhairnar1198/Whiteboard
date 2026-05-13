import { Tool } from './Tool';

/**
 * SelectTool — the default tool. Lets Fabric handle native selection,
 * while allowing space-press or right-click drag to pan the viewport.
 */
export class SelectTool extends Tool {
  activate() {
    const fabric = this.engine.canvas.fabric;
    if (!fabric) return;
    fabric.selection = true;
    fabric.isDrawingMode = false;
  }

  onMouseDown(opt) {
    this.engine.canvas.tryStartPan(opt, { keyOnly: true });
  }

  onMouseMove(opt) {
    this.engine.canvas.panMove(opt);
  }

  onMouseUp() {
    if (this.engine.canvas.endPan()) {
      const fabric = this.engine.canvas.fabric;
      if (fabric) fabric.selection = true;
    }
  }
}

export default SelectTool;
