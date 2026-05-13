import { getEffectiveHandleIn, getEffectiveHandleOut } from './penUtils';

/**
 * Builds an SVG path "d" string from a collection of points.
 * @param {Array} points - Array of point objects {x, y, handleIn, handleOut}.
 * @param {boolean} isClosed - Whether the path is closed.
 * @returns {string} SVG path data string.
 */
export const buildSVGPath = (points, previewAnchor = null, isClosed = false) => {
  const pts = [...(points || [])];
  if (previewAnchor) pts.push(previewAnchor);
  if (pts.length === 0) return '';

  let d = `M ${pts[0].x} ${pts[0].y}`;

  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    d += segmentToSVG(p0, p1);
  }

  if (isClosed && pts.length > 1) {
    const p0 = pts[pts.length - 1];
    const p1 = pts[0];
    d += segmentToSVG(p0, p1);
    d += ' Z';
  }

  return d;
};

/**
 * Helper to build a single segment string.
 * @private
 */
const segmentToSVG = (p0, p1) => {
  const cp1 = p0.handleOut;
  const cp2 = p1.handleIn;

  if (!cp1 && !cp2) {
    return ` L ${p1.x} ${p1.y}`;
  }

  const c1 = cp1 || { x: p0.x, y: p0.y };
  const c2 = cp2 || { x: p1.x, y: p1.y };

  return ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p1.x} ${p1.y}`;
};

/**
 * Converts a sequence of points into cubic Bezier segments.
 * @param {Array} points - Point objects.
 * @param {boolean} isClosed - Path closure.
 * @returns {Array} Array of { p0, p1, cp1, cp2 }.
 */
export const pointsToSegments = (points, isClosed) => {
  const segments = [];
  const count = isClosed ? points.length : points.length - 1;

  for (let i = 0; i < count; i++) {
    const p0 = points[i];
    const p1 = points[(i + 1) % points.length];
    segments.push({
      p0: { x: p0.x, y: p0.y },
      p1: { x: p1.x, y: p1.y },
      cp1: getEffectiveHandleOut(p0),
      cp2: getEffectiveHandleIn(p1),
    });
  }
  return segments;
};

/**
 * Evaluates a cubic Bezier curve at parameter t [0, 1].
 * @param {Object} segment - { p0, p1, cp1, cp2 }.
 * @param {number} t - Parameter t.
 * @returns {{x: number, y: number}} Point on curve.
 */
export const getPointOnCurve = (segment, t) => {
  const { p0, p1, cp1, cp2 } = segment;
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * cp1.x + 3 * mt * t2 * cp2.x + t3 * p1.x,
    y: mt3 * p0.y + 3 * mt2 * t * cp1.y + 3 * mt * t2 * cp2.y + t3 * p1.y,
  };
};

/**
 * Splits a cubic Bezier segment at parameter t using De Casteljau's algorithm.
 * @param {Object} segment - { p0, p1, cp1, cp2 }.
 * @param {number} t - Parameter t.
 * @returns {Array} Array of two segments [segmentA, segmentB].
 */
export const splitCurveAtT = (segment, t) => {
  const { p0, p1, cp1, cp2 } = segment;

  const q0 = lerp(p0, cp1, t);
  const q1 = lerp(cp1, cp2, t);
  const q2 = lerp(cp2, p1, t);

  const r0 = lerp(q0, q1, t);
  const r1 = lerp(q1, q2, t);

  const b = lerp(r0, r1, t);

  return [
    { p0, p1: b, cp1: q0, cp2: r0 },
    { p0: b, p1, cp1: r1, cp2: q2 },
  ];
};

/**
 * Linear interpolation between two points.
 * @private
 */
const lerp = (a, b, t) => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

/**
 * Finds the segment and parameter t closest to the given coordinates.
 * @param {Array} points - Path points.
 * @param {boolean} isClosed - Path closure.
 * @param {number} mouseX - Target X.
 * @param {number} mouseY - Target Y.
 * @returns {Object|null} Result { segmentIndex, t, distance, position }.
 */
export const closestSegmentToPoint = (points, isClosed, mouseX, mouseY) => {
  const segments = pointsToSegments(points, isClosed);
  let best = null;
  const threshold = 12;

  segments.forEach((seg, idx) => {
    // Sample 20 points per segment
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const pos = getPointOnCurve(seg, t);
      const dist = Math.sqrt(Math.pow(pos.x - mouseX, 2) + Math.pow(pos.y - mouseY, 2));

      if (dist < threshold && (!best || dist < best.distance)) {
        best = { segmentIndex: idx, t, distance: dist, position: pos };
      }
    }
  });

  return best;
};

/**
 * Inserts a new point into the path by splitting a curve.
 * @param {Array} points - Original points array.
 * @param {number} segmentIndex - Index of segment to split.
 * @param {number} t - Parameter t at which to split.
 * @returns {Array} New points array.
 */
export const insertPointAtT = (points, segmentIndex, t) => {
  const newPoints = [...points];
  const segments = pointsToSegments(points, false); // Get segments for logic
  // We need to re-fetch the segment carefully considering closure if needed, 
  // but usually insertion is requested on a specific open or closed segment identified by index.
  const isClosed = points.length > 2 && segmentIndex === points.length - 1;
  
  const p0Index = segmentIndex;
  const p1Index = (segmentIndex + 1) % points.length;
  
  const segment = {
    p0: points[p0Index],
    p1: points[p1Index],
    cp1: getEffectiveHandleOut(points[p0Index]),
    cp2: getEffectiveHandleIn(points[p1Index]),
  };

  const [segA, segB] = splitCurveAtT(segment, t);

  // Update original points' handles
  newPoints[p0Index] = {
    ...newPoints[p0Index],
    handleOut: segA.cp1,
    type: 'asymmetric',
  };
  
  newPoints[p1Index] = {
    ...newPoints[p1Index],
    handleIn: segB.cp2,
    type: 'asymmetric',
  };

  // Create new point
  const newPoint = {
    x: segA.p1.x,
    y: segA.p1.y,
    handleIn: segA.cp2,
    handleOut: segB.cp1,
    type: 'mirrored',
  };

  newPoints.splice(segmentIndex + 1, 0, newPoint);
  return newPoints;
};

/**
 * Removes a point and optionally smooths the connection between neighbors.
 * @param {Array} points - Points array.
 * @param {number} index - Index to remove.
 * @param {boolean} isClosed - Path closure.
 * @returns {Array} New points array.
 */
export const deletePointAtIndex = (points, index, isClosed) => {
  if (points.length <= 1) return [];
  
  const newPoints = points.filter((_, i) => i !== index);
  
  // Simple smoothing: if we removed a point between two others, 
  // we could adjust their handles. For now, we'll keep it simple
  // but ensure types are preserved or updated if they were straight.
  
  return newPoints;
};
