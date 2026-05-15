import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectCanRedo, selectCanUndo } from '@/store/selectors';

/**
 * useHistory — thin wrapper around engine.history. The buffer lives
 * in HistoryManager (no React state, no Redux state). Only the
 * boolean flags are mirrored into Redux, and consumers subscribe to
 * them here.
 */
const useHistory = (engine) => {
  const canUndo = useSelector(selectCanUndo);
  const canRedo = useSelector(selectCanRedo);

  const saveState = useCallback(
    (state) => {
      engine?.history?.push(state);
    },
    [engine],
  );

  const undo = useCallback(() => engine?.history?.undo() ?? null, [engine]);
  const redo = useCallback(() => engine?.history?.redo() ?? null, [engine]);

  return { saveState, undo, redo, canUndo, canRedo };
};

export default useHistory;
