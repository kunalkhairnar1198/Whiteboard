import { createSlice } from '@reduxjs/toolkit';

const initialState = { ids: [] };

const selectionSlice = createSlice({
  name: 'selection',
  initialState,
  reducers: {
    selectionChanged(state, action) {
      state.ids = Array.isArray(action.payload) ? action.payload : [];
    },
    selectionCleared(state) {
      state.ids = [];
    },
  },
});

export const selectionActions = selectionSlice.actions;
export default selectionSlice.reducer;
