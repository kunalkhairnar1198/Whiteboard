import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectSelectedIds } from '@/store/selectors';

/**
 * useSelectedElement — returns the single Fabric object currently
 * selected (or null when 0/many are selected). Re-renders when the
 * selection changes or when the selected object's projection changes
 * (so property controls reflect updates).
 */
export const useSelectedElement = (engine) => {
  const ids = useSelector(selectSelectedIds);
  const id = ids.length === 1 ? ids[0] : null;

  // Subscribe to layer:updated so property controls pick up changes
  // applied via engine.layers.update (e.g. typing into a position
  // input). We don't need the payload — we just bust the local tick
  // so consumers re-read fresh values from the Fabric object.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!engine || !id) return undefined;
    return engine.bus.on('layer:updated', (payload) => {
      if (payload?.id === id) setTick((n) => n + 1);
    });
  }, [engine, id]);

  if (!engine || !id) return null;
  return engine.layers.getById(id);
};

export default useSelectedElement;
