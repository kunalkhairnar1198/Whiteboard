/**
 * ToolManager — registry of tools + single mouse-event dispatcher.
 *
 * The Fabric `mouse:down/move/up` listeners are registered exactly
 * once when the manager is attached to the canvas. They route to the
 * active tool. Switching tools never re-binds canvas listeners.
 *
 * `context` is a mutable object shared between the manager and tools.
 * Callers update it via `setContext(patch)`; tools read live via
 * `this.context.*` at the moment a mouse event fires.
 */
export class ToolManager {
  constructor(engine) {
    this.engine = engine;
    this.tools = new Map();
    this.activeName = null;
    this.activeTool = null;
    this.context = {};
    this._attached = null;

    this._onDown = (opt) => this.activeTool?.onMouseDown?.(opt);
    this._onMove = (opt) => this.activeTool?.onMouseMove?.(opt);
    this._onUp = (opt) => this.activeTool?.onMouseUp?.(opt);
  }

  register(name, tool) {
    this.tools.set(name, tool);
  }

  get(name) {
    return this.tools.get(name) || null;
  }

  setContext(patch) {
    if (!patch) return;
    Object.assign(this.context, patch);
    this.activeTool?.onContextUpdate?.(this.context);
  }

  activate(name) {
    if (name === this.activeName) return;
    const next = this.tools.get(name);
    if (!next) {
      // Unknown tool: deactivate current and clear active.
      if (this.activeTool) this.activeTool.deactivate?.();
      this.activeTool = null;
      this.activeName = null;
      this.engine.bus.emit('tool:changed', { name: null });
      return;
    }
    if (this.activeTool) this.activeTool.deactivate?.();
    this.activeTool = next;
    this.activeName = name;
    next.activate?.(this.context);
    this.engine.bus.emit('tool:changed', { name });
  }

  getActiveName() {
    return this.activeName;
  }

  attach(fabricCanvas) {
    if (this._attached) return;
    this._attached = fabricCanvas;
    fabricCanvas.on('mouse:down', this._onDown);
    fabricCanvas.on('mouse:move', this._onMove);
    fabricCanvas.on('mouse:up', this._onUp);
  }

  detach() {
    if (!this._attached) return;
    const fabricCanvas = this._attached;
    fabricCanvas.off('mouse:down', this._onDown);
    fabricCanvas.off('mouse:move', this._onMove);
    fabricCanvas.off('mouse:up', this._onUp);
    this._attached = null;
    if (this.activeTool) {
      this.activeTool.deactivate?.();
      this.activeTool = null;
      this.activeName = null;
    }
  }

  dispose() {
    this.detach();
    this.tools.clear();
  }
}

export default ToolManager;
