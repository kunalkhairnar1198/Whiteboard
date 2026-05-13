/**
 * EventBus — typed pub/sub used by the EditorEngine to fan out
 * domain events (layers changed, selection changed, tool changed, …)
 * to React hooks via useSyncExternalStore and to the Redux engineBridge
 * middleware.
 *
 * Phase A: scaffolding only — no consumers yet.
 */
export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('EventBus.on requires a function listener');
    }
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(fn);
    return () => this.off(event, fn);
  }

  once(event, fn) {
    const unsub = this.on(event, (payload) => {
      unsub();
      fn(payload);
    });
    return unsub;
  }

  off(event, fn) {
    const set = this.listeners.get(event);
    if (!set) return;
    set.delete(fn);
    if (set.size === 0) this.listeners.delete(event);
  }

  emit(event, payload) {
    const set = this.listeners.get(event);
    console.log('🚌 [EventBus.emit]', event, '→ listenerCount=', set?.size ?? 0);
    if (!set || set.size === 0) return;
    for (const fn of Array.from(set)) {
      try {
        fn(payload);
      } catch (err) {
        console.error(`[EventBus] listener for "${event}" threw:`, err);
      }
    }
  }

  clear() {
    this.listeners.clear();
  }
}

export default EventBus;
