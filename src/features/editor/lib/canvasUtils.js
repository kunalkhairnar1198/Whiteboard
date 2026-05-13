import {
  Canvas,
  Rect,
  Circle,
  Triangle,
  Path,
  Line,
  Polygon,
  IText,
  Image as FabricImage,
  Group,
  Pattern,
  PatternBrush,
  Point,
  fabric,
} from '@/features/editor/utils/fabricFactory';

export const SHAPE_TOOLS = [
  'rectangle',
  'circle',
  'triangle',
  'star',
  'arrow',
  'line',
  'polygon',
  'frame',
  'pen',
];

export const isShapeTool = (tool) => SHAPE_TOOLS.includes(tool);

/**
 * Set canvas background color
 */
export const setCanvasBackgroundColor = (canvas, color) => {
  if (!canvas) return console.error('Canvas not initialized');

  try {
    canvas.backgroundColor = color;
    canvas.requestRenderAll?.() || canvas.renderAll();
  } catch (err) {
    console.error('Error setting background color:', err);
  }
};

/**
 * Set canvas background image
 */

export const setCanvasBackgroundImage = async (canvas, imageUrl, canvasSize) => {
  if (!canvas || !imageUrl) return;

  try {
    const img = await FabricImage.fromURL(imageUrl);

    // Maintain aspect ratio & fill canvas
    const scale = Math.max(canvasSize.width / img.width, canvasSize.height / img.height);

    img.scale(scale);
    img.set({
      selectable: false,
      evented: false,
      originX: 'left',
      originY: 'top',
    });

    // ✅ Fabric v6 background API
    canvas.set('backgroundImage', img);

    // ✅ Important: ensure full redraw
    canvas.requestRenderAll?.();
    canvas.renderAll?.();

    return true;
  } catch (err) {
    console.error('Error setting canvas background image:', err);
    throw err;
  }
};

/**
 * Build a small offscreen canvas containing one grid cell's stroke
 * pattern. Used as the source of a repeating Pattern fill.
 */
const createGridPatternSource = (size, color = '#e5e7eb') => {
  const c = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  c.width = Math.max(1, Math.round(size * dpr));
  c.height = Math.max(1, Math.round(size * dpr));
  c.style.width = `${size}px`;
  c.style.height = `${size}px`;
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  // Sub-pixel offset for crisp 1px lines on the right and bottom edges
  // of the cell — when tiled this yields a clean grid.
  ctx.beginPath();
  ctx.moveTo(size - 0.5, 0);
  ctx.lineTo(size - 0.5, size);
  ctx.moveTo(0, size - 0.5);
  ctx.lineTo(size, size - 0.5);
  ctx.stroke();
  return c;
};

/**
 * Draw grid — Phase I: replaces the 2000-Line+Group rebuild with a
 * single Rect filled with a tiled Pattern. Toggling visibility costs
 * one set+render; resizing the canvas costs nothing (the Rect covers
 * a large area). Changing gridSize regenerates the small pattern
 * source canvas only.
 *
 * Signature unchanged for caller compatibility: `gridGroup.current`
 * still receives the host Rect.
 */
export const drawGrid = (canvas, showGrid, gridSize, _canvasSize, gridGroup) => {
  if (!canvas) return;

  if (gridGroup.current) {
    canvas.remove(gridGroup.current);
    gridGroup.current = null;
  }

  if (!showGrid) {
    canvas.requestRenderAll?.() || canvas.renderAll();
    return;
  }

  const pattern = new Pattern({
    source: createGridPatternSource(gridSize),
    repeat: 'repeat',
  });

  // Cover a large area so pan within reasonable bounds always sees grid.
  const extent = 20000;
  const rect = new Rect({
    left: -extent / 2,
    top: -extent / 2,
    width: extent,
    height: extent,
    fill: pattern,
    selectable: false,
    evented: false,
    hoverCursor: 'default',
    excludeFromExport: true,
    objectCaching: false,
  });

  gridGroup.current = rect;
  canvas.add(rect);

  // Send to back so it sits below user content.
  if (typeof canvas.sendObjectToBack === 'function') {
    canvas.sendObjectToBack(rect);
  } else if (typeof canvas.sendToBack === 'function') {
    canvas.sendToBack(rect);
  } else {
    try {
      const objs = canvas.getObjects();
      const idx = objs.indexOf(rect);
      if (idx > -1) {
        objs.splice(idx, 1);
        objs.unshift(rect);
      }
    } catch (err) {
      /* ignore */
    }
  }
  canvas.requestRenderAll?.() || canvas.renderAll();
};

/**
 * Get anchor points for a shape
 */
export const getShapeAnchors = (obj) => {
  if (!obj) return [];

  // For basic shapes, return top, right, bottom, left centers
  const width = obj.width * obj.scaleX;
  const height = obj.height * obj.scaleY;
  const rx = width / 2;
  const ry = height / 2;

  // Center point in canvas coordinates
  const center = obj.getCenterPoint();

  // Define relative anchor points
  const anchors = [
    { x: 0, y: -ry, name: 'top' },
    { x: rx, y: 0, name: 'right' },
    { x: 0, y: ry, name: 'bottom' },
    { x: -rx, y: 0, name: 'left' },
  ];

  // Rotate anchors based on object angle
  const angleRad = (obj.angle || 0) * (Math.PI / 180);
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  return anchors.map((anchor) => ({
    x: center.x + (anchor.x * cos - anchor.y * sin),
    y: center.y + (anchor.x * sin + anchor.y * cos),
    name: anchor.name,
    ownerId: obj.data?.id,
  }));
};

/**
 * Update all lines connected to an object
 */
export const updateConnections = (canvas, obj) => {
  if (!canvas || !obj || !obj.data?.id) return;

  const objId = obj.data.id;
  const anchors = getShapeAnchors(obj);

  canvas.getObjects().forEach((o) => {
    if (o.type === 'line' && o.data?.connector) {
      let changed = false;

      // Check if this line is connected to the moved object at either end
      if (o.data.sourceId === objId) {
        const anchor = anchors.find((a) => a.name === o.data.sourceAnchor);
        if (anchor) {
          o.set({ x1: anchor.x, y1: anchor.y });
          changed = true;
        }
      }

      if (o.data.targetId === objId) {
        const anchor = anchors.find((a) => a.name === o.data.targetAnchor);
        if (anchor) {
          o.set({ x2: anchor.x, y2: anchor.y });
          changed = true;
        }
      }

      if (changed) {
        o.setCoords();
      }
    }
  });
};

/**
 * Add shape to canvas
 */
export const addShape = (
  canvas,
  type,
  customProps,
  elementCounter,
  textColor,
  setElementCounter,
  setSelectedIds,
  syncElements,
  saveState,
) => {
  if (!canvas || !type) return;

  const id = `element-${elementCounter}`;
  // allow passing radius and gradient via customProps
  const baseProps = {
    left: 100 + ((elementCounter * 20) % 400),
    top: 100 + ((elementCounter * 20) % 300),
    name: `${type}-${elementCounter}`,
    data: { id, type },
    ...customProps,
  };

  let obj;

  switch (type) {
    case 'rectangle':
      obj = new Rect({
        width: 150,
        height: 100,
        fill: 'transparent',
        stroke: '#000000',
        strokeWidth: 2,
        ...baseProps,
      });
      break;
    case 'circle':
      obj = new Circle({
        radius: customProps && customProps.radius ? customProps.radius : 60,
        fill: 'transparent',
        stroke: '#000000',
        strokeWidth: 2,
        ...baseProps,
      });
      break;
    case 'triangle':
      obj = new Triangle({
        width: 120,
        height: 120,
        fill: 'transparent',
        stroke: '#000000',
        strokeWidth: 2,
        ...baseProps,
      });
      break;
    case 'star':
      const starPath = 'M 0 -50 L 29 40 L -47 -15 L 47 -15 L -29 40 Z';
      obj = new Path(starPath, {
        fill: 'transparent',
        stroke: '#000000',
        strokeWidth: 2,
        ...baseProps,
      });
      break;
    case 'arrow':
      const arrowPath = 'M 0 0 L 120 0 M 120 0 L 105 15 M 120 0 L 105 -15';
      obj = new Path(arrowPath, {
        stroke: '#000000',
        strokeWidth: 3,
        fill: 'transparent',
        ...baseProps,
      });
      break;
    case 'line':
      obj = new Line([0, 0, 150, 100], { stroke: '#1f2937', strokeWidth: 4, ...baseProps });
      break;
    case 'polygon':
      obj = new Polygon(
        [
          { x: 0, y: -60 },
          { x: 52, y: -30 },
          { x: 52, y: 30 },
          { x: 0, y: 60 },
          { x: -52, y: 30 },
          { x: -52, y: -30 },
        ],
        { fill: 'transparent', stroke: '#000000', strokeWidth: 2, ...baseProps },
      );
      break;
    case 'text':
      obj = new IText('Type here', {
        fontSize: 24,
        fontFamily: 'Arial',
        fill: textColor,
        editable: true,
        objectCaching: false,
        ...baseProps,
      });
      break;
    case 'frame':
      obj = new Rect({
        width: customProps && customProps.width ? customProps.width : 200,
        height: customProps && customProps.height ? customProps.height : 200,
        fill: 'transparent',
        stroke: '#000',
        strokeWidth: 4,
        strokeDashArray: [10, 5],
        ...baseProps,
      });
      break;
    default:
      console.error('Unknown shape type:', type);
      return;
  }

  // Apply gradient fill if provided: { type: 'linear'|'radial', colors: ['#fff','#000'], coords?: {...} }
  if (obj && customProps && customProps.gradient && Array.isArray(customProps.gradient.colors)) {
    try {
      const g = customProps.gradient;
      const colorStops = g.colors.map((c, i) => ({
        offset: colorStopsOffset(i, g.colors.length),
        color: c,
      }));
      // coords fallback: left-to-right across object bounds
      const width = obj.width || (obj.radius ? obj.radius * 2 : 100);
      const height = obj.height || (obj.radius ? obj.radius * 2 : 100);
      const coords = g.coords || { x1: 0, y1: 0, x2: width, y2: 0 };
      const gradient = new fabric.Gradient({
        type: g.type || 'linear',
        gradientUnits: 'pixels',
        coords,
        colorStops,
      });
      obj.set('fill', gradient);
    } catch (err) {
      console.error('addShape: Failed to apply gradient', err);
    }
  }

  if (obj) {
    // If rectangle and a corner radius was provided as `radius`, map it to rx/ry (fabric supports rx/ry)
    if (obj.type === 'rect' && customProps && customProps.radius) {
      try {
        obj.set({ rx: customProps.radius, ry: customProps.radius });
      } catch (err) {
        // ignore if rx/ry not supported in this fabric build
      }
    }

    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.requestRenderAll?.() || canvas.renderAll();
    setElementCounter((prev) => prev + 1);
    setSelectedIds([id]);
    syncElements();
    setTimeout(() => saveState?.(canvas.toJSON()), 100);
  }
};

export const createInteractiveShape = ({ type, id, x, y, textColor }) => {
  const common = {
    left: x,
    top: y,
    originX: 'left',
    originY: 'top',
    selectable: false,
    evented: false,
    name: `${type}-${id.split('-')[1]}`,
    data: { id, type },
  };

  switch (type) {
    case 'rectangle':
      return new Rect({
        width: 1,
        height: 1,
        fill: 'transparent',
        stroke: '#000000',
        strokeWidth: 2,
        ...common,
      });
    case 'circle':
      return new Circle({
        radius: 1,
        fill: 'transparent',
        stroke: '#000000',
        strokeWidth: 2,
        ...common,
      });
    case 'triangle':
      return new Triangle({
        width: 1,
        height: 1,
        fill: 'transparent',
        stroke: '#000000',
        strokeWidth: 2,
        ...common,
      });
    case 'line':
      return new Line([x, y, x + 1, y + 1], {
        stroke: '#1f2937',
        strokeWidth: 4,
        ...common,
      });
    case 'frame':
      return new Rect({
        width: 1,
        height: 1,
        fill: 'transparent',
        stroke: '#000',
        strokeWidth: 4,
        strokeDashArray: [10, 5],
        ...common,
      });
    case 'star':
      return new Path(
        'M 50 0 L 61 35 L 98 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 2 35 L 39 35 Z',
        {
          fill: 'transparent',
          stroke: '#000000',
          strokeWidth: 2,
          scaleX: 0.01,
          scaleY: 0.01,
          ...common,
        },
      );
    case 'arrow':
      return new Path('M 0 50 L 70 50 L 70 25 L 120 60 L 70 95 L 70 70 L 0 70 Z', {
        fill: 'transparent',
        stroke: '#000000',
        strokeWidth: 2,
        scaleX: 0.01,
        scaleY: 0.01,
        ...common,
      });
    case 'polygon':
      return new Polygon(
        [
          { x: 50, y: 0 },
          { x: 93, y: 25 },
          { x: 93, y: 75 },
          { x: 50, y: 100 },
          { x: 7, y: 75 },
          { x: 7, y: 25 },
        ],
        {
          fill: 'transparent',
          stroke: '#000000',
          strokeWidth: 2,
          scaleX: 0.01,
          scaleY: 0.01,
          ...common,
        },
      );
    case 'text':
      return new IText('Type here', {
        fontSize: 24,
        fontFamily: 'Arial',
        fill: textColor,
        editable: true,
        objectCaching: false,
        ...common,
      });
    default:
      return null;
  }
};

export const updateInteractiveShape = ({ shape, type, startX, startY, currentX, currentY }) => {
  if (!shape) return;

  const dx = currentX - startX;
  const dy = currentY - startY;
  const width = Math.max(Math.abs(dx), 1);
  const height = Math.max(Math.abs(dy), 1);
  const left = dx < 0 ? currentX : startX;
  const top = dy < 0 ? currentY : startY;

  switch (type) {
    case 'rectangle':
    case 'triangle':
    case 'frame':
      shape.set({ left, top, width, height });
      break;
    case 'circle': {
      const radius = Math.max(width, height) / 2;
      shape.set({
        left: startX + dx / 2 - radius,
        top: startY + dy / 2 - radius,
        radius,
      });
      break;
    }
    case 'line':
      shape.set({ x1: startX, y1: startY, x2: currentX, y2: currentY });
      break;
    case 'star':
    case 'arrow':
    case 'polygon': {
      const baseWidth = shape.width || 100;
      const baseHeight = shape.height || 100;
      shape.set({
        left,
        top,
        scaleX: width / baseWidth,
        scaleY: height / baseHeight,
        flipX: dx < 0,
        flipY: dy < 0,
      });
      break;
    }
    default:
      break;
  }
};

// helper: avoid division by zero for offsets
const colorStopsOffset = (index, length) => {
  if (!length || length <= 1) return 0;
  if (index === length - 1) return 1;
  return index / (length - 1);
};

/**
 * Create pattern brushes
 */
export const createPatternBrushes = (canvas) => {
  const brushes = {};

  if (PatternBrush) {
    // Vertical
    brushes.vline = new PatternBrush(canvas);
    brushes.vline.getPatternSrc = function () {
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
    };

    // Horizontal
    brushes.hline = new PatternBrush(canvas);
    brushes.hline.getPatternSrc = function () {
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
    };

    // Square
    brushes.square = new PatternBrush(canvas);
    brushes.square.getPatternSrc = function () {
      const s = 10,
        d = 2;
      const c = document.createElement('canvas');
      c.width = c.height = s + d;
      const ctx = c.getContext('2d');
      ctx.fillStyle = this.color;
      ctx.fillRect(0, 0, s, s);
      return c;
    };

    // Diamond
    brushes.diamond = new PatternBrush(canvas);
    brushes.diamond.getPatternSrc = function () {
      const s = 10,
        d = 5;
      const c = document.createElement('canvas');
      const rect = new Rect({ width: s, height: s, angle: 45, fill: this.color });
      const ctx = c.getContext('2d');
      c.width = c.height = s + d;
      rect.render(ctx);
      return c;
    };

    // Texture
    const img = new Image();
    img.src = '../../assets/ladybug.png';
    brushes.texture = new PatternBrush(canvas);
    brushes.texture.source = img;
  }

  return brushes;
};
