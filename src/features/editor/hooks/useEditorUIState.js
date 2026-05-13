import { useState } from 'react';

export const useEditorUIState = () => {
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [showLayers, setShowLayers] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [toolbarOrientation, setToolbarOrientation] = useState('vertical');

  return {
    showLeftSidebar,
    setShowLeftSidebar,
    showRightSidebar,
    setShowRightSidebar,
    showLayers,
    setShowLayers,
    showFilters,
    setShowFilters,
    toolbarOrientation,
    setToolbarOrientation,
  };
};

export default useEditorUIState;
