import React from 'react';
import {
  Download,
  PanelLeftOpen,
  PanelRightOpen,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Layout,
  Save,
  Upload,
  ChevronLeft,
} from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import ShortcutHelpDialog from './ShortcutHelpDialog';
import { cn } from '@/lib/utils';

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
  saveWorkspace,
  loadWorkspaceFromFile,
  setShowLeftSidebar,
  setShowRightSidebar,
  toolbarOrientation,
  setToolbarOrientation,
  showLeftSidebar,
  showRightSidebar,
  onBack,
}) => {
  const fileInputRef = useRef(null);
  const toggleOrientation = () => {
    setToolbarOrientation(prev => prev === 'vertical' ? 'horizontal' : 'vertical');
  };
  return (
    <header className="border-b bg-background/90 px-4 pt-2 backdrop-blur">
      <Card className="flex flex-col gap-3 border-none bg-transparent m-1 shadow-none sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} title="Back to Dashboard">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight">Template Editor</h1>
              <p className="text-xs text-muted-foreground">Fabric canvas with editor panels</p>
            </div>
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
        
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={saveWorkspace} title="Save Workspace (JSON)">
            <Save className="w-5 h-5 text-blue-600" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} title="Import Workspace (JSON)">
            <Upload className="w-5 h-5 text-orange-600" />
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={loadWorkspaceFromFile} 
              accept=".json" 
              className="hidden" 
            />
          </Button>
        </div>
        
        <Separator orientation="vertical" className="mx-1 hidden h-7 sm:block" />
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleOrientation} 
          title={`Switch to ${toolbarOrientation === 'vertical' ? 'Horizontal' : 'Vertical'} Toolbar`}
        >
          <Layout className={`w-5 h-5 transition-transform duration-300 ${toolbarOrientation === 'horizontal' ? 'rotate-90' : ''}`} />
        </Button>
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
