import { createSlice } from '@reduxjs/toolkit';

const initialState = {};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {},
});

export const editorActions = editorSlice.actions;
export default editorSlice.reducer;
