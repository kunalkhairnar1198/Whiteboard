import React, { useEffect, useRef } from 'react';

/**
 * PenToolOverlay — thin canvas host for the engine's PenRenderer.
 *
 * Phase E replaces the previous React SVG implementation. This
 * component just mounts a <canvas> element and hands its ref to
 * `engine.penRenderer`; the renderer subscribes to bus events and
 * paints all pen visuals at 60fps using canvas 2D, never going
 * through React's reconciler.
 */
export const PenToolOverlay = ({ engine, canvasSize }) => {
  const canvasElRef = useRef(null);

  useEffect(() => {
    if (!engine || !canvasElRef.current) return undefined;
    engine.penRenderer.attach(canvasElRef.current);
    engine.penRenderer.setSize(canvasSize.width, canvasSize.height);
    return () => {
      engine.penRenderer.detach();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  useEffect(() => {
    if (!engine || !canvasElRef.current) return;
    engine.penRenderer.setSize(canvasSize.width, canvasSize.height);
  }, [engine, canvasSize.width, canvasSize.height]);

  return (
    <canvas
      ref={canvasElRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    />
  );
};

export default PenToolOverlay;
