import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  order: [],
  byId: {},
};

const layerSlice = createSlice({
  name: 'layer',
  initialState,
  reducers: {
    layerAdded(state, action) {
      const { layer, index } = action.payload;
      if (!layer || !layer.id) return;
      state.byId[layer.id] = layer;
      if (state.order.includes(layer.id)) return;
      if (typeof index === 'number' && index >= 0 && index <= state.order.length) {
        state.order.splice(index, 0, layer.id);
      } else {
        state.order.push(layer.id);
      }
    },
    layerRemoved(state, action) {
      const id = action.payload;
      if (!id) return;
      delete state.byId[id];
      state.order = state.order.filter((x) => x !== id);
    },
    layerUpdated(state, action) {
      const { id, changes } = action.payload;
      if (!state.byId[id]) return;
      state.byId[id] = { ...state.byId[id], ...changes };
    },
    layersReordered(state, action) {
      const order = action.payload;
      if (!Array.isArray(order)) return;
      state.order = order;
    },
    layersReplaced(state, action) {
      const { layers, order } = action.payload;
      const nextById = {};
      (layers || []).forEach((l) => {
        if (l && l.id) nextById[l.id] = l;
      });
      state.byId = nextById;
      state.order = Array.isArray(order) ? [...order] : [];
    },
    layersCleared(state) {
      state.byId = {};
      state.order = [];
    },
  },
});

export const layerActions = layerSlice.actions;
export default layerSlice.reducer;
