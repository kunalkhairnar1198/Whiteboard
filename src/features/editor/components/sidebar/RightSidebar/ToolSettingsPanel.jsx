import React, { memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { usePenTool } from '@/features/editor/tools/pen/usePenTool';

import { selectToolSettings } from '@/store/selectors';
import { toolActions } from '@/store/slices/toolSlice';
import { useEngine } from '@/features/editor/engine/EngineContext';

/**
 * ToolSettingsPanel — settings for whichever drawing tool is active.
 * Reads from toolSlice via selector and dispatches updates directly.
 * No props except `currentTool` (the URL-backed name from FabricEditor).
 */
const ToolSettingsPanel = ({ currentTool }) => {
  switch (currentTool) {
    case 'brush':
      return <BrushSettings />;
    case 'eraser':
      return <EraserSettings />;
    case 'pen':
      return <PenSettings />;
    default:
      return (
        <div className="py-12 text-center">
          <p className="text-muted-foreground text-sm">Select an element to edit properties</p>
        </div>
      );
  }
};

const useToolSettingsUpdater = () => {
  const dispatch = useDispatch();
  return useCallback((patch) => dispatch(toolActions.toolSettingsUpdated(patch)), [dispatch]);
};

const BrushSettings = memo(() => {
  const settings = useSelector(selectToolSettings);
  const update = useToolSettingsUpdater();
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-muted-foreground text-xs">Brush</h4>
      <div>
        <label className="block mb-1 text-muted-foreground text-xs">Brush Type</label>
        <select
          value={settings.penBrushType}
          onChange={(e) => update({ penBrushType: e.target.value })}
          className="px-3 py-2 border border-border rounded-lg w-full text-sm bg-background text-foreground"
        >
          <option value="Pencil">Pencil</option>
          <option value="Circle">Circle</option>
          <option value="Spray">Spray</option>
          <option value="Pattern">Pattern</option>
        </select>
      </div>
      <div>
        <label className="block mb-1 text-muted-foreground text-xs">Line Color</label>
        <input
          type="color"
          value={settings.penColor}
          onChange={(e) => update({ penColor: e.target.value })}
          className="border border-border rounded-lg w-full h-10 cursor-pointer"
        />
      </div>
      <div>
        <label className="block mb-1 text-muted-foreground text-xs">Width: {settings.penWidth}px</label>
        <input
          type="range"
          min="1"
          max="100"
          value={settings.penWidth}
          onChange={(e) => update({ penWidth: +e.target.value })}
          className="w-full"
        />
      </div>
      <div>
        <label className="block mb-1 text-muted-foreground text-xs">
          Opacity: {Math.round(settings.penOpacity * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={settings.penOpacity}
          onChange={(e) => update({ penOpacity: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <h5 className="font-semibold text-muted-foreground text-xs">Shadow</h5>
        <div>
          <label className="block mb-1 text-muted-foreground text-xs">Shadow Color</label>
          <input
            type="color"
            value={settings.penShadowColor}
            onChange={(e) => update({ penShadowColor: e.target.value })}
            className="border border-border rounded-lg w-full h-10 cursor-pointer"
          />
        </div>
        <div>
          <label className="block mb-1 text-muted-foreground text-xs">Blur: {settings.penShadowBlur}</label>
          <input
            type="range"
            min="0"
            max="50"
            value={settings.penShadowBlur}
            onChange={(e) => update({ penShadowBlur: +e.target.value })}
            className="w-full"
          />
        </div>
        <div>
          <label className="block mb-1 text-muted-foreground text-xs">
            Offset: {settings.penShadowOffset}px
          </label>
          <input
            type="range"
            min="-50"
            max="50"
            value={settings.penShadowOffset}
            onChange={(e) => update({ penShadowOffset: +e.target.value })}
            className="w-full"
          />
        </div>
      </div>
      <p className="text-muted-foreground text-xs pt-2">
        Tip: changes apply immediately while in drawing mode.
      </p>
    </div>
  );
});
BrushSettings.displayName = 'BrushSettings';

const EraserSettings = memo(() => {
  const settings = useSelector(selectToolSettings);
  const update = useToolSettingsUpdater();
  const size = settings.eraserSize;
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-muted-foreground text-xs">Eraser</h4>
      <div>
        <label className="block mb-1 text-muted-foreground text-xs">Size: {size}px</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => update({ eraserSize: Math.max(1, size - 1) })}
            className="bg-secondary text-secondary-foreground px-2 py-1 border border-border rounded"
          >
            -
          </button>
          <input
            type="range"
            min="1"
            max="200"
            value={size}
            onChange={(e) => update({ eraserSize: +e.target.value })}
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => update({ eraserSize: Math.min(200, size + 1) })}
            className="bg-secondary text-secondary-foreground px-2 py-1 border border-border rounded"
          >
            +
          </button>
        </div>
        <p className="pt-1 text-muted-foreground text-xs">
          Use the buttons or slider to change eraser size.
        </p>
      </div>
    </div>
  );
});
EraserSettings.displayName = 'EraserSettings';

const PenSettings = memo(() => {
  const settings = useSelector(selectToolSettings);
  const update = useToolSettingsUpdater();
  const engine = useEngine();
  const penTool = usePenTool(engine);
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-muted-foreground text-xs">Pen Tool</h4>
      <div>
        <label className="block mb-1 text-muted-foreground text-xs">Stroke Color</label>
        <input
          type="color"
          value={settings.penColor}
          onChange={(e) => update({ penColor: e.target.value })}
          className="border border-border rounded-lg w-full h-10 cursor-pointer"
        />
      </div>
      <div>
        <label className="block mb-1 text-muted-foreground text-xs">Width: {settings.penWidth}px</label>
        <input
          type="range"
          min="1"
          max="20"
          value={settings.penWidth}
          onChange={(e) => update({ penWidth: +e.target.value })}
          className="w-full"
        />
      </div>
      <div className="pt-2">
        <label className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={penTool.state.snapEnabled}
            onChange={() => penTool.toggleSnap()}
            className="w-4 h-4"
          />
          <span className="text-muted-foreground text-xs">Snap to Grid</span>
        </label>
        <p className="text-muted-foreground text-xs">Double-click any path to enter node edit mode.</p>
      </div>
    </div>
  );
});
PenSettings.displayName = 'PenSettings';

export default memo(ToolSettingsPanel);
