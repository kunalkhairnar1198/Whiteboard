/**
 * @typedef {'corner' | 'smooth' | 'asymmetric' | 'disconnected'} PointType
 */

/**
 * @typedef {Object} Point
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} AnchorPoint
 * @property {string} id
 * @property {number} x
 * @property {number} y
 * @property {PointType} type
 * @property {Point | null} handleIn - incoming bezier handle (relative to x, y)
 * @property {Point | null} handleOut - outgoing bezier handle (relative to x, y)
 * @property {number} [cornerRadius] - per-point corner radius
 * @property {boolean} [moveTo] - if true, starts a new sub-path at this point
 */

/**
 * @typedef {Object} VectorPath
 * @property {string} id
 * @property {AnchorPoint[]} points
 * @property {boolean} closed
 * @property {string | null} fill
 * @property {string} stroke
 * @property {number} strokeWidth
 * @property {'none' | 'round' | 'square'} strokeCap
 * @property {'miter' | 'round' | 'bevel'} strokeJoin
 * @property {number[]} dashArray
 * @property {'nonzero' | 'evenodd'} fillRule
 * @property {number} opacity
 */

/**
 * @typedef {'draw' | 'edit'} PenMode
 */

/**
 * @typedef {Object} PenToolState
 * @property {PenMode} mode
 * @property {VectorPath | null} activePath
 * @property {string[]} selectedPoints - anchor point IDs
 * @property {string | null} hoveredPoint
 * @property {boolean} isDraggingHandle
 * @property {Point | null} previewPoint
 * @property {boolean} snapEnabled
 */

export const EMPTY_PATH = (id) => ({
  id,
  points: [],
  closed: false,
  fill: null,
  stroke: '#1f2937',
  strokeWidth: 4,
  strokeCap: 'round',
  strokeJoin: 'round',
  dashArray: [],
  fillRule: 'nonzero',
  opacity: 1,
});

export const INITIAL_STATE = {
  mode: 'draw',
  activePath: null,
  selectedPoints: [],
  hoveredPoint: null,
  isDraggingHandle: false,
  previewPoint: null,
  snapEnabled: true,
};
