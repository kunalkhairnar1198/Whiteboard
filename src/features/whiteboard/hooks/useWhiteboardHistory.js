/**
 * useWhiteboardHistory Hook
 * Integrates pen tool state with undo/redo system
 */

import { useCallback, useRef } from 'react';

/**
 * Custom hook for undo/redo with whiteboard state
 *
 * Usage:
 * const { state, setState, undo, redo, canUndo, canRedo } = useWhiteboardHistory(initialState);
 */
export const useWhiteboardHistory = (initialState) => {
  const historyRef = useRef({
    past: [],
    present: initialState,
    future: [],
  });

  const setState = useCallback((newState) => {
    const history = historyRef.current;
    history.past.push(history.present);
    history.present = newState;
    history.future = []; // Clear future on new action
  }, []);

  const undo = useCallback(() => {
    const history = historyRef.current;
    if (!history.past.length) return false;

    history.future.unshift(history.present);
    history.present = history.past.pop();
    return true;
  }, []);

  const redo = useCallback(() => {
    const history = historyRef.current;
    if (!history.future.length) return false;

    history.past.push(history.present);
    history.present = history.future.shift();
    return true;
  }, []);

  return {
    state: historyRef.current.present,
    setState,
    undo,
    redo,
    canUndo: historyRef.current.past.length > 0,
    canRedo: historyRef.current.future.length > 0,
    saveState: useCallback((state) => setState(state), [setState]),
  };
};

export default useWhiteboardHistory;
