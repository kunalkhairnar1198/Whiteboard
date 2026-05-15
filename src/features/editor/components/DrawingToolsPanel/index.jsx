import React, { useRef, useState } from 'react';
import { Eraser, Image as ImageIcon, Move, Square, Type } from 'lucide-react';

import { addShape } from '@/features/editor/lib/canvasUtils';

const DrawingToolsPanel = ({
  canvas,
  currentTool,
  setCurrentTool,
  textColor,
  setTextColor,
  handleImageUpload,
  background,
  setBackground,
  handleBgImageUpload,
  showGrid,
  setShowGrid,
  gridSize,
  setGridSize,
  selectedPreset,
  handlePresetChange,
  canvasPresets,
  elements,
  elementCounter,
  setElementCounter,
  setSelectedIds,
  syncElements,
  saveState,
}) => {
  const fileInputRef = useRef();
  const bgFileInputRef = useRef();

  const handleAddShape = (type) => {
    if (!type || !canvas) return;
    const customProps = {};
    if (radius && radius > 0) customProps.radius = radius;
    if (gradientEnabled) {
      customProps.gradient = { type: gradientType, colors: [gradientFrom, gradientTo] };
    }

    addShape(
      canvas,
      type,
      customProps,
      elementCounter,
      textColor,
      setElementCounter,
      setSelectedIds,
      syncElements,
      saveState,
    );
  };

  const [radius, setRadius] = useState(0);
  const [gradientEnabled, setGradientEnabled] = useState(false);
  const [gradientType, setGradientType] = useState('linear');
  const [gradientFrom, setGradientFrom] = useState('#3b82f6');
  const [gradientTo, setGradientTo] = useState('#8b5cf6');

  const shapes = [
    { type: 'rectangle', label: 'Rect', icon: '▭' },
    { type: 'circle', label: 'Circle', icon: '●' },
    { type: 'triangle', label: 'Triangle', icon: '▲' },
    { type: 'star', label: 'Star', icon: '★' },
    { type: 'arrow', label: 'Arrow', icon: '→' },
    { type: 'line', label: 'Line', icon: '/' },
    { type: 'polygon', label: 'Hex', icon: '⬡' },
    { type: 'frame', label: 'Frame', icon: '🖼' },
    { type: 'text', label: 'Text', icon: 'T' },
  ];

  return (
    <div className="space-y-6">
      {/* Tools */}
      <div>
        <h3 className="mb-3 font-semibold text-gray-700 text-sm">Tools</h3>
        <div className="gap-2 grid grid-cols-2">
          {[
            { tool: 'select', icon: <Square />, label: 'Select' },
            { tool: 'pan', icon: <Move />, label: 'Pan' },
            { tool: 'eraser', icon: <Eraser />, label: 'Eraser' },
          ].map((t) => (
            <button
              key={t.tool}
              onClick={() => {
                setCurrentTool(t.tool);
                if (canvas) canvas.isDrawingMode = t.tool === 'eraser';
              }}
              className={`p-3 rounded-lg border-2 transition-all ${
                currentTool === t.tool
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              title={t.label}
            >
              {React.cloneElement(t.icon, { className: 'w-5 h-5 mx-auto' })}
              <span className="block mt-1 text-xs">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Shapes */}
      <div>
        <h3 className="mb-3 font-semibold text-gray-700 text-sm">Shapes</h3>
        <div className="gap-2 grid grid-cols-4">
          {shapes.map((shape) => (
            <button
              key={shape.type}
              onClick={() => handleAddShape(shape.type)}
              className="hover:bg-blue-50 p-3 border border-gray-200 hover:border-blue-400 rounded-lg transition-all"
              title={shape.label}
            >
              <span className="text-2xl">{shape.icon}</span>
            </button>
          ))}
        </div>
        <div className="space-y-2 mt-3">
          <label className="block text-gray-600 text-xs">Corner/Radius</label>
          <input
            type="range"
            min="0"
            max="200"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between items-center text-gray-500 text-xs">
            <span>Radius: {radius}px</span>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={gradientEnabled}
                onChange={(e) => setGradientEnabled(e.target.checked)}
              />
              <span>Gradient</span>
            </label>
          </div>
          {gradientEnabled && (
            <div className="gap-2 grid grid-cols-2">
              <div>
                <label className="block mb-1 text-gray-600 text-xs">From</label>
                <input
                  type="color"
                  value={gradientFrom}
                  onChange={(e) => setGradientFrom(e.target.value)}
                  className="w-full h-8"
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-600 text-xs">To</label>
                <input
                  type="color"
                  value={gradientTo}
                  onChange={(e) => setGradientTo(e.target.value)}
                  className="w-full h-8"
                />
              </div>
              <div className="col-span-2">
                <label className="block mb-1 text-gray-600 text-xs">Type</label>
                <select
                  value={gradientType}
                  onChange={(e) => setGradientType(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded w-full"
                >
                  x<option value="linear">Linear</option>
                  <option value="radial">Radial</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Text */}
      <div>
        <h3 className="mb-3 font-semibold text-gray-700 text-sm">Text</h3>
        <button
          onClick={() => handleAddShape('text')}
          className="flex justify-center items-center gap-2 bg-gradient-to-r from-purple-500 hover:from-purple-600 to-pink-500 hover:to-pink-600 p-3 rounded-lg w-full text-white transition-all"
        >
          <Type className="w-5 h-5" />
          Add Text
        </button>
        <div className="mt-4">
          <label className="block mb-1 text-gray-600 text-xs">Text Color:</label>
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="border border-gray-300 rounded-lg w-full h-8 cursor-pointer"
          />
        </div>
      </div>

      {/* Images */}
      <div>
        <h3 className="mb-3 font-semibold text-gray-700 text-sm">Images</h3>
        <label className="block hover:bg-blue-50 p-8 border-2 border-gray-300 hover:border-blue-400 border-dashed rounded-lg text-center transition-all cursor-pointer">
          <ImageIcon className="mx-auto mb-2 w-8 h-8 text-gray-400" />
          <p className="text-gray-600 text-sm">Upload Image</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              console.log('File selected:', e.target.files);
              if (!canvas) {
                console.error('Canvas is not initialized');
                return;
              }
              handleImageUpload(e);
            }}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
};

export default DrawingToolsPanel;
