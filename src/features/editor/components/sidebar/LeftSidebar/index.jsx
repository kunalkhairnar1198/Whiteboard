import React, { memo, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eraser,
  FileJson,
  Image as ImageIcon,
  Move,
  Pencil,
  PenTool,
  RefreshCw,
  Square,
  Trash2,
  Type,
} from 'lucide-react';

import useLayers from '@/features/editor/hooks/useLayers';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
} from '@/components/ui/sidebar';

// / Left sidebar component
// Flow: Render tool buttons, shape grid, text/image upload, canvas settings.
const LeftSidebar = ({
  currentTool,
  setCurrentTool,
  canvas,
  showLeftSidebar,
  setShowLeftSidebar,
  handleImageUpload,
  background,
  setBackground,
  handleBgImageUpload,
  showGrid,
  setShowGrid,
  gridSize,
  setGridSize,
  selectedPreset,
  handlePresetChange,
  canvasPresets,
  saveState,
  loadSavedDiagram,
  getSavedDiagramsList,
}) => {
  const elements = useLayers();
  const [savedDiagrams, setSavedDiagrams] = useState([]);

  useEffect(() => {
    if (getSavedDiagramsList) {
      setSavedDiagrams(getSavedDiagramsList());
    }
  }, [getSavedDiagramsList]);

  const refreshDiagrams = () => {
    if (getSavedDiagramsList) {
      setSavedDiagrams(getSavedDiagramsList());
    }
  };
  const fileInputRef = useRef();
  const bgFileInputRef = useRef();
  const [customWidth, setCustomWidth] = useState(canvasPresets['Custom'].width);
  const [customHeight, setCustomHeight] = useState(canvasPresets['Custom'].height);

  // Shape definitions with explicit validation
  const shapes = [
    { type: 'rectangle', label: 'Rect', icon: '▭' },
    { type: 'circle', label: 'Circle', icon: '●' },
    { type: 'triangle', label: 'Triangle', icon: '▲' },
    { type: 'star', label: 'Star', icon: '★' },
    { type: 'arrow', label: 'Arrow', icon: '→' },
    { type: 'line', label: 'Line', icon: '/' },
    { type: 'polygon', label: 'Hex', icon: '⬡' },
    { type: 'frame', label: 'Frame', icon: '🖼' },
    { type: 'text', label: 'Text', icon: 'T' },
  ].filter((shape) => {
    if (!shape.type) {
      console.error('Invalid shape configuration:', shape);
      return false;
    }
    return true;
  });

  const handleCustomSizeSubmit = () => {
    if (customWidth >= 100 && customHeight >= 100) {
      handlePresetChange('Custom', customWidth, customHeight);
    }
  };

  // radius + gradient UI state
  const [radius, setRadius] = useState(0);
  const [gradientEnabled, setGradientEnabled] = useState(false);
  const [gradientType, setGradientType] = useState('linear');
  const [gradientFrom, setGradientFrom] = useState('#FF6B00');
  const [gradientTo, setGradientTo] = useState('#FF8C38');

  return (
    <Sidebar side="left" mobileOpen={showLeftSidebar}>
      <SidebarHeader className="flex flex-row items-center justify-between p-4 border-b">
        <div>
          <p className="text-sm font-semibold">Settings</p>
          <p className="text-xs text-muted-foreground">Canvas & Grid configurations</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowLeftSidebar(!showLeftSidebar)}
          className="absolute right-0 translate-x-full top-0  h-8 w-8 rounded-r-xl rounded-l-none border-l-0 shadow-lg z-[110] bg-background hover:bg-secondary"
          title={showLeftSidebar ? 'Collapse Sidebar' : 'Open Settings'}
        >
          <ChevronLeft
            className={cn(
              'h-5 w-5 transition-transform duration-300',
              !showLeftSidebar && 'rotate-180',
            )}
          />
        </Button>
      </SidebarHeader>
      <SidebarContent className="space-y-6">
        {/* Debug Info */}
        <Card className="bg-muted/40">
          <CardContent className="space-y-1 p-3 text-xs text-muted-foreground">
            <div>Canvas: {canvas ? 'Ready' : 'Not Ready'}</div>
            <div>Elements: {elements.length}</div>
          </CardContent>
        </Card>

        <SidebarGroup>
          <SidebarGroupLabel>Canvas</SidebarGroupLabel>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Template</label>
              <select
                value={selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full px-2 py-1 border border-border rounded bg-background text-foreground"
              >
                {Object.keys(canvasPresets).map((preset) => (
                  <option key={preset} value={preset}>
                    {preset}
                  </option>
                ))}
              </select>
            </div>
            {selectedPreset === 'Custom' && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                  Custom Dimensions
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Width (px):</label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(parseInt(e.target.value) || '')}
                      min="100"
                      max="4000"
                      className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                      placeholder="Width"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Height (px):</label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(parseInt(e.target.value) || '')}
                      min="100"
                      max="4000"
                      className="w-full px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                      placeholder="Height"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCustomSizeSubmit}
                  className="mt-2 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors"
                >
                  Apply Custom Size
                </button>
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Background Color:</label>
              <input
                type="color"
                value={background.type === 'color' ? background.value : '#ffffff'}
                onChange={(e) => setBackground({ type: 'color', value: e.target.value })}
                className="w-full h-10 border border-border rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label className="block p-4 border-2 border-dashed border-border rounded-lg text-center cursor-pointer hover:border-primary/50 hover:bg-secondary transition-all">
                <ImageIcon className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">Upload Background Image</p>
                <input
                  ref={bgFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    handleBgImageUpload(e);
                    setShowLeftSidebar(false);
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Grid</SidebarGroupLabel>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="w-4 h-4 accent-primary rounded focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-foreground">Show Grid</span>
            </label>
            {showGrid && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Grid Size: {gridSize}px
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={gridSize}
                  onChange={(e) => setGridSize(+e.target.value)}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </SidebarGroup>

        {/* Workspace Diagrams */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Workspace Diagrams</span>
            <Button variant="ghost" size="icon" className="h-4 w-4" onClick={refreshDiagrams}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </SidebarGroupLabel>
          <div className="space-y-1 mt-2">
            {savedDiagrams.length === 0 ? (
              <p className="text-xs text-muted-foreground px-2 py-1">No saved diagrams</p>
            ) : (
              savedDiagrams.map((name) => (
                <div key={name} className="flex items-center gap-1 px-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 justify-start gap-2 h-8 text-xs overflow-hidden text-ellipsis whitespace-nowrap"
                    onClick={() => loadSavedDiagram(name)}
                  >
                    <FileJson className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span className="truncate">{name}</span>
                  </Button>
                </div>
              ))
            )}
            <div className="pt-2 px-2">
              <p className="text-[10px] text-muted-foreground italic">
                Diagrams are saved in browser's local storage. Export JSON to save to your local
                machine.
              </p>
            </div>
          </div>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default memo(LeftSidebar);
