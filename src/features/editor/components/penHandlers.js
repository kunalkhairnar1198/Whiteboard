import { distanceBetween } from '../../utils/penUtils';

/**
 * Decides if a new drawing session should start.
 * @param {Object} state - Current pen tool state.
 * @param {Object|null} fabricTarget - The object under mouse.
 * @returns {boolean} True if drawing should begin.
 */
export const shouldStartDrawing = (state, fabricTarget) => {
  return state.mode === 'idle' && !fabricTarget;
};

/**
 * Decides if we should enter edit mode for an existing path.
 * @param {Object} state - Current pen tool state.
 * @param {Object|null} fabricTarget - The object under mouse.
 * @returns {boolean} True if we should enter edit mode.
 */
export const shouldEnterEditMode = (state, fabricTarget) => {
  return state.mode === 'idle' && fabricTarget && fabricTarget._isPenPath;
};

/**
 * Decides if we should resume drawing an existing open path.
 * @param {Object} state - Current pen tool state.
 * @param {Object|null} fabricTarget - The object under mouse.
 * @returns {boolean} True if we should resume the path.
 */
export const shouldResumeExistingPath = (state, fabricTarget) => {
  if (state.mode !== 'drawing' || !fabricTarget || fabricTarget._penRole !== 'anchor') return false;

  const points = state.points || [];
  const index = fabricTarget._pointIndex;
  
  // Endpoint anchors only: first or last
  const isEndpoint = index === 0 || index === points.length - 1;
  return isEndpoint && !state.isClosed;
};

/**
 * Decides if clicking at the given position should close the path.
 * @param {Object} state - Current pen tool state.
 * @param {Object} clickPos - {x, y} coordinate in canvas space.
 * @returns {boolean} True if the path should be closed.
 */
export const shouldClosePath = (state, clickPos) => {
  if (state.mode !== 'drawing' || state.points.length < 3) return false;
  return distanceBetween(clickPos, state.points[0]) <= 8;
};

/**
 * Resolves the role of the clicked object.
 * @param {Object|null} fabricTarget - The object under mouse.
 * @returns {string} One of: 'anchor', 'handleIn', 'handleOut', 'segment', 'penPath', 'canvas'.
 */
export const resolveClickTarget = (fabricTarget) => {
  if (!fabricTarget) return 'canvas';
  if (fabricTarget._penRole) return fabricTarget._penRole;
  if (fabricTarget._isPenPath) return 'penPath';
  return 'canvas';
};

/**
 * Gets the index of the clicked anchor.
 * @param {Object|null} fabricTarget - The object under mouse.
 * @returns {number|null} The index or null.
 */
export const getClickedAnchorIndex = (fabricTarget) => {
  return (fabricTarget && fabricTarget._penRole === 'anchor') ? fabricTarget._pointIndex : null;
};

/**
 * Gets info about the clicked handle.
 * @param {Object|null} fabricTarget - The object under mouse.
 * @returns {Object|null} { pointIndex, side } or null.
 */
export const getClickedHandleInfo = (fabricTarget) => {
  if (!fabricTarget) return null;
  if (fabricTarget._penRole === 'handleIn') {
    return { pointIndex: fabricTarget._pointIndex, side: 'in' };
  }
  if (fabricTarget && fabricTarget._penRole === 'handleOut') {
    return { pointIndex: fabricTarget._pointIndex, side: 'out' };
  }
  return null;
};

/**
 * Gets info about a clicked draft anchor.
 */
export const getClickedDraftAnchorIndex = (fabricTarget) => {
  return (fabricTarget && fabricTarget.data?.penDraft) ? fabricTarget.data.draftPointIndex : null;
};

/**
 * Decides if we should add a new point to a segment of a path.
 * @param {Object} state - Current pen tool state.
 * @param {Object|null} fabricTarget - The object under mouse.
 * @returns {boolean} True if we should add a point.
 */
export const shouldAddPointOnSegment = (state, fabricTarget) => {
  return state.mode === 'edit' && resolveClickTarget(fabricTarget) === 'penPath';
};

/**
 * Dispatches the core mouse-down action.
 * @param {Object} state - Current state.
 * @param {Object|null} fabricTarget - Target object.
 * @param {Object} mousePos - {x, y} position.
 * @returns {string} The action string.
 */
export const resolveMouseDownAction = (state, fabricTarget, mousePos) => {
  const role = resolveClickTarget(fabricTarget);

  if (shouldClosePath(state, mousePos)) return 'CLOSE_PATH';
  if (shouldResumeExistingPath(state, fabricTarget)) return 'RESUME_PATH';
  if (shouldStartDrawing(state, fabricTarget)) return 'START_DRAWING';
  
  if (role === 'anchor') return 'SELECT_ANCHOR';
  if (role === 'handleIn' || role === 'handleOut') return 'DRAG_HANDLE';
  
  if (shouldAddPointOnSegment(state, fabricTarget)) return 'ADD_SEGMENT_POINT';
  if (shouldEnterEditMode(state, fabricTarget)) return 'ENTER_EDIT';
  
  if (state.mode === 'drawing' && !fabricTarget) return 'ADD_POINT';
  if (state.mode === 'drawing' && getClickedDraftAnchorIndex(fabricTarget) !== null) return 'DRAG_DRAFT_ANCHOR';
  
  if (state.mode === 'edit' && !fabricTarget) return 'START_MARQUEE';
  
  return 'NONE';
};
