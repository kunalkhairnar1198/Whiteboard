import { createSlice } from '@reduxjs/toolkit';

/**
 * toolSlice — owns tool *settings* (pen/eraser/text). The active tool
 * name itself stays in the URL via nuqs, so it survives navigation
 * and reload.
 *
 * Settings keys are kept flat so engine.tools.setContext can receive
 * the slice's state.settings object as-is.
 */
const initialState = {
  settings: {
    penColor: '#1f2937',
    penWidth: 4,
    penOpacity: 1,
    penBrushType: 'Pencil',
    penShadowColor: '#000000',
    penShadowBlur: 0,
    penShadowOffset: 0,
    eraserSize: 10,
    textColor: '#1f2937',
  },
};

const toolSlice = createSlice({
  name: 'tool',
  initialState,
  reducers: {
    toolSettingsUpdated(state, action) {
      const patch = action.payload;
      if (patch && typeof patch === 'object') {
        Object.assign(state.settings, patch);
      }
    },
  },
});

export const toolActions = toolSlice.actions;
export default toolSlice.reducer;
