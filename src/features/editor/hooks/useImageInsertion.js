import { useCallback } from 'react';
import { fabric } from '@/features/editor/utils/fabricFactory';
import { isImageFile, readFileAsHTMLImage } from '@/features/editor/services/imageService';

const MAX_INSERT_SIZE = 400;

/**
 * useImageInsertion — converts file-input events into Fabric.Image
 * objects placed on the canvas. Uses imageService primitives instead of
 * raw FileReader / Image() Promise chains.
 */
export const useImageInsertion = ({
  canvas,
  engine,
  counterRef,
  incrementElementCounter,
  setShowFilters,
  setShowLayers,
  safeSaveState,
}) => {
  const handleImageUpload = useCallback(
    async (e) => {
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

      for (const file of Array.from(files)) {
        if (!isImageFile(file)) {
          console.error('Invalid file type:', file.type);
          continue;
        }
        try {
          const img = await readFileAsHTMLImage(file);
          const scale =
            img.width > MAX_INSERT_SIZE || img.height > MAX_INSERT_SIZE
              ? Math.min(MAX_INSERT_SIZE / img.width, MAX_INSERT_SIZE / img.height)
              : 1;
          const counter = counterRef.current;
          const id = `element-${counter}`;
          const fabricImage = new fabric.Image(img, {
            scaleX: scale,
            scaleY: scale,
            left: 100 + ((counter * 20) % 400),
            top: 100 + ((counter * 20) % 300),
            data: { id, type: 'image' },
            name: `image-${counter}`,
          });
          fabricImage.filters = [];
          canvas.current.add(fabricImage);
          canvas.current.setActiveObject(fabricImage);
          canvas.current.renderAll();
          incrementElementCounter();
          engine.selection.setSelection([id]);
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
          console.error('Error reading/loading image:', err);
        }
      }
      e.target.value = '';
    },
    [
      canvas,
      engine,
      counterRef,
      incrementElementCounter,
      setShowFilters,
      setShowLayers,
      safeSaveState,
    ],
  );

  return { handleImageUpload };
};

export default useImageInsertion;
