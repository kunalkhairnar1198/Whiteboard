import React, { memo, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import LayerItem from '@/features/editor/components/layer-item/LayerItem';
import { useEngineContext } from '@/features/editor/engine/EngineContext';
import { selectLayerList, selectSelectedIds } from '@/store/selectors';

/**
 * LayersPanel — DnD list of layers. Uses engine.layers for all
 * mutations; doesn't take any layer-op props.
 */
const LayersPanel = () => {
  const { engine, saveState, handleElementChange } = useEngineContext();
  const elements = useSelector(selectLayerList);
  const selectedIds = useSelector(selectSelectedIds);
  const [activeId, setActiveId] = useState(null);
  console.log('[LayersPanel render] elements.length=', elements.length, 'elements=', elements);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const onLayerSelect = useCallback(
    (id) => {
      engine?.selection?.setSelection([id]);
    },
    [engine],
  );

  const toggleLayerVisibility = useCallback(
    (id) => {
      if (engine?.layers?.toggleVisible(id)) saveState?.();
    },
    [engine, saveState],
  );

  const toggleLayerLock = useCallback(
    (id) => {
      if (engine?.layers?.toggleLock(id)) saveState?.();
    },
    [engine, saveState],
  );

  const moveLayer = useCallback(
    (id, direction) => {
      if (engine?.layers?.move(id, direction)) saveState?.();
    },
    [engine, saveState],
  );

  const deleteElement = useCallback(
    (id) => {
      if (engine?.layers?.remove(id)) saveState?.();
    },
    [engine, saveState],
  );

  const handleRename = useCallback(
    (id, newName) => {
      handleElementChange?.(id, { name: newName });
    },
    [handleElementChange],
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const onDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    if (!engine) return;

    // sortedIds is [top, ..., bottom]
    // elements is [bottom, ..., top]
    const oldIndex = sortedIds.indexOf(active.id);
    const newIndex = sortedIds.indexOf(over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Move in the UI-visible order [top -> bottom]
    const newSortedIds = arrayMove(sortedIds, oldIndex, newIndex);
    
    // The engine expects [bottom -> top]
    const newOrder = [...newSortedIds].reverse();

    if (engine.layers.setOrder(newOrder)) {
      saveState?.();
    }
  };

  const sortedIds = elements.slice().reverse().map((el) => el.id);
  const activeElement = activeId ? elements.find(el => el.id === activeId) : null;

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700 text-sm">Layers ({elements.length})</h3>
          </div>
          <div className="space-y-2">
            {elements
              .slice()
              .reverse()
              .map((element) => (
                <LayerItem
                  key={element.id}
                  element={element}
                  isSelected={selectedIds.includes(element.id)}
                  toggleLayerVisibility={toggleLayerVisibility}
                  toggleLayerLock={toggleLayerLock}
                  moveLayer={moveLayer}
                  deleteElement={deleteElement}
                  onSelect={onLayerSelect}
                  onRename={handleRename}
                />
              ))}
            {elements.length === 0 && (
              <div className="py-8 text-gray-500 text-center">
                <p className="text-sm">No layers yet</p>
                <p className="text-xs">Add shapes, text, or images to get started</p>
              </div>
            )}
          </div>
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={dropAnimation}>
        {activeElement ? (
          <div className="w-full">
            <LayerItem
              element={activeElement}
              isSelected={selectedIds.includes(activeElement.id)}
              isOverlay
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default memo(LayersPanel);
