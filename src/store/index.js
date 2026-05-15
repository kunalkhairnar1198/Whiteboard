import { configureStore } from '@reduxjs/toolkit';

import editor from './slices/editorSlice';
import history from './slices/historySlice';
import layer from './slices/layerSlice';
import selection from './slices/selectionSlice';
import settings from './slices/settingsSlice';
import tool from './slices/toolSlice';
import ui from './slices/uiSlice';

/**
 * Phase A scaffolding: empty slices, real store + Provider. Subsequent
 * phases populate slices and add the engineBridge middleware.
 */
export const store = configureStore({
  reducer: { editor, tool, history, layer, selection, ui, settings },
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: {
        ignoredActions: [],
        ignoredPaths: [],
      },
    }),
});

export default store;
