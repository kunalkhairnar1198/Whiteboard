import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Eye, EyeOff, Lock, Unlock, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * LayerItem — single row in the layer panel.
 *
 * Memoized: only re-renders when its element projection, isSelected
 * flag, or any of the callback props change. Callbacks are expected
 * to be stable across renders (declared with useCallback in the
 * parent) so memoization actually saves work.
 */
const LayerItem = ({
  element,
  isSelected,
  toggleLayerVisibility,
  toggleLayerLock,
  moveLayer,
  deleteElement,
  onSelect,
  onRename,
  isOverlay = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nameValue, setNameValue] = useState(element.name || element.type);
  const inputRef = useRef(null);

  useEffect(() => {
    setNameValue(element.name || element.type);
  }, [element.name, element.type]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: element.id,
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    touchAction: 'none',
    zIndex: isOverlay ? 1000 : undefined,
  };

  const handleSelect = useCallback(() => onSelect?.(element.id), [onSelect, element.id]);
  const handleToggleVisibility = useCallback(
    (e) => { e.stopPropagation(); toggleLayerVisibility?.(element.id); },
    [toggleLayerVisibility, element.id],
  );
  const handleToggleLock = useCallback(
    (e) => { e.stopPropagation(); toggleLayerLock?.(element.id); },
    [toggleLayerLock, element.id],
  );
  const handleMoveUp = useCallback(
    (e) => { e.stopPropagation(); moveLayer?.(element.id, 'up'); },
    [moveLayer, element.id],
  );
  const handleMoveDown = useCallback(
    (e) => { e.stopPropagation(); moveLayer?.(element.id, 'down'); },
    [moveLayer, element.id],
  );
  const handleDelete = useCallback(
    (e) => { e.stopPropagation(); deleteElement?.(element.id); },
    [deleteElement, element.id],
  );

  const commitRename = () => {
    setIsEditing(false);
    if (nameValue !== (element.name || element.type)) {
      onRename?.(element.id, nameValue);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all cursor-pointer ${
        isOverlay ? 'border-blue-600 bg-white shadow-xl scale-105' :
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
      onClick={isOverlay ? undefined : handleSelect}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {element.type === 'rectangle'
              ? '▭'
              : element.type === 'circle'
              ? '●'
              : element.type === 'triangle'
              ? '▲'
              : element.type === 'star'
              ? '★'
              : element.type === 'textbox' || element.type === 'text'
              ? 'T'
              : element.type === 'image'
              ? '🖼'
              : element.type === 'path'
              ? '✏'
              : '◆'}
          </span>
          <span className="text-sm font-medium text-gray-700 truncate">
            {isEditing ? (
              <input
                ref={inputRef}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    inputRef.current?.blur();
                  } else if (e.key === 'Escape') {
                    setIsEditing(false);
                    setNameValue(element.name || element.type);
                  }
                }}
                autoFocus
              />
            ) : (
              <span
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                title="Double-click to rename"
                className="cursor-text"
              >
                {element.name || element.type}
              </span>
            )}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={handleToggleVisibility}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title={element.visible ? 'Hide' : 'Show'}
        >
          {element.visible ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4 text-gray-400" />
          )}
        </button>
        <button
          onClick={handleToggleLock}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title={element.locked ? 'Unlock' : 'Lock'}
        >
          {element.locked ? (
            <Lock className="w-4 h-4 text-red-500" />
          ) : (
            <Unlock className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={handleMoveUp}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title="Move Up"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button
          onClick={handleMoveDown}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title="Move Down"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default memo(LayerItem);
