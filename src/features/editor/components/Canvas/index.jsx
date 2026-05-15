import React, { memo } from 'react';

import { Card } from '@/components/ui/card';

const CanvasArea = ({ canvasRef, containerRef, canvasSize, cursorStyle, children }) => (
  <main
    ref={containerRef}
    className="relative flex flex-1 items-center justify-center overflow-auto bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_45%),linear-gradient(180deg,_rgba(248,250,252,1),_rgba(241,245,249,1))] "
    style={{ cursor: cursorStyle }}
  >
    <Card
      className="relative overflow-hidden rounded-[28px] border-border/70 bg-white "
      style={{ width: canvasSize.width, height: canvasSize.height }}
    >
      <canvas ref={canvasRef} />
      {children}
    </Card>
  </main>
);

export default memo(CanvasArea);
