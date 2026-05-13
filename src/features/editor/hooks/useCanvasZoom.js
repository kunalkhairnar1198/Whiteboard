import { useCallback, useEffect } from 'react';
import { parseAsFloat, useQueryState } from 'nuqs';

/**
 * useCanvasZoom — owns zoom state (mirrored in the URL via nuqs) and
 * routes all zoom mutations through the CanvasManager. Also binds the
 * mouse:wheel listener directly to the Fabric canvas once it's ready.
 */
export const useCanvasZoom = (canvas, { engine } = {}) => {
  const [zoom, setZoom] = useQueryState(
    'zoom',
    parseAsFloat.withDefault(1).withOptions({ history: 'replace', shallow: true }),
  );

  const handleZoomIn = useCallback(() => {
    const cm = engine?.canvas;
    if (!cm || !cm.isReady()) return;
    try {
      const next = Math.min(zoom * 1.2, 5);
      cm.setZoom(next);
      setZoom(next);
    } catch (err) {
      console.error('Error zooming in:', err);
    }
  }, [engine, zoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    const cm = engine?.canvas;
    if (!cm || !cm.isReady()) return;
    try {
      const next = Math.max(zoom * 0.8, 0.1);
      cm.setZoom(next);
      setZoom(next);
    } catch (err) {
      console.error('Error zooming out:', err);
    }
  }, [engine, zoom, setZoom]);

  const resetZoom = useCallback(() => {
    const cm = engine?.canvas;
    if (!cm || !cm.isReady()) return;
    try {
      cm.resetViewport();
      setZoom(1);
    } catch (err) {
      console.error('Error resetting zoom:', err);
    }
  }, [engine, setZoom]);

  const handleMouseWheel = useCallback(
    (opt) => {
      const cm = engine?.canvas;
      if (!cm || !cm.isReady() || !cm.fabric) return;
      let next = cm.fabric.getZoom();
      next *= 0.999 ** opt.e.deltaY;
      if (next > 5) next = 5;
      if (next < 0.1) next = 0.1;
      cm.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, next);
      opt.e.preventDefault();
      opt.e.stopPropagation();
      setZoom(next);
    },
    [engine, setZoom],
  );

  // Bind mouse:wheel directly to the Fabric canvas. We can't depend on
  // `engine.canvas.fabric` (not reactive), so use the engine bus:
  // attach when `canvas:attached` fires, detach when `canvas:detached`
  // fires. Re-bind whenever `handleMouseWheel` identity changes (zoom
  // value changes capture a new closure).
  useEffect(() => {
    if (!engine) return undefined;
    let attachedFabric = engine.canvas?.fabric || null;
    if (attachedFabric) attachedFabric.on('mouse:wheel', handleMouseWheel);
    const offAttached = engine.bus.on('canvas:attached', ({ fabric: f }) => {
      attachedFabric = f;
      f.on('mouse:wheel', handleMouseWheel);
    });
    const offDetached = engine.bus.on('canvas:detached', () => {
      if (attachedFabric) attachedFabric.off('mouse:wheel', handleMouseWheel);
      attachedFabric = null;
    });
    return () => {
      if (attachedFabric) attachedFabric.off('mouse:wheel', handleMouseWheel);
      offAttached();
      offDetached();
    };
  }, [engine, handleMouseWheel]);

  return { zoom, setZoom, handleZoomIn, handleZoomOut, resetZoom, handleMouseWheel };
};

export default useCanvasZoom;
