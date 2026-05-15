import React, { memo } from 'react';
import { ChevronRight, Filter } from 'lucide-react';
import { useSelector } from 'react-redux';

import { useSelectedElement } from '@/features/editor/hooks/useSelectedElement';

import { cn } from '@/lib/utils';
import { selectSelectedIds } from '@/store/selectors';
import { useEngine } from '@/features/editor/engine/EngineContext';

import { Button } from '@/components/ui/button';
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar';

import FiltersPanel from './FiltersPanel';
import LayersPanel from './LayersPanel';
import PropertiesPanel from './PropertiesPanel';
import ToolSettingsPanel from './ToolSettingsPanel';

/**
 * RightSidebar — orchestrator only. Tabs + which panel to show. All
 * data flows through EngineContext + Redux selectors inside the
 * sub-panels.
 *
 * Phase H: 1259 lines → ~80 lines. Props reduced from 40 to 6.
 */
const RightSidebar = ({
  showRightSidebar,
  setShowRightSidebar,
  showLayers,
  setShowLayers,
  showFilters,
  setShowFilters,
  currentTool,
}) => {
  const engine = useEngine();
  const selectedElement = useSelectedElement(engine);
  const selectedIds = useSelector(selectSelectedIds);

  const showImageFiltersTab = selectedElement?.type === 'image';
  console.warn(
    '🔍 [RightSidebar] showLayers=',
    showLayers,
    'showFilters=',
    showFilters,
    'selectedIds.length=',
    selectedIds.length,
    'selectedElement?',
    Boolean(selectedElement),
    '→ panel will be:',
    showFilters && showImageFiltersTab
      ? 'FiltersPanel'
      : showLayers
        ? 'LayersPanel'
        : selectedIds.length === 0
          ? 'ToolSettingsPanel'
          : 'PropertiesPanel',
  );
  return (
    <Sidebar side="right" mobileOpen={showRightSidebar}>
      <SidebarHeader className="flex flex-row items-center justify-between p-4 border-b">
        <div>
          <p className="font-semibold text-sm">Inspector</p>
          <p className="text-muted-foreground text-xs">Properties, layers, and filters</p>
        </div>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setShowRightSidebar(!showRightSidebar)}
          className="absolute left-0 -translate-x-full top-0 h-10 w-10 rounded-l-xl rounded-r-none border-r-0 shadow-lg z-[110] bg-background hover:bg-secondary"
          title={showRightSidebar ? 'Collapse Inspector' : 'Open Inspector'}
        >
          <ChevronRight
            className={cn(
              'h-5 w-5 transition-transform duration-300',
              !showRightSidebar && 'rotate-180',
            )}
          />
        </Button>
      </SidebarHeader>

      <div className="flex">
        <TabButton
          active={!showLayers && !showFilters}
          onClick={() => {
            setShowLayers(false);
            setShowFilters(false);
          }}
        >
          Properties
        </TabButton>
        <TabButton
          active={showLayers && !showFilters}
          onClick={() => {
            setShowLayers(true);
            setShowFilters(false);
          }}
        >
          Layers
        </TabButton>
        {showImageFiltersTab && (
          <TabButton
            active={showFilters}
            onClick={() => {
              setShowLayers(false);
              setShowFilters(true);
            }}
          >
            <Filter className="inline mr-1 w-4 h-4" /> Filters
          </TabButton>
        )}
      </div>

      <SidebarContent>
        {showFilters && showImageFiltersTab ? (
          <FiltersPanel />
        ) : showLayers ? (
          <LayersPanel />
        ) : selectedIds.length === 0 ? (
          <ToolSettingsPanel currentTool={currentTool} />
        ) : (
          <PropertiesPanel />
        )}
      </SidebarContent>
    </Sidebar>
  );
};

const TabButton = ({ active, onClick, children }) => (
  <Button
    onClick={onClick}
    variant="ghost"
    className={`h-auto flex-1 rounded-none px-4 py-3 text-sm font-medium ${
      active ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
    }`}
  >
    {children}
  </Button>
);

export default memo(RightSidebar);
