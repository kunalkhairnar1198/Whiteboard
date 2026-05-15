/**
 * Example Whiteboard Page
 * Demonstrates integration of the Figma-like Pen Tool
 */

import React, { useRef, useState } from 'react';

import Whiteboard from '@/features/whiteboard/Whiteboard';

export default function WhiteboardExample() {
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [bgColor, setBgColor] = useState('#ffffff');
  const [tool, setTool] = useState('pen');
  const containerRef = useRef(null);
  const whiteboardRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const handleResize = (e) => {
    const target = e.target;
    const dimension = target.name;
    setCanvasSize((prev) => ({
      ...prev,
      [dimension]: parseInt(target.value, 10),
    }));
  };

  const handleUndo = () => {
    if (whiteboardRef.current?.undo) {
      whiteboardRef.current.undo();
      setTimeout(updateUndoRedoState, 10);
    }
  };

  const handleRedo = () => {
    if (whiteboardRef.current?.redo) {
      whiteboardRef.current.redo();
      setTimeout(updateUndoRedoState, 10);
    }
  };

  const updateUndoRedoState = () => {
    if (whiteboardRef.current) {
      setCanUndo(whiteboardRef.current.canUndo || false);
      setCanRedo(whiteboardRef.current.canRedo || false);
    }
  };

  return (
    <div className="flex bg-gray-100 h-screen">
      {/* Left Toolbar */}
      <div className="bg-white p-4 border-gray-300 border-r w-64 overflow-y-auto">
        <h2 className="mb-4 font-bold text-lg">Whiteboard Settings</h2>

        {/* Tool Selection */}
        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-700 text-sm">Tool</label>
          <select
            value={tool}
            onChange={(e) => setTool(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded w-full"
          >
            <option value="pen">Pen Tool (Bézier)</option>
            <option value="select" disabled>
              Select Tool
            </option>
            <option value="hand" disabled>
              Hand/Pan
            </option>
          </select>
        </div>

        {/* Canvas Size */}
        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-700 text-sm">Canvas Size</label>
          <div className="space-y-2">
            <div>
              <label className="text-gray-600 text-xs">Width</label>
              <input
                type="number"
                name="width"
                value={canvasSize.width}
                onChange={handleResize}
                min="400"
                max="2000"
                step="100"
                className="px-2 py-1 border border-gray-300 rounded w-full"
              />
            </div>
            <div>
              <label className="text-gray-600 text-xs">Height</label>
              <input
                type="number"
                name="height"
                value={canvasSize.height}
                onChange={handleResize}
                min="300"
                max="1500"
                step="100"
                className="px-2 py-1 border border-gray-300 rounded w-full"
              />
            </div>
          </div>
        </div>

        {/* Background Color */}
        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-700 text-sm">Background</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="border border-gray-300 rounded w-12 h-10"
            />
            <span className="self-center text-gray-500 text-xs">{bgColor}</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-3 border border-blue-200 rounded text-blue-900 text-sm">
          <h3 className="mb-2 font-semibold">Pen Tool Guide</h3>
          <ul className="space-y-1 text-xs">
            <li>
              • <strong>Click</strong> to add anchor points
            </li>
            <li>
              • <strong>Drag</strong> to create curves
            </li>
            <li>
              • <strong>Double-click</strong> to finish path
            </li>
            <li>
              • <strong>Backspace</strong> = remove last point (while drawing)
            </li>
            <li>
              • <strong>Click path</strong> to edit
            </li>
            <li>
              • <strong>Drag anchor</strong> to move
            </li>
            <li>
              • <strong>Drag handle</strong> to adjust curve
            </li>
            <li>
              • <strong>Shift</strong> + hover = lock angle
            </li>
            <li>
              • <strong>Alt</strong> + hold = show path guides
            </li>
            <li>
              • <strong>Alt</strong> + drag = break symmetry
            </li>
            <li className="mt-2 pt-2 border-gray-300 border-t">
              <strong>Undo/Redo:</strong>
            </li>
            <li>
              • <strong>Ctrl+Z</strong> (or <strong>Cmd+Z</strong>) = undo
            </li>
            <li>
              • <strong>Ctrl+Y</strong> (or <strong>Cmd+Shift+Z</strong>) = redo
            </li>
          </ul>
        </div>

        {/* Advanced Options */}
        <div className="mt-6 pt-6 border-gray-200 border-t">
          <h3 className="mb-3 font-semibold text-sm">Advanced</h3>
          <div className="space-y-2">
            <button className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded w-full text-gray-700 text-sm">
              Clear All Paths
            </button>
            <button className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded w-full text-gray-700 text-sm">
              Export as SVG
            </button>
            <button className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded w-full text-gray-700 text-sm">
              Save Drawing
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex flex-col flex-1" ref={containerRef}>
        {/* Top Toolbar */}
        <div className="flex items-center gap-2 bg-white p-2 border-gray-300 border-b">
          <button className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded text-white text-sm">
            ✏️ Pen
          </button>
          <button
            className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-gray-700 text-sm"
            disabled
          >
            ↔️ Select
          </button>
          <button
            className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-gray-700 text-sm"
            disabled
          >
            ✋ Hand
          </button>

          <div className="flex-1" />

          <button
            onClick={handleUndo}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              canUndo
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button
            onClick={handleRedo}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              canRedo
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </button>

          <div className="ml-2 text-gray-500 text-xs">
            {canvasSize.width} × {canvasSize.height}px
          </div>
        </div>

        {/* Whiteboard Canvas */}
        <div className="flex-1 bg-gray-50 overflow-auto">
          <Whiteboard
            ref={whiteboardRef}
            width={canvasSize.width}
            height={canvasSize.height}
            backgroundColor={bgColor}
          />
        </div>

        {/* Status Bar */}
        <div className="bg-white px-4 py-2 border-gray-300 border-t text-gray-600 text-xs">
          Ready. Select Pen Tool to start drawing.
        </div>
      </div>
    </div>
  );
}
