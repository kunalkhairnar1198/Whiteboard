export const createHistoryStore = (maxHistory = 50) => {
  const store = {
    history: [],
    step: -1,
  };

  const getFlags = () => ({
    canUndo: store.step > 0,
    canRedo: store.step < store.history.length - 1,
  });

  const saveState = (state) => {
    try {
      const serialized = typeof state === 'string' ? state : JSON.stringify(state);
      if (store.step >= 0 && store.history[store.step] === serialized) {
        return;
      }
      store.history = store.history.slice(0, store.step + 1);
      store.history.push(serialized);
      if (store.history.length > maxHistory) {
        store.history.shift();
      }
      store.step = store.history.length - 1;
    } catch (error) {
      console.error('Failed to save history state', error);
    }
  };

  const parseAtStep = () => {
    try {
      return JSON.parse(store.history[store.step]);
    } catch (error) {
      console.error('Failed to parse history state', error);
      return null;
    }
  };

  const undo = () => {
    if (store.step <= 0) return null;
    store.step -= 1;
    return parseAtStep();
  };

  const redo = () => {
    if (store.step >= store.history.length - 1) return null;
    store.step += 1;
    return parseAtStep();
  };

  return {
    getFlags,
    saveState,
    undo,
    redo,
  };
};
