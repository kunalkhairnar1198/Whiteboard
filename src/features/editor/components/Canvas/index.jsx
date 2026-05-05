import React from 'react';
import { Card } from '@/components/ui/card';

// Canvas area component
// Flow: Render canvas element with dynamic size and cursor.
const CanvasArea = ({ canvasRef, containerRef, canvasSize, cursorStyle, children }) => {
  return (
    <main
      ref={containerRef}
      className="relative flex flex-1 items-center justify-center overflow-auto bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,1),_rgba(241,245,249,1))] p-3 sm:p-4 md:p-6 lg:p-8"
      style={{ cursor: cursorStyle }}
    >
      <Card
        className="relative overflow-hidden rounded-[28px] border-border/70 bg-white shadow-2xl"
        style={{ width: canvasSize.width, height: canvasSize.height }}
      >
        <canvas ref={canvasRef} />
        {children}
      </Card>
    </main>
  );
};

export default CanvasArea;
