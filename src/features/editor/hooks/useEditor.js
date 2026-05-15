import { useEffect, useRef } from 'react';

import { store } from '@/store';
import { attachEngineToStore } from '@/store/engineSync';
import { EditorEngine } from '@/features/editor/engine/EditorEngine';

/**
 * useEditor — constructs a single EditorEngine for the host component,
 * disposes on unmount, and wires the engine bus to the Redux store.
 *
 * StrictMode-safe: on cleanup we null the ref so the next render
 * lazily creates a fresh engine after a strict double mount.
 */
export const useEditor = () => {
  const engineRef = useRef(null);

  if (!engineRef.current || engineRef.current.isDisposed()) {
    console.warn('🔧 [useEditor] creating new EditorEngine');
    engineRef.current = new EditorEngine();
  }

  useEffect(() => {
    const engine = engineRef.current;
    console.warn('🔧 [useEditor] effect: about to attachEngineToStore', Boolean(engine));
    const detachBridge = attachEngineToStore(engine, store);
    console.warn('🔧 [useEditor] effect: attachEngineToStore returned');
    return () => {
      console.warn('🔧 [useEditor] cleanup running');
      detachBridge();
      engine.dispose();
      if (engineRef.current === engine) {
        engineRef.current = null;
      }
    };
  }, []);

  return engineRef.current;
};

export default useEditor;
