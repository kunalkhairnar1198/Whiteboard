import { historyActions } from './slices/historySlice';
import { layerActions } from './slices/layerSlice';
import { selectionActions } from './slices/selectionSlice';

/**
 * Wires EditorEngine bus events to the Redux store. Call once per
 * engine instance; the returned function detaches all subscriptions.
 *
 * One-way bridge: engine → store. UI code mutates through engine
 * methods (e.g. `engine.layers.update`); the engine fires the bus
 * event that lands here and dispatches the mirror action.
 */
export const attachEngineToStore = (engine, store) => {
  console.warn('🌉 [engineSync] attaching to engine#', engine?._instanceId);
  if (!engine || !store) return () => {};

  const unsubs = [];

  // Push current tool settings into engine.tools.context immediately,
  // then mirror future store changes so the active tool always sees
  // the latest values without React in the loop.
  let prevToolSettings = store.getState().tool.settings;
  engine.tools.setContext(prevToolSettings);
  unsubs.push(
    store.subscribe(() => {
      const nextToolSettings = store.getState().tool.settings;
      if (nextToolSettings === prevToolSettings) return;
      prevToolSettings = nextToolSettings;
      engine.tools.setContext(nextToolSettings);
    }),
  );

  unsubs.push(
    engine.bus.on('layer:added', (payload) => {
      console.log('[engineSync] layer:added received, dispatching', payload);
      store.dispatch(layerActions.layerAdded(payload));
      console.log('[engineSync] post-dispatch state:', store.getState().layer);
    }),
  );
  unsubs.push(
    engine.bus.on('layer:removed', ({ id }) => {
      store.dispatch(layerActions.layerRemoved(id));
    }),
  );
  unsubs.push(
    engine.bus.on('layer:updated', ({ id, changes }) => {
      store.dispatch(layerActions.layerUpdated({ id, changes }));
    }),
  );
  unsubs.push(
    engine.bus.on('layers:reordered', ({ order }) => {
      store.dispatch(layerActions.layersReordered(order));
    }),
  );
  unsubs.push(
    engine.bus.on('layers:replaced', ({ layers, order }) => {
      store.dispatch(layerActions.layersReplaced({ layers, order }));
    }),
  );
  unsubs.push(
    engine.bus.on('selection:changed', ({ ids }) => {
      store.dispatch(selectionActions.selectionChanged(ids));
    }),
  );
  unsubs.push(
    engine.bus.on('history:changed', (flags) => {
      store.dispatch(historyActions.historyFlagsChanged(flags));
    }),
  );
  unsubs.push(
    engine.bus.on('engine:disposing', () => {
      store.dispatch(layerActions.layersCleared());
      store.dispatch(selectionActions.selectionCleared());
      store.dispatch(historyActions.historyCleared());
    }),
  );

  return () => unsubs.forEach((u) => u());
};

export default attachEngineToStore;
