import React from 'react';
import {
  Download,
  PanelLeftOpen,
  PanelRightOpen,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import ShortcutHelpDialog from './ShortcutHelpDialog';

// Header component
// Flow: Render input for name, zoom controls, undo/redo, export button.
const Header = ({
  templateName,
  setTemplateName,
  zoom,
  handleZoomIn,
  handleZoomOut,
  resetZoom,
  handleUndo,
  handleRedo,
  canUndo,
  canRedo,
  exportCanvas,
  setShowLeftSidebar,
  setShowRightSidebar,
}) => {
  return (
    <header className="border-b bg-background/90 px-4 py-3 backdrop-blur">
      <Card className="flex flex-col gap-3 border-none bg-transparent shadow-none sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 sm:hidden">
            <Button variant="outline" size="icon" onClick={() => setShowLeftSidebar(true)}>
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setShowRightSidebar(true)}>
              <PanelRightOpen className="h-4 w-4" />
            </Button>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight">Template Editor</h1>
            <p className="text-xs text-muted-foreground">Fabric canvas with editor panels</p>
          </div>
        </div>
        <div className="flex flex-1 items-center gap-3 sm:max-w-sm">
          <Input
          type="text"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          className="flex-1"
        />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" size="icon" onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut className="w-5 h-5" />
        </Button>
        <div className="rounded-md border px-3 py-2 text-sm font-medium">{Math.round(zoom * 100)}%</div>
        <Button variant="outline" size="icon" onClick={handleZoomIn} title="Zoom In">
          <ZoomIn className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={resetZoom} title="Reset Zoom">
          1:1
        </Button>
        <Separator orientation="vertical" className="mx-1 hidden h-7 sm:block" />
        <Button variant="outline" size="icon" onClick={handleUndo} disabled={!canUndo} title="Undo">
          <RotateCcw className="w-5 h-5" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleRedo} disabled={!canRedo} title="Redo">
          <RotateCw className="w-5 h-5" />
        </Button>
        <Separator orientation="vertical" className="mx-1 hidden h-7 sm:block" />
        <ShortcutHelpDialog />
        <Button onClick={() => exportCanvas('png')} className="gap-2">
          <Download className="w-4 h-4" />
          Export PNG
        </Button>
        </div>
      </Card>
    </header>
  );
};

export default Header;
