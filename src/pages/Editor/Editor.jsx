// FabricEditor.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { parseAsFloat, parseAsString, useQueryState } from 'nuqs';

import useCanvasBackground from '@/features/editor/hooks/useCanvasBackground';
import useCanvasGrid from '@/features/editor/hooks/useCanvasGrid';
import useCanvasInstance from '@/features/editor/hooks/useCanvasInstance';
import useCanvasKeyboard from '@/features/editor/hooks/useCanvasKeyboard';
import useCanvasPersistence from '@/features/editor/hooks/useCanvasPersistence';
import useCanvasSize from '@/features/editor/hooks/useCanvasSize';
import useCanvasZoom from '@/features/editor/hooks/useCanvasZoom';
import useEditor from '@/features/editor/hooks/useEditor';
import useEditorUIState from '@/features/editor/hooks/useEditorUIState';
import useElementCounter from '@/features/editor/hooks/useElementCounter';
import { useElementUpdater } from '@/features/editor/hooks/useElementUpdater';
import useEnginePanning from '@/features/editor/hooks/useEnginePanning';
import useHistory from '@/features/editor/hooks/useHistory';
import useImageInsertion from '@/features/editor/hooks/useImageInsertion';
import useTemplateName from '@/features/editor/hooks/useTemplateName';
import { usePenTool } from '@/features/editor/tools/pen/usePenTool';

import { EngineProvider } from '@/features/editor/engine/EngineContext';
import { isShapeTool } from '@/features/editor/lib/canvasUtils';
import { getSavedDiagramsList } from '@/features/editor/lib/persistence';
import { PenToolOverlay } from '@/features/editor/tools/pen/PenToolOverlay';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import CanvasArea from '@/features/editor/components/Canvas';
import Header from '@/features/editor/components/sidebar/Header';
import LeftSidebar from '@/features/editor/components/sidebar/LeftSidebar';
import RightSidebar from '@/features/editor/components/sidebar/RightSidebar';
import EditorToolbar from '@/features/editor/components/Toolbar/EditorToolbar';
import { canvasPresets } from '@/features/editor/constants/canvasPresets';

/**
 * FabricEditor
 * - Fixed: background image upload now sets the canvas background image and waits for it to load
 * - Defensive: supports utilities that return a Promise or use a callback
 * - Comments explain the flows where saving state and rendering matter
 */

const FabricEditor = ({ initialDiagramName, onBack }) => {
  // -------------------------
  // Refs (declared first so hooks below can close over them)
  // -------------------------
  const canvasRef = useRef(null);
  const canvas = useRef(null);
  // Shape-drawing / text-creating / anchor-helper refs moved into
  // their respective Tool classes (Phase D). Pan state lives in
  // CanvasManager. autoSaveTimer + isLoadingRef live in
  // useCanvasPersistence.

  // -------------------------
  // States
  // -------------------------
  // Layer list + selection now live in Redux, populated by
  // engine.layers / engine.selection via the engineSync bridge.
  // LeftSidebar reads `elements` via useLayers() directly; image
  // insertion sets selection via engine.selection.setSelection.
  const engine = useEditor();
  const { zoom, setZoom, handleZoomIn, handleZoomOut, resetZoom } = useCanvasZoom(canvas, {
    engine,
  });
  const { canvasSize, selectedPreset, handlePresetChange } = useCanvasSize({ zoom, engine });
  const { background, setBackground, handleBgImageUpload } = useCanvasBackground(canvas, {
    canvasSize,
    engine,
  });
  const { isCanvasReady } = useCanvasInstance(canvas, {
    canvasElRef: canvasRef,
    initialCanvasSize: canvasSize,
    initialBackgroundColor: background.type === 'color' ? background.value : '#ffffff',
    engine,
  });
  const { showGrid, setShowGrid, gridSize, setGridSize } = useCanvasGrid(canvas, {
    canvasSize,
    engine,
  });
  const [currentTool, setCurrentTool] = useQueryState(
    'tool',
    parseAsString.withDefault('select').withOptions({ history: 'replace', shallow: true }),
  );
  // Tool settings live in toolSlice (Redux). engineSync mirrors them
  // into engine.tools.context whenever they change.
  const {
    counterRef: elementCounterRef,
    increment: incrementElementCounter,
    syncFromState: syncElementCounter,
  } = useElementCounter(0);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const { isPanning } = useEnginePanning(engine, isSpacePressed);
  const ui = useEditorUIState();
  const {
    showLayers,
    setShowLayers,
    showFilters,
    setShowFilters,
    showLeftSidebar,
    setShowLeftSidebar,
    showRightSidebar,
    setShowRightSidebar,
    toolbarOrientation,
    setToolbarOrientation,
  } = ui;
  const { templateName, setTemplateName, saveWorkspace } = useTemplateName(initialDiagramName, {
    canvas,
  });

  // -------------------------
  // History (buffer in engine.history; flags via Redux) + persistence.
  // -------------------------
  const history = useHistory(engine);
  const { canUndo, canRedo } = history;
  const { safeSaveState, loadWorkspaceFromFile, loadSavedDiagram, handleUndo, handleRedo } =
    useCanvasPersistence({
      engine,
      canvas,
      isCanvasReady,
      templateName,
      setTemplateName,
      initialDiagramName,
      syncElementCounter,
      history,
    });
  const isTextObject = useCallback((obj) => obj?.type === 'textbox' || obj?.type === 'i-text', []);

  // -------------------------
  // canvasSize → canvas.setDimensions is now owned by useCanvasSize
  // (which calls engine.canvas.setSize on change).
  // -------------------------

  // Pen path commit + edit-mode visibility restore are owned by
  // PenStateMachine.commit / .reset; no React-side handler needed.
  const penTool = usePenTool(engine);

  const { handleImageUpload } = useImageInsertion({
    canvas,
    engine,
    counterRef: elementCounterRef,
    incrementElementCounter,
    setShowFilters,
    setShowLayers,
    safeSaveState,
  });

  // -------------------------
  // Element property updates — useElementUpdater handles the special
  // cases (filters, gradient, text wrap/decoration) and routes plain
  // updates through obj.set.
  // -------------------------
  const handleElementChange = useElementUpdater(engine, { onCommit: safeSaveState });

  // -------------------------
  // Delete / duplicate / layer controls
  // -------------------------
  const deleteSelected = useCallback(() => {
    const ids = engine.selection.getIds();
    if (ids.length === 0) return;
    engine.layers.removeMany(ids);
    engine.selection.clear();
    safeSaveState();
  }, [engine, safeSaveState]);

  const duplicateSelected = useCallback(async () => {
    const ids = engine.selection.getIds();
    if (ids.length !== 1) return;
    const newId = `element-${elementCounterRef.current}`;
    const created = await engine.layers.duplicate(ids[0], newId);
    if (!created) return;
    incrementElementCounter();
    engine.selection.setSelection([newId]);
    safeSaveState();
  }, [engine, elementCounterRef, incrementElementCounter, safeSaveState]);

  // Layer ops (toggleVisible, toggleLock, move, delete, select) are
  // owned by LayersPanel — see LayersPanel.jsx.

  const clearCanvas = useCallback(() => {
    if (!window.confirm('Clear all layers? This cannot be undone.')) return;
    engine.layers.clear();
    syncElementCounter(0);
    safeSaveState();
  }, [engine, syncElementCounter, safeSaveState]);

  const exportCanvas = useCallback(
    (format) => engine.canvas.exportImage({ format, fileName: templateName }),
    [engine, templateName],
  );

  // selectedElement is computed inside PropertiesPanel via
  // useSelectedElement; FabricEditor no longer derives it.

  const cursorStyle = (() => {
    if (isPanning) return 'grabbing';
    switch (currentTool) {
      case 'pan':
        return 'grab';

      case 'pen':
        if (penTool.state.hoveredPoint) {
          if (penTool.state.hoveredPoint.startsWith('anchor')) return 'move';
          return 'crosshair';
        }
        return 'crosshair'; // Should ideally be a custom pen icon
      case 'brush':
        return 'crosshair';
      case 'eraser':
        return 'pointer';
      case 'text':
        return 'text';
      default:
        return isShapeTool(currentTool) ? 'crosshair' : 'default';
    }
  })();

  // Brush prop updates are now owned by BrushTool.onContextUpdate.

  // -------------------------
  // Tool activation — ToolManager owns the canvas mouse events; this
  // effect only flips the active tool. Listeners are bound once when
  // the engine attaches to the canvas (in attachFabricCanvas).
  // -------------------------
  useEffect(() => {
    if (!isCanvasReady) return;
    engine.tools.activate(currentTool);
  }, [engine, isCanvasReady, currentTool]);

  // -------------------------
  // Tool context — only helper callbacks here now. Tool settings are
  // mirrored by engineSync directly from toolSlice into
  // engine.tools.context, so this effect doesn't need to re-fire on
  // every slider tick.
  // -------------------------
  useEffect(() => {
    engine.tools.setContext({
      elementCounterRef,
      incrementElementCounter,
      safeSaveState,
      setShowFilters,
      setShowLayers,
      setShowRightSidebar,
    });
  }, [
    engine,
    elementCounterRef,
    incrementElementCounter,
    safeSaveState,
    setShowFilters,
    setShowLayers,
    setShowRightSidebar,
  ]);

  // Engine-level canvas listeners (dblclick, object:*, object:moving)
  // are bound by EditorEngine.attachFabricCanvas. The pen-edit-request
  // event tells React to flip the active tool when the user double-
  // clicks an existing path.
  useEffect(() => {
    if (!engine) return undefined;
    return engine.bus.on('pen:edit-requested', () => setCurrentTool('pen'));
  }, [engine, setCurrentTool]);

  useCanvasKeyboard({
    engine,
    canvas,
    currentTool,
    setCurrentTool,
    handleUndo,
    handleRedo,
    duplicateSelected,
    deleteSelected,
    isTextObject,
    setShowLeftSidebar,
    setShowRightSidebar,
    setIsSpacePressed,
  });

  // -------------------------
  // Render
  // -------------------------
  return (
    <EngineProvider
      engine={engine}
      handleElementChange={handleElementChange}
      saveState={safeSaveState}
      duplicateSelected={duplicateSelected}
      deleteSelected={deleteSelected}
    >
      <SidebarProvider className="bg-background h-screen font-sans">
        <div className="flex flex-col w-full h-screen">
          <Header
            templateName={templateName}
            setTemplateName={setTemplateName}
            zoom={zoom}
            handleZoomIn={handleZoomIn}
            handleZoomOut={handleZoomOut}
            resetZoom={resetZoom}
            handleUndo={handleUndo}
            handleRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            exportCanvas={exportCanvas}
            saveWorkspace={saveWorkspace}
            loadWorkspaceFromFile={loadWorkspaceFromFile}
            clearCanvas={clearCanvas}
            setShowLeftSidebar={setShowLeftSidebar}
            setShowRightSidebar={setShowRightSidebar}
            onBack={onBack}
            toolbarOrientation={toolbarOrientation}
            setToolbarOrientation={setToolbarOrientation}
            showLeftSidebar={showLeftSidebar}
            showRightSidebar={showRightSidebar}
          />
          <div className="flex flex-1 overflow-hidden relative">
            <LeftSidebar
              currentTool={currentTool}
              setCurrentTool={setCurrentTool}
              canvas={isCanvasReady ? canvas.current : null}
              showLeftSidebar={showLeftSidebar}
              setShowLeftSidebar={setShowLeftSidebar}
              handleImageUpload={handleImageUpload}
              background={background}
              setBackground={setBackground}
              handleBgImageUpload={handleBgImageUpload}
              showGrid={showGrid}
              setShowGrid={setShowGrid}
              gridSize={gridSize}
              setGridSize={setGridSize}
              selectedPreset={selectedPreset}
              handlePresetChange={handlePresetChange}
              canvasPresets={canvasPresets}
              saveState={safeSaveState}
              loadSavedDiagram={loadSavedDiagram}
              getSavedDiagramsList={getSavedDiagramsList}
            />
            <SidebarInset className="min-w-0  relative">
              <EditorToolbar
                currentTool={currentTool}
                setCurrentTool={setCurrentTool}
                canvas={isCanvasReady ? canvas.current : null}
                onImageUpload={handleImageUpload}
                orientation={toolbarOrientation}
              />
              <CanvasArea canvasRef={canvasRef} canvasSize={canvasSize} cursorStyle={cursorStyle}>
                {currentTool === 'pen' && (
                  <PenToolOverlay engine={engine} canvasSize={canvasSize} />
                )}
              </CanvasArea>
            </SidebarInset>
            <RightSidebar
              showRightSidebar={showRightSidebar}
              setShowRightSidebar={setShowRightSidebar}
              showLayers={showLayers}
              setShowLayers={setShowLayers}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              currentTool={currentTool}
            />
          </div>
        </div>
      </SidebarProvider>
    </EngineProvider>
  );
};

export default FabricEditor;
