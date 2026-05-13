import React, { memo, useEffect, useState } from 'react';
import { useEngineContext } from '@/features/editor/engine/EngineContext';
import { useSelectedElement } from '@/features/editor/hooks/useSelectedElement';

const normalizeColorValue = (value, fallback = '#000000') =>
  typeof value === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : fallback;

/**
 * PropertiesPanel — controls for the single selected layer object.
 *
 * Pulls the selected element via the engine instead of a prop, and
 * dispatches changes through `handleElementChange` from EngineContext
 * (which routes through useElementUpdater).
 */
const PropertiesPanel = () => {
  const { engine, handleElementChange, duplicateSelected, deleteSelected } = useEngineContext();
  const selectedElement = useSelectedElement(engine);

  const isTextElement =
    selectedElement?.type === 'textbox' ||
    selectedElement?.type === 'i-text' ||
    selectedElement?.data?.type === 'text';

  if (!selectedElement) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500 text-sm">Select an element to edit properties</p>
      </div>
    );
  }

  const id = selectedElement.data?.id;
  if (!id) return null;

  return (
    <div className="space-y-4">
      <h3 className="mb-4 font-semibold text-gray-700 text-sm">Properties</h3>

      {/* Position & Size */}
      <div>
        <h4 className="mb-2 font-semibold text-muted-foreground text-xs">Position & Size</h4>
        <div className="gap-2 grid grid-cols-2">
          <div>
            <label className="block mb-1 text-gray-500 text-xs">X:</label>
            <input
              type="number"
              value={Math.round(selectedElement.left)}
              onChange={(e) => handleElementChange(id, { left: +e.target.value })}
              className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-500 text-xs">Y:</label>
            <input
              type="number"
              value={Math.round(selectedElement.top)}
              onChange={(e) => handleElementChange(id, { top: +e.target.value })}
              className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
            />
          </div>
          {!isTextElement && (
            <>
              <div>
                <label className="block mb-1 text-gray-500 text-xs">Width:</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.width * (selectedElement.scaleX || 1))}
                  onChange={(e) => handleElementChange(id, { width: +e.target.value })}
                  className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-500 text-xs">Height:</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.height * (selectedElement.scaleY || 1))}
                  onChange={(e) => handleElementChange(id, { height: +e.target.value })}
                  className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Fill Color */}
      {selectedElement.type !== 'line' && selectedElement.type !== 'image' && (
        <div>
          <label className="block mb-2 font-semibold text-muted-foreground text-xs">
            Fill Color:
          </label>
          <input
            type="color"
            value={normalizeColorValue(selectedElement.fill, '#ffffff')}
            onChange={(e) => handleElementChange(id, { fill: e.target.value })}
            className="border border-gray-300 rounded-lg w-full h-10 cursor-pointer"
          />
          <label className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              checked={selectedElement.fill === 'transparent' || !selectedElement.fill}
              onChange={(e) =>
                handleElementChange(id, {
                  fill: e.target.checked
                    ? 'transparent'
                    : normalizeColorValue(selectedElement.fill, '#ffffff'),
                })
              }
              className="w-4 h-4"
            />
            <span className="text-muted-foreground text-xs">Transparent Fill</span>
          </label>
        </div>
      )}

      {/* Radius / Gradient */}
      {selectedElement.type !== 'image' && (
        <div className="space-y-3">
          <h4 className="font-semibold text-muted-foreground text-xs">Radius & Gradient</h4>
          {selectedElement.type === 'circle' && (
            <div>
              <label className="block mb-1 text-gray-500 text-xs">
                Radius: {selectedElement.radius || Math.round((selectedElement.width || 0) / 2)}
              </label>
              <input
                type="range"
                min="1"
                max="400"
                value={selectedElement.radius || Math.round((selectedElement.width || 0) / 2)}
                onChange={(e) => handleElementChange(id, { radius: +e.target.value })}
                className="w-full"
              />
            </div>
          )}
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
                  handleElementChange(id, { rx: +e.target.value, ry: +e.target.value })
                }
                className="w-full"
              />
            </div>
          )}
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
            <label className="block mb-2 font-semibold text-muted-foreground text-xs">
              Stroke Color:
            </label>
            <input
              type="color"
              value={selectedElement.stroke || '#000000'}
              onChange={(e) => handleElementChange(id, { stroke: e.target.value })}
              className="border border-gray-300 rounded-lg w-full h-10 cursor-pointer"
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold text-muted-foreground text-xs">
              Stroke Width: {selectedElement.strokeWidth || 0}px
            </label>
            <input
              type="range"
              min="0"
              max="20"
              value={selectedElement.strokeWidth || 0}
              onChange={(e) => handleElementChange(id, { strokeWidth: +e.target.value })}
              className="w-full"
            />
          </div>
        </>
      )}

      {/* Opacity */}
      <div>
        <label className="block mb-2 font-semibold text-muted-foreground text-xs">
          Opacity: {Math.round((selectedElement.opacity || 0) * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={selectedElement.opacity || 0}
          onChange={(e) => handleElementChange(id, { opacity: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Rotation */}
      <div>
        <label className="block mb-2 font-semibold text-muted-foreground text-xs">
          Rotation: {Math.round(selectedElement.angle || 0)}°
        </label>
        <input
          type="range"
          min="0"
          max="360"
          value={selectedElement.angle || 0}
          onChange={(e) => handleElementChange(id, { angle: +e.target.value })}
          className="w-full"
        />
      </div>

      {/* Shadow */}
      <div className="space-y-3">
        <h4 className="font-semibold text-muted-foreground text-xs">Shadow</h4>
        <div>
          <label className="block mb-1 text-gray-500 text-xs">Shadow Color:</label>
          <input
            type="color"
            value={normalizeColorValue(selectedElement.shadow?.color, '#000000')}
            onChange={(e) =>
              handleElementChange(id, {
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
              handleElementChange(id, {
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
                handleElementChange(id, {
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
                handleElementChange(id, {
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
              handleElementChange(id, {
                shadow: { ...selectedElement.shadow, opacity: parseFloat(e.target.value) },
              })
            }
            className="w-full"
          />
        </div>
      </div>

      {/* Text Properties */}
      {isTextElement && (
        <TextProperties
          selectedElement={selectedElement}
          handleElementChange={handleElementChange}
        />
      )}

      {/* Polygon Sides */}
      {selectedElement.type === 'polygon' && (
        <div>
          <label className="block mb-2 font-semibold text-muted-foreground text-xs">
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
              handleElementChange(id, { points });
            }}
            className="w-full"
          />
        </div>
      )}

      {/* Frame */}
      {selectedElement.type === 'frame' && (
        <FrameProperties
          selectedElement={selectedElement}
          handleElementChange={handleElementChange}
        />
      )}

      {/* Image hint */}
      {selectedElement.type === 'image' && (
        <div className="space-y-3">
          <h4 className="font-semibold text-muted-foreground text-xs">Image Filters</h4>
          <p className="text-gray-500 text-xs">Use the Filters tab to adjust image properties</p>
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
  );
};

// -------------------------
// Text Properties sub-section
// -------------------------
const TextProperties = ({ selectedElement, handleElementChange }) => {
  const id = selectedElement.data.id;
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-muted-foreground text-xs">Text Properties</h4>
      <div>
        <label className="block mb-2 font-semibold text-muted-foreground text-xs">
          Text Content:
        </label>
        <textarea
          value={selectedElement.text || ''}
          onChange={(e) => handleElementChange(id, { text: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
          rows="3"
        />
      </div>
      <div>
        <label className="block mb-2 font-semibold text-muted-foreground text-xs">
          Font Size: {selectedElement.fontSize}px
        </label>
        <input
          type="range"
          min="8"
          max="120"
          value={selectedElement.fontSize || 24}
          onChange={(e) => handleElementChange(id, { fontSize: parseInt(e.target.value, 10) })}
          className="w-full"
        />
      </div>
      <div>
        <label className="block mb-2 font-semibold text-muted-foreground text-xs">
          Font Family:
        </label>
        <select
          value={selectedElement.fontFamily || 'Arial'}
          onChange={(e) => handleElementChange(id, { fontFamily: e.target.value })}
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
        <label className="block mb-2 font-semibold text-muted-foreground text-xs">
          Font Weight:
        </label>
        <select
          value={selectedElement.fontWeight || 'normal'}
          onChange={(e) => handleElementChange(id, { fontWeight: e.target.value })}
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
        <label className="block mb-2 font-semibold text-muted-foreground text-xs">
          Font Style:
        </label>
        <select
          value={selectedElement.fontStyle || 'normal'}
          onChange={(e) => handleElementChange(id, { fontStyle: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
        >
          <option value="normal">Normal</option>
          <option value="italic">Italic</option>
          <option value="oblique">Oblique</option>
        </select>
      </div>
      <div>
        <label className="block mb-2 font-semibold text-muted-foreground text-xs">
          Text Align:
        </label>
        <div className="gap-2 grid grid-cols-4">
          {['left', 'center', 'right', 'justify'].map((align) => (
            <button
              key={align}
              onClick={() => handleElementChange(id, { textAlign: align })}
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
        <label className="block mb-2 font-semibold text-muted-foreground text-xs">
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
                  const decoration = selectedElement.textDecoration || '';
                  let parts = decoration.split(' ').filter(Boolean);
                  if (isActive) parts = parts.filter((d) => d !== decor.value);
                  else parts.push(decor.value);
                  handleElementChange(id, { textDecoration: parts.join(' ') });
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
              handleElementChange(id, {
                wrap: e.target.checked,
                textWidth: selectedElement.width || 200,
              })
            }
            className="w-4 h-4"
          />
          <span className="font-semibold text-muted-foreground text-xs">Enable Text Wrapping</span>
        </label>
        {selectedElement.width !== undefined && (
          <div className="mt-2">
            <label className="block mb-2 font-semibold text-muted-foreground text-xs">
              Text Width: {selectedElement.width || 200}px
            </label>
            <input
              type="range"
              min="100"
              max="500"
              value={selectedElement.width || 200}
              onChange={(e) => handleElementChange(id, { textWidth: +e.target.value })}
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// -------------------------
// Frame sub-section
// -------------------------
const FrameProperties = ({ selectedElement, handleElementChange }) => {
  const id = selectedElement.data.id;
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-muted-foreground text-xs">Frame Properties</h4>
      <div>
        <label className="block mb-1 text-gray-500 text-xs">Border Color:</label>
        <input
          type="color"
          value={selectedElement.stroke || '#000000'}
          onChange={(e) => handleElementChange(id, { stroke: e.target.value })}
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
          onChange={(e) => handleElementChange(id, { strokeWidth: +e.target.value })}
          className="w-full"
        />
      </div>
      <div>
        <label className="block mb-1 text-gray-500 text-xs">
          Dash Length: {selectedElement.strokeDashArray ? selectedElement.strokeDashArray[0] : 10}
        </label>
        <input
          type="range"
          min="0"
          max="50"
          value={selectedElement.strokeDashArray ? selectedElement.strokeDashArray[0] : 10}
          onChange={(e) =>
            handleElementChange(id, {
              strokeDashArray: [
                +e.target.value,
                selectedElement.strokeDashArray ? selectedElement.strokeDashArray[1] : 5,
              ],
            })
          }
          className="w-full"
        />
      </div>
      <div>
        <label className="block mb-1 text-gray-500 text-xs">
          Dash Gap: {selectedElement.strokeDashArray ? selectedElement.strokeDashArray[1] : 5}
        </label>
        <input
          type="range"
          min="0"
          max="50"
          value={selectedElement.strokeDashArray ? selectedElement.strokeDashArray[1] : 5}
          onChange={(e) =>
            handleElementChange(id, {
              strokeDashArray: [
                selectedElement.strokeDashArray ? selectedElement.strokeDashArray[0] : 10,
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
          onChange={(e) => handleElementChange(id, { rx: +e.target.value, ry: +e.target.value })}
          className="w-full"
        />
      </div>
      <div>
        <label className="block mb-1 text-gray-500 text-xs">Fill Color:</label>
        <input
          type="color"
          value={normalizeColorValue(selectedElement.fill, '#ffffff')}
          onChange={(e) => handleElementChange(id, { fill: e.target.value })}
          className="border border-gray-300 rounded w-full h-8 cursor-pointer"
        />
        <label className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            checked={selectedElement.fill === 'transparent'}
            onChange={(e) =>
              handleElementChange(id, {
                fill: e.target.checked
                  ? 'transparent'
                  : normalizeColorValue(selectedElement.fill, '#ffffff'),
              })
            }
            className="w-4 h-4"
          />
          <span className="text-muted-foreground text-xs">Transparent Fill</span>
        </label>
      </div>
    </div>
  );
};

// -------------------------
// Gradient sub-section
// -------------------------
const GradientControls = ({ selectedElement, handleElementChange }) => {
  const id = selectedElement.data.id;
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
    const f = selectedElement.fill;
    if (f && typeof f === 'object' && f.colorStops) {
      const stops = f.colorStops;
      if (stops.length >= 2) {
        setFrom(normalizeColorValue(stops[0].color, '#ffffff'));
        setTo(normalizeColorValue(stops[stops.length - 1].color, '#8b5cf6'));
        setEnabled(true);
      }
      if (f.type) setType(f.type);
      return;
    }
    if (typeof f === 'string') {
      setFrom(normalizeColorValue(f, '#ffffff'));
      setEnabled(false);
    }
  }, [selectedElement]);

  const applyGradient = () => {
    handleElementChange(id, { fill: undefined, gradient: { type, colors: [from, to] } });
  };

  const removeGradient = () => {
    handleElementChange(id, { gradient: null, fill: from });
    setEnabled(false);
  };

  return (
    <div>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        <span className="font-semibold text-muted-foreground text-xs">Use Gradient Fill</span>
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
};

export default memo(PropertiesPanel);
