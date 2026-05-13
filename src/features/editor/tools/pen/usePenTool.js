import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { INITIAL_STATE } from './types';

/**
 * usePenTool — thin selector-style wrapper around engine.pen.
 *
 * Reactivity is intentionally minimal: only `snapEnabled` and the
 * presence of an active path drive React re-renders (used by the
 * sidebar checkbox and FabricEditor's auto-finalize fallback). All
 * other reads go through engine.pen.state directly so they don't
 * trigger renders during a 60fps drag.
 *
 * The 2nd argument is kept for backward compatibility with the
 * previous hook signature but is ignored — the engine owns lifecycle.
 */
export const usePenTool = (engine, _opts = {}) => {
  const subscribe = useCallback(
    (listener) => {
      if (!engine?.pen) return () => {};
      return engine.pen.subscribe(listener);
    },
    [engine],
  );

  const snapEnabled = useSyncExternalStore(
    subscribe,
    () => engine?.pen?.state?.snapEnabled ?? INITIAL_STATE.snapEnabled,
    () => INITIAL_STATE.snapEnabled,
  );

  const hasActivePath = useSyncExternalStore(
    subscribe,
    () => Boolean(engine?.pen?.state?.activePath),
    () => false,
  );

  const reset = useCallback(() => engine?.pen?.reset(), [engine]);
  const enterEditMode = useCallback((vp) => engine?.pen?.enterEditMode(vp), [engine]);
  const deleteSelectedPoints = useCallback(() => engine?.pen?.deleteSelectedPoints(), [engine]);
  const toggleSnap = useCallback(() => engine?.pen?.toggleSnap(), [engine]);
  const joinSelectedPoints = useCallback(() => engine?.pen?.joinSelectedPoints(), [engine]);
  const breakPathAtSelected = useCallback(() => engine?.pen?.breakPathAtSelected(), [engine]);
  const finalize = useCallback(() => engine?.pen?.finalize(), [engine]);

  // Backward-compatible `state` accessor for the few callers that
  // read it imperatively. snapEnabled is reactive (above); other
  // fields are live but not subscribed.
  const state = useMemo(
    () => ({
      get mode() { return engine?.pen?.state?.mode ?? INITIAL_STATE.mode; },
      get activePath() { return engine?.pen?.state?.activePath ?? null; },
      get selectedPoints() { return engine?.pen?.state?.selectedPoints ?? []; },
      get hoveredPoint() { return engine?.pen?.state?.hoveredPoint ?? null; },
      snapEnabled,
    }),
    [engine, snapEnabled],
  );

  return {
    state,
    hasActivePath,
    reset,
    enterEditMode,
    deleteSelectedPoints,
    toggleSnap,
    joinSelectedPoints,
    breakPathAtSelected,
    finalize,
  };
};

export default usePenTool;
