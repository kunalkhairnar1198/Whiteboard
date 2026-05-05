import React from 'react';
import { Eye, EyeOff, Lock, Unlock, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Reusable layer item
// Flow: Render layer info and buttons, call callbacks on clicks.
import { useState, useRef, useEffect } from 'react';

const LayerItem = ({
  element,
  selectedIds,
  toggleLayerVisibility,
  toggleLayerLock,
  moveLayer,
  deleteElement,
  onSelect,
  onRename,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nameValue, setNameValue] = useState(element.name || element.type);
  const inputRef = useRef(null);

  useEffect(() => {
    setNameValue(element.name || element.type);
  }, [element.name, element.type]);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: element.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : 1,
    touchAction: 'manipulation',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      key={element.id}
      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all cursor-pointer ${
        selectedIds.includes(element.id)
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onSelect(element.id)}
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
                onBlur={() => {
                  setIsEditing(false);
                  if (nameValue !== (element.name || element.type))
                    onRename?.(element.id, nameValue);
                }}
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
                  // focus handled by input autoFocus when rendered
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
          onClick={(e) => {
            e.stopPropagation();
            toggleLayerVisibility(element.id);
          }}
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
          onClick={(e) => {
            e.stopPropagation();
            toggleLayerLock(element.id);
          }}
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
          onClick={(e) => {
            e.stopPropagation();
            moveLayer(element.id, 'up');
          }}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title="Move Up"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            moveLayer(element.id, 'down');
          }}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title="Move Down"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteElement(element.id);
          }}
          className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default LayerItem;
