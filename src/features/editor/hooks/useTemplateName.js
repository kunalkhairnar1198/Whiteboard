import { useCallback, useState } from 'react';

import { exportToJson, persistCanvasState } from '@/features/editor/lib/persistence';

export const useTemplateName = (initialDiagramName, { canvas } = {}) => {
  const [templateName, setTemplateName] = useState(initialDiagramName || 'Untitled Template');

  const saveWorkspace = useCallback(() => {
    if (!canvas?.current) return;
    const json = canvas.current.toObject([
      'id',
      'name',
      'data',
      'lockMovementX',
      'lockMovementY',
      'lockRotation',
      'lockScalingX',
      'lockScalingY',
      'selectable',
    ]);
    persistCanvasState(json, templateName);
    exportToJson(json, templateName);
  }, [canvas, templateName]);

  return { templateName, setTemplateName, saveWorkspace };
};

export default useTemplateName;
