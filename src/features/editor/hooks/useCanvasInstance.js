import { useEffect, useState } from 'react';

import { Canvas as FabricCanvas } from '@/features/editor/utils/fabricFactory';

/**
 * Owns the lifecycle of a Fabric canvas attached to `canvasRef`.
 * The caller declares the ref so React/ESLint can treat it as stable
 * across the component.
 *
 * Phase B: after construction we attach the canvas to the EditorEngine
 * so the engine's CanvasManager can drive background/grid/size/zoom.
 * The canvas itself is still created and disposed here.
 */
export const useCanvasInstance = (
  canvasRef,
  { canvasElRef, initialCanvasSize, initialBackgroundColor, engine },
) => {
  const [isCanvasReady, setIsCanvasReady] = useState(false);

  useEffect(() => {
    console.warn(
      '🔧 [useCanvasInstance] effect running, hasEl?',
      Boolean(canvasElRef.current),
      'hasCanvas?',
      Boolean(canvasRef.current),
      'hasEngine?',
      Boolean(engine),
    );
    if (!canvasElRef.current || canvasRef.current) return undefined;
    canvasRef.current = new FabricCanvas(canvasElRef.current, {
      width: initialCanvasSize.width,
      height: initialCanvasSize.height,
      backgroundColor: initialBackgroundColor,
      preserveObjectStacking: true,
      selection: true,
      fireRightClick: true,
      stopContextMenu: true,
    });

    if (engine) {
      console.warn('🔧 [useCanvasInstance] calling engine.attachFabricCanvas');
      engine.attachFabricCanvas(canvasRef.current);
    } else {
      console.error('🔧 [useCanvasInstance] NO ENGINE — fabric canvas created but not wired!');
    }

    setIsCanvasReady(true);

    return () => {
      if (canvasRef.current) {
        try {
          if (engine && !engine.isDisposed()) engine.detachFabricCanvas();
        } catch (err) {
          // ignore detach errors
        }
        try {
          canvasRef.current.dispose && canvasRef.current.dispose();
        } catch (err) {
          // ignore dispose errors
        }
        canvasRef.current = null;
      }
      setIsCanvasReady(false);
    };
  }, [canvasRef, canvasElRef, engine]);

  return { isCanvasReady };
};

export default useCanvasInstance;
