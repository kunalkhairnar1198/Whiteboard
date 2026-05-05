// src/hooks/useFabricDrawing.js
import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

/**
 * Custom hook to initialize and control Fabric.js drawing canvas
 * @param {Object} options - Canvas config options and brush settings
 * @returns {Object} { canvasRef, fabricCanvas, clearCanvas, updateBrush, toggleDrawingMode }
 */
export const useFabricDrawing = (options = {}) => {
  const {
    width = 800,
    height = 500,
    isDrawingMode = true,
    brushType = 'Pencil',
    brushColor = '#000000',
    shadowColor = '#000000',
    lineWidth = 5,
    shadowBlur = 0,
    shadowOffset = 0,
  } = options;

  const canvasRef = useRef(null);
  const fabricCanvas = useRef(null);

  // Initialize Fabric.js canvas once
  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode,
      width,
      height,
    });
    fabricCanvas.current = canvas;
    fabric.Object.prototype.transparentCorners = false;

    // Default brush
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    updateBrush({ canvas });

    return () => {
      canvas.dispose();
    };
  }, []);

  // Update brush dynamically
  const updateBrush = ({
    canvas = fabricCanvas.current,
    type = brushType,
    color = brushColor,
    width = lineWidth,
    shadowC = shadowColor,
    blur = shadowBlur,
    offset = shadowOffset,
  } = {}) => {
    if (!canvas) return;

    let brush;
    const makePatternBrush = (callback) => {
      const b = new fabric.PatternBrush(canvas);
      b.getPatternSrc = callback;
      return b;
    };

    switch (type) {
      case 'hline':
        brush = makePatternBrush(function () {
          const c = document.createElement('canvas');
          c.width = c.height = 10;
          const ctx = c.getContext('2d');
          ctx.strokeStyle = this.color;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(0, 5);
          ctx.lineTo(10, 5);
          ctx.stroke();
          return c;
        });
        break;

      case 'vline':
        brush = makePatternBrush(function () {
          const c = document.createElement('canvas');
          c.width = c.height = 10;
          const ctx = c.getContext('2d');
          ctx.strokeStyle = this.color;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(5, 0);
          ctx.lineTo(5, 10);
          ctx.stroke();
          return c;
        });
        break;

      case 'square':
        brush = makePatternBrush(function () {
          const size = 10, gap = 2;
          const c = document.createElement('canvas');
          c.width = c.height = size + gap;
          const ctx = c.getContext('2d');
          ctx.fillStyle = this.color;
          ctx.fillRect(0, 0, size, size);
          return c;
        });
        break;

      case 'diamond':
        brush = makePatternBrush(function () {
          const size = 10, gap = 5;
          const c = document.createElement('canvas');
          const rect = new fabric.Rect({
            width: size,
            height: size,
            angle: 45,
            fill: this.color,
          });
          const rectWidth = rect.getBoundingRect().width;
          c.width = c.height = rectWidth + gap;
          rect.set({ left: rectWidth / 2, top: rectWidth / 2 });
          const ctx = c.getContext('2d');
          rect.render(ctx);
          return c;
        });
        break;

      case 'texture':
        const img = new Image();
        img.src = '/assets/ladybug.png';
        brush = new fabric.PatternBrush(canvas);
        brush.source = img;
        break;

      default:
        const BrushClass = fabric[`${type}Brush`] || fabric.PencilBrush;
        brush = new BrushClass(canvas);
    }

    // Apply properties
    brush.color = color;
    brush.width = parseInt(width, 10) || 1;
    brush.shadow = new fabric.Shadow({
      blur: parseInt(blur, 10) || 0,
      offsetX: parseInt(offset, 10) || 0,
      offsetY: parseInt(offset, 10) || 0,
      affectStroke: true,
      color: shadowC,
    });

    canvas.freeDrawingBrush = brush;
  };

  const clearCanvas = () => {
    fabricCanvas.current?.clear();
  };

  const toggleDrawingMode = () => {
    const canvas = fabricCanvas.current;
    if (!canvas) return false;
    canvas.isDrawingMode = !canvas.isDrawingMode;
    return canvas.isDrawingMode;
  };

  return {
    canvasRef,
    fabricCanvas,
    clearCanvas,
    updateBrush,
    toggleDrawingMode,
  };
};
