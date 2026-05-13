import { createSlice } from '@reduxjs/toolkit';

const initialState = {};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
});

export const settingsActions = settingsSlice.actions;
export default settingsSlice.reducer;
