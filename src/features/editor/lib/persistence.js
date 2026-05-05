
const STORAGE_KEY = 'fabric_editor_state';

/**
 * Persists the canvas state to local storage.
 * @param {Object|string} state - The JSON object or string representing the canvas state.
 */
export const persistCanvasState = (state) => {
  try {
    const serialized = typeof state === 'string' ? state : JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to persist canvas state to local storage:', error);
  }
};

/**
 * Loads the canvas state from local storage.
 * @returns {Object|null} - The parsed canvas state or null if not found/invalid.
 */
export const loadCanvasState = () => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    return serialized ? JSON.parse(serialized) : null;
  } catch (error) {
    console.error('Failed to load canvas state from local storage:', error);
    return null;
  }
};

/**
 * Clears the persisted canvas state from local storage.
 */
export const clearPersistedState = () => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Updates a specific property in the persisted state.
 * @param {string} key - The top-level key in the state object.
 * @param {any} value - The new value for the key.
 */
export const updatePersistedProperty = (key, value) => {
  const state = loadCanvasState();
  if (state) {
    state[key] = value;
    persistCanvasState(state);
  }
};
