import { fabric } from 'fabric';

export const createShape = (type, id, counter, customProps = {}) => {
  const baseProps = {
    left: 100 + (counter * 20) % 400,
    top: 100 + (counter * 20) % 300,
    name: `${type}-${counter}`,
    lockMovementX: false,
    lockMovementY: false,
    visible: true,
    data: { id, type },
    ...customProps,
  };

  switch (type) {
    case 'rectangle':
      return new fabric.Rect({
        width: 150,
        height: 100,
        fill: '#3b82f6',
        stroke: '#1e40af',
        strokeWidth: 2,
        ...baseProps,
      });
    case 'circle':
      return new fabric.Circle({
        radius: 60,
        fill: '#8b5cf6',
        stroke: '#6d28d9',
        strokeWidth: 2,
        ...baseProps,
      });
    // ... other shapes (triangle, star, arrow, line, polygon, text, frame)
    default:
      console.error('Unknown shape type:', type);
      return null;
  }
};