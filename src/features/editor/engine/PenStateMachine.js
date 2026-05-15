import { v4 as uuidv4 } from 'uuid';

import { buildSVGPath } from '@/features/editor/tools/pen/usePathRenderer';

import { EMPTY_PATH, INITIAL_STATE } from '@/features/editor/tools/pen/types';
import { fabric } from '@/features/editor/utils/fabricFactory';

const SNAP_GRID_SIZE = 20;
const POINT_HIT = 10;
const HANDLE_HIT = 8;
const SEGMENT_HIT = 15;
const CLOSE_PATH_HIT = 10;
const HANDLE_PULL_THRESHOLD = 4;

/**
 * PenStateMachine — engine-owned state + behavior for the pen tool.
 *
 * State is split into two buckets:
 *   - `state`   : structural data (mode, activePath, selectedPoints,
 *                 hoveredPoint, snapEnabled). Changes emit
 *                 `pen:state-changed`. React subscribes via
 *                 useSyncExternalStore.
 *   - `previewPoint` (separate field) : transient mouse position.
 *                 Changes emit `pen:preview-changed`. PenRenderer
 *                 listens (canvas-2D) so no React re-render per frame.
 *
 * Path completion fires `pen:path-complete` on the bus.
 */
export class PenStateMachine {
  constructor(engine) {
    this.engine = engine;
    this.state = INITIAL_STATE;
    this.previewPoint = null;
    this._dragStart = null;
    // Set when enterEditMode hides the original Fabric path so we can
    // either swap (commit) or restore visibility (reset without commit).
    this._editingFabricObj = null;
  }

  // -------------------------
  // Subscription helpers
  // -------------------------
  subscribe(listener) {
    return this.engine.bus.on('pen:state-changed', listener);
  }

  subscribePreview(listener) {
    const off1 = this.engine.bus.on('pen:state-changed', listener);
    const off2 = this.engine.bus.on('pen:preview-changed', listener);
    return () => {
      off1();
      off2();
    };
  }

  hasActivePath() {
    return Boolean(this.state.activePath);
  }

  // -------------------------
  // Mutations
  // -------------------------
  _setState(updater) {
    const next =
      typeof updater === 'function' ? updater(this.state) : { ...this.state, ...updater };
    if (next === this.state) return;
    this.state = next;
    this.engine.bus.emit('pen:state-changed');
  }

  _setPreview(point) {
    if (point === this.previewPoint) return;
    if (
      point &&
      this.previewPoint &&
      point.x === this.previewPoint.x &&
      point.y === this.previewPoint.y
    ) {
      return;
    }
    this.previewPoint = point;
    this.engine.bus.emit('pen:preview-changed');
  }

  // -------------------------
  // Pointer
  // -------------------------
  getPointer(evt) {
    const fabric = this.engine.canvas.fabric;
    if (!fabric) return { x: 0, y: 0 };
    const pointer = fabric.getPointer(evt);
    let { x, y } = pointer;
    if (this.state.snapEnabled) {
      x = Math.round(x / SNAP_GRID_SIZE) * SNAP_GRID_SIZE;
      y = Math.round(y / SNAP_GRID_SIZE) * SNAP_GRID_SIZE;
    }
    return { x, y };
  }

  // -------------------------
  // Public commands
  // -------------------------
  reset() {
    // If we entered edit mode and never committed (e.g. tool switched
    // before finalize), restore the hidden original.
    if (this._editingFabricObj) {
      this._editingFabricObj.set({ visible: true, evented: true });
      this.engine.render.schedule();
      this._editingFabricObj = null;
    }
    this.state = INITIAL_STATE;
    this.previewPoint = null;
    this._dragStart = null;
    this.engine.bus.emit('pen:state-changed');
    this.engine.bus.emit('pen:preview-changed');
  }

  toggleSnap() {
    this._setState((prev) => ({ ...prev, snapEnabled: !prev.snapEnabled }));
  }

  /**
   * Enter edit mode for an existing path. Hides the original Fabric
   * object so the PenRenderer overlay is the only thing visible until
   * `commit` swaps it in (or `reset` restores it).
   */
  enterEditMode(vectorPath) {
    const existing = this.engine.layers.getById(vectorPath.id);
    if (existing) {
      existing.set({ visible: false, evented: false });
      this.engine.render.schedule();
      this._editingFabricObj = existing;
    }
    this._setState({
      mode: 'edit',
      activePath: vectorPath,
      selectedPoints: [],
      hoveredPoint: null,
    });
  }

  /**
   * Commit the active path to the canvas as a Fabric.Path. If we're in
   * edit mode, swap the existing object in-place to preserve layer
   * order; otherwise add and increment the counter via tool context.
   * Reads brush settings from `engine.tools.context` (mirrored from
   * Redux toolSlice). Always resets when done.
   */
  commit() {
    const path = this.state.activePath;
    const fabricCanvas = this.engine.canvas.fabric;
    if (!path || !fabricCanvas) {
      this.reset();
      return null;
    }

    const editingObj = this._editingFabricObj;
    const editingId = editingObj?.data?.id;

    // Path too small to be useful — drop original if we were editing.
    if (path.points.length < 2) {
      if (editingObj) {
        fabricCanvas.remove(editingObj);
        this._editingFabricObj = null;
      }
      this.reset();
      return null;
    }

    const tCtx = this.engine.tools.context;
    const counter = tCtx.elementCounterRef?.current ?? 0;
    const id = editingId || `element-${counter}`;
    const d = buildSVGPath(path);

    const fabricPath = new fabric.Path(d, {
      id,
      fill: path.fill || 'transparent',
      stroke: tCtx.penColor ?? path.stroke ?? '#1f2937',
      strokeWidth: tCtx.penWidth ?? path.strokeWidth ?? 4,
      opacity: tCtx.penOpacity ?? path.opacity ?? 1,
      strokeDashArray: path.dashArray && path.dashArray.length > 0 ? path.dashArray : null,
      fillRule: path.fillRule || 'nonzero',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      data: {
        ...path,
        id,
        type: 'path',
        points: [...path.points],
        closed: path.closed,
      },
      name: editingId ? undefined : `pen-path-${counter}`,
    });

    if (editingObj) {
      const objects = fabricCanvas.getObjects();
      const existingIdx = objects.indexOf(editingObj);
      if (existingIdx !== -1) {
        fabricPath.name = editingObj.name;
        fabricCanvas.remove(editingObj);
        fabricCanvas.insertAt(fabricPath, existingIdx);
      } else {
        fabricCanvas.add(fabricPath);
      }
      this._editingFabricObj = null;
    } else {
      fabricCanvas.add(fabricPath);
      tCtx.incrementElementCounter?.();
    }

    fabricCanvas.setActiveObject(fabricPath);
    this.engine.render.schedule();
    this.engine.layers.refresh();
    this.engine.selection.setSelection([id]);
    tCtx.setShowFilters?.(false);
    tCtx.setShowLayers?.(true);
    tCtx.setShowRightSidebar?.(true);
    tCtx.safeSaveState?.();

    this.engine.bus.emit('pen:path-complete', { vectorPath: path });
    this.reset();
    return path;
  }

  /** Alias kept for callers that still use `finalize`. */
  finalize() {
    return this.commit();
  }

  togglePointType(pointId) {
    this._setState((prev) => {
      if (!prev.activePath) return prev;
      const points = [...prev.activePath.points];
      const idx = points.findIndex((p) => p.id === pointId);
      if (idx === -1) return prev;
      const point = { ...points[idx] };
      if (point.type === 'corner') {
        point.type = 'smooth';
        if (!point.handleIn && !point.handleOut) {
          point.handleIn = { x: -20, y: 0 };
          point.handleOut = { x: 20, y: 0 };
        }
      } else {
        point.type = 'corner';
        point.handleIn = null;
        point.handleOut = null;
      }
      points[idx] = point;
      return { ...prev, activePath: { ...prev.activePath, points } };
    });
  }

  deleteSelectedPoints() {
    this._setState((prev) => {
      if (!prev.activePath) return prev;
      let newPoints;
      if (prev.mode === 'draw') {
        newPoints = [...prev.activePath.points];
        newPoints.pop();
      } else {
        if (prev.selectedPoints.length === 0) return prev;
        newPoints = prev.activePath.points.filter((p) => !prev.selectedPoints.includes(p.id));
      }
      if (newPoints.length === 0) return { ...prev, activePath: null, selectedPoints: [] };
      return {
        ...prev,
        activePath: { ...prev.activePath, points: newPoints },
        selectedPoints: [],
      };
    });
  }

  joinSelectedPoints() {
    this._setState((prev) => {
      if (!prev.activePath || prev.selectedPoints.length !== 2) return prev;
      const path = { ...prev.activePath };
      const points = [...path.points];
      const [id1, id2] = prev.selectedPoints;
      const idx1 = points.findIndex((p) => p.id === id1);
      const idx2 = points.findIndex((p) => p.id === id2);
      const isEnd1 = idx1 === 0 || idx1 === points.length - 1;
      const isEnd2 = idx2 === 0 || idx2 === points.length - 1;

      if (isEnd1 && isEnd2 && !path.closed) {
        if (
          (idx1 === 0 && idx2 === points.length - 1) ||
          (idx2 === 0 && idx1 === points.length - 1)
        ) {
          return { ...prev, activePath: { ...path, closed: true }, selectedPoints: [] };
        }
      }
      return prev;
    });
  }

  breakPathAtSelected() {
    this._setState((prev) => {
      if (!prev.activePath || prev.selectedPoints.length !== 1) return prev;
      const path = { ...prev.activePath };
      const points = [...path.points];
      const pointId = prev.selectedPoints[0];
      const idx = points.findIndex((p) => p.id === pointId);
      if (idx === -1) return prev;

      if (path.closed) {
        const newPoints = [...points.slice(idx), ...points.slice(0, idx)];
        return {
          ...prev,
          activePath: { ...path, points: newPoints, closed: false },
          selectedPoints: [points[idx].id],
        };
      }
      if (idx === 0 || idx === points.length - 1) return prev;

      const originalPoint = points[idx];
      const duplicatePoint = { ...originalPoint, id: uuidv4(), moveTo: true };
      const newPoints = [...points];
      newPoints.splice(idx + 1, 0, duplicatePoint);

      return {
        ...prev,
        activePath: { ...path, points: newPoints },
        selectedPoints: [duplicatePoint.id],
      };
    });
  }

  // -------------------------
  // Mouse handlers (port from usePenTool.js)
  // -------------------------
  onMouseDown(opt) {
    const { x, y } = this.getPointer(opt.e);
    const evt = opt.e;

    if (this.state.mode === 'draw') {
      this._dragStart = { x, y };
      const activePath = this.state.activePath;

      // Click near first point → close + commit.
      if (activePath && activePath.points.length > 0) {
        const firstPoint = activePath.points[0];
        const dist = Math.hypot(firstPoint.x - x, firstPoint.y - y);
        if (dist < CLOSE_PATH_HIT) {
          this._setState({ activePath: { ...activePath, closed: true } });
          this.commit();
          return;
        }
      }

      this._setState((prev) => {
        const counter = this.engine.tools.context.elementCounterRef?.current ?? 0;
        const path = prev.activePath || EMPTY_PATH(`element-${counter}`);
        const newPoint = {
          id: uuidv4(),
          x,
          y,
          type: 'corner',
          handleIn: null,
          handleOut: null,
        };
        return {
          ...prev,
          activePath: { ...path, points: [...path.points, newPoint] },
          isDraggingHandle: true,
        };
      });
      this._setPreview(null);
      return;
    }

    // Edit mode
    const hovered = this.state.hoveredPoint;
    if (hovered) {
      if (hovered.startsWith('segment')) {
        const segIdx = parseInt(hovered.split('_')[1], 10);
        this._setState((prev) => {
          const points = [...prev.activePath.points];
          const newPoint = { id: uuidv4(), x, y, type: 'corner', handleIn: null, handleOut: null };
          points.splice(segIdx + 1, 0, newPoint);
          return {
            ...prev,
            activePath: { ...prev.activePath, points },
            selectedPoints: [newPoint.id],
            hoveredPoint: `anchor_${newPoint.id}`,
          };
        });
        return;
      }

      const pointId = hovered.split('_')[1];
      if (evt.altKey) {
        this.togglePointType(pointId);
        return;
      }

      const isHandle = hovered.startsWith('handle');
      this._setState((prev) => {
        let newSelected;
        if (isHandle) {
          newSelected = [pointId];
        } else if (evt.shiftKey) {
          newSelected = prev.selectedPoints.includes(pointId)
            ? prev.selectedPoints.filter((id) => id !== pointId)
            : [...prev.selectedPoints, pointId];
        } else {
          newSelected = prev.selectedPoints.includes(pointId) ? prev.selectedPoints : [pointId];
        }
        return {
          ...prev,
          selectedPoints: newSelected,
          isDraggingHandle: isHandle,
          draggedPointId: pointId,
          draggedHandleType: isHandle ? (hovered.startsWith('handleIn') ? 'in' : 'out') : null,
        };
      });
      this._dragStart = { x, y };
      return;
    }

    // Blank click in edit mode — possibly transition to draw at an endpoint.
    const selectedIds = this.state.selectedPoints;
    const activePath = this.state.activePath;
    if (selectedIds.length === 1 && activePath && !activePath.closed) {
      const id = selectedIds[0];
      const points = activePath.points;
      const idx = points.findIndex((p) => p.id === id);
      if (idx !== -1) {
        // A point is an endpoint if:
        // 1. It's the first point
        // 2. It's the last point
        // 3. The NEXT point has moveTo: true
        // 4. IT has moveTo: true
        const isStart = idx === 0;
        const isEnd = idx === points.length - 1;
        const isBeforeBreak = points[idx + 1]?.moveTo;
        const isAfterBreak = points[idx].moveTo;

        if (isStart || isEnd || isBeforeBreak || isAfterBreak) {
          // Reorder the points so the selected point becomes the last point
          // for the draw mode.
          let newPoints;
          if (isEnd) {
            newPoints = [...points];
          } else if (isStart) {
            newPoints = [...points].reverse();
            // If we reverse, we need to fix moveTo flags.
            // Original first point is now last, it didn't have moveTo.
            // Original last point is now first.
            newPoints.forEach((p, i) => {
              if (i === 0) p.moveTo = true;
              else delete p.moveTo;
            });
          } else {
            // Internal break point. This is more complex because we want
            // to continue the sub-path.
            // For now, let's just allow it by making it the last point.
            newPoints = [...points.slice(0, idx + 1)];
            // And we probably want to keep the rest as another path?
            // The current engine only supports one activePath.
            // If we continue from an internal point, we "drop" the trailing points
            // or we have to support multi-path drawing.
          }

          if (newPoints) {
            this._setState({
              mode: 'draw',
              activePath: { ...activePath, points: newPoints },
              selectedPoints: [],
              isDraggingHandle: false,
            });
            return;
          }
        }
      }
    }
    this._setState({ selectedPoints: [] });
  }

  onMouseMove(opt) {
    const { x, y } = this.getPointer(opt.e);
    const evt = opt.e;
    const prev = this.state;

    // Draw mode: pull last anchor's handle.
    if (
      prev.mode === 'draw' &&
      prev.isDraggingHandle &&
      prev.activePath &&
      prev.activePath.points.length > 0
    ) {
      const points = [...prev.activePath.points];
      const lastIdx = points.length - 1;
      const last = { ...points[lastIdx] };
      const dx = x - last.x;
      const dy = y - last.y;
      if (Math.abs(dx) > HANDLE_PULL_THRESHOLD || Math.abs(dy) > HANDLE_PULL_THRESHOLD) {
        last.type = evt.altKey ? 'disconnected' : 'smooth';
        last.handleOut = { x: dx, y: dy };
        if (!evt.altKey) last.handleIn = { x: -dx, y: -dy };
        points[lastIdx] = last;
        this._setState({ ...prev, activePath: { ...prev.activePath, points } });
      }
      this._setPreview({ x, y });
      return;
    }

    // Edit mode drag
    if (prev.mode === 'edit') {
      if (this._dragStart && prev.draggedPointId && prev.activePath) {
        const dx = x - this._dragStart.x;
        const dy = y - this._dragStart.y;
        this._dragStart = { x, y };

        const points = [...prev.activePath.points];
        if (prev.isDraggingHandle) {
          const pointIdx = points.findIndex((p) => p.id === prev.draggedPointId);
          if (pointIdx !== -1) {
            const point = { ...points[pointIdx] };
            const hDx = x - point.x;
            const hDy = y - point.y;
            const isAlt = evt.altKey;
            if (isAlt && point.type !== 'disconnected') point.type = 'disconnected';

            if (prev.draggedHandleType === 'in') {
              point.handleIn = { x: hDx, y: hDy };
              if (!isAlt) {
                if (point.type === 'smooth') {
                  point.handleOut = { x: -hDx, y: -hDy };
                } else if (point.type === 'asymmetric' && point.handleOut) {
                  const len = Math.hypot(point.handleOut.x, point.handleOut.y);
                  const angle = Math.atan2(-hDy, -hDx);
                  point.handleOut = { x: Math.cos(angle) * len, y: Math.sin(angle) * len };
                }
              }
            } else {
              point.handleOut = { x: hDx, y: hDy };
              if (!isAlt) {
                if (point.type === 'smooth') {
                  point.handleIn = { x: -hDx, y: -hDy };
                } else if (point.type === 'asymmetric' && point.handleIn) {
                  const len = Math.hypot(point.handleIn.x, point.handleIn.y);
                  const angle = Math.atan2(-hDy, -hDx);
                  point.handleIn = { x: Math.cos(angle) * len, y: Math.sin(angle) * len };
                }
              }
            }
            points[pointIdx] = point;
          }
        } else {
          prev.selectedPoints.forEach((id) => {
            const idx = points.findIndex((p) => p.id === id);
            if (idx !== -1) {
              const p = { ...points[idx], x: points[idx].x + dx, y: points[idx].y + dy };
              points[idx] = p;
            }
          });
        }

        this._setState({ ...prev, activePath: { ...prev.activePath, points } });
        this._setPreview({ x, y });
        return;
      }

      // Hover detection
      let hovered = null;
      if (prev.activePath) {
        for (const p of prev.activePath.points) {
          if (Math.hypot(p.x - x, p.y - y) < POINT_HIT) {
            hovered = `anchor_${p.id}`;
            break;
          }
          if (p.handleIn) {
            if (Math.hypot(p.x + p.handleIn.x - x, p.y + p.handleIn.y - y) < HANDLE_HIT) {
              hovered = `handleIn_${p.id}`;
              break;
            }
          }
          if (p.handleOut) {
            if (Math.hypot(p.x + p.handleOut.x - x, p.y + p.handleOut.y - y) < HANDLE_HIT) {
              hovered = `handleOut_${p.id}`;
              break;
            }
          }
        }
        if (!hovered) {
          const segIdx = this._findSegmentAt(x, y);
          if (segIdx !== null) hovered = `segment_${segIdx}`;
        }
      }
      if (hovered !== prev.hoveredPoint) this._setState({ ...prev, hoveredPoint: hovered });
      this._setPreview({ x, y });
      return;
    }

    // Draw mode no drag: just update preview.
    this._setPreview({ x, y });
  }

  onMouseUp() {
    this._setState((prev) => {
      if (!prev.isDraggingHandle && !prev.draggedPointId) return prev;
      return { ...prev, isDraggingHandle: false, draggedPointId: null, draggedHandleType: null };
    });
    this._dragStart = null;
  }

  _findSegmentAt(x, y) {
    const activePath = this.state.activePath;
    if (!activePath || activePath.points.length < 2) return null;
    const points = activePath.points;
    for (let i = 0; i < points.length; i += 1) {
      const p1 = points[i];
      const p2 = points[i + 1] || (activePath.closed ? points[0] : null);
      if (!p2) break;
      let midX;
      let midY;
      if (p1.handleOut && p2.handleIn) {
        midX = (p1.x + p1.handleOut.x + p2.x + p2.handleIn.x) / 4;
        midY = (p1.y + p1.handleOut.y + p2.y + p2.handleIn.y) / 4;
      } else {
        midX = (p1.x + p2.x) / 2;
        midY = (p1.y + p2.y) / 2;
      }
      if (Math.hypot(midX - x, midY - y) < SEGMENT_HIT) return i;
    }
    return null;
  }
}

export default PenStateMachine;
