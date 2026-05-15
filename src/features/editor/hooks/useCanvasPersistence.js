import { useCallback, useEffect } from 'react';

import { getNextElementCounterFromState } from '@/features/editor/lib/editorState';
import { loadCanvasState } from '@/features/editor/lib/persistence';

/**
 * useCanvasPersistence — restore + load + workspace orchestration.
 *
 * Auto-save lives entirely in `engine.persistence`: this hook just
 * keeps it informed of the React-side bits (template name → storage
 * keys; loading flag while restore runs) and exposes a thin
 * `safeSaveState` that proxies to `engine.persistence.scheduleSave`.
 *
 * Owns:
 *  - sync of templateName → engine.persistence.setNames
 *  - the initial baseline-save effect (after canvas is ready)
 *  - the initial restore-from-localStorage effect (mount once)
 *  - undo/redo + load handlers
 */
export const useCanvasPersistence = ({
  engine,
  canvas,
  isCanvasReady,
  templateName,
  setTemplateName,
  initialDiagramName,
  syncElementCounter,
  history,
}) => {
  // Keep the persistence service's localStorage keys in sync with
  // the current template name.
  useEffect(() => {
    const names = ['current'];
    if (templateName && templateName !== 'Untitled Template') names.push(templateName);
    engine.persistence.setNames(names);
  }, [engine, templateName]);

  // Thin alias around the engine's debounced auto-save so existing
  // callers (useElementUpdater, useImageInsertion, layer ops, etc.)
  // keep their `safeSaveState()` shape.
  const safeSaveState = useCallback(() => {
    engine.persistence.scheduleSave();
  }, [engine]);

  // Restore canvas from a JSON payload, syncing layer projection,
  // selection, and element counter. Gates engine auto-save while in
  // flight via persistence.setLoading.
  const restoreCanvasState = useCallback(
    async (state) => {
      if (!state || !canvas.current) return;
      engine.persistence.setLoading(true);
      try {
        // Detach layer tracking so per-object adds during load don't
        // fire N dispatches; reattach refreshes in one shot.
        engine.layers.detach();
        await canvas.current.loadFromJSON(state);
        canvas.current.requestRenderAll();
        canvas.current.discardActiveObject();
        engine.layers.attach(canvas.current);
        engine.selection.clear();
        syncElementCounter(getNextElementCounterFromState(state));
      } catch (error) {
        console.error('Error restoring canvas state:', error);
      } finally {
        engine.persistence.setLoading(false);
      }
    },
    [engine, canvas, syncElementCounter],
  );

  const handleUndo = useCallback(() => {
    const previousState = history.undo();
    if (previousState) restoreCanvasState(previousState);
  }, [history, restoreCanvasState]);

  const handleRedo = useCallback(() => {
    const nextState = history.redo();
    if (nextState) restoreCanvasState(nextState);
  }, [history, restoreCanvasState]);

  const loadWorkspaceFromFile = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = JSON.parse(event.target.result);
          await restoreCanvasState(json);
          setTemplateName(file.name.replace('.json', ''));
        } catch (err) {
          console.error('Failed to load workspace file:', err);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [restoreCanvasState, setTemplateName],
  );

  const loadSavedDiagram = useCallback(
    async (name) => {
      const state = loadCanvasState(name);
      if (state) {
        await restoreCanvasState(state);
        setTemplateName(name);
      }
    },
    [restoreCanvasState, setTemplateName],
  );

  // Initial baseline save once the canvas is ready (so undo always has
  // something to fall back to). scheduleSave already gates on
  // engine.persistence.isLoading(), so no explicit guard needed here.
  useEffect(() => {
    if (!isCanvasReady) return undefined;
    const t = setTimeout(() => {
      try {
        if (canvas.current) safeSaveState();
      } catch (err) {
        console.error('Error saving initial state:', err);
      }
    }, 100);
    return () => clearTimeout(t);
  }, [isCanvasReady, canvas, safeSaveState]);

  // One-shot restore from localStorage at mount (uses the diagram name
  // from the URL or 'current' as fallback).
  useEffect(() => {
    if (!isCanvasReady || !canvas.current) return;
    const savedState = loadCanvasState(initialDiagramName || 'current');
    if (savedState) restoreCanvasState(savedState);
  }, [isCanvasReady, canvas, initialDiagramName, restoreCanvasState]);

  return {
    safeSaveState,
    restoreCanvasState,
    loadWorkspaceFromFile,
    loadSavedDiagram,
    handleUndo,
    handleRedo,
  };
};

export default useCanvasPersistence;
