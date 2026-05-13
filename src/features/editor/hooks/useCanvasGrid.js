import { useEffect, useMemo, useState } from 'react';

/**
 * useCanvasGrid — owns the grid React state and pushes it to the
 * CanvasManager.
 *
 * Phase B: delegates the actual draw to `engine.canvas.setGrid`. The
 * returned `gridGroup` object preserves the existing `.current`
 * accessor used by FabricEditor (e.g. when exporting an image without
 * the grid).
 */
export const useCanvasGrid = (canvas, { canvasSize, engine }) => {
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);

  useEffect(() => {
    const cm = engine?.canvas;
    if (!cm || !cm.isReady()) return;
    cm.setGrid({ show: showGrid, size: gridSize, canvasSize });
  }, [engine, canvasSize, showGrid, gridSize]);

  // Expose a stable ref-like accessor backed by the CanvasManager's
  // grid group, so existing call sites keep working.
  const gridGroup = useMemo(
    () => ({
      get current() {
        return engine?.canvas?.getGridGroup?.() ?? null;
      },
      set current(_) {
        // CanvasManager owns the grid group; callers should use
        // setGrid/getGridGroup. Setter retained for API symmetry.
      },
    }),
    [engine],
  );

  return { showGrid, setShowGrid, gridSize, setGridSize, gridGroup };
};

export default useCanvasGrid;
