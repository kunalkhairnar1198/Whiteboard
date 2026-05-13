/**
 * Konva Whiteboard
 * Integrated drawing canvas - (Pen Tool Removed)
 */

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Stage, Layer } from 'react-konva';

/**
 * Whiteboard Component
 */
const Whiteboard = forwardRef(
  ({ width = 1200, height = 800, backgroundColor = '#ffffff' }, ref) => {
    const stageRef = useRef(null);
    const layerRef = useRef(null);

    // History tracking - simplified ref-based placeholder
    const historyRef = useRef({
      past: [],
      present: [],
      future: [],
    });

    const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });

    // Expose undo/redo functions via ref
    useImperativeHandle(
      ref,
      () => ({
        undo: () => {},
        redo: () => {},
        canUndo: false,
        canRedo: false,
      }),
      [],
    );

    // UI/interaction state
    const [currentTool, setCurrentTool] = useState('select');
    const [modifiers, setModifiers] = useState({ altKey: false, shiftKey: false, ctrlKey: false });

    // Track keyboard modifiers
    useEffect(() => {
      const handleKeyDown = (e) => {
        setModifiers((prev) => ({
          ...prev,
          altKey: e.altKey,
          shiftKey: e.shiftKey,
          ctrlKey: e.ctrlKey,
        }));
      };

      const handleKeyUp = (e) => {
        setModifiers((prev) => ({
          ...prev,
          altKey: e.altKey,
          shiftKey: e.shiftKey,
          ctrlKey: e.ctrlKey,
        }));
      };

      window.addEventListener('keydown', handleKeyDown, true);
      window.addEventListener('keyup', handleKeyUp, true);

      return () => {
        window.removeEventListener('keydown', handleKeyDown, true);
        window.removeEventListener('keyup', handleKeyUp, true);
      };
    }, []);

    return (
      <div className="flex flex-col bg-gray-50 w-full h-full">
        <div className="flex gap-2 bg-white p-3 border-gray-200 border-b">
          <button
            onClick={() => setCurrentTool('select')}
            className={`px-4 py-2 rounded ${
              currentTool === 'select' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Select
          </button>
          <button
            onClick={() => setCurrentTool('eraser')}
            className={`px-4 py-2 rounded ${
              currentTool === 'eraser' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Eraser
          </button>
          <span className="ml-auto text-gray-500 text-sm">Whiteboard Mode: {currentTool}</span>
        </div>

        <div className="flex-1 overflow-auto">
          <Stage
            ref={stageRef}
            width={width}
            height={height}
            style={{ background: backgroundColor }}
          >
            <Layer ref={layerRef}>{/* Board content would be rendered here */}</Layer>
          </Stage>
        </div>
      </div>
    );
  },
);

Whiteboard.displayName = 'Whiteboard';

export default Whiteboard;
