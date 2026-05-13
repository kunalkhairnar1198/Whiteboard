/**
 * persistence.worker.js — off-thread JSON.stringify.
 *
 * Phase G: localStorage is unavailable in workers, so the worker
 * only performs serialization. The main thread receives the
 * pre-stringified payload and does the localStorage write itself.
 *
 * Protocol:
 *   in : { requestId: number, state: object, names: string[] }
 *   out: { requestId: number, names: string[], result: string|null, error: string|null }
 */
self.addEventListener('message', (event) => {
  const { requestId, state, names } = event.data || {};
  let result = null;
  let error = null;
  try {
    result = JSON.stringify(state);
  } catch (err) {
    error = err && err.message ? err.message : String(err);
  }
  self.postMessage({ requestId, names, result, error });
});
