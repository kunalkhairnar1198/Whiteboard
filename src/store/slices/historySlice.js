import { createSlice } from '@reduxjs/toolkit';

const initialState = { canUndo: false, canRedo: false };

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    historyFlagsChanged(state, action) {
      state.canUndo = Boolean(action.payload?.canUndo);
      state.canRedo = Boolean(action.payload?.canRedo);
    },
    historyCleared(state) {
      state.canUndo = false;
      state.canRedo = false;
    },
  },
});

export const historyActions = historySlice.actions;
export default historySlice.reducer;
