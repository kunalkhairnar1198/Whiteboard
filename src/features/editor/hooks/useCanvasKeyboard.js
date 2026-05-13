import { useEffect, useRef } from 'react';

/**
 * useCanvasKeyboard — owns the global keydown/keyup listeners for the editor.
 *
 * Pen-mode shortcuts route directly to engine.pen.* (Enter, Esc, Ctrl+B,
 * Ctrl+J, Delete/Backspace). Non-pen shortcuts call into the orchestrator
 * callbacks (undo/redo/duplicate/space-pan/tool-switch).
 */
export const useCanvasKeyboard = ({
  engine,
  canvas,
  currentTool,
  setCurrentTool,
  handleUndo,
  handleRedo,
  duplicateSelected,
  deleteSelected,
  isTextObject,
  setShowLeftSidebar,
  setShowRightSidebar,
  setIsSpacePressed,
}) => {
  const modifierKeysRef = useRef({ altKey: false, shiftKey: false, ctrlKey: false });

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
          engine.pen.finalize();
          return;
        }
        if (e.key === 'Escape') {
          engine.pen.finalize();
          setCurrentTool('select');
          return;
        }
        if (ctrl && e.key.toLowerCase() === 'b') {
          e.preventDefault();
          engine.pen.breakPathAtSelected();
          return;
        }
        if (ctrl && e.key.toLowerCase() === 'j') {
          e.preventDefault();
          engine.pen.joinSelectedPoints();
          return;
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
          engine.pen.deleteSelectedPoints();
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
        deleteSelected();
        setShowLeftSidebar(false);
        setShowRightSidebar(false);
      } else if (e.key.toLowerCase() === 'v') {
        setCurrentTool('select');
      } else if (e.key.toLowerCase() === 'p') {
        setCurrentTool('pen');
      } else if (e.key === ' ') {
        const activeObject = canvas.current?.getActiveObject();
        if (!activeObject?.isEditing) {
          e.preventDefault();
          setIsSpacePressed(true);
          if (canvas.current) canvas.current.defaultCursor = 'grab';
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === ' ') {
        setIsSpacePressed(false);
        if (canvas.current) canvas.current.defaultCursor = 'default';
      }
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
    engine,
    canvas,
    currentTool,
    setCurrentTool,
    handleUndo,
    handleRedo,
    duplicateSelected,
    deleteSelected,
    isTextObject,
    setShowLeftSidebar,
    setShowRightSidebar,
    setIsSpacePressed,
  ]);
};

export default useCanvasKeyboard;
