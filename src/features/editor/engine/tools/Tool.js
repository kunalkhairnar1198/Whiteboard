/**
 * Tool — base class for all editor tools.
 *
 * A Tool is a stateful object that owns the canvas mouse behavior
 * while it is the active tool. Lifecycle:
 *
 *   activate(context)      — called when this tool becomes active
 *   deactivate()           — called when another tool takes over
 *   onContextUpdate(ctx)   — called when ToolManager.setContext is invoked
 *   onMouseDown(opt)       — Fabric mouse:down opt
 *   onMouseMove(opt)       — Fabric mouse:move opt
 *   onMouseUp(opt)         — Fabric mouse:up opt
 *
 * Tools have stable references to the engine and read live state
 * from `this.context` (a mutable object owned by ToolManager).
 *
 * Optional hooks consulted by the engine-level handlers:
 *   shouldDeferSaveOnAdd(target) → boolean
 */
export class Tool {
  constructor(engine) {
    this.engine = engine;
  }

  get context() {
    return this.engine.tools.context;
  }

  activate() {}
  deactivate() {}
  onContextUpdate() {}
  onMouseDown() {}
  onMouseMove() {}
  onMouseUp() {}
}

export default Tool;
