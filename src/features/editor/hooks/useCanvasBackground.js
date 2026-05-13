import { useCallback, useEffect, useState } from 'react';

/**
 * useCanvasBackground — owns the background state (color or image) and
 * pushes it to the CanvasManager whenever it changes.
 *
 * Phase B: previously called canvasUtils directly on the raw canvas;
 * now delegates to `engine.canvas.setBackgroundColor/Image`.
 */
export const useCanvasBackground = (canvas, { canvasSize, engine, onAfterApply } = {}) => {
  const [background, setBackground] = useState({ type: 'color', value: '#ffffff' });

  useEffect(() => {
    const cm = engine?.canvas;
    if (!cm || !cm.isReady()) return;

    if (background.type === 'color') {
      cm.setBackgroundColor(background.value);
      onAfterApply?.();
    } else if (background.type === 'image' && background.value) {
      cm.setBackgroundImage(background.value, canvasSize)
        .then(() => onAfterApply?.())
        .catch((err) => console.warn('setBackgroundImage rejected', err));
    }
  }, [background, canvasSize, engine, onAfterApply]);

  const handleBgImageUpload = useCallback((e) => {
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
      setBackground({ type: 'image', value: event.target.result });
    };
    reader.onerror = (err) => {
      console.error('Error reading bg file', err);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  return { background, setBackground, handleBgImageUpload };
};

export default useCanvasBackground;
