import React, { createContext, useContext, useMemo } from 'react';

/**
 * EngineContext — React context that exposes the engine + the small
 * set of host callbacks (handleElementChange, saveState,
 * duplicateSelected, deleteSelected) so deeply-nested panels can
 * dispatch through the engine without prop drilling.
 *
 * Use `useEngine()` to access. Sub-panels never receive these as
 * props — they pull from context.
 */
const EngineContext = createContext(null);

export const EngineProvider = ({
  engine,
  handleElementChange,
  saveState,
  duplicateSelected,
  deleteSelected,
  children,
}) => {
  const value = useMemo(
    () => ({
      engine,
      handleElementChange,
      saveState,
      duplicateSelected,
      deleteSelected,
    }),
    [engine, handleElementChange, saveState, duplicateSelected, deleteSelected],
  );
  return <EngineContext.Provider value={value}>{children}</EngineContext.Provider>;
};

export const useEngineContext = () => useContext(EngineContext);

export const useEngine = () => useContext(EngineContext)?.engine ?? null;

export default EngineContext;
