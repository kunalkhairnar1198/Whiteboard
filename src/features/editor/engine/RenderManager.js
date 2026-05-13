/**
 * RenderManager — collects render requests from all managers and
 * batches them into one requestAnimationFrame per frame.
 *
 * Phase B: minimal implementation, used by CanvasManager. Subsequent
 * phases will let tools and other managers participate.
 */
export class RenderManager {
  constructor(engine) {
    this.engine = engine;
    this._rafId = null;
    this._disposed = false;
  }

  schedule() {
    if (this._disposed) return;
    if (this._rafId !== null) return;
    this._rafId = requestAnimationFrame(() => {
      this._rafId = null;
      const fabric = this.engine.canvas.fabric;
      if (fabric) fabric.requestRenderAll();
    });
  }

  flush() {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    const fabric = this.engine.canvas.fabric;
    if (fabric) fabric.renderAll();
  }

  dispose() {
    this._disposed = true;
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }
}

export default RenderManager;
