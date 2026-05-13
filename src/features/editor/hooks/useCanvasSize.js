import { useCallback, useEffect, useState } from 'react';
import { canvasPresets } from '@/features/editor/constants/canvasPresets';

const computePresetSize = (presetName, zoom) => {
  const preset = canvasPresets[presetName] || canvasPresets.Custom;
  const maxWidth = window.innerWidth * 0.7;
  const maxHeight = window.innerHeight * 0.7;
  const scale = Math.min(maxWidth / preset.width, maxHeight / preset.height, 1);
  return {
    width: preset.width * scale * zoom,
    height: preset.height * scale * zoom,
  };
};

/**
 * useCanvasSize — owns the canvasSize React state plus the window
 * resize listener; pushes size changes to CanvasManager.setSize.
 *
 * Phase B absorbs the inline `setDimensions` effect previously living
 * in FabricEditor.
 */
export const useCanvasSize = ({ zoom = 1, engine } = {}) => {
  const [canvasSize, setCanvasSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [selectedPreset, setSelectedPreset] = useState('Custom');

  useEffect(() => {
    const handleResize = () => {
      if (selectedPreset === 'Custom') {
        setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
      } else {
        setCanvasSize(computePresetSize(selectedPreset, zoom));
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedPreset, zoom]);

  // Apply size to the canvas via the engine.
  useEffect(() => {
    const cm = engine?.canvas;
    if (!cm || !cm.isReady()) return;
    cm.setSize(canvasSize);
  }, [engine, canvasSize]);

  const handlePresetChange = useCallback(
    (presetName, customWidth, customHeight) => {
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
      setCanvasSize({ width: width * scale * zoom, height: height * scale * zoom });
    },
    [zoom],
  );

  return { canvasSize, setCanvasSize, selectedPreset, setSelectedPreset, handlePresetChange };
};

export default useCanvasSize;
