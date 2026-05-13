/**
 * HistoryManager — engine-owned undo/redo buffer.
 *
 * Phase F keeps the existing full-snapshot semantics (each `push`
 * stores `JSON.stringify(canvas.toJSON())`), but moves the buffer
 * out of React state and caps it by byte budget instead of entry
 * count. Redux only mirrors the boolean `canUndo` / `canRedo` flags
 * via `history:changed` on the engine bus.
 *
 * Op-level diffs are a future optimization; this implementation is a
 * drop-in semantic match for the previous `createHistoryStore`.
 */

const DEFAULT_MAX_BYTES = 30 * 1024 * 1024; // 30 MB

const byteSize = (str) => (typeof str === 'string' ? str.length * 2 : 0);

export class HistoryManager {
  constructor(engine, { maxBytes = DEFAULT_MAX_BYTES } = {}) {
    this.engine = engine;
    this.maxBytes = maxBytes;
    this._entries = []; // [{ payload: string, bytes: number }]
    this._step = -1;
    this._totalBytes = 0;
  }

  getFlags() {
    return {
      canUndo: this._step > 0,
      canRedo: this._step < this._entries.length - 1,
    };
  }

  push(state) {
    if (state == null) return;
    const payload =
      typeof state === 'string'
        ? state
        : (() => {
            try {
              return JSON.stringify(state);
            } catch (err) {
              console.error('HistoryManager: failed to serialize state', err);
              return null;
            }
          })();
    if (!payload) return;

    if (this._step >= 0 && this._entries[this._step].payload === payload) return;

    // Drop forward history.
    if (this._step < this._entries.length - 1) {
      const dropped = this._entries.splice(this._step + 1);
      for (const entry of dropped) this._totalBytes -= entry.bytes;
    }

    const bytes = byteSize(payload);
    this._entries.push({ payload, bytes });
    this._totalBytes += bytes;

    // Trim from front until under budget. Always keep at least one
    // entry so we have a baseline to restore to.
    while (this._totalBytes > this.maxBytes && this._entries.length > 1) {
      const removed = this._entries.shift();
      this._totalBytes -= removed.bytes;
    }

    this._step = this._entries.length - 1;
    this._emit();
  }

  undo() {
    if (this._step <= 0) return null;
    this._step -= 1;
    this._emit();
    return this._parse(this._entries[this._step].payload);
  }

  redo() {
    if (this._step >= this._entries.length - 1) return null;
    this._step += 1;
    this._emit();
    return this._parse(this._entries[this._step].payload);
  }

  clear() {
    this._entries = [];
    this._step = -1;
    this._totalBytes = 0;
    this._emit();
  }

  // -------------------------
  // Diagnostics (handy for the future workshop)
  // -------------------------
  size() {
    return this._totalBytes;
  }

  length() {
    return this._entries.length;
  }

  _parse(payload) {
    try {
      return JSON.parse(payload);
    } catch (err) {
      console.error('HistoryManager: failed to parse history payload', err);
      return null;
    }
  }

  _emit() {
    this.engine.bus.emit('history:changed', this.getFlags());
  }

  dispose() {
    this._entries = [];
    this._step = -1;
    this._totalBytes = 0;
  }
}

export default HistoryManager;
