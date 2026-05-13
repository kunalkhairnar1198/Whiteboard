import PersistenceWorker from '@/features/editor/workers/persistence.worker.js?worker';
import { writeRawState, persistCanvasState } from '@/features/editor/lib/persistence';

/**
 * PersistenceService — owns the persistence Web Worker and proxies
 * save requests to it. The worker performs JSON.stringify off the
 * main thread; the result is written to localStorage from main.
 *
 * Phase G: worker for serialization only, localStorage backend
 * unchanged. Falls back to synchronous main-thread save if the worker
 * fails to spawn or postMessage throws.
 *
 * Loads remain synchronous (lib/persistence.loadCanvasState) since
 * they're only used during initial restore or workspace switch.
 */
let nextRequestId = 0;

const SAVE_DEBOUNCE_MS = 1000;

export class PersistenceService {
  constructor(engine) {
    this.engine = engine;
    this._worker = null;
    this._workerFailed = false;
    this._pending = new Map();
    this._onMessage = this._onMessage.bind(this);
    this._onError = this._onError.bind(this);
    // scheduleSave state:
    this._names = ['current'];
    this._saveTimer = null;
    this._isLoading = false;
  }

  // -------------------------
  // Restore-aware auto-save
  // -------------------------

  /** True while a restore is in flight; gates scheduleSave. */
  isLoading() {
    return this._isLoading;
  }

  setLoading(value) {
    this._isLoading = Boolean(value);
  }

  /** Set the localStorage keys that scheduleSave writes to (always includes 'current'). */
  setNames(names) {
    const list = Array.isArray(names) ? names.filter(Boolean) : [];
    this._names = list.length ? list : ['current'];
  }

  /**
   * Debounced auto-save: serializes the current canvas, pushes the
   * snapshot into HistoryManager, and writes it to localStorage via
   * the worker. Skipped while `isLoading()` is true.
   */
  scheduleSave() {
    if (this._isLoading) return;
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      try {
        const fabricCanvas = this.engine.canvas.fabric;
        if (!fabricCanvas) return;
        const json = fabricCanvas.toJSON([
          'id',
          'name',
          'data',
          'lockMovementX',
          'lockMovementY',
          'lockRotation',
          'lockScalingX',
          'lockScalingY',
          'selectable',
        ]);
        this.engine.history.push(json);
        this.save(json, this._names).catch((err) =>
          console.error('Persistence save failed', err),
        );
      } catch (err) {
        console.error('Error during auto-save:', err);
      }
    }, SAVE_DEBOUNCE_MS);
  }

  _ensureWorker() {
    if (this._worker || this._workerFailed) return this._worker;
    try {
      this._worker = new PersistenceWorker();
      this._worker.addEventListener('message', this._onMessage);
      this._worker.addEventListener('error', this._onError);
    } catch (err) {
      console.warn('PersistenceService: worker spawn failed, using main-thread fallback', err);
      this._workerFailed = true;
      this._worker = null;
    }
    return this._worker;
  }

  _onMessage(event) {
    const { requestId, names, result, error } = event.data || {};
    const pending = this._pending.get(requestId);
    if (!pending) return;
    this._pending.delete(requestId);

    if (error || typeof result !== 'string') {
      pending.reject(new Error(error || 'Worker returned no result'));
      return;
    }
    try {
      (names || []).forEach((name) => writeRawState(result, name));
      pending.resolve(true);
    } catch (err) {
      pending.reject(err);
    }
  }

  _onError(err) {
    console.warn('PersistenceService: worker error, switching to main-thread fallback', err);
    this._workerFailed = true;
    // Reject all pending requests; callers may retry on the fallback.
    for (const [, pending] of this._pending) {
      pending.reject(new Error('Worker error'));
    }
    this._pending.clear();
    this._terminate();
  }

  _terminate() {
    if (this._worker) {
      try {
        this._worker.removeEventListener('message', this._onMessage);
        this._worker.removeEventListener('error', this._onError);
        this._worker.terminate();
      } catch (err) {
        // ignore
      }
      this._worker = null;
    }
  }

  /**
   * Save a canvas state under one or more names. The worker stringifies
   * once and the main thread writes the result to each localStorage key.
   * Returns a Promise<boolean> that resolves true on success.
   */
  save(state, names) {
    const list = Array.isArray(names) ? names.filter(Boolean) : [names].filter(Boolean);
    if (!list.length) return Promise.resolve(false);

    return new Promise((resolve, reject) => {
      const worker = this._ensureWorker();
      if (!worker) {
        this._saveOnMain(state, list, resolve, reject);
        return;
      }
      const requestId = ++nextRequestId;
      this._pending.set(requestId, { resolve, reject });
      try {
        worker.postMessage({ requestId, state, names: list });
      } catch (err) {
        // structured clone failure or similar — fall back.
        this._pending.delete(requestId);
        console.warn('PersistenceService: postMessage failed, using main-thread fallback', err);
        this._saveOnMain(state, list, resolve, reject);
      }
    });
  }

  _saveOnMain(state, names, resolve, reject) {
    try {
      names.forEach((name) => persistCanvasState(state, name));
      resolve(true);
    } catch (err) {
      reject(err);
    }
  }

  dispose() {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
    }
    this._terminate();
    // Reject any in-flight requests so callers don't hang forever.
    for (const [, pending] of this._pending) {
      pending.reject(new Error('PersistenceService disposed'));
    }
    this._pending.clear();
  }
}

export default PersistenceService;
