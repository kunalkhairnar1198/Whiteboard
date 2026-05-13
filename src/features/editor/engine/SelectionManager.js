/**
 * SelectionManager — subscribes to Fabric selection events and mirrors
 * the result on the engine bus. Programmatic selection (e.g. clicking
 * a layer in the sidebar) goes back through `setSelection`, which
 * applies to the Fabric canvas and then fires the same bus event.
 */

const arraysEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

export class SelectionManager {
  constructor(engine) {
    this.engine = engine;
    this._ids = [];
    this._attached = null;

    const readActiveIds = () => {
      const fabric = this._attached;
      if (!fabric) return [];
      return fabric
        .getActiveObjects()
        .map((o) => (o && o.data ? o.data.id : null))
        .filter(Boolean);
    };
    this._onChange = () => this._setIdsInternal(readActiveIds());
    this._onClear = () => this._setIdsInternal([]);
  }

  // -------------------------
  // Lifecycle
  // -------------------------
  attach(fabricCanvas) {
    if (this._attached) return;
    this._attached = fabricCanvas;
    fabricCanvas.on('selection:created', this._onChange);
    fabricCanvas.on('selection:updated', this._onChange);
    fabricCanvas.on('selection:cleared', this._onClear);
  }

  detach() {
    if (!this._attached) return;
    const fabricCanvas = this._attached;
    fabricCanvas.off('selection:created', this._onChange);
    fabricCanvas.off('selection:updated', this._onChange);
    fabricCanvas.off('selection:cleared', this._onClear);
    this._attached = null;
    this._ids = [];
  }

  dispose() {
    this.detach();
  }

  // -------------------------
  // API
  // -------------------------
  getIds() {
    return this._ids;
  }

  /**
   * Programmatically set the active selection. If ids is empty, clears
   * the active object. Single-id selection is set directly; multi-id
   * selection currently picks the first non-locked object (proper
   * ActiveSelection wrapping is deferred to a later phase).
   */
  setSelection(ids) {
    const fabric = this.engine.canvas.fabric;
    if (!fabric) return;

    if (!ids || ids.length === 0) {
      fabric.discardActiveObject();
      this.engine.render.schedule();
      this._setIdsInternal([]);
      return;
    }

    const objs = ids
      .map((id) => this.engine.layers.getById(id))
      .filter((o) => o && !o.lockMovementX);

    if (objs.length === 0) {
      this._setIdsInternal([]);
      return;
    }

    fabric.setActiveObject(objs[0]);
    this.engine.render.schedule();
    this._setIdsInternal(ids);
  }

  clear() {
    this.setSelection([]);
  }

  _setIdsInternal(ids) {
    if (arraysEqual(this._ids, ids)) return;
    this._ids = ids;
    this.engine.bus.emit('selection:changed', { ids });
  }
}

export default SelectionManager;
