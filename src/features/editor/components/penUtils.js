import { Path as FabricPath } from 'fabric';
import * as fabric from 'fabric';

import { 
  mirrorHandle, 
  clonePoint as clonePenPoint, 
  distanceBetween,
  canvasToPathLocal,
  pathLocalToCanvas
} from '../../utils/penUtils.js';

import { buildSVGPath as buildPenPathString } from '../../utils/pathBuilder.js';
import { 
  parsePathString, 
  updatePenPathFromAnchors 
} from '../../lib/fabricPathUtils.js';

export const PEN_ANCHOR_HIT_RADIUS = 12;

export { clonePenPoint, distanceBetween, mirrorHandle };
export const clonePenPoints = (points = []) => points.map(clonePenPoint);

export const constrainPointAngle = (origin, pointer) => {
  const dx = pointer.x - origin.x;
  const dy = pointer.y - origin.y;
  const distance = distanceBetween(origin, pointer);

  if (!distance) return { ...pointer };

  const snap = Math.PI / 4;
  const snappedAngle = Math.round(Math.atan2(dy, dx) / snap) * snap;

  return {
    x: origin.x + Math.cos(snappedAngle) * distance,
    y: origin.y + Math.sin(snappedAngle) * distance,
  };
};

export const applyPointConstraints = (origin, pointer, options = {}) => {
  if (!origin || !pointer) return pointer;
  return options.shiftKey ? constrainPointAngle(origin, pointer) : pointer;
};

// No changes needed for mirrorHandle as it is now re-exported

export const buildDraggedPoint = (anchor, pointer, options = {}) => {
  const constrainedPointer = applyPointConstraints(anchor, pointer, options);
  const handleOut = { ...constrainedPointer };
  // A and B stay collinear if smooth. 
  // If ALT is held, it becomes a corner (independent handles)
  const isSmooth = !options.altKey;
  const handleIn = isSmooth ? mirrorHandle(anchor, handleOut) : null;

  return {
    x: anchor.x,
    y: anchor.y,
    handleIn,
    handleOut,
    isSmooth,
    type: isSmooth ? 'smooth' : 'corner',
  };
};

export const createPenPathObject = ({
  points,
  closed = false,
  id,
  name,
  stroke = '#1f2937',
  strokeWidth = 2,
  opacity = 1,
  selectable = true,
  evented = true,
  excludeFromExport = false,
}) => {
  const pathString = buildPenPathString(points, null, closed);
  const path = new FabricPath(pathString || 'M 0 0', {
    fill: '',
    stroke,
    strokeWidth,
    opacity,
    objectCaching: false,
    perPixelTargetFind: true,
    selectable,
    evented,
    hasControls: !excludeFromExport,
    name,
    excludeFromExport,
  });

  path.data = {
    id,
    type: 'pen-path',
    pathTool: 'pen',
    points: clonePenPoints(points),
    closed,
  };
  path._isPenPath = true;

  return path;
};

export const refreshPenPathObject = (pathObject, points, closed = false) => {
  if (!pathObject) return false;
  const nextPoints = clonePenPoints(points);
  pathObject.set({
    path: parsePathString(buildPenPathString(nextPoints, null, closed)),
    data: {
      ...(pathObject.data || {}),
      points: nextPoints,
      closed,
      pathTool: 'pen',
      type: 'pen-path',
    },
  });
  pathObject.setCoords();
  return updatePenPathFromAnchors(pathObject, nextPoints);
};

export const isNearFirstPoint = (points, pointer, threshold = PEN_ANCHOR_HIT_RADIUS) => {
  if (!points?.length || !pointer) return false;
  return distanceBetween(points[0], pointer) <= threshold;
};

export const isPenControlTarget = (target) => !!target?.data?.penControl;

export const pointToCanvasPosition = (pathObject, point) => {
  const result = pathLocalToCanvas(point.x, point.y, pathObject);
  return result;
};

export const canvasPointToPathPoint = (pathObject, point) => {
  return canvasToPathLocal(point.x, point.y, pathObject);
};

export const moveAnchorPoint = (points, index, nextAnchor) => {
  const nextPoints = clonePenPoints(points);
  const currentPoint = nextPoints[index];
  if (!currentPoint) return nextPoints;

  const dx = nextAnchor.x - currentPoint.x;
  const dy = nextAnchor.y - currentPoint.y;

  nextPoints[index] = {
    ...currentPoint,
    x: nextAnchor.x,
    y: nextAnchor.y,
    handleIn: currentPoint.handleIn
      ? {
          x: currentPoint.handleIn.x + dx,
          y: currentPoint.handleIn.y + dy,
        }
      : null,
    handleOut: currentPoint.handleOut
      ? {
          x: currentPoint.handleOut.x + dx,
          y: currentPoint.handleOut.y + dy,
        }
      : null,
    type: currentPoint.type || 'smooth',
  };

  return nextPoints;
};

export const moveHandlePoint = (points, index, role, nextHandle, options = {}) => {
  const nextPoints = clonePenPoints(points);
  const point = nextPoints[index];
  if (!point) return nextPoints;

  const normalizedHandle = applyPointConstraints(point, nextHandle, options);
  const oppositeRole = role === 'handleIn' ? 'handleOut' : 'handleIn';

  point[role] = normalizedHandle;

  if (options.altKey) {
    point.isSmooth = false;
    point.type = 'corner';
  } else if (point.isSmooth || point.type === 'smooth') {
    point[oppositeRole] = mirrorHandle(point, normalizedHandle);
  }

  return nextPoints;
};

export const deletePoint = (points, index) => {
  if (index < 0 || index >= points.length) return points;
  const nextPoints = clonePenPoints(points);
  nextPoints.splice(index, 1);
  return nextPoints;
};

export const togglePointType = (points, index) => {
  if (index < 0 || index >= points.length) return points;
  const nextPoints = clonePenPoints(points);
  const point = nextPoints[index];
  
  if (point.type === 'smooth') {
    point.type = 'corner';
    point.isSmooth = false;
  } else {
    point.type = 'smooth';
    point.isSmooth = true;
    if (point.handleIn) {
      point.handleOut = mirrorHandle(point, point.handleIn);
    } else if (point.handleOut) {
      point.handleIn = mirrorHandle(point, point.handleOut);
    }
  }
  
  return nextPoints;
};
