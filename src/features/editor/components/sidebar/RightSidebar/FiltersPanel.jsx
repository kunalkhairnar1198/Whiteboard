import React, { lazy, memo, Suspense, useCallback } from 'react';
import { useEngineContext } from '@/features/editor/engine/EngineContext';
import { useSelectedElement } from '@/features/editor/hooks/useSelectedElement';

// Code-split: ImageFilterPanel pulls in Fabric's filter classes; load
// only when the user actually opens the Filters tab.
const ImageFilterPanel = lazy(() => import('@/features/editor/components/filters/ImageFilterPanel'));

const FilterFallback = () => (
  <div className="py-12 text-center">
    <p className="text-gray-500 text-sm">Loading filters…</p>
  </div>
);

/**
 * FiltersPanel — wraps the existing ImageFilterPanel and shims its
 * legacy prop shape (it expects a `canvas` ref) from the engine.
 */
const FiltersPanel = () => {
  const { engine, saveState } = useEngineContext();
  const selectedElement = useSelectedElement(engine);

  const onFilterChange = useCallback(() => {
    saveState?.();
  }, [saveState]);

  if (!selectedElement || selectedElement.type !== 'image') {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500 text-sm">Select an image to apply filters</p>
      </div>
    );
  }

  // ImageFilterPanel expects { canvas: refLike } — wrap engine.canvas.fabric.
  const canvasRefLike = { current: engine?.canvas?.fabric ?? null };

  return (
    <Suspense fallback={<FilterFallback />}>
      <ImageFilterPanel
        canvas={canvasRefLike}
        selectedElement={selectedElement}
        onFilterChange={onFilterChange}
      />
    </Suspense>
  );
};

export default memo(FiltersPanel);
