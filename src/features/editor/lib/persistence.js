
const STORAGE_KEY = 'fabric_editor_state';
const DIAGRAMS_LIST_KEY = 'fabric_editor_diagrams_list';

/**
 * Persists the canvas state to local storage.
 * @param {Object|string} state - The JSON object or string representing the canvas state.
 * @param {string} name - The name of the diagram.
 */
export const persistCanvasState = (state, name = 'current') => {
  try {
    const serialized = typeof state === 'string' ? state : JSON.stringify(state);
    localStorage.setItem(`${STORAGE_KEY}_${name}`, serialized);
    
    // Update diagrams list if it's a named diagram
    if (name !== 'current') {
      const list = getSavedDiagramsList();
      if (!list.includes(name)) {
        const newList = [...list, name];
        localStorage.setItem(DIAGRAMS_LIST_KEY, JSON.stringify(newList));
      }
    }
  } catch (error) {
    console.error('Failed to persist canvas state to local storage:', error);
  }
};

/**
 * Loads the canvas state from local storage.
 * @param {string} name - The name of the diagram.
 * @returns {Object|null} - The parsed canvas state or null if not found/invalid.
 */
export const loadCanvasState = (name = 'current') => {
  try {
    const serialized = localStorage.getItem(`${STORAGE_KEY}_${name}`);
    return serialized ? JSON.parse(serialized) : null;
  } catch (error) {
    console.error('Failed to load canvas state from local storage:', error);
    return null;
  }
};

/**
 * Gets the list of saved diagram names from local storage.
 * @returns {string[]} - Array of diagram names.
 */
export const getSavedDiagramsList = () => {
  try {
    const list = localStorage.getItem(DIAGRAMS_LIST_KEY);
    return list ? JSON.parse(list) : [];
  } catch (error) {
    console.error('Failed to get diagrams list:', error);
    return [];
  }
};

/**
 * Deletes a saved diagram.
 * @param {string} name - The name of the diagram to delete.
 */
export const deleteSavedDiagram = (name) => {
  try {
    localStorage.removeItem(`${STORAGE_KEY}_${name}`);
    const list = getSavedDiagramsList();
    const newList = list.filter(item => item !== name);
    localStorage.setItem(DIAGRAMS_LIST_KEY, JSON.stringify(newList));
  } catch (error) {
    console.error('Failed to delete diagram:', error);
  }
};

/**
 * Exports canvas state as a downloadable JSON file.
 * @param {Object} state - The JSON state to export.
 * @param {string} fileName - The name of the file to download.
 */
export const exportToJson = (state, fileName = 'diagram') => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", fileName + ".json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};
