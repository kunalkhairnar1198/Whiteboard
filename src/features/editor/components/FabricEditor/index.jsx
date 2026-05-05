// FabricEditor.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
// prefer named imports for modern fabric builds; keep fallback `fabric` for filters/brushes
import {
  Canvas as FabricCanvas,
  Circle as FabricCircle,
  Gradient as FabricGradient,
  Image as FabricImage,
  Line as FabricLine,
  Shadow as FabricShadow,
  StaticCanvas,
  Path as FabricPath,
} from 'fabric';
import * as fabric from 'fabric'; // keep for filters, brush classes, etc.
import useHistory from '@/features/editor/hooks/useHistory';
import {
  createInteractiveShape,
  drawGrid,
  isShapeTool,
  getShapeAnchors,
  setCanvasBackgroundColor,
  setCanvasBackgroundImage,
  updateConnections,
  updateInteractiveShape,
} from '@/features/editor/lib/canvasUtils';
import { getNextElementCounterFromState } from '@/features/editor/lib/editorState';
import { moveLayerInOrder } from '@/features/editor/lib/layerOrder';
import { loadCanvasState, persistCanvasState } from '@/features/editor/lib/persistence';
import Header from '@/features/editor/components/sidebar/Header';
import LeftSidebar from '@/features/editor/components/sidebar/LeftSidebar';
import CanvasArea from '@/features/editor/components/Canvas';
import RightSidebar from '@/features/editor/components/sidebar/RightSidebar';
import { canvasPresets } from '@/features/editor/constants/canvasPresets';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { usePenTool } from '@/features/editor/tools/pen/usePenTool';
import { PenToolOverlay } from '@/features/editor/tools/pen/PenToolOverlay';
import { usePathRenderer } from '@/features/editor/tools/pen/usePathRenderer';
import { v4 as uuidv4 } from 'uuid';


/**
 * FabricEditor
 * - Fixed: background image upload now sets the canvas background image and waits for it to load
 * - Defensive: supports utilities that return a Promise or use a callback
 * - Comments explain the flows where saving state and rendering matter
 */

const FabricEditor = () => {
  // -------------------------
  // States
  // -------------------------
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [elements, setElements] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [canvasSize, setCanvasSize] = useState({
    width: window.innerWidth < 640 ? 300 : window.innerWidth < 1024 ? 600 : 800,
    height: window.innerWidth < 640 ? 200 : window.innerWidth < 1024 ? 400 : 600,
  });
  const [zoom, setZoom] = useState(1);
  const [background, setBackground] = useState({ type: 'color', value: '#ffffff' });
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [currentTool, setCurrentTool] = useState('select');
  const [penColor, setPenColor] = useState('#1f2937');
  const [penWidth, setPenWidth] = useState(4);
  const [penOpacity, setPenOpacity] = useState(1);
  const [penBrushType, setPenBrushType] = useState('Pencil');
  const [penShadowColor, setPenShadowColor] = useState('#000000');
  const [penShadowBlur, setPenShadowBlur] = useState(0);
  const [penShadowOffset, setPenShadowOffset] = useState(0);
  const [eraserSize, setEraserSize] = useState(10);
  const [textColor, setTextColor] = useState('#1f2937');
  const [templateName, setTemplateName] = useState('Untitled Template');
  const [elementCounter, setElementCounter] = useState(0);
  const [showLayers, setShowLayers] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('Custom');
  const [editingPathId, setEditingPathId] = useState(null);


  // -------------------------
  // Refs
  // -------------------------
  const canvasRef = useRef(null);
  const canvas = useRef(null);
  // elementCounterRef mirrors elementCounter state but provides a stable ref
  const elementCounterRef = useRef(elementCounter);
  const gridGroup = useRef(null);
  const isLoadingRef = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const drawingShapeRef = useRef(null);
  const drawingShapeStartRef = useRef(null);
  const isCreatingTextRef = useRef(false);
  const anchorHelpersRef = useRef([]);
  const modifierKeysRef = useRef({ altKey: false, shiftKey: false, ctrlKey: false });

  // -------------------------
  // History hook for undo/redo (user provided)
  // -------------------------
  const { saveState, undo, redo, canUndo, canRedo } = useHistory();
  const { buildSVGPath } = usePathRenderer();

  // -------------------------
  // Helpers
  // -------------------------
  const safeSaveState = useCallback(() => {
    try {
      if (canvas.current) {
        // Fabric v6 toObject/toJSON handling
        const json = canvas.current.toObject(['data', 'id', 'name']);
        saveState(json);
        persistCanvasState(json);
      } else {
        console.warn('Canvas not initialized; skipping saveState');
      }
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }, [saveState]);

  const isTextObject = useCallback((obj) => obj?.type === 'textbox' || obj?.type === 'i-text', []);

  const syncElements = useCallback(() => {
    if (!canvas.current) return;
    try {
      const objects = canvas.current
        .getObjects()
        .filter((obj) => obj.data && obj.data.id && !obj.excludeFromExport);
      setElements(
        objects.map((obj) => ({
          id: obj.data.id,
          type: obj.data.type,
          name: obj.name || `${obj.data.type}-${(obj.data.id || '').split('-')[1]}`,
          visible: obj.visible !== false,
          locked: obj.lockMovementX || false,
        })),
      );
    } catch (error) {
      console.error('Error syncing elements:', error);
    }
  }, [setElements]);

  // -------------------------
  // Path Completion Handler
  // -------------------------
  const handlePenPathComplete = useCallback((vectorPath) => {
    if (!canvas.current || vectorPath.points.length < 2) {
        if (editingPathId) {
            // Clean up if path became too small
            const existing = canvas.current.getObjects().find(o => o.data?.id === editingPathId);
            if (existing) canvas.current.remove(existing);
            setEditingPathId(null);
            syncElements();
        }
        return;
    }
    
    const d = buildSVGPath(vectorPath);
    const existingId = editingPathId;
    const id = existingId || `element-${elementCounterRef.current}`;
    
    // Create new Fabric Path
    // Create new Fabric Path using the global fabric instance to ensure consistency
    const fabricPath = new fabric.Path(d, {
        id: id,
        fill: vectorPath.fill || 'transparent',
        stroke: penColor,
        strokeWidth: penWidth, 
        opacity: penOpacity,
        fillRule: vectorPath.fillRule || 'nonzero',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        data: { 
            id, 
            type: 'path',
            points: [...vectorPath.points],
            closed: vectorPath.closed 
        },
        name: existingId ? undefined : `pen-path-${elementCounterRef.current}`,
    });
    
    if (existingId) {
        // REPLACE EXISTING OBJECT to preserve layer order
        const objects = canvas.current.getObjects();
        const existingIdx = objects.findIndex(o => o.data?.id === existingId);
        const existing = objects[existingIdx];
        
        if (existingIdx !== -1) {
            // Transfer name and other props if needed
            fabricPath.name = existing.name;
            canvas.current.remove(existing);
            canvas.current.insertAt(fabricPath, existingIdx);
        } else {
            canvas.current.add(fabricPath);
        }
        setEditingPathId(null);
    } else {
        canvas.current.add(fabricPath);
        elementCounterRef.current += 1;
        setElementCounter(elementCounterRef.current);
    }
    
    canvas.current.setActiveObject(fabricPath);
    canvas.current.requestRenderAll();
    
    setSelectedIds([id]);
    syncElements();
    safeSaveState();
  }, [buildSVGPath, syncElements, safeSaveState, editingPathId, penColor, penWidth, penOpacity]);

  // -------------------------
  // Pen Tool Hook
  // -------------------------
  const penTool = usePenTool(canvas.current, {
     onPathComplete: handlePenPathComplete,
     elementCounter: elementCounterRef.current,
     zoom
  });

  // Cleanup for pen tool edit mode when switching tools
  useEffect(() => {
      if (currentTool !== 'pen' && editingPathId) {
          // Restore visibility if we didn't finish properly
          const existing = canvas.current.getObjects().find(o => o.data?.id === editingPathId);
          if (existing) {
              existing.set({ visible: true, evented: true });
              canvas.current.requestRenderAll();
          }
          setEditingPathId(null);
          syncElements();
      }
  }, [currentTool, editingPathId]);





  const createGradientFill = useCallback((obj, gradientConfig) => {
    if (!obj || !gradientConfig || !Array.isArray(gradientConfig.colors)) return null;

    const colors = gradientConfig.colors.filter(Boolean);
    if (!colors.length) return null;

    const width = obj.getScaledWidth?.() || obj.width || (obj.radius ? obj.radius * 2 : 100);
    const height = obj.getScaledHeight?.() || obj.height || (obj.radius ? obj.radius * 2 : 100);

    const colorStops = colors.map((color, index) => ({
      offset: colors.length === 1 ? 1 : index / (colors.length - 1),
      color,
    }));

    const coords =
      gradientConfig.coords ||
      (gradientConfig.type === 'radial'
        ? {
            x1: width / 2,
            y1: height / 2,
            r1: 0,
            x2: width / 2,
            y2: height / 2,
            r2: Math.max(width, height) / 2,
          }
        : {
            x1: 0,
            y1: 0,
            x2: width,
            y2: 0,
          });

    return new FabricGradient({
      type: gradientConfig.type || 'linear',
      gradientUnits: 'pixels',
      coords,
      colorStops,
    });
  }, []);

  // -------------------------
  // Preset handling
  // -------------------------
  const handlePresetChange = (presetName, customWidth, customHeight) => {
    setSelectedPreset(presetName);
    let width = 800;
    let height = 600;
    if (presetName === 'Custom' && customWidth && customHeight) {
      width = parseInt(customWidth, 10);
      height = parseInt(customHeight, 10);
    } else {
      const preset = canvasPresets[presetName] || canvasPresets.Custom;
      width = preset.width;
      height = preset.height;
    }
    width = Math.max(100, Math.min(width, 4000));
    height = Math.max(100, Math.min(height, 4000));
    const maxWidth = window.innerWidth * 0.7;
    const maxHeight = window.innerHeight * 0.7;
    const scale = Math.min(maxWidth / width, maxHeight / height, 1);
    const newW = width * scale * zoom;
    const newH = height * scale * zoom;
    setCanvasSize({ width: newW, height: newH });
    if (canvas.current) {
      canvas.current.setDimensions({ width: newW, height: newH });
      canvas.current.setZoom(zoom);
      canvas.current.renderAll();
      drawGrid(canvas.current, showGrid, gridSize, { width: newW, height: newH }, gridGroup);
    }
  };

  // -------------------------
  // Image upload as normal object
  // -------------------------
  const handleImageUpload = (e) => {
    if (!canvas.current) {
      console.error('Canvas is not initialized in handleImageUpload');
      e.target.value = '';
      return;
    }

    const files = e.target.files;
    if (!files || files.length === 0) {
      e.target.value = '';
      return;
    }

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        console.error('Invalid file type:', file.type);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const img = new Image();
          img.src = reader.result;
          img.onload = () => {
            try {
              const maxSize = 400;
              let scale = 1;
              if (img.width > maxSize || img.height > maxSize) {
                scale = Math.min(maxSize / img.width, maxSize / img.height);
              }

              const id = `element-${elementCounter}`;
              const fabricImage = new fabric.Image(img, {
                scaleX: scale,
                scaleY: scale,
                left: 100 + ((elementCounter * 20) % 400),
                top: 100 + ((elementCounter * 20) % 300),
                data: { id, type: 'image' },
                name: `image-${elementCounter}`,
              });

              fabricImage.filters = [];
              canvas.current.add(fabricImage);
              canvas.current.setActiveObject(fabricImage);
              canvas.current.renderAll();
              setElementCounter((prev) => prev + 1);
              setSelectedIds([id]);
              syncElements();
              setShowFilters(true);
              setShowLayers(true);

              setTimeout(() => {
                try {
                  safeSaveState();
                } catch (err) {
                  console.error('Error saving state after image upload:', err);
                }
              }, 100);
            } catch (err) {
              console.error('Error creating fabric image:', err);
            }
          };
        } catch (err) {
          console.error('Error loading image:', err);
        }
      };
      reader.onerror = (err) => {
        console.error('Error reading file:', err);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };
  // -------------------------
  // Background image upload (canvas background)
  // Important: ensure we actually set the image as the canvas background,
  // wait for it to be applied, then save the canvas state.
  // -------------------------
  const handleBgImageUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      e.target.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      console.error('Background must be an image');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;

      // Update UI state so sidebars reflect background type immediately
      setBackground({ type: 'image', value: dataUrl });

      if (canvas.current) {
        try {
          const maybePromise = setCanvasBackgroundImage(canvas.current, dataUrl, canvasSize);
          if (maybePromise && typeof maybePromise.then === 'function') {
            maybePromise
              .then(() => {
                safeSaveState();
              })
              .catch((err) => {
                console.warn('setCanvasBackgroundImage promise rejected, still saving state', err);
                safeSaveState();
              });
          } else {
            setTimeout(() => {
              try {
                if (canvas.current) canvas.current.renderAll();
              } catch (renderErr) {
                // ignore
              }
              safeSaveState();
            }, 120);
          }
        } catch (err) {
          console.error('Error applying background image to canvas directly', err);
          setTimeout(() => {
            try {
              safeSaveState();
            } catch (e2) {
              console.error('Failed to save state after background fallback', e2);
            }
          }, 120);
        }
      } else {
        // If canvas not ready yet, just save background state — background useEffect will pick it up
        setTimeout(() => {
          try {
            safeSaveState();
          } catch (err) {
            console.error('Error saving state after background upload (canvas not ready)', err);
          }
        }, 120);
      }
    };
    reader.onerror = (err) => {
      console.error('Error reading bg file', err);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // -------------------------
  // Element property updates
  // -------------------------


  const handleElementChange = (id, newProps) => {
    if (!canvas.current) return;
    try {
      const obj = canvas.current.getObjects().find((o) => o.data && o.data.id === id);
      if (!obj) return;

      if (
        (isTextObject(obj) || obj.type === 'image') &&
        (newProps.brightness !== undefined || newProps.contrast !== undefined)
      ) {
        if (!obj.filters) obj.filters = [];
        if (newProps.brightness !== undefined) {
          const bIndex = obj.filters.findIndex((f) => f && f.type === 'Brightness');
          if (newProps.brightness !== 0) {
            obj.filters[bIndex] = new fabric.Image.filters.Brightness({
              brightness: newProps.brightness / 100,
            });
          } else if (bIndex !== -1) {
            obj.filters.splice(bIndex, 1);
          }
          delete newProps.brightness;
        }
        if (newProps.contrast !== undefined) {
          const cIndex = obj.filters.findIndex((f) => f && f.type === 'Contrast');
          if (newProps.contrast !== 0) {
            obj.filters[cIndex] = new fabric.Image.filters.Contrast({
              contrast: newProps.contrast / 100,
            });
          } else if (cIndex !== -1) {
            obj.filters.splice(cIndex, 1);
          }
          delete newProps.contrast;
        }
        try {
          if (typeof obj.applyFilters === 'function') obj.applyFilters();
        } catch (err) {
          console.warn('applyFilters failed:', err);
        }
      }

      if (isTextObject(obj) && newProps.wrap !== undefined) {
        obj.set({ width: newProps.wrap ? newProps.textWidth || 200 : undefined });
        delete newProps.wrap;
        delete newProps.textWidth;
      }

      if (isTextObject(obj) && newProps.textDecoration !== undefined) {
        obj.set({ textDecoration: newProps.textDecoration || '' });
        delete newProps.textDecoration;
      }

      if (newProps.gradient !== undefined) {
        if (newProps.gradient) {
          const gradientFill = createGradientFill(obj, newProps.gradient);
          if (gradientFill) {
            obj.set({ fill: gradientFill });
          }
          if (newProps.fill === undefined) {
            delete newProps.fill;
          }
        }
        delete newProps.gradient;
      }

      obj.set(newProps);
      canvas.current.renderAll();
      syncElements();
      safeSaveState();
    } catch (error) {
      console.error('Error updating element:', error);
    }
  };

  // -------------------------
  // Delete / duplicate / layer controls
  // -------------------------
  const deleteSelected = useCallback(() => {
    if (!canvas.current) return;
    try {
      const activeObject = canvas.current.getActiveObject();
      


      // Default: Delete regular objects
      const activeObjects = canvas.current.getActiveObjects();
      if (activeObjects.length > 0) {
        activeObjects.forEach((obj) => {
          if (obj.data && obj.data.id) {
            canvas.current.remove(obj);
          }
        });
        canvas.current.discardActiveObject();
        canvas.current.renderAll();
        setSelectedIds([]);
        syncElements();
        safeSaveState();
      }
    } catch (error) {
      console.error('Error deleting selected:', error);
    }
  }, [currentTool, syncElements, safeSaveState]);

  const deleteElement = useCallback(
    (id) => {
      if (!canvas.current) return;
      try {
        const obj = canvas.current.getObjects().find((o) => o.data && o.data.id === id);
        if (obj) {
          canvas.current.remove(obj);
          canvas.current.renderAll();
          setSelectedIds((prev) => prev.filter((sid) => sid !== id));
          syncElements();
          safeSaveState();
        }
      } catch (error) {
        console.error('Error deleting element:', error);
      }
    },
    [syncElements, safeSaveState],
  );

  const duplicateSelected = useCallback(() => {
    if (!canvas.current) return;
    try {
      const active = canvas.current.getActiveObject();
      if (active && active.data) {
        active.clone((cloned) => {
          const id = `element-${elementCounterRef.current}`;
          cloned.set({
            left: cloned.left + 30,
            top: cloned.top + 30,
            data: { id, type: cloned.data.type },
            name: `${cloned.data.type}-${elementCounterRef.current}`,
          });
          if (cloned.type === 'image' && active.filters) {
            cloned.filters = [...(active.filters || [])];
          }
          canvas.current.add(cloned);
          canvas.current.setActiveObject(cloned);
          canvas.current.renderAll();
          // increment ref and mirror to state
          elementCounterRef.current += 1;
          setElementCounter(elementCounterRef.current);
          setSelectedIds([id]);
          syncElements();
          safeSaveState();
        });
      }
    } catch (error) {
      console.error('Error duplicating element:', error);
    }
  }, [syncElements, safeSaveState]);

  // Keep elementCounterRef in sync if elementCounter state is updated elsewhere
  useEffect(() => {
    elementCounterRef.current = elementCounter;
  }, [elementCounter]);

  const toggleLayerVisibility = (id) => {
    if (!canvas.current) return;
    try {
      const obj = canvas.current.getObjects().find((o) => o.data && o.data.id === id);
      if (obj) {
        obj.set('visible', !obj.visible);
        canvas.current.renderAll();
        syncElements();
        safeSaveState();
      }
    } catch (error) {
      console.error('Error toggling layer visibility:', error);
    }
  };

  const toggleLayerLock = (id) => {
    if (!canvas.current) return;
    try {
      const obj = canvas.current.getObjects().find((o) => o.data && o.data.id === id);
      if (obj) {
        const locked = !obj.lockMovementX;
        obj.set({
          lockMovementX: locked,
          lockMovementY: locked,
          lockRotation: locked,
          lockScalingX: locked,
          lockScalingY: locked,
          selectable: !locked,
        });
        canvas.current.renderAll();
        syncElements();
        safeSaveState();
      }
    } catch (error) {
      console.error('Error toggling layer lock:', error);
    }
  };

  const moveLayer = (id, direction) => {
    if (!canvas.current) return;
    try {
      const objects = canvas.current.getObjects();
      const reorderedObjects = moveLayerInOrder(objects, id, direction);

      if (reorderedObjects !== objects) {
        canvas.current._objects = reorderedObjects;
        canvas.current.renderAll?.();
        syncElements();
        safeSaveState();
      }
    } catch (error) {
      console.error('Error moving layer:', error);
    }
  };

  // -------------------------
  // Zoom handlers
  // -------------------------
  const handleZoomIn = () => {
    if (!canvas.current) return;
    try {
      const newZoom = Math.min(zoom * 1.2, 5);
      canvas.current.setZoom(newZoom);
      setZoom(newZoom);
    } catch (error) {
      console.error('Error zooming in:', error);
    }
  };

  const handleZoomOut = () => {
    if (!canvas.current) return;
    try {
      const newZoom = Math.max(zoom * 0.8, 0.1);
      canvas.current.setZoom(newZoom);
      setZoom(newZoom);
    } catch (error) {
      console.error('Error zooming out:', error);
    }
  };

  const resetZoom = () => {
    if (!canvas.current) return;
    try {
      canvas.current.setZoom(1);
      canvas.current.setViewportTransform([1, 0, 0, 1, 0, 0]);
      setZoom(1);
    } catch (error) {
      console.error('Error resetting zoom:', error);
    }
  };

  // -------------------------
  // Export canvas to image
  // -------------------------
  const exportCanvas = (format) => {
    if (!canvas.current) return;
    try {
      const wasGridVisible = showGrid;
      if (gridGroup.current) gridGroup.current.set('visible', false);

      const dataURL = canvas.current.toDataURL({
        format: format === 'jpg' ? 'jpeg' : 'png',
        multiplier: 2,
      });

      if (gridGroup.current && wasGridVisible) {
        gridGroup.current.set('visible', true);
        canvas.current.renderAll();
      }
      const link = document.createElement('a');
      link.download = `${templateName}.${format}`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting canvas:', error);
    }
  };

  // -------------------------
  // Derived selected element reference
  // -------------------------
  const selectedElement =
    canvas.current && selectedIds.length === 1
      ? canvas.current.getObjects().find((obj) => obj.data && obj.data.id === selectedIds[0])
      : null;

  const cursorStyle = (() => {
    if (isPanning) return 'grabbing';
    switch (currentTool) {
      case 'pan':
        return 'grab';

      case 'pen':
        if (penTool.state.hoveredPoint) {
            if (penTool.state.hoveredPoint.startsWith('anchor')) return 'move';
            return 'crosshair';
        }
        return 'crosshair'; // Should ideally be a custom pen icon
      case 'brush':
        return 'crosshair';
      case 'eraser':
        return 'pointer';
      case 'text':
        return 'text';
      default:
        return isShapeTool(currentTool) ? 'crosshair' : 'default';
    }
  })();

  const onLayerSelect = (id) => {
    if (!canvas.current) return;
    const obj = canvas.current.getObjects().find((o) => o.data && o.data.id === id);
    if (obj && !obj.lockMovementX) {

      canvas.current.setActiveObject(obj);
      canvas.current.renderAll();
      setSelectedIds([id]);

    }
    setShowRightSidebar(false);
  };

  const restoreCanvasState = useCallback(
    async (state) => {
      if (!state || !canvas.current) return;

      isLoadingRef.current = true;
      try {
        await canvas.current.loadFromJSON(state);

        canvas.current.renderAll();
        canvas.current.discardActiveObject();
        setSelectedIds([]);

        syncElements();
        const nextCounter = getNextElementCounterFromState(state);
        elementCounterRef.current = nextCounter;
        setElementCounter(nextCounter);

      } catch (error) {
        console.error('Error restoring canvas state:', error);
      } finally {
        isLoadingRef.current = false;
      }
    },
    [syncElements],
  );

  const handleUndo = useCallback(() => {
    const previousState = undo();
    if (previousState) {
      restoreCanvasState(previousState);
    }
  }, [restoreCanvasState, undo]);

  const handleRedo = useCallback(() => {
    const nextState = redo();
    if (nextState) {
      restoreCanvasState(nextState);
    }
  }, [restoreCanvasState, redo]);

  // -------------------------
  // Canvas initialization and event wiring
  // -------------------------
  useEffect(() => {
    if (canvasRef.current && !canvas.current) {
      canvas.current = new FabricCanvas(canvasRef.current, {
        width: canvasSize.width,
        height: canvasSize.height,
        backgroundColor: background.type === 'color' ? background.value : undefined,
        preserveObjectStacking: true,
        selection: true,
        fireRightClick: true,
        stopContextMenu: true,
      });

      // If initial background is an image, ensure background set via utility after instantiation
      if (background.type === 'image' && background.value) {
        // call util defensively
        try {
          const ret = setCanvasBackgroundImage(canvas.current, background.value, canvasSize);
          if (ret && typeof ret.then === 'function') {
            ret
              .then(() => {
                canvas.current && canvas.current.renderAll();
              })
              .catch(() => {});
          } else {
            setTimeout(() => canvas.current && canvas.current.renderAll(), 80);
          }
        } catch (err) {
          console.warn('Background image set failed at init', err);
        }
      }      // Initialize common brush instance (if any)
      try {
        const brushName = penBrushType || 'Pencil';
        let initBrush = null;
        if (fabric && fabric[brushName + 'Brush']) {
          initBrush = new fabric[brushName + 'Brush'](canvas.current);
        } else if (fabric && fabric.PencilBrush) {
          initBrush = new fabric.PencilBrush(canvas.current);
        }
        if (initBrush) {
          initBrush.color = penColor;
          initBrush.width = penWidth;
          if ('opacity' in initBrush) initBrush.opacity = penOpacity;
          initBrush.shadow = new fabric.Shadow({
            blur: penShadowBlur,
            offsetX: 0,
            offsetY: 0,
            affectStroke: true,
            color: penShadowColor,
          });
          canvas.current.freeDrawingBrush = initBrush;
        }
      } catch (err) {
        console.warn('Brush initialization error', err);
      }

      // Save initial baseline state for undo stack
      setTimeout(() => {
        try {
          if (canvas.current && !isLoadingRef.current) {
            safeSaveState();
            setIsCanvasReady(true);
          }
        } catch (err) {
          console.error('Error saving initial state:', err);
        }
      }, 100);

      // clean up on unmount
      return () => {
        if (canvas.current) {
          try {
            canvas.current.dispose && canvas.current.dispose();
          } catch (err) {
            // ignore dispose errors
          }
          canvas.current = null;
        }
      };
    }
  }, [
    background.type,
    background.value,
    canvasRef,
    canvasSize,
    penBrushType,
    penColor,
    penOpacity,
    penShadowBlur,
    penShadowColor,
    penWidth,
    safeSaveState,
  ]);

  // -------------------------
  // Resize / grid rerenders
  // -------------------------
  useEffect(() => {
    if (canvas.current) {
      canvas.current.setDimensions(canvasSize);
      canvas.current.renderAll();
      if (showGrid) drawGrid(canvas.current, showGrid, gridSize, canvasSize, gridGroup);
    }
  }, [canvasSize, showGrid, gridSize]);

  // -------------------------
  // Background changes: color or image
  // We leave this effect because other parts of the app may update `background` state.
  // The handleBgImageUpload already applies the image to the canvas directly, but this
  // effect ensures that programmatic background changes also work.
  // -------------------------
  useEffect(() => {
    if (currentTool !== 'pen' && penTool.state.activePath) {
        handlePenPathComplete(penTool.state.activePath);
        penTool.reset();
    }
  }, [currentTool, penTool, handlePenPathComplete]);

  useEffect(() => {
    if (canvas.current) {
      if (background.type === 'color') {
        setCanvasBackgroundColor(canvas.current, background.value);
      } else if (background.type === 'image' && background.value) {
        // Defensive: if util returns Promise, wait; otherwise schedule small delay
        try {
          const maybePromise = setCanvasBackgroundImage(
            canvas.current,
            background.value,
            canvasSize,
          );
          if (maybePromise && typeof maybePromise.then === 'function') {
            maybePromise
              .then(() => canvas.current && canvas.current.renderAll())
              .catch((err) => {
                console.warn('setCanvasBackgroundImage rejected in background effect', err);
              });
          } else {
            setTimeout(() => canvas.current && canvas.current.renderAll(), 80);
          }
        } catch (err) {
          console.error('Error setting background image in effect', err);
        }
      }
    }
  }, [background, canvasSize]);

  // -------------------------
  // Brush prop updates (color, width, etc.)
  // -------------------------
  useEffect(() => {
    if (canvas.current && canvas.current.freeDrawingBrush) {
      const brush = canvas.current.freeDrawingBrush;
      brush.color = penColor;
      brush.width = penWidth;
      if ('opacity' in brush) brush.opacity = penOpacity;
      brush.shadow = brush.shadow || new fabric.Shadow({});
      brush.shadow.color = penShadowColor;
      brush.shadow.blur = penShadowBlur;
      brush.shadow.offsetX = penShadowOffset;
      brush.shadow.offsetY = penShadowOffset;
      canvas.current.requestRenderAll();
    }
  }, [penColor, penWidth, penOpacity, penShadowColor, penShadowBlur, penShadowOffset]);

  // -------------------------
  // Restore persisted state once
  // -------------------------
  useEffect(() => {
    if (!canvas.current || !isCanvasReady) return;

    const savedState = loadCanvasState();
    if (savedState) {
      isLoadingRef.current = true;
      canvas.current.loadFromJSON(savedState).then(() => {
        canvas.current.requestRenderAll();
        syncElements();
        
        // Update element counter from loaded state
        const maxId = getNextElementCounterFromState(canvas.current.toJSON());
        elementCounterRef.current = maxId;
        setElementCounter(maxId);
        
        isLoadingRef.current = false;
        console.log('Restored state from persistence');
      });
    }
  }, [isCanvasReady, syncElements]);

  // -------------------------
  // Grid drawing whenever relevant props change
  // -------------------------
  useEffect(() => {
    drawGrid(canvas.current, showGrid, gridSize, canvasSize, gridGroup);
  }, [showGrid, gridSize, canvasSize]);

  // -------------------------
  // Tool switching (drawing/eraser/pan) and events wiring
  // -------------------------
  useEffect(() => {
    if (!canvas.current) return;

    canvas.current.isDrawingMode = currentTool === 'brush';
    canvas.current.selection =
      !isShapeTool(currentTool) && currentTool !== 'pan' && currentTool !== 'eraser';

    const clearAnchorHelpers = () => {
      if (!canvas.current) return;
      anchorHelpersRef.current.forEach(h => {
        if (h && canvas.current) {
           try { canvas.current.remove(h); } catch(err) { /* already removed */ }
        }
      });
      anchorHelpersRef.current = [];
      canvas.current.requestRenderAll();
    };

    const showAnchors = () => {
      clearAnchorHelpers();
      if (currentTool !== 'line') return;

      canvas.current.getObjects().forEach(obj => {
        if (!obj.data?.id || obj.type === 'line' || obj.type === 'i-text' || obj.excludeFromExport) return;
        
        const anchors = getShapeAnchors(obj);
        anchors.forEach(a => {
          const helper = new FabricCircle({
            left: a.x,
            top: a.y,
            radius: 5,
            fill: '#ffffff',
            stroke: '#10b981',
            strokeWidth: 2,
            selectable: false,
            evented: true,
            originX: 'center',
            originY: 'center',
            hoverCursor: 'crosshair',
            data: { anchor: true, ownerId: a.ownerId, anchorName: a.name }
          });
          
          helper.on('mouseover', () => {
            helper.set({ fill: '#10b981', radius: 7 });
            canvas.current.renderAll();
          });
          
          helper.on('mouseout', () => {
            helper.set({ fill: '#ffffff', radius: 5 });
            canvas.current.renderAll();
          });

          canvas.current.add(helper);
          anchorHelpersRef.current.push(helper);
        });
      });
      canvas.current.renderAll();
    };

    if (currentTool === 'line') {
      showAnchors();
    } else {
      clearAnchorHelpers();
    }

    if (currentTool === 'brush') {
      const brushType = penBrushType || 'Pencil';
      const NewBrush = (fabric && fabric[brushType + 'Brush']) || fabric.PencilBrush;
      try {
        const newBrush = new NewBrush(canvas.current);
        newBrush.color = penColor;
        newBrush.width = penWidth;
        if ('opacity' in newBrush) newBrush.opacity = penOpacity;
        newBrush.shadow = new fabric.Shadow({
          blur: penShadowBlur,
          offsetX: penShadowOffset,
          offsetY: penShadowOffset,
          affectStroke: true,
          color: penShadowColor,
        });
        canvas.current.freeDrawingBrush = newBrush;
      } catch (err) {
        console.warn('Failed to set custom brush, reverting to PencilBrush', err);
        const fallback = new fabric.PencilBrush(canvas.current);
        fallback.color = penColor;
        fallback.width = penWidth;
        canvas.current.freeDrawingBrush = fallback;
      }
    }

    // Event handlers
    const handleMouseDown = (opt) => {
      const evt = opt.e;
      const modifierPressed = !!evt.ctrlKey;
      const activeObject = canvas.current.getActiveObject();
      const target = opt.target;

      if (currentTool === 'eraser') {
        canvas.current.isErasing = true;
        if (target && !target.excludeFromExport && target.type !== 'canvas') {
          if (target.data?.id) setSelectedIds((prev) => prev.filter(id => id !== target.data.id));
          canvas.current.remove(target);
          canvas.current.discardActiveObject();
          canvas.current.requestRenderAll();
          syncElements();
          safeSaveState();
        }
        return;
      }



      if (isShapeTool(currentTool)) {
        const clickedObject = opt.target;
        if (clickedObject?.data?.id && clickedObject.selectable !== false) {
          canvas.current.setActiveObject(clickedObject);
          canvas.current.requestRenderAll();
          return;
        }

        const pointer = canvas.current.getPointer(evt);
        const id = `element-${elementCounterRef.current}`;
        const shape = createInteractiveShape({
          type: currentTool,
          id,
          x: pointer.x,
          y: pointer.y,
          textColor,
        });

        if (!shape) return;

        drawingShapeStartRef.current = pointer;
        drawingShapeRef.current = shape;
        
        // Check for anchor start
        if (currentTool === 'line' && target?.data?.anchor) {
          shape.set({
            x1: target.left,
            y1: target.top,
            x2: target.left,
            y2: target.top,
            data: {
              ...shape.data,
              connector: true,
              sourceId: target.data.ownerId,
              sourceAnchor: target.data.anchorName
            }
          });
        }

        canvas.current.discardActiveObject();
        canvas.current.add(shape);
        canvas.current.requestRenderAll();
        return;
      }

      if (currentTool === 'text') {
        if (isCreatingTextRef.current) return;

        if (opt.target?.data?.id) {
          canvas.current.setActiveObject(opt.target);
          canvas.current.requestRenderAll();
          return;
        }

        const pointer = canvas.current.getPointer(evt);
        const id = `element-${elementCounterRef.current}`;
        const textObject = createInteractiveShape({
          type: 'text',
          id,
          x: pointer.x,
          y: pointer.y,
          textColor,
        });

        if (!textObject) return;

        isCreatingTextRef.current = true;
        canvas.current.add(textObject);
        canvas.current.setActiveObject(textObject);
        textObject.set({
          selectable: true,
          evented: true,
          editable: true,
          hasControls: true,
          hasBorders: true,
          objectCaching: false,
        });
        canvas.current.requestRenderAll();
        elementCounterRef.current += 1;
        setElementCounter(elementCounterRef.current);
        setSelectedIds([]);
        syncElements();
        // Skip setCurrentTool('select') for persistence
        // setCurrentTool('select');

        textObject.on('editing:exited', () => {
          const trimmed = textObject.text?.trim() || '';
          isCreatingTextRef.current = false;

          if (!trimmed) {
            canvas.current?.remove(textObject);
            canvas.current?.discardActiveObject();
            canvas.current?.requestRenderAll();
            setSelectedIds([]);
            syncElements();
            safeSaveState();
            return;
          }

          textObject.setCoords();
          canvas.current?.setActiveObject(textObject);
          canvas.current?.requestRenderAll();
          setSelectedIds([id]);
          syncElements();
          safeSaveState();
        });

        requestAnimationFrame(() => {
          canvas.current?.setActiveObject(textObject);
          textObject.enterEditing();
          textObject.selectAll();
          canvas.current?.requestRenderAll();
        });
        return;
      }

      if (currentTool === 'pan' || evt.button === 2) {
        setIsPanning(true);
        canvas.current.selection = false;
        lastPos.current = { x: evt.clientX, y: evt.clientY };
      }
    };
    const handleMouseMove = (opt) => {
      if (currentTool === 'eraser' && canvas.current.isErasing) {
        const target = opt.target;
        if (target && !target.excludeFromExport && target.type !== 'canvas') {
          if (target.data?.id) setSelectedIds((prev) => prev.filter(id => id !== target.data.id));
          canvas.current.remove(target);
          canvas.current.discardActiveObject();
          canvas.current.requestRenderAll();
          syncElements();
          safeSaveState();
        }
        return;
      }



      if (drawingShapeRef.current && drawingShapeStartRef.current && isShapeTool(currentTool)) {
        const pointer = canvas.current.getPointer(opt.e);
        updateInteractiveShape({
          shape: drawingShapeRef.current,
          type: currentTool,
          startX: drawingShapeStartRef.current.x,
          startY: drawingShapeStartRef.current.y,
          currentX: pointer.x,
          currentY: pointer.y,
        });
        canvas.current.requestRenderAll();
        return;
      }

      if (isPanning && currentTool === 'pan') {
        const evt = opt.e;
        const vpt = canvas.current.viewportTransform;
        const deltaX = (evt.clientX - lastPos.current.x) / zoom;
        const deltaY = (evt.clientY - lastPos.current.y) / zoom;
        const maxPanX = canvasSize.width * 0.5;
        const maxPanY = canvasSize.height * 0.5;
        vpt[4] = Math.max(-maxPanX, Math.min(maxPanX, vpt[4] + deltaX));
        vpt[5] = Math.max(-maxPanY, Math.min(maxPanY, vpt[5] + deltaY));
        canvas.current.requestRenderAll();
        lastPos.current = { x: evt.clientX, y: evt.clientY };
      }
    };
    const handleMouseUp = (opt) => {
      if (currentTool === 'eraser') {
        canvas.current.isErasing = false;
        return;
      }



      if (drawingShapeRef.current && drawingShapeStartRef.current && isShapeTool(currentTool)) {
        const shape = drawingShapeRef.current;
        const start = drawingShapeStartRef.current;
        const width =
          currentTool === 'line'
            ? Math.abs((shape.x2 ?? start.x) - (shape.x1 ?? start.x))
            : (shape.getScaledWidth?.() ?? shape.width ?? 0);
        const height =
          currentTool === 'line'
            ? Math.abs((shape.y2 ?? start.y) - (shape.y1 ?? start.y))
            : (shape.getScaledHeight?.() ?? shape.height ?? 0);

        drawingShapeRef.current = null;
        drawingShapeStartRef.current = null;

        if (width < 5 && height < 5) {
          canvas.current.remove(shape);
          canvas.current.requestRenderAll();
          return;
        }

        shape.set({ selectable: true, evented: true });
        
        // Handle connector target
        if (currentTool === 'line' && shape.data?.connector) {
          const pointer = canvas.current.getPointer(opt.e);
          const targetAnchor = anchorHelpersRef.current.find(h => {
            const dist = distanceBetween({ x: h.left, y: h.top }, pointer);
            return dist < 15;
          });
          
          if (targetAnchor) {
            shape.set({
              x2: targetAnchor.left,
              y2: targetAnchor.top,
              data: {
                ...shape.data,
                targetId: targetAnchor.data.ownerId,
                targetAnchor: targetAnchor.data.anchorName
              }
            });
          }
        }

        canvas.current.discardActiveObject();
        canvas.current.requestRenderAll();
        elementCounterRef.current += 1;
        setElementCounter(elementCounterRef.current);
        setSelectedIds([]);
        syncElements();
        safeSaveState();
        return;
      }

      if (isPanning) {
        setIsPanning(false);
        canvas.current.selection = !isShapeTool(currentTool);
      }
    };
    const handleMouseDblClick = (opt) => {
      const target = opt.target;
      if (!target) return;

      if (isTextObject(target)) {
          canvas.current.setActiveObject(target);
          target.enterEditing();
          target.selectAll();
          canvas.current.requestRenderAll();
          return;
      }

      // Enter pen edit mode if it's a path with point data
      if (target.data && target.data.type === 'path' && target.data.points) {
          setCurrentTool('pen');
          setEditingPathId(target.data.id);
          penTool.enterEditMode({
              ...target.data,
              id: target.data.id,
              points: target.data.points,
              closed: target.data.closed,
              stroke: target.stroke,
              strokeWidth: target.strokeWidth,
              strokeCap: target.strokeLinecap,
              strokeLinejoin: target.strokeLinejoin,
              fill: target.fill,
          });
          // Hide original path while editing (overlay shows the active state)
          target.set({
              visible: false,
              evented: false,
          });
          canvas.current.requestRenderAll();
          syncElements();
      }
    };
    const handlePathCreated = (opt) => {
      const path = opt.path;
      const id = `element-${elementCounter}`;
      path.set({
        data: { id, type: 'path' },
        name: `drawing-${elementCounter}`,
      });
      setElementCounter((prev) => prev + 1);
      syncElements();
      if (!isLoadingRef.current && currentTool === 'brush') safeSaveState();
    };

    const handleObjectAdded = (opt) => {
      if (isLoadingRef.current) return;
      if (isCreatingTextRef.current && isTextObject(opt?.target)) return;

      if (opt?.target && opt.target.data && opt.target.data.id) {
        syncElements();
        safeSaveState();
      }
    };
    const handleObjectModified = (opt) => {
      if (isLoadingRef.current) return;

      syncElements();
      safeSaveState();
    };
    const handleObjectRemoved = () => {
      if (isLoadingRef.current) return;

      syncElements();
      safeSaveState();
    };
    const handleSelection = () => {
      const activeObject = canvas.current.getActiveObject();

      const selected = canvas.current
        .getActiveObjects()
        .map((o) => (o.data ? o.data.id : null))
        .filter(Boolean);
      setSelectedIds(selected);

    };
    const handleSelectionCleared = () => {
      setSelectedIds([]);
    };

    const handleObjectMoving = (opt) => {
      if (!canvas.current) return;
      updateConnections(canvas.current, opt.target);
    };


    // Attach event listeners
    if (currentTool === 'pen') {
        canvas.current.on('mouse:down', penTool.handleMouseDown);
        canvas.current.on('mouse:move', penTool.handleMouseMove);
        canvas.current.on('mouse:up', penTool.handleMouseUp);
    } else {
        canvas.current.on('mouse:down', handleMouseDown);
        canvas.current.on('mouse:move', handleMouseMove);
        canvas.current.on('mouse:up', handleMouseUp);
    }

    canvas.current.on('mouse:dblclick', handleMouseDblClick);
    canvas.current.on('path:created', handlePathCreated);
    canvas.current.on('selection:created', handleSelection);
    canvas.current.on('selection:updated', handleSelection);
    canvas.current.on('selection:cleared', handleSelectionCleared);
    canvas.current.on('object:added', handleObjectAdded);
    canvas.current.on('object:modified', handleObjectModified);
    canvas.current.on('object:removed', handleObjectRemoved);
    canvas.current.on('object:moving', handleObjectMoving);

    // Detach on cleanup
    return () => {
      if (!canvas.current) return;
      canvas.current.off('mouse:down', handleMouseDown);
      canvas.current.off('mouse:move', handleMouseMove);
      canvas.current.off('mouse:up', handleMouseUp);
      canvas.current.off('mouse:down', penTool.handleMouseDown);
      canvas.current.off('mouse:move', penTool.handleMouseMove);
      canvas.current.off('mouse:up', penTool.handleMouseUp);
      canvas.current.off('mouse:dblclick', handleMouseDblClick);
      canvas.current.off('path:created', handlePathCreated);
      canvas.current.off('selection:created', handleSelection);
      canvas.current.off('selection:updated', handleSelection);
      canvas.current.off('selection:cleared', handleSelectionCleared);
      canvas.current.off('object:added', handleObjectAdded);
      canvas.current.off('object:modified', handleObjectModified);
      canvas.current.off('object:removed', handleObjectRemoved);
      canvas.current.off('object:moving', handleObjectMoving);
    };
  }, [
    currentTool,
    isPanning,
    penColor,
    penWidth,
    penOpacity,
    penBrushType,
    penShadowBlur,
    penShadowColor,
    penShadowOffset,
    eraserSize,
    elementCounter,
    safeSaveState,
    syncElements,
    zoom,
    canvasSize.width,
    canvasSize.height,
    isTextObject,
    textColor,
  ]);

  // Keep eraser size live
  useEffect(() => {
    if (!canvas.current) return;
    if (currentTool === 'eraser' && canvas.current.freeDrawingBrush) {
      canvas.current.freeDrawingBrush.width = eraserSize;
      canvas.current.requestRenderAll();
    }
  }, [eraserSize, currentTool]);

  // Window resize handling based on preset
  useEffect(() => {
    const handleResize = () => {
      const preset = canvasPresets[selectedPreset] || canvasPresets.Custom;
      const maxWidth = window.innerWidth * 0.7;
      const maxHeight = window.innerHeight * 0.7;
      const scale = Math.min(maxWidth / preset.width, maxHeight / preset.height, 1);
      const newSize = { width: preset.width * scale * zoom, height: preset.height * scale * zoom };
      setCanvasSize(newSize);
      if (canvas.current) {
        canvas.current.setDimensions(newSize);
        canvas.current.renderAll();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedPreset, zoom]);

  // -------------------------
  // Keyboard shortcuts
  // -------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      modifierKeysRef.current = {
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey || e.metaKey,
      };
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (currentTool === 'pen') {
          if (e.key === 'Enter') {
              if (penTool.state.activePath) {
                  handlePenPathComplete(penTool.state.activePath);
                  penTool.reset();
              }
              return;
          }
          if (e.key === 'Escape') {
              if (penTool.state.mode === 'edit' && penTool.state.activePath) {
                  handlePenPathComplete(penTool.state.activePath);
              }
              penTool.reset();
              setCurrentTool('select');
              return;
          }
          if (ctrl && e.key.toLowerCase() === 'b') {
              e.preventDefault();
              penTool.breakPathAtSelected();
              return;
          }
          if (ctrl && e.key.toLowerCase() === 'j') {
              e.preventDefault();
              penTool.joinSelectedPoints();
              return;
          }
          if (e.key === 'Delete' || e.key === 'Backspace') {
              penTool.deleteSelectedPoints();
              return;
          }
      }

      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      } else if (ctrl && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObject = canvas.current?.getActiveObject();
        if (isTextObject(activeObject) && activeObject.isEditing) {
          activeObject.exitEditing();
          canvas.current?.requestRenderAll();
          return;
        }

        if (canvas.current) {
          const selected = canvas.current.getActiveObjects();
          if (selected.length > 0) {
            selected.forEach(obj => canvas.current.remove(obj));
            canvas.current.discardActiveObject().renderAll();
            setSelectedIds([]);
            syncElements();
            safeSaveState();
          }
        }
        setShowLeftSidebar(false);
        setShowRightSidebar(false);

      } else if (e.key.toLowerCase() === 'v') {
        setCurrentTool('select');
      } else if (e.key.toLowerCase() === 'p') {
        setCurrentTool('pen');
      } else if (ctrl && e.shiftKey && (e.key === "'" || e.key === '"')) {
        e.preventDefault();
        penTool.toggleSnap();
      }
    };

    const handleKeyUp = (e) => {
      modifierKeysRef.current = {
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey || e.metaKey,
      };
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    handleUndo,
    handleRedo,
    duplicateSelected,
    deleteSelected,
    currentTool,
    selectedIds,
    isTextObject,
  ]);

  // Debounced syncElements
  useEffect(() => {
    if (canvas.current) {
      const timer = setTimeout(syncElements, 100);
      return () => clearTimeout(timer);
    }
  }, [syncElements]);

  // -------------------------
  // Render
  // -------------------------
  return (
    <SidebarProvider className="bg-background h-screen font-sans">
      <div className="flex flex-col bg-background w-full h-screen">
        <Header
          templateName={templateName}
          setTemplateName={setTemplateName}
          zoom={zoom}
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
          resetZoom={resetZoom}
          handleUndo={handleUndo}
          handleRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          exportCanvas={exportCanvas}
          setShowLeftSidebar={setShowLeftSidebar}
          setShowRightSidebar={setShowRightSidebar}
        />
        <div className="flex flex-1 overflow-hidden">
          <LeftSidebar
            currentTool={currentTool}
            setCurrentTool={setCurrentTool}
            canvas={isCanvasReady ? canvas.current : null}
            showLeftSidebar={showLeftSidebar}
            setShowLeftSidebar={setShowLeftSidebar}
            textColor={textColor}
            setTextColor={setTextColor}
            handleImageUpload={handleImageUpload}
            background={background}
            setBackground={setBackground}
            handleBgImageUpload={handleBgImageUpload}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            gridSize={gridSize}
            setGridSize={setGridSize}
            selectedPreset={selectedPreset}
            handlePresetChange={handlePresetChange}
            canvasPresets={canvasPresets}
            elements={elements}
            elementCounter={elementCounter}
            setElementCounter={setElementCounter}
            setSelectedIds={setSelectedIds}
            syncElements={syncElements}
            saveState={safeSaveState}
          />
          <SidebarInset className="min-w-0">
            <CanvasArea canvasRef={canvasRef} canvasSize={canvasSize} cursorStyle={cursorStyle}>
              {currentTool === 'pen' && (
                <PenToolOverlay
                  activePath={penTool.state.activePath}
                  previewPoint={penTool.state.previewPoint}
                  selectedPoints={penTool.state.selectedPoints}
                  hoveredPoint={penTool.state.hoveredPoint}
                  canvasSize={canvasSize}
                  zoom={zoom}
                />
              )}
            </CanvasArea>
          </SidebarInset>
          <RightSidebar
            showRightSidebar={showRightSidebar}
            setShowRightSidebar={setShowRightSidebar}
            showLayers={showLayers}
            setShowLayers={setShowLayers}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            elements={elements}
            setElements={setElements}
            selectedIds={selectedIds}
            toggleLayerVisibility={toggleLayerVisibility}
            toggleLayerLock={toggleLayerLock}
            moveLayer={moveLayer}
            getCanvasObjects={() => canvas.current?.getObjects?.() ?? []}
            deleteElement={deleteElement}
            onLayerSelect={onLayerSelect}
            selectedElement={selectedElement}
            canvas={canvas}
            handleElementChange={handleElementChange}
            saveState={safeSaveState}
            syncElements={syncElements}
            duplicateSelected={duplicateSelected}
            deleteSelected={deleteSelected}
            currentTool={currentTool}
            penColor={penColor}
            setPenColor={setPenColor}
            penWidth={penWidth}
            setPenWidth={setPenWidth}
            penBrushType={penBrushType}
            setPenBrushType={setPenBrushType}
            penOpacity={penOpacity}
            setPenOpacity={setPenOpacity}
            penShadowColor={penShadowColor}
            setPenShadowColor={setPenShadowColor}
            penShadowBlur={penShadowBlur}
            setPenShadowBlur={setPenShadowBlur}
            penShadowOffset={penShadowOffset}
            setPenShadowOffset={setPenShadowOffset}
            eraserSize={eraserSize}
            setEraserSize={setEraserSize}
            penTool={penTool}
          />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default FabricEditor;
