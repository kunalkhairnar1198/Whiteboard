import { useCallback } from 'react';
import {
  fabric,
  Gradient as FabricGradient,
} from '@/features/editor/utils/fabricFactory';

const isTextObject = (obj) => obj?.type === 'textbox' || obj?.type === 'i-text';

const createGradientFill = (obj, gradientConfig) => {
  if (!obj || !gradientConfig || !Array.isArray(gradientConfig.colors)) return null;
  const colors = gradientConfig.colors.filter(Boolean);
  if (!colors.length) return null;

  const width = obj.getScaledWidth?.() || obj.width || (obj.radius ? obj.radius * 2 : 100);
  const height = obj.getScaledHeight?.() || obj.height || (obj.radius ? obj.radius * 2 : 100);
  const colorStops = colors.map((color, index) => ({
    offset: colors.length === 1 ? 1 : index / (colors.length - 1),
    color,
  }));
  const coords =
    gradientConfig.coords ||
    (gradientConfig.type === 'radial'
      ? {
          x1: width / 2,
          y1: height / 2,
          r1: 0,
          x2: width / 2,
          y2: height / 2,
          r2: Math.max(width, height) / 2,
        }
      : { x1: 0, y1: 0, x2: width, y2: 0 });

  return new FabricGradient({
    type: gradientConfig.type || 'linear',
    gradientUnits: 'pixels',
    coords,
    colorStops,
  });
};

const projectLayer = (obj) => ({
  id: obj.data?.id,
  type: obj.data?.type,
  name: obj.name || `${obj.data?.type}-${(obj.data?.id || '').split('-')[1] ?? ''}`,
  visible: obj.visible !== false,
  locked: Boolean(obj.lockMovementX),
});

/**
 * useElementUpdater — returns an updater function for the Properties
 * panel. Handles the special-cased properties that aren't a plain
 * obj.set: image filters (brightness/contrast), text width wrap,
 * text decoration, and gradient fill. Falls through to obj.set for
 * everything else.
 *
 * After applying, emits `layer:updated` so the Redux projection
 * picks up name/visibility/lock changes, then invokes onCommit so
 * the host can schedule a save.
 */
export const useElementUpdater = (engine, { onCommit } = {}) =>
  useCallback(
    (id, rawPatch) => {
      const obj = engine?.layers?.getById(id);
      if (!obj) return;
      const newProps = { ...rawPatch };

      if (
        (isTextObject(obj) || obj.type === 'image') &&
        (newProps.brightness !== undefined || newProps.contrast !== undefined)
      ) {
        if (!obj.filters) obj.filters = [];
        if (newProps.brightness !== undefined) {
          const bIndex = obj.filters.findIndex((f) => f && f.type === 'Brightness');
          if (newProps.brightness !== 0) {
            const filter = new fabric.Image.filters.Brightness({
              brightness: newProps.brightness / 100,
            });
            if (bIndex === -1) obj.filters.push(filter);
            else obj.filters[bIndex] = filter;
          } else if (bIndex !== -1) {
            obj.filters.splice(bIndex, 1);
          }
          delete newProps.brightness;
        }
        if (newProps.contrast !== undefined) {
          const cIndex = obj.filters.findIndex((f) => f && f.type === 'Contrast');
          if (newProps.contrast !== 0) {
            const filter = new fabric.Image.filters.Contrast({
              contrast: newProps.contrast / 100,
            });
            if (cIndex === -1) obj.filters.push(filter);
            else obj.filters[cIndex] = filter;
          } else if (cIndex !== -1) {
            obj.filters.splice(cIndex, 1);
          }
          delete newProps.contrast;
        }
        try {
          if (typeof obj.applyFilters === 'function') obj.applyFilters();
        } catch (err) {
          console.warn('applyFilters failed:', err);
        }
      }

      if (isTextObject(obj) && newProps.wrap !== undefined) {
        obj.set({ width: newProps.wrap ? newProps.textWidth || 200 : undefined });
        delete newProps.wrap;
        delete newProps.textWidth;
      }

      if (isTextObject(obj) && newProps.textDecoration !== undefined) {
        obj.set({ textDecoration: newProps.textDecoration || '' });
        delete newProps.textDecoration;
      }

      if (newProps.gradient !== undefined) {
        if (newProps.gradient) {
          const gradientFill = createGradientFill(obj, newProps.gradient);
          if (gradientFill) obj.set({ fill: gradientFill });
          if (newProps.fill === undefined) delete newProps.fill;
        }
        delete newProps.gradient;
      }

      obj.set(newProps);
      engine.render.schedule();
      engine.bus.emit('layer:updated', { id, changes: projectLayer(obj) });
      onCommit?.();
    },
    [engine, onCommit],
  );

export default useElementUpdater;
