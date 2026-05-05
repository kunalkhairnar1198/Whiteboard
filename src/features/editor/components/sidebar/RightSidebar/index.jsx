import React, { useState, useEffect } from 'react';
import * as fabric from 'fabric';
import { Filter } from 'lucide-react';
import ImageFilterPanel from '@/features/editor/components/filters/ImageFilterPanel';
import LayerItem from '@/features/editor/components/layer-item/LayerItem';
import { reorderLayersByIds } from '@/features/editor/lib/layerOrder';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const normalizeColorValue = (value, fallback = '#000000') =>
  typeof value === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : fallback;

const RightSidebar = ({
  showRightSidebar,
  setShowRightSidebar,
  showLayers,
  setShowLayers,
  showFilters,
  setShowFilters,
  elements,
  selectedIds,
  toggleLayerVisibility,
  toggleLayerLock,
  moveLayer,
  getCanvasObjects,
  deleteElement,
  onLayerSelect,
  setElements,
  selectedElement,
  canvas,
  handleElementChange,
  saveState,
  syncElements,
  duplicateSelected,
  deleteSelected,
  currentTool,
  penColor,
  setPenColor,
  penWidth,
  setPenWidth,
  penBrushType,
  setPenBrushType,
  penOpacity,
  setPenOpacity,
  penShadowColor,
  setPenShadowColor,
  penShadowBlur,
  setPenShadowBlur,
  penShadowOffset,
  setPenShadowOffset,
  eraserSize,
  setEraserSize,
  penTool,
}) => {
  const isTextElement =
    selectedElement?.type === 'textbox' ||
    selectedElement?.type === 'i-text' ||
    selectedElement?.data?.type === 'text';

  // Setup sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require 5px movement to start drag
      },
    }),
    useSensor(KeyboardSensor),
  );

  // Handle drag end event
  const onDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const sourceIndex = elements.findIndex((el) => el.id === active.id);
    const destinationIndex = elements.findIndex((el) => el.id === over.id);

    if (sourceIndex === -1 || destinationIndex === -1) {
      console.error('Invalid source or destination index', { sourceIndex, destinationIndex });
      return;
    }

    // Reorder elements array (reverse order to match display)
    const reversedElements = [...elements].reverse();
    const sourceIdx = elements.length - 1 - sourceIndex;
    const destinationIdx = elements.length - 1 - destinationIndex;
    const [movedElement] = reversedElements.splice(sourceIdx, 1);
    reversedElements.splice(destinationIdx, 0, movedElement);

    // Update elements state with corrected order
    const newElements = reversedElements.reverse();
    setElements(newElements);

    // Sync canvas object order
    if (!canvas.current) {
      console.warn('Canvas is not initialized, skipping canvas sync');
      return;
    }

    try {
      const canvasObjects = getCanvasObjects();
      const orderedLayerIds = newElements.map((el) => el.id);
      canvas.current._objects = reorderLayersByIds(canvasObjects, orderedLayerIds);
      canvas.current.renderAll();
      syncElements();
      saveState(canvas.current.toJSON());
    } catch (error) {
      console.error('Error syncing canvas:', error);
    }
  };

  // Create reversed IDs for SortableContext to match display order
  const sortedIds = elements
    .slice()
    .reverse()
    .map((el) => el.id);

  // Stable handler for ImageFilterPanel to avoid recreating the inline function each render
  const handleFilterChange = React.useCallback(() => {
    if (canvas.current) {
      saveState(canvas.current.toJSON());
      syncElements();
    } else {
      console.warn('Canvas is not initialized, skipping filter save');
    }
  }, [canvas, saveState, syncElements]);

  return (
    <Sidebar side="right" mobileOpen={showRightSidebar} className="w-64 sm:w-80 md:w-72 lg:w-80">
      <SidebarHeader>
        <div className="flex justify-between items-center">
          <div>
            <p className="font-semibold text-sm">Inspector</p>
            <p className="text-muted-foreground text-xs">Properties, layers, and filters</p>
          </div>
        </div>
        <div className="flex">
          <Button
            onClick={() => {
              setShowLayers(false);
              setShowFilters(false);
            }}
            variant="ghost"
            className={`h-auto flex-1 rounded-none px-4 py-3 text-sm font-medium ${
              !showLayers && !showFilters
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground'
            }`}
          >
            Properties
          </Button>
          <Button
            onClick={() => {
              setShowLayers(true);
              setShowFilters(false);
            }}
            variant="ghost"
            className={`h-auto flex-1 rounded-none px-4 py-3 text-sm font-medium ${
              showLayers && !showFilters
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground'
            }`}
          >
            Layers
          </Button>
          {selectedElement?.type === 'image' && (
            <Button
              onClick={() => {
                setShowLayers(false);
                setShowFilters(true);
              }}
              variant="ghost"
              className={`h-auto flex-1 rounded-none px-4 py-3 text-sm font-medium ${
                showFilters
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <Filter className="inline mr-1 w-4 h-4" />
              Filters
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {showFilters && selectedElement?.type === 'image' ? (
          <ImageFilterPanel
            canvas={canvas}
            selectedElement={selectedElement}
            onFilterChange={handleFilterChange}
          />
        ) : showLayers ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-700 text-sm">
                    Layers ({elements.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {elements
                    .slice()
                    .reverse()
                    .map((element) => (
                      <LayerItem
                        key={element.id}
                        element={element}
                        selectedIds={selectedIds}
                        toggleLayerVisibility={toggleLayerVisibility}
                        toggleLayerLock={toggleLayerLock}
                        moveLayer={moveLayer}
                        deleteElement={deleteElement}
                        onSelect={() => onLayerSelect(element.id)}
                        onRename={(id, newName) => {
                          try {
                            // Use provided handler to update canvas object name and sync
                            handleElementChange(id, { name: newName });
                          } catch (err) {
                            console.error('Error renaming layer:', err);
                          }
                        }}
                      />
                    ))}
                  {elements.length === 0 && (
                    <div className="py-8 text-gray-500 text-center">
                      <p className="text-sm">No layers yet</p>
                      <p className="text-xs">Add shapes, text, or images to get started</p>
                    </div>
                  )}
                </div>
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div>
            <h3 className="mb-4 font-semibold text-gray-700 text-sm">Properties</h3>
            {selectedIds.length === 0 ? (
              currentTool === 'brush' ? (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-600 text-xs">
                    Brush
                  </h4>
                  {currentTool === 'brush' && (
                    <div>
                      <label className="block mb-1 text-gray-500 text-xs">Brush Type</label>
                      <select
                        value={penBrushType}
                        onChange={(e) => setPenBrushType(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg w-full text-sm"
                      >
                        <option value="Pencil">Pencil</option>
                        <option value="Circle">Circle</option>
                        <option value="Spray">Spray</option>
                        <option value="Pattern">Pattern</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block mb-1 text-gray-500 text-xs">Line Color</label>
                    <input
                      type="color"
                      value={penColor}
                      onChange={(e) => setPenColor(e.target.value)}
                      className="border border-gray-300 rounded-lg w-full h-10 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-gray-500 text-xs">Width: {penWidth}px</label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={penWidth}
                      onChange={(e) => setPenWidth(+e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-gray-500 text-xs">
                      Opacity: {Math.round(penOpacity * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={penOpacity}
                      onChange={(e) => setPenOpacity(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-semibold text-gray-600 text-xs">Shadow</h5>
                    <div>
                      <label className="block mb-1 text-gray-500 text-xs">Shadow Color</label>
                      <input
                        type="color"
                        value={penShadowColor}
                        onChange={(e) => setPenShadowColor(e.target.value)}
                        className="border border-gray-300 rounded-lg w-full h-10 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-gray-500 text-xs">
                        Blur: {penShadowBlur}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={penShadowBlur}
                        onChange={(e) => setPenShadowBlur(+e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-gray-500 text-xs">
                        Offset: {penShadowOffset}px
                      </label>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={penShadowOffset}
                        onChange={(e) => setPenShadowOffset(+e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="pt-2">
                    <p className="text-gray-500 text-xs">
                      Tip: changes apply immediately while in drawing mode.
                    </p>
                  </div>
                </div>
              ) : currentTool === 'eraser' ? (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-600 text-xs">Eraser</h4>
                  <div>
                    <label className="block mb-1 text-gray-500 text-xs">Size: {eraserSize}px</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEraserSize(Math.max(1, eraserSize - 1))}
                        className="bg-gray-100 px-2 py-1 border rounded"
                        type="button"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="1"
                        max="200"
                        value={eraserSize}
                        onChange={(e) => setEraserSize(+e.target.value)}
                        className="flex-1"
                      />
                      <button
                        onClick={() => setEraserSize(Math.min(200, eraserSize + 1))}
                        className="bg-gray-100 px-2 py-1 border rounded"
                        type="button"
                      >
                        +
                      </button>
                    </div>
                    <p className="pt-1 text-gray-500 text-xs">
                      Use the buttons or slider to change eraser size.
                    </p>
                  </div>
                </div>
              ) : currentTool === 'pen' ? (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-600 text-xs">Pen Tool</h4>
                  <div>
                    <label className="block mb-1 text-gray-500 text-xs">Stroke Color</label>
                    <input
                      type="color"
                      value={penColor}
                      onChange={(e) => setPenColor(e.target.value)}
                      className="border border-gray-300 rounded-lg w-full h-10 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-gray-500 text-xs">Width: {penWidth}px</label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={penWidth}
                      onChange={(e) => setPenWidth(+e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="pt-2">
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={penTool.state.snapEnabled}
                        onChange={() => penTool.toggleSnap()}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-600 text-xs">Snap to Grid</span>
                    </label>
                    <p className="text-gray-500 text-xs">
                      Double-click any path to enter node edit mode.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-gray-500 text-sm">Select an element to edit properties</p>
                </div>
              )
            ) : (
              selectedElement && (
                <div className="space-y-4">

                  {/* Position & Size */}
                  <div>
                    <h4 className="mb-2 font-semibold text-gray-600 text-xs">Position & Size</h4>
                    <div className="gap-2 grid grid-cols-2">
                      <div>
                        <label className="block mb-1 text-gray-500 text-xs">X:</label>
                        <input
                          type="number"
                          value={Math.round(selectedElement.left)}
                          onChange={(e) =>
                            handleElementChange(selectedElement.data.id, { left: +e.target.value })
                          }
                          className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-gray-500 text-xs">Y:</label>
                        <input
                          type="number"
                          value={Math.round(selectedElement.top)}
                          onChange={(e) =>
                            handleElementChange(selectedElement.data.id, { top: +e.target.value })
                          }
                          className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
                        />
                      </div>
                      {!isTextElement && (
                        <>
                          <div>
                            <label className="block mb-1 text-gray-500 text-xs">Width:</label>
                            <input
                              type="number"
                              value={Math.round(
                                selectedElement.width * (selectedElement.scaleX || 1),
                              )}
                              onChange={(e) =>
                                handleElementChange(selectedElement.data.id, {
                                  width: +e.target.value,
                                })
                              }
                              className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-gray-500 text-xs">Height:</label>
                            <input
                              type="number"
                              value={Math.round(
                                selectedElement.height * (selectedElement.scaleY || 1),
                              )}
                              onChange={(e) =>
                                handleElementChange(selectedElement.data.id, {
                                  height: +e.target.value,
                                })
                              }
                              className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Fill Color */}
                  {(selectedElement.type !== 'line' &&
                    selectedElement.type !== 'image') && (
                      <div>
                        <label className="block mb-2 font-semibold text-gray-600 text-xs">
                          Fill Color:
                        </label>
                        <input
                          type="color"
                          value={normalizeColorValue(selectedElement.fill, '#ffffff')}
                          onChange={(e) =>
                            handleElementChange(selectedElement.data.id, { fill: e.target.value })
                          }
                          className="border border-gray-300 rounded-lg w-full h-10 cursor-pointer"
                        />
                        <label className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            checked={selectedElement.fill === 'transparent' || !selectedElement.fill}
                            onChange={(e) =>
                              handleElementChange(selectedElement.data.id, {
                                fill: e.target.checked
                                  ? 'transparent'
                                  : normalizeColorValue(selectedElement.fill, '#ffffff'),
                              })
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-gray-600 text-xs">Transparent Fill</span>
                        </label>
                      </div>
                    )}

                  {/* Radius / Corner Radius + Gradient */}
                  {selectedElement && selectedElement.type !== 'image' && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-600 text-xs">Radius & Gradient</h4>
                      {/* Circle radius */}
                      {selectedElement.type === 'circle' && (
                        <div>
                          <label className="block mb-1 text-gray-500 text-xs">
                            Radius:{' '}
                            {selectedElement.radius || Math.round((selectedElement.width || 0) / 2)}
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="400"
                            value={
                              selectedElement.radius || Math.round((selectedElement.width || 0) / 2)
                            }
                            onChange={(e) =>
                              handleElementChange(selectedElement.data.id, {
                                radius: +e.target.value,
                              })
                            }
                            className="w-full"
                          />
                        </div>
                      )}

                      {/* Rect corner radius (rx/ry) */}
                      {selectedElement.type === 'rect' && (
                        <div>
                          <label className="block mb-1 text-gray-500 text-xs">
                            Corner Radius: {selectedElement.rx || 0}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="200"
                            value={selectedElement.rx || 0}
                            onChange={(e) =>
                              handleElementChange(selectedElement.data.id, {
                                rx: +e.target.value,
                                ry: +e.target.value,
                              })
                            }
                            className="w-full"
                          />
                        </div>
                      )}

                      {/* Gradient */}
                      <GradientControls
                        selectedElement={selectedElement}
                        handleElementChange={handleElementChange}
                      />
                    </div>
                  )}

                  {/* Stroke */}
                  {!isTextElement && (
                    <>
                      <div>
                        <label className="block mb-2 font-semibold text-gray-600 text-xs">
                          Stroke Color:
                        </label>
                        <input
                          type="color"
                          value={selectedElement.stroke || '#000000'}
                          onChange={(e) =>
                            handleElementChange(selectedElement.data.id, { stroke: e.target.value })
                          }
                          className="border border-gray-300 rounded-lg w-full h-10 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-semibold text-gray-600 text-xs">
                          Stroke Width: {selectedElement.strokeWidth || 0}px
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={selectedElement.strokeWidth || 0}
                          onChange={(e) =>
                            handleElementChange(selectedElement.data.id, {
                              strokeWidth: +e.target.value,
                            })
                          }
                          className="w-full"
                        />
                      </div>
                    </>
                  )}

                  {/* Opacity */}
                  <div>
                    <label className="block mb-2 font-semibold text-gray-600 text-xs">
                      Opacity: {Math.round((selectedElement.opacity || 0) * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={selectedElement.opacity || 0}
                      onChange={(e) =>
                        handleElementChange(selectedElement.data.id, {
                          opacity: parseFloat(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Rotation */}
                  <div>
                    <label className="block mb-2 font-semibold text-gray-600 text-xs">
                      Rotation: {Math.round(selectedElement.angle || 0)}°
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={selectedElement.angle || 0}
                      onChange={(e) =>
                        handleElementChange(selectedElement.data.id, { angle: +e.target.value })
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Shadow */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-600 text-xs">Shadow</h4>
                    <div>
                      <label className="block mb-1 text-gray-500 text-xs">Shadow Color:</label>
                        <input
                          type="color"
                          value={normalizeColorValue(selectedElement.shadow?.color, '#000000')}
                          onChange={(e) =>
                            handleElementChange(selectedElement.data.id, {
                              shadow: { ...selectedElement.shadow, color: e.target.value },
                          })
                        }
                        className="border border-gray-300 rounded w-full h-8 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-gray-500 text-xs">
                        Blur: {selectedElement.shadow?.blur || 0}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={selectedElement.shadow?.blur || 0}
                        onChange={(e) =>
                          handleElementChange(selectedElement.data.id, {
                            shadow: { ...selectedElement.shadow, blur: +e.target.value },
                          })
                        }
                        className="w-full"
                      />
                    </div>
                    <div className="gap-2 grid grid-cols-2">
                      <div>
                        <label className="block mb-1 text-gray-500 text-xs">
                          Offset X: {selectedElement.shadow?.offsetX || 0}
                        </label>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          value={selectedElement.shadow?.offsetX || 0}
                          onChange={(e) =>
                            handleElementChange(selectedElement.data.id, {
                              shadow: { ...selectedElement.shadow, offsetX: +e.target.value },
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-gray-500 text-xs">
                          Offset Y: {selectedElement.shadow?.offsetY || 0}
                        </label>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          value={selectedElement.shadow?.offsetY || 0}
                          onChange={(e) =>
                            handleElementChange(selectedElement.data.id, {
                              shadow: { ...selectedElement.shadow, offsetY: +e.target.value },
                            })
                          }
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block mb-1 text-gray-500 text-xs">
                        Opacity: {Math.round((selectedElement.shadow?.opacity || 1) * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={selectedElement.shadow?.opacity || 1}
                        onChange={(e) =>
                          handleElementChange(selectedElement.data.id, {
                            shadow: {
                              ...selectedElement.shadow,
                              opacity: parseFloat(e.target.value),
                            },
                          })
                        }
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Text Properties */}
                  {isTextElement && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-600 text-xs">Text Properties</h4>
                      <div>
                        <label className="block mb-2 font-semibold text-gray-600 text-xs">
                          Text Content:
                        </label>
                        <textarea
                          value={selectedElement.text || ''}
                          onChange={(e) =>
                            handleElementChange(selectedElement.data.id, { text: e.target.value })
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
                          rows="3"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-semibold text-gray-600 text-xs">
                          Font Size: {selectedElement.fontSize}px
                        </label>
                        <input
                          type="range"
                          min="8"
                          max="120"
                          value={selectedElement.fontSize || 24}
                          onChange={(e) =>
                            handleElementChange(selectedElement.data.id, {
                              fontSize: parseInt(e.target.value),
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 font-semibold text-gray-600 text-xs">
                          Font Family:
                        </label>
                        <select
                          value={selectedElement.fontFamily || 'Arial'}
                          onChange={(e) =>
                            handleElementChange(selectedElement.data.id, {
                              fontFamily: e.target.value,
                            })
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
                        >
                          <option value="Arial">Arial</option>
                          <option value="Helvetica">Helvetica</option>
                          <option value="Times New Roman">Times New Roman</option>
                          <option value="Georgia">Georgia</option>
                          <option value="Courier New">Courier New</option>
                          <option value="Verdana">Verdana</option>
                          <option value="Impact">Impact</option>
                          <option value="Comic Sans MS">Comic Sans MS</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-2 font-semibold text-gray-600 text-xs">
                          Font Weight:
                        </label>
                        <select
                          value={selectedElement.fontWeight || 'normal'}
                          onChange={(e) =>
                            handleElementChange(selectedElement.data.id, {
                              fontWeight: e.target.value,
                            })
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
                        >
                          <option value="100">100 (Thin)</option>
                          <option value="200">200 (Extra Light)</option>
                          <option value="300">300 (Light)</option>
                          <option value="normal">400 (Normal)</option>
                          <option value="500">500 (Medium)</option>
                          <option value="600">600 (Semi Bold)</option>
                          <option value="bold">700 (Bold)</option>
                          <option value="800">800 (Extra Bold)</option>
                          <option value="900">900 (Black)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-2 font-semibold text-gray-600 text-xs">
                          Font Style:
                        </label>
                        <select
                          value={selectedElement.fontStyle || 'normal'}
                          onChange={(e) =>
                            handleElementChange(selectedElement.data.id, {
                              fontStyle: e.target.value,
                            })
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
                        >
                          <option value="normal">Normal</option>
                          <option value="italic">Italic</option>
                          <option value="oblique">Oblique</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-2 font-semibold text-gray-600 text-xs">
                          Text Align:
                        </label>
                        <div className="gap-2 grid grid-cols-4">
                          {['left', 'center', 'right', 'justify'].map((align) => (
                            <button
                              key={align}
                              onClick={() =>
                                handleElementChange(selectedElement.data.id, { textAlign: align })
                              }
                              className={`px-3 py-2 text-xs rounded-lg border-2 transition-all ${
                                selectedElement.textAlign === align
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              {align}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block mb-2 font-semibold text-gray-600 text-xs">
                          Text Decoration:
                        </label>
                        <div className="gap-2 grid grid-cols-4">
                          {[
                            { value: 'underline', label: 'U' },
                            { value: 'line-through', label: 'S' },
                            { value: 'overline', label: 'O' },
                          ].map((decor) => {
                            const isActive = selectedElement.textDecoration?.includes(decor.value);
                            return (
                              <button
                                key={decor.value}
                                onClick={() => {
                                  let newDecoration = selectedElement.textDecoration || '';
                                  let decorations = newDecoration.split(' ').filter(Boolean);
                                  if (isActive) {
                                    decorations = decorations.filter((d) => d !== decor.value);
                                  } else {
                                    decorations.push(decor.value);
                                  }
                                  newDecoration = decorations.join(' ');
                                  handleElementChange(selectedElement.data.id, {
                                    textDecoration: newDecoration,
                                  });
                                }}
                                className={`px-3 py-2 font-bold rounded-lg border-2 transition-all ${
                                  isActive
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                              >
                                {decor.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedElement.width !== undefined}
                            onChange={(e) =>
                              handleElementChange(selectedElement.data.id, {
                                wrap: e.target.checked,
                                textWidth: selectedElement.width || 200,
                              })
                            }
                            className="w-4 h-4"
                          />
                          <span className="font-semibold text-gray-600 text-xs">
                            Enable Text Wrapping
                          </span>
                        </label>
                        {selectedElement.width !== undefined && (
                          <div className="mt-2">
                            <label className="block mb-2 font-semibold text-gray-600 text-xs">
                              Text Width: {selectedElement.width || 200}px
                            </label>
                            <input
                              type="range"
                              min="100"
                              max="500"
                              value={selectedElement.width || 200}
                              onChange={(e) =>
                                handleElementChange(selectedElement.data.id, {
                                  textWidth: +e.target.value,
                                })
                              }
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Polygon Sides */}
                  {selectedElement.type === 'polygon' && (
                    <div>
                      <label className="block mb-2 font-semibold text-gray-600 text-xs">
                        Sides: {selectedElement.points?.length || 6}
                      </label>
                      <input
                        type="range"
                        min="3"
                        max="12"
                        value={selectedElement.points?.length || 6}
                        onChange={(e) => {
                          const sides = +e.target.value;
                          const points = Array.from({ length: sides }, (_, i) => {
                            const angle = (i * 2 * Math.PI) / sides;
                            return { x: 60 * Math.cos(angle), y: 60 * Math.sin(angle) };
                          });
                          handleElementChange(selectedElement.data.id, { points });
                        }}
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* Frame Customization */}
                  {selectedElement.type === 'frame' && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-600 text-xs">Frame Properties</h4>
                      <div>
                        <label className="block mb-1 text-gray-500 text-xs">Border Color:</label>
                        <input
                          type="color"
                          value={selectedElement.stroke || '#000000'}
                          onChange={(e) =>
                            handleElementChange(selectedElement.data.id, { stroke: e.target.value })
                          }
                          className="border border-gray-300 rounded w-full h-8 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-gray-500 text-xs">
                          Border Width: {selectedElement.strokeWidth || 4}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          value={selectedElement.strokeWidth || 4}
                          onChange={(e) =>
                            handleElementChange(selectedElement.data.id, {
                              strokeWidth: +e.target.value,
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-gray-500 text-xs">
                          Dash Length:{' '}
                          {selectedElement.strokeDashArray
                            ? selectedElement.strokeDashArray[0]
                            : 10}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={
                            selectedElement.strokeDashArray
                              ? selectedElement.strokeDashArray[0]
                              : 10
                          }
                          onChange={(e) =>
                            handleElementChange(selectedElement.data.id, {
                              strokeDashArray: [
                                +e.target.value,
                                selectedElement.strokeDashArray
                                  ? selectedElement.strokeDashArray[1]
                                  : 5,
                              ],
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-gray-500 text-xs">
                          Dash Gap:{' '}
                          {selectedElement.strokeDashArray ? selectedElement.strokeDashArray[1] : 5}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={
                            selectedElement.strokeDashArray ? selectedElement.strokeDashArray[1] : 5
                          }
                          onChange={(e) =>
                            handleElementChange(selectedElement.data.id, {
                              strokeDashArray: [
                                selectedElement.strokeDashArray
                                  ? selectedElement.strokeDashArray[0]
                                  : 10,
                                +e.target.value,
                              ],
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-gray-500 text-xs">
                          Corner Radius: {selectedElement.rx || 0}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={selectedElement.rx || 0}
                          onChange={(e) =>
                            handleElementChange(selectedElement.data.id, {
                              rx: +e.target.value,
                              ry: +e.target.value,
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-gray-500 text-xs">Fill Color:</label>
                        <input
                          type="color"
                          value={normalizeColorValue(selectedElement.fill, '#ffffff')}
                          onChange={(e) =>
                            handleElementChange(selectedElement.data.id, { fill: e.target.value })
                          }
                          className="border border-gray-300 rounded w-full h-8 cursor-pointer"
                        />
                        <label className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            checked={selectedElement.fill === 'transparent'}
                            onChange={(e) =>
                              handleElementChange(selectedElement.data.id, {
                                fill: e.target.checked
                                  ? 'transparent'
                                  : normalizeColorValue(selectedElement.fill, '#ffffff'),
                              })
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-gray-600 text-xs">Transparent Fill</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Image Filters Placeholder */}
                  {selectedElement.type === 'image' && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-600 text-xs">Image Filters</h4>
                      <p className="text-gray-500 text-xs">
                        Use the Filters tab to adjust image properties
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2 pt-4 border-gray-200 border-t">
                    <button
                      onClick={duplicateSelected}
                      className="flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg w-full text-white transition-colors"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={deleteSelected}
                      className="flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg w-full text-white transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default RightSidebar;

// GradientControls: small inline component to manage from/to colors and type
function GradientControls({ selectedElement, handleElementChange }) {
  const initialFrom =
    selectedElement && selectedElement.fill && typeof selectedElement.fill === 'string'
      ? normalizeColorValue(selectedElement.fill, '#ffffff')
      : '#ffffff';
  const [enabled, setEnabled] = useState(
    selectedElement && selectedElement.fill && typeof selectedElement.fill !== 'string',
  );
  const [from, setFrom] = useState(initialFrom || '#3b82f6');
  const [to, setTo] = useState('#8b5cf6');
  const [type, setType] = useState('linear');

  useEffect(() => {
    // if fill is a fabric.Gradient-like object (serialized), try to pull colors
    const f = selectedElement.fill;
    if (f && typeof f === 'object' && f.colorStops) {
      const stops = f.colorStops;
      if (stops.length >= 2) {
        setFrom(normalizeColorValue(stops[0].color, '#ffffff'));
        setTo(normalizeColorValue(stops[stops.length - 1].color, '#8b5cf6'));
        setEnabled(true);
      }
      if (f.type) {
        setType(f.type);
      }
      return;
    }

    if (typeof f === 'string') {
      setFrom(normalizeColorValue(f, '#ffffff'));
      setEnabled(false);
    }
  }, [selectedElement]);

  const applyGradient = () => {
    // send a simple gradient descriptor to handleElementChange. canvasUtils will construct the Gradient.
    handleElementChange(selectedElement.data.id, {
      fill: undefined,
      gradient: { type, colors: [from, to] },
    });
  };

  const removeGradient = () => {
    handleElementChange(selectedElement.data.id, { gradient: null, fill: from });
    setEnabled(false);
  };

  return (
    <div>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        <span className="font-semibold text-gray-600 text-xs">Use Gradient Fill</span>
      </label>
      {enabled && (
        <div className="gap-2 grid grid-cols-2 mt-2">
          <div>
            <label className="block mb-1 text-gray-500 text-xs">From</label>
            <input
              type="color"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full h-8"
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-500 text-xs">To</label>
            <input
              type="color"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full h-8"
            />
          </div>
          <div className="col-span-2">
            <label className="block mb-1 text-gray-500 text-xs">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded w-full"
            >
              <option value="linear">Linear</option>
              <option value="radial">Radial</option>
            </select>
          </div>
          <div className="flex gap-2 col-span-2 mt-2">
            <button
              onClick={applyGradient}
              className="flex-1 bg-blue-600 px-3 py-2 rounded text-white"
            >
              Apply
            </button>
            <button onClick={removeGradient} className="flex-1 bg-gray-100 px-3 py-2 rounded">
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
