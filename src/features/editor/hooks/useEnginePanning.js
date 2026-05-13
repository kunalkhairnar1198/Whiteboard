import { useEffect, useState } from 'react';

/**
 * useEnginePanning — bidirectional pan state bridge.
 *
 * - Mirrors `canvas:pan:started/ended` bus events into local `isPanning`
 *   state so React-side concerns (cursorStyle, etc.) can re-render.
 * - Pushes `isSpacePressed` (owned by the keyboard hook) into
 *   `engine.canvas.setSpacePressed` so the PanTool dispatcher can
 *   consider space-held as an override.
 */
export const useEnginePanning = (engine, isSpacePressed) => {
  const [isPanning, setIsPanning] = useState(false);

  useEffect(() => {
    if (!engine) return undefined;
    const offStart = engine.bus.on('canvas:pan:started', () => setIsPanning(true));
    const offEnd = engine.bus.on('canvas:pan:ended', () => setIsPanning(false));
    return () => {
      offStart();
      offEnd();
    };
  }, [engine]);

  useEffect(() => {
    engine.canvas.setSpacePressed(isSpacePressed);
  }, [engine, isSpacePressed]);

  return { isPanning };
};

export default useEnginePanning;
