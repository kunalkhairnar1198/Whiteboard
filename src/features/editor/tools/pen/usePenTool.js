import { useState, useCallback, useRef } from 'react';
import { INITIAL_STATE, EMPTY_PATH } from './types';
import { v4 as uuidv4 } from 'uuid';

export const usePenTool = (canvas, { onPathComplete, elementCounter, setElementCounter }) => {
  const [state, setState] = useState(INITIAL_STATE);
  const stateRef = useRef(state);

  // Keep stateRef in sync
  const updateState = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      stateRef.current = next;
      return next;
    });
  }, []);

  const getPointer = useCallback((e) => {
    if (!canvas) return { x: 0, y: 0 };
    const pointer = canvas.getPointer(e);
    let { x, y } = pointer;
    
    // Snap to grid if enabled
    if (stateRef.current.snapEnabled) {
        const gridSize = 20; // Default grid size
        x = Math.round(x / gridSize) * gridSize;
        y = Math.round(y / gridSize) * gridSize;
    }
    
    return { x, y };
  }, [canvas]);

  const dragStartRef = useRef(null);

  const enterEditMode = useCallback((vectorPath) => {
    updateState({
        mode: 'edit',
        activePath: vectorPath,
        selectedPoints: [],
        hoveredPoint: null,
    });
  }, [updateState]);

  const deleteSelectedPoints = useCallback(() => {
    updateState(prev => {
        if (!prev.activePath) return prev;
        
        let newPoints;
        if (prev.mode === 'draw') {
            // Delete last placed point (undo step)
            newPoints = [...prev.activePath.points];
            newPoints.pop();
        } else {
            // Delete selected points in edit mode
            if (prev.selectedPoints.length === 0) return prev;
            newPoints = prev.activePath.points.filter(p => !prev.selectedPoints.includes(p.id));
        }

        if (newPoints.length === 0) {
             return { ...prev, activePath: null, selectedPoints: [] };
        }
        
        return {
            ...prev,
            activePath: { ...prev.activePath, points: newPoints },
            selectedPoints: [],
        };
    });
  }, [updateState]);

  const togglePointType = useCallback((pointId) => {
      updateState(prev => {
          if (!prev.activePath) return prev;
          const points = [...prev.activePath.points];
          const idx = points.findIndex(p => p.id === pointId);
          if (idx === -1) return prev;
          
          const point = { ...points[idx] };
          if (point.type === 'corner') {
              point.type = 'smooth';
              // Add some default handles if none exist
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
  }, [updateState]);

  const findSegmentAt = useCallback((x, y) => {
      const activePath = stateRef.current.activePath;
      if (!activePath || activePath.points.length < 2) return null;
      
      const points = activePath.points;
      for (let i = 0; i < points.length; i++) {
          const p1 = points[i];
          const p2 = points[i + 1] || (activePath.closed ? points[0] : null);
          if (!p2) break;
          
          // Simple approximation: check distance to line segment midpoints
          // For real curves, we'd need more complex bezier distance math
          let midX, midY;
          if (p1.handleOut && p2.handleIn) {
              // Cubic midpoint approx
              midX = (p1.x + p1.handleOut.x + p2.x + p2.handleIn.x) / 4;
              midY = (p1.y + p1.handleOut.y + p2.y + p2.handleIn.y) / 4;
          } else {
              midX = (p1.x + p2.x) / 2;
              midY = (p1.y + p2.y) / 2;
          }
          
          const dist = Math.sqrt(Math.pow(midX - x, 2) + Math.pow(midY - y, 2));
          if (dist < 15) return i; // Return index of first point of the segment
      }
      return null;
  }, []);

  const joinSelectedPoints = useCallback(() => {
    updateState(prev => {
        if (!prev.activePath || prev.selectedPoints.length !== 2) return prev;
        
        const path = { ...prev.activePath };
        const points = [...path.points];
        
        const id1 = prev.selectedPoints[0];
        const id2 = prev.selectedPoints[1];
        
        const idx1 = points.findIndex(p => p.id === id1);
        const idx2 = points.findIndex(p => p.id === id2);
        
        const isEnd1 = idx1 === 0 || idx1 === points.length - 1;
        const isEnd2 = idx2 === 0 || idx2 === points.length - 1;
        
        if (isEnd1 && isEnd2 && !path.closed) {
            if ((idx1 === 0 && idx2 === points.length - 1) || (idx2 === 0 && idx1 === points.length - 1)) {
                // Join start and end -> close path
                return { ...prev, activePath: { ...path, closed: true }, selectedPoints: [] };
            }
            // Join two other open paths (not supported yet as we only have one active path)
            // But we could join them if we had multiple.
        }
        return prev;
    });
  }, [updateState]);

  const breakPathAtSelected = useCallback(() => {
    updateState(prev => {
        if (!prev.activePath || prev.selectedPoints.length !== 1) return prev;
        
        const path = { ...prev.activePath };
        const points = [...path.points];
        const pointId = prev.selectedPoints[0];
        const idx = points.findIndex(p => p.id === pointId);
        
        if (idx === -1) return prev;
        
        if (path.closed) {
            // Reorder points so that the broken point is the first/last, effectively opening the path
            const newPoints = [...points.slice(idx), ...points.slice(0, idx)];
            return { 
                ...prev, 
                activePath: { ...path, points: newPoints, closed: false },
                selectedPoints: [points[idx].id] 
            };
        } else {
            // Break an open path into two sub-paths on the same layer
            if (idx === 0 || idx === points.length - 1) return prev; // Already ends
            
            // 1. Create a duplicate of the anchor point at idx
            const originalPoint = points[idx];
            const duplicatePoint = { ...originalPoint, id: uuidv4(), moveTo: true };
            
            // 2. Insert the duplicate right after the original
            const newPoints = [...points];
            newPoints.splice(idx + 1, 0, duplicatePoint);
            
            return {
                ...prev,
                activePath: { ...path, points: newPoints },
                selectedPoints: [duplicatePoint.id], // Select the new start point
                draggedPointId: duplicatePoint.id,   // Allow immediate dragging
                isDraggingHandle: false
            };
        }
    });
  }, [updateState]);

  const handleMouseDown = useCallback((opt) => {
    const { x, y } = getPointer(opt.e);
    const evt = opt.e;
    
    if (stateRef.current.mode === 'draw') {
        dragStartRef.current = { x, y };

        const current = stateRef.current;
        let activePath = current.activePath;
        
        // Handle path closure before state update starts
        if (activePath && activePath.points.length > 0) {
            const firstPoint = activePath.points[0];
            const dist = Math.sqrt(Math.pow(firstPoint.x - x, 2) + Math.pow(firstPoint.y - y, 2));
            if (dist < 10) {
                const closedPath = { ...activePath, closed: true };
                updateState({ ...INITIAL_STATE, activePath: null });
                onPathComplete(closedPath);
                return;
            }
        }

        updateState((prev) => {
            let activePath = prev.activePath || EMPTY_PATH(`element-${elementCounter}`);

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
            activePath: {
            ...activePath,
            points: [...activePath.points, newPoint],
            },
            previewPoint: null,
            isDraggingHandle: true,
        };
        });
    } else if (stateRef.current.mode === 'edit') {
        const hovered = stateRef.current.hoveredPoint;
        if (hovered) {
             if (hovered.startsWith('segment')) {
                 // Add point on segment
                 const segIdx = parseInt(hovered.split('_')[1]);
                 updateState(prev => {
                     const points = [...prev.activePath.points];
                     const newPoint = { id: uuidv4(), x, y, type: 'corner', handleIn: null, handleOut: null };
                     points.splice(segIdx + 1, 0, newPoint);
                     return { 
                         ...prev, 
                         activePath: { ...prev.activePath, points },
                         selectedPoints: [newPoint.id],
                         hoveredPoint: `anchor_${newPoint.id}` 
                     };
                 });
                 return;
             }
             
             const pointId = hovered.split('_')[1];
             if (evt.altKey) {
                 togglePointType(pointId);
                 return;
             }
             
             const isHandle = hovered.startsWith('handle');
             
             updateState(prev => {
                 let newSelected;
                 if (isHandle) {
                     newSelected = [pointId];
                 } else {
                     if (evt.shiftKey) {
                         newSelected = prev.selectedPoints.includes(pointId)
                             ? prev.selectedPoints.filter(id => id !== pointId)
                             : [...prev.selectedPoints, pointId];
                     } else {
                         newSelected = prev.selectedPoints.includes(pointId) ? prev.selectedPoints : [pointId];
                     }
                 }
                 
                 return {
                     ...prev,
                     selectedPoints: newSelected,
                     isDraggingHandle: isHandle,
                     draggedPointId: pointId,
                     draggedHandleType: isHandle ? (hovered.startsWith('handleIn') ? 'in' : 'out') : null,
                 };
             });
             dragStartRef.current = { x, y };
        } else {
             // Clicked on blank area in EDIT mode
             const selectedIds = stateRef.current.selectedPoints;
             const activePath = stateRef.current.activePath;
             
             if (selectedIds.length === 1 && activePath && !activePath.closed) {
                 const id = selectedIds[0];
                 const points = activePath.points;
                 const idx = points.findIndex(p => p.id === id);
                 
                 if (idx === 0 || idx === points.length - 1) {
                     // Selected an endpoint! Switch to DRAW mode and continue
                     const newPoints = idx === 0 ? [...points].reverse() : [...points];
                     updateState({ 
                         mode: 'draw', 
                         activePath: { ...activePath, points: newPoints },
                         selectedPoints: [],
                         isDraggingHandle: false
                     });
                     // Now let draw mode handle the next move
                     return;
                 }
             }
             updateState({ selectedPoints: [] });
        }
    }
  }, [getPointer, updateState, elementCounter, onPathComplete, togglePointType]);

  const handleMouseMove = useCallback((opt) => {
    const { x, y } = getPointer(opt.e);
    const evt = opt.e;
    
    updateState((prev) => {
      // Draw Mode Handle Pull
      if (prev.mode === 'draw' && prev.isDraggingHandle && prev.activePath && prev.activePath.points.length > 0) {
        const points = [...prev.activePath.points];
        const lastPointIndex = points.length - 1;
        const lastPoint = { ...points[lastPointIndex] };
        
        const dx = x - lastPoint.x;
        const dy = y - lastPoint.y;
        
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
            lastPoint.type = evt.altKey ? 'disconnected' : 'smooth';
            lastPoint.handleOut = { x: dx, y: dy };
            if (!evt.altKey) lastPoint.handleIn = { x: -dx, y: -dy };
            points[lastPointIndex] = lastPoint;
            return {
                ...prev,
                activePath: { ...prev.activePath, points },
                previewPoint: { x, y }
            };
        }
      }

      // Edit Mode Movement
      if (prev.mode === 'edit') {
          if (dragStartRef.current && prev.draggedPointId && prev.activePath) {
              const dx = x - dragStartRef.current.x;
              const dy = y - dragStartRef.current.y;
              dragStartRef.current = { x, y }; // Update for next move

              const points = [...prev.activePath.points];
              
              if (prev.isDraggingHandle) {
                  // Drag single handle
                  const pointIdx = points.findIndex(p => p.id === prev.draggedPointId);
                  if (pointIdx !== -1) {
                      const point = { ...points[pointIdx] };
                      const hDx = x - point.x;
                      const hDy = y - point.y;
                      const isAlt = evt.altKey;

                      // If Alt is held while dragging a handle, break symmetry
                      if (isAlt && point.type !== 'disconnected') {
                          point.type = 'disconnected';
                      }

                      if (prev.draggedHandleType === 'in') {
                          point.handleIn = { x: hDx, y: hDy };
                          // Mirroring rules
                          if (!isAlt) {
                              if (point.type === 'smooth') {
                                  point.handleOut = { x: -hDx, y: -hDy };
                              } else if (point.type === 'asymmetric' && point.handleOut) {
                                  const len = Math.sqrt(Math.pow(point.handleOut.x, 2) + Math.pow(point.handleOut.y, 2));
                                  const angle = Math.atan2(-hDy, -hDx);
                                  point.handleOut = { x: Math.cos(angle) * len, y: Math.sin(angle) * len };
                              }
                          }
                      } else {
                          point.handleOut = { x: hDx, y: hDy };
                          // Mirroring rules
                          if (!isAlt) {
                              if (point.type === 'smooth') {
                                  point.handleIn = { x: -hDx, y: -hDy };
                              } else if (point.type === 'asymmetric' && point.handleIn) {
                                  const len = Math.sqrt(Math.pow(point.handleIn.x, 2) + Math.pow(point.handleIn.y, 2));
                                  const angle = Math.atan2(-hDy, -hDx);
                                  point.handleIn = { x: Math.cos(angle) * len, y: Math.sin(angle) * len };
                              }
                          }
                      }
                      points[pointIdx] = point;
                  }
              } else {
                  // Drag all selected anchor points
                  prev.selectedPoints.forEach(id => {
                      const idx = points.findIndex(p => p.id === id);
                      if (idx !== -1) {
                          const p = { ...points[idx] };
                          p.x += dx;
                          p.y += dy;
                          points[idx] = p;
                      }
                  });
              }
              
              return {
                  ...prev,
                  activePath: { ...prev.activePath, points },
                  previewPoint: { x, y }
              };
          }
          
          // Hover detection in edit mode
          let hovered = null;
          if (prev.activePath) {
              for (const p of prev.activePath.points) {
                  const dPoint = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
                  if (dPoint < 10) { hovered = `anchor_${p.id}`; break; }
                  
                  if (p.handleIn) {
                      const dIn = Math.sqrt(Math.pow(p.x + p.handleIn.x - x, 2) + Math.pow(p.y + p.handleIn.y - y, 2));
                      if (dIn < 8) { hovered = `handleIn_${p.id}`; break; }
                  }
                  if (p.handleOut) {
                      const dOut = Math.sqrt(Math.pow(p.x + p.handleOut.x - x, 2) + Math.pow(p.y + p.handleOut.y - y, 2));
                      if (dOut < 8) { hovered = `handleOut_${p.id}`; break; }
                  }
              }
              
              if (!hovered) {
                  const segIdx = findSegmentAt(x, y);
                  if (segIdx !== null) hovered = `segment_${segIdx}`;
              }
          }
          return { ...prev, previewPoint: { x, y }, hoveredPoint: hovered };
      }

      return {
        ...prev,
        previewPoint: { x, y },
      };
    });
  }, [getPointer, updateState, findSegmentAt]);

  const handleMouseUp = useCallback(() => {
    updateState(prev => {
        if (prev.mode === 'edit' && dragStartRef.current && prev.activePath && !prev.hoveredPoint) {
           // Clicked away or finished drag
        }
        return { ...prev, isDraggingHandle: false, draggedPointId: null, draggedHandleType: null };
    });
    dragStartRef.current = null;
  }, [updateState]);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    stateRef.current = INITIAL_STATE;
  }, []);

  const toggleSnap = useCallback(() => {
      updateState(prev => ({ ...prev, snapEnabled: !prev.snapEnabled }));
  }, [updateState]);

  return {
    state,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    enterEditMode,
    deleteSelectedPoints,
    togglePointType,
    toggleSnap,
    joinSelectedPoints,
    breakPathAtSelected,
    reset,
  };
};
