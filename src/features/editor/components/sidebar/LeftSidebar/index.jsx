import React, { useRef, useState } from 'react';
import { Square, Move, PenTool, Pencil, Eraser, Type, Image as ImageIcon } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Card, CardContent } from '@/components/ui/card';
// / Left sidebar component
// Flow: Render tool buttons, shape grid, text/image upload, canvas settings.
const LeftSidebar = ({
  currentTool,
  setCurrentTool,
  canvas,
  showLeftSidebar,
  setShowLeftSidebar,
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
  const [customWidth, setCustomWidth] = useState(canvasPresets['Custom'].width);
  const [customHeight, setCustomHeight] = useState(canvasPresets['Custom'].height);

  // Shape definitions with explicit validation
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
  ].filter((shape) => {
    if (!shape.type) {
      console.error('Invalid shape configuration:', shape);
      return false;
    }
    return true;
  });

  const handleCustomSizeSubmit = () => {
    if (customWidth >= 100 && customHeight >= 100) {
      handlePresetChange('Custom', customWidth, customHeight);
    }
  };

  // radius + gradient UI state
  const [radius, setRadius] = useState(0);
  const [gradientEnabled, setGradientEnabled] = useState(false);
  const [gradientType, setGradientType] = useState('linear');
  const [gradientFrom, setGradientFrom] = useState('#3b82f6');
  const [gradientTo, setGradientTo] = useState('#8b5cf6');

  return (
    <Sidebar side="left" mobileOpen={showLeftSidebar} className="w-64 sm:w-72 md:w-60 lg:w-72">
      <SidebarHeader>
        <div>
          <p className="text-sm font-semibold">Tools</p>
          <p className="text-xs text-muted-foreground">Add shapes, text, assets, and canvas settings</p>
        </div>
      </SidebarHeader>
      <SidebarContent className="space-y-6">
        {/* Debug Info */}
        <Card className="bg-muted/40">
          <CardContent className="space-y-1 p-3 text-xs text-muted-foreground">
            <div>Canvas: {canvas ? 'Ready' : 'Not Ready'}</div>
            <div>Elements: {elements.length}</div>
          </CardContent>
        </Card>

        {/* Tools */}
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setCurrentTool('select');
                if (canvas) canvas.isDrawingMode = false;
                setShowLeftSidebar(false);
              }}
              className={`p-3 rounded-lg border-2 transition-all ${
                currentTool === 'select'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              title="Select Tool"
            >
              <Square className="w-5 h-5 mx-auto" />
              <span className="text-xs mt-1 block">Select</span>
            </button>
            <button
              onClick={() => {
                setCurrentTool('pan');
                if (canvas) canvas.isDrawingMode = false;
                setShowLeftSidebar(false);
              }}
              className={`p-3 rounded-lg border-2 transition-all ${
                currentTool === 'pan'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              title="Pan Tool"
            >
              <Move className="w-5 h-5 mx-auto" />
              <span className="text-xs mt-1 block">Pan</span>
            </button>

            <button
              onClick={() => {
                setCurrentTool('pen');
                if (canvas) canvas.isDrawingMode = false;
                setShowLeftSidebar(false);
              }}
              className={`p-3 rounded-lg border-2 transition-all ${
                currentTool === 'pen'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              title="Pen Tool"
            >
              <PenTool className="w-5 h-5 mx-auto" />
              <span className="text-xs mt-1 block">Pen</span>
            </button>
            <button
              onClick={() => {
                setCurrentTool('brush');
                if (canvas) canvas.isDrawingMode = true;
                setShowLeftSidebar(false);
              }}
              className={`p-3 rounded-lg border-2 transition-all ${
                currentTool === 'brush'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              title="Brush Tool"
            >
              <Pencil className="w-5 h-5 mx-auto" />
              <span className="text-xs mt-1 block">Brush</span>
            </button>
            <button
              onClick={() => {
                setCurrentTool('eraser');
                if (canvas) canvas.isDrawingMode = true;
                setShowLeftSidebar(false);
              }}
              className={`p-3 rounded-lg border-2 transition-all ${
                currentTool === 'eraser'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              title="Eraser Tool"
            >
              <Eraser className="w-5 h-5 mx-auto" />
              <span className="text-xs mt-1 block">Eraser</span>
            </button>
          </div>
        </SidebarGroup>

        {/* Shapes */}
        <SidebarGroup>
          <SidebarGroupLabel>Shapes</SidebarGroupLabel>
          <div className="grid grid-cols-4 gap-2">
            {shapes.map((shape) => (
              <button
                key={shape.type}
                onClick={() => {
                  setCurrentTool(shape.type);
                  if (canvas) canvas.isDrawingMode = false;
                  setShowLeftSidebar(false);
                }}
                className={`p-3 rounded-lg border transition-all ${
                  currentTool === shape.type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                }`}
                title={shape.label}
              >
                <span className="text-2xl">{shape.icon}</span>
              </button>
            ))}
          </div>
        </SidebarGroup>

        {/* Text */}
        <SidebarGroup>
          <SidebarGroupLabel>Text</SidebarGroupLabel>
          <button
            onClick={() => {
              setCurrentTool('text');
              if (canvas) canvas.isDrawingMode = false;
              setShowLeftSidebar(false);
            }}
            className="w-full p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
          >
            <Type className="w-5 h-5" />
            Text Tool
          </button>
          <div className="mt-4">
            <label className="text-xs text-gray-600 block mb-1">Text Color:</label>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-full h-8 border border-gray-300 rounded-lg cursor-pointer"
            />
          </div>
        </SidebarGroup>

        {/* Images */}
        <SidebarGroup>
          <SidebarGroupLabel>Images</SidebarGroupLabel>
          <label className="block p-8 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
            <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">Upload Image</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                handleImageUpload(e);
                setShowLeftSidebar(false);
              }}
              className="hidden"
            />
          </label>
        </SidebarGroup>

        {/* Canvas Settings */}
        <SidebarGroup>
          <SidebarGroupLabel>Canvas</SidebarGroupLabel>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600 block mb-1">Template</label>
              <select
                value={selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded"
              >
                {Object.keys(canvasPresets).map((preset) => (
                  <option key={preset} value={preset}>
                    {preset}
                  </option>
                ))}
              </select>
            </div>
            {selectedPreset === 'Custom' && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-600 mb-2">Custom Dimensions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Width (px):</label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(parseInt(e.target.value) || '')}
                      min="100"
                      max="4000"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Width"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Height (px):</label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(parseInt(e.target.value) || '')}
                      min="100"
                      max="4000"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Height"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCustomSizeSubmit}
                  className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Custom Size
                </button>
              </div>
            )}
            <div>
              <label className="text-xs text-gray-600 block mb-1">Background Color:</label>
              <input
                type="color"
                value={background.type === 'color' ? background.value : '#ffffff'}
                onChange={(e) => setBackground({ type: 'color', value: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label className="block p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                <ImageIcon className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                <p className="text-xs text-gray-600">Upload Background Image</p>
                <input
                  ref={bgFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    handleBgImageUpload(e);
                    setShowLeftSidebar(false);
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </SidebarGroup>

        {/* Grid Settings */}
        <SidebarGroup>
          <SidebarGroupLabel>Grid</SidebarGroupLabel>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show Grid</span>
            </label>
            {showGrid && (
              <div>
                <label className="text-xs text-gray-600 block mb-1">Grid Size: {gridSize}px</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={gridSize}
                  onChange={(e) => setGridSize(+e.target.value)}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default LeftSidebar;
