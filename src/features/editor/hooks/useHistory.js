import { useCallback, useRef, useState } from 'react';

import { createHistoryStore } from '@/features/editor/lib/historyStore';

const useHistory = (maxHistory = 50) => {
  const storeRef = useRef(null);
  if (!storeRef.current) {
    storeRef.current = createHistoryStore(maxHistory);
  }

  const [canUndoState, setCanUndoState] = useState(false);
  const [canRedoState, setCanRedoState] = useState(false);

  const syncFlags = useCallback(() => {
    const { canUndo, canRedo } = storeRef.current.getFlags();
    setCanUndoState((prev) => (prev === canUndo ? prev : canUndo));
    setCanRedoState((prev) => (prev === canRedo ? prev : canRedo));
  }, []);

  const saveState = useCallback(
    (state) => {
      storeRef.current.saveState(state);
      syncFlags();
    },
    [syncFlags],
  );

  const undo = useCallback(() => {
    const state = storeRef.current.undo();
    syncFlags();
    return state;
  }, [syncFlags]);

  const redo = useCallback(() => {
    const state = storeRef.current.redo();
    syncFlags();
    return state;
  }, [syncFlags]);

  return {
    saveState,
    undo,
    redo,
    canUndo: canUndoState,
    canRedo: canRedoState,
  };
};

export default useHistory;
