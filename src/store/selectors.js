import { createSelector } from '@reduxjs/toolkit';

// Layers
export const selectLayerOrder = (state) => state.layer.order;
export const selectLayerById = (id) => (state) => state.layer.byId[id] || null;
export const selectLayerCount = (state) => state.layer.order.length;

export const selectLayerList = createSelector(
  [selectLayerOrder, (state) => state.layer.byId],
  (order, byId) => {
    const result = new Array(order.length);
    for (let i = 0; i < order.length; i += 1) {
      result[i] = byId[order[i]];
    }
    return result.filter(Boolean);
  },
);

// History
export const selectCanUndo = (state) => state.history.canUndo;
export const selectCanRedo = (state) => state.history.canRedo;

// Tool settings
export const selectToolSettings = (state) => state.tool.settings;
export const selectToolSetting = (key) => (state) => state.tool.settings[key];

// Selection
export const selectSelectedIds = (state) => state.selection.ids;
export const selectIsSelected = (id) => (state) => state.selection.ids.includes(id);
export const selectSingleSelectedId = createSelector([selectSelectedIds], (ids) =>
  ids.length === 1 ? ids[0] : null,
);
