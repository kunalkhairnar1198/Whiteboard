import { moveLayerInOrder, reorderLayersByIds } from '@/features/editor/lib/layerOrder';
import { updateConnections } from '@/features/editor/lib/canvasUtils';

/**
 * LayerManager — single source of truth for layer projection.
 *
 * Owns:
 *  - `byId: Map<id, fabricObject>` for O(1) lookups
 *  - Fabric event subscriptions for object:added / object:removed
 *  - Emits `layer:added`, `layer:removed`, `layer:updated`,
 *    `layers:reordered`, `layers:replaced` on the engine bus.
 *
 * The engineSync middleware mirrors these into Redux. LayerManager
 * does not depend on Redux; the bus is the only contract.
 *
 * Phase C: arbitrary reorder still mutates `fabric._objects` directly
 * (existing layerOrder utility). Replacement with a non-private API
 * is tracked for a later phase.
 */

const isLayerObject = (obj) => Boolean(obj?.data?.id) && obj.excludeFromExport !== true;

const projectLayer = (obj) => {
  const id = obj.data?.id;
  const type = obj.data?.type;
  return {
    id,
    type,
    name: obj.name || (id ? `${type}-${String(id).split('-')[1] ?? ''}` : type),
    visible: obj.visible !== false,
    locked: Boolean(obj.lockMovementX),
  };
};

const indexAmongLayers = (fabricCanvas, id) => {
  if (!fabricCanvas) return -1;
  let layerIdx = 0;
  for (const o of fabricCanvas.getObjects()) {
    if (!isLayerObject(o)) continue;
    if (o.data.id === id) return layerIdx;
    layerIdx += 1;
  }
  return -1;
};

export class LayerManager {
  constructor(engine) {
    this.engine = engine;
    this.byId = new Map();
    this._attached = null;
    this._onAdd = (opt) => {
      const obj = opt?.target;
      if (!isLayerObject(obj)) return;
      this._track(obj);
    };
    this._onRemove = (opt) => {
      const obj = opt?.target;
      const id = obj?.data?.id;
      if (!id) return;
      this._untrack(id);
    };
  }

  // -------------------------
  // Lifecycle
  // -------------------------
  attach(fabricCanvas) {
    console.log('[LayerManager.attach] called, already attached?', Boolean(this._attached));
    if (this._attached) return;
    this._attached = fabricCanvas;
    this.refresh();
    fabricCanvas.on('object:added', this._onAdd);
    fabricCanvas.on('object:removed', this._onRemove);
    console.log('[LayerManager.attach] listeners bound');
  }

  detach() {
    if (!this._attached) return;
    const fabricCanvas = this._attached;
    fabricCanvas.off('object:added', this._onAdd);
    fabricCanvas.off('object:removed', this._onRemove);
    this._attached = null;
    this.byId.clear();
  }

  dispose() {
    this.detach();
  }

  /**
   * Rebuild the byId map from the current canvas state and emit
   * `layers:replaced` with the full projection. Used on attach and
   * after `loadFromJSON`.
   */
  refresh() {
    const fabric = this.engine.canvas.fabric;
    if (!fabric) return;
    this.byId.clear();
    const layers = [];
    const order = [];
    fabric.getObjects().forEach((obj) => {
      if (!isLayerObject(obj)) return;
      this.byId.set(obj.data.id, obj);
      layers.push(projectLayer(obj));
      order.push(obj.data.id);
    });
    this.engine.bus.emit('layers:replaced', { layers, order });
  }

  // -------------------------
  // Internal tracking
  // -------------------------
  _track(obj) {
    const id = obj.data.id;
    console.log(
      '[LayerManager._track] id=',
      id,
      'engine#',
      this.engine._instanceId,
      'layer:added listeners=',
      this.engine.bus.listeners.get('layer:added')?.size ?? 0,
    );
    if (this.byId.has(id)) {
      this.byId.set(id, obj);
      this.engine.bus.emit('layer:updated', { id, changes: projectLayer(obj) });
      return;
    }
    this.byId.set(id, obj);
    const index = indexAmongLayers(this._attached, id);
    const layer = projectLayer(obj);
    console.log('[LayerManager._track] emitting layer:added on engine#', this.engine._instanceId, {
      layer,
      index,
    });
    this.engine.bus.emit('layer:added', { layer, index });
  }

  _untrack(id) {
    if (!this.byId.has(id)) return;
    this.byId.delete(id);
    this.engine.bus.emit('layer:removed', { id });
  }

  // -------------------------
  // Read API
  // -------------------------
  getById(id) {
    return this.byId.get(id) || null;
  }

  getOrderedIds() {
    const fabric = this.engine.canvas.fabric;
    if (!fabric) return [];
    return fabric
      .getObjects()
      .filter(isLayerObject)
      .map((o) => o.data.id);
  }

  getProjection() {
    const fabric = this.engine.canvas.fabric;
    if (!fabric) return [];
    return fabric.getObjects().filter(isLayerObject).map(projectLayer);
  }

  // -------------------------
  // Mutation API
  // -------------------------
  update(id, patch) {
    const obj = this.byId.get(id);
    if (!obj) return false;
    obj.set(patch);
    this.engine.render.schedule();
    this.engine.bus.emit('layer:updated', { id, changes: projectLayer(obj) });
    return true;
  }

  toggleVisible(id) {
    const obj = this.byId.get(id);
    if (!obj) return false;
    obj.set('visible', !obj.visible);
    this.engine.render.schedule();
    this.engine.bus.emit('layer:updated', { id, changes: projectLayer(obj) });
    return true;
  }

  toggleLock(id) {
    const obj = this.byId.get(id);
    if (!obj) return false;
    const locked = !obj.lockMovementX;
    obj.set({
      lockMovementX: locked,
      lockMovementY: locked,
      lockRotation: locked,
      lockScalingX: locked,
      lockScalingY: locked,
      selectable: !locked,
    });
    this.engine.render.schedule();
    this.engine.bus.emit('layer:updated', { id, changes: projectLayer(obj) });
    return true;
  }

  remove(id) {
    const obj = this.byId.get(id);
    if (!obj) return false;
    const fabric = this.engine.canvas.fabric;
    if (fabric) fabric.remove(obj);
    this.engine.render.schedule();
    return true;
  }

  /**
   * Remove every layer whose id appears in `ids`. Returns the count
   * actually removed (skipping unknown ids).
   */
  removeMany(ids) {
    const fabric = this.engine.canvas.fabric;
    if (!fabric || !ids || ids.length === 0) return 0;
    let removed = 0;
    ids.forEach((id) => {
      const obj = this.byId.get(id);
      if (!obj) return;
      fabric.remove(obj);
      removed += 1;
    });
    if (removed > 0) this.engine.render.schedule();
    return removed;
  }

  /**
   * Remove every non-`excludeFromExport` object on the canvas. Clears
   * any active selection first so callers don't end up holding a stale
   * selection. Returns the number of objects removed.
   */
  clear() {
    const fabric = this.engine.canvas.fabric;
    if (!fabric) return 0;
    this.engine.selection.clear();
    const objects = fabric.getObjects();
    let removed = 0;
    for (let i = objects.length - 1; i >= 0; i -= 1) {
      const obj = objects[i];
      if (obj.excludeFromExport) continue;
      fabric.remove(obj);
      removed += 1;
    }
    fabric.discardActiveObject();
    this.engine.render.schedule();
    return removed;
  }

  /**
   * Clone a layer via Fabric's async `clone` API, mint it the given
   * `newId`, place it offset (+30, +30) from the source, and add it to
   * the canvas. Returns a Promise resolving to the new id, or null if
   * the source isn't tracked.
   *
   * The new id is supplied by the caller because the element-counter
   * lives in React state (see useElementCounter).
   */
  duplicate(id, newId) {
    const obj = this.byId.get(id);
    const fabric = this.engine.canvas.fabric;
    if (!obj || !fabric) return Promise.resolve(null);
    return new Promise((resolve) => {
      obj.clone((cloned) => {
        cloned.set({
          left: cloned.left + 30,
          top: cloned.top + 30,
          data: { id: newId, type: cloned.data?.type ?? obj.data?.type },
          name: `${cloned.data?.type ?? obj.data?.type ?? 'layer'}-${String(newId).split('-')[1] ?? newId}`,
        });
        if (cloned.type === 'image' && obj.filters) {
          cloned.filters = [...(obj.filters || [])];
        }
        fabric.add(cloned);
        fabric.setActiveObject(cloned);
        this.engine.render.schedule();
        resolve(newId);
      });
    });
  }

  /**
   * Move a layer one step `up` or `down` in z-order. Mutates
   * `fabric._objects` via the existing layerOrder utility — to be
   * replaced with Fabric public reorder calls in a later phase.
   */
  move(id, direction) {
    const fabric = this.engine.canvas.fabric;
    if (!fabric) return false;
    const next = moveLayerInOrder(fabric.getObjects(), id, direction);
    if (next === fabric.getObjects()) return false;
    fabric._objects = next;
    this.engine.render.schedule();
    this.engine.bus.emit('layers:reordered', { order: this.getOrderedIds() });
    return true;
  }

  /**
   * Re-route connector lines that target the moved object's anchors.
   * Called from the engine-level `object:moving` listener.
   */
  updateConnections(target) {
    const fabric = this.engine.canvas.fabric;
    if (!fabric || !target) return;
    updateConnections(fabric, target);
  }

  setOrder(orderedIds) {
    const fabric = this.engine.canvas.fabric;
    if (!fabric) return false;

    console.log('[LayerManager.setOrder] request:', orderedIds);
    const currentObjects = fabric.getObjects();
    const next = reorderLayersByIds(currentObjects, orderedIds);

    if (next === currentObjects) {
      console.log('[LayerManager.setOrder] no change detected by utility');
      return false;
    }

    fabric._objects = next;
    // Force fabric to recognize the new order if it caches anything
    fabric.getObjects().forEach((obj, i) => {
      if (obj.canvas === fabric) {
        // Some internal fabric methods might rely on this,
        // though usually it's derived.
      }
    });

    this.engine.render.schedule();
    this.engine.bus.emit('layers:reordered', { order: this.getOrderedIds() });
    console.log('[LayerManager.setOrder] success, new order emitted');
    return true;
  }
}

export default LayerManager;
