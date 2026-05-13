import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { 
  MousePointer2, 
  Hand, 
  PenTool, 
  Pencil, 
  Eraser, 
  Type, 
  Image as ImageIcon,
  Square,
  Circle,
  Triangle,
  Star,
  ArrowRight,
  Minus,
  Hexagon
} from 'lucide-react';

const ToolbarButton = ({ icon: Icon, label, isActive, onClick, activeColor = "primary", orientation = "vertical" }) => {
  const activeClasses = {
    primary: "bg-primary text-primary-foreground shadow-lg shadow-primary/20",
    secondary: "bg-secondary text-secondary-foreground shadow-md shadow-secondary/20",
    accent: "bg-accent text-accent-foreground shadow-lg shadow-accent/20",
  };

  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "relative p-3 rounded-xl transition-all duration-300 group",
        isActive 
          ? `${activeClasses[activeColor]} scale-110 z-10` 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className={cn("w-5 h-5 transition-transform duration-300", !isActive && "group-hover:scale-110")} />
      {isActive && (
        <span className={cn(
          "absolute bg-primary-foreground rounded-full",
          orientation === 'vertical' 
            ? "-left-1 top-1/2 -translate-y-1/2 w-1 h-6" 
            : "left-1/2 -bottom-1 -translate-x-1/2 w-6 h-1"
        )} />
      )}
    </button>
  );
};

const Separator = ({ orientation = "vertical" }) => (
  <div className={cn(
    "bg-border/60 mx-auto",
    orientation === 'vertical' ? "h-[1px] w-8 my-2" : "w-[1px] h-8 mx-2"
  )} />
);

const EditorToolbar = ({ 
  currentTool, 
  setCurrentTool, 
  canvas,
  onImageUpload,
  orientation = "vertical" // "vertical" or "horizontal"
}) => {
  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select (V)', color: 'primary' },
    { id: 'pan', icon: Hand, label: 'Pan (H)', color: 'primary' },
    { id: 'pen', icon: PenTool, label: 'Pen (P)', color: 'primary' },
    { id: 'brush', icon: Pencil, label: 'Brush (B)', color: 'primary' },
    { id: 'eraser', icon: Eraser, label: 'Eraser (E)', color: 'primary' },
  ];

  const shapes = [
    { id: 'rectangle', icon: Square, label: 'Rectangle', color: 'secondary' },
    { id: 'circle', icon: Circle, label: 'Circle', color: 'secondary' },
    { id: 'triangle', icon: Triangle, label: 'Triangle', color: 'secondary' },
    { id: 'line', icon: Minus, label: 'Line (L)', color: 'secondary' },
    { id: 'arrow', icon: ArrowRight, label: 'Arrow', color: 'secondary' },
    { id: 'star', icon: Star, label: 'Star', color: 'secondary' },
    { id: 'polygon', icon: Hexagon, label: 'Hexagon', color: 'secondary' },
    { id: 'text', icon: Type, label: 'Text (T)', color: 'accent' },
  ];

  const handleToolClick = (toolId) => {
    setCurrentTool(toolId);
    if (canvas) {
      canvas.isDrawingMode = toolId === 'brush';
    }
  };

  const containerClasses = orientation === 'vertical'
    ? "left-6 top-1/2 -translate-y-1/2 flex-col"
    : "bottom-6 left-1/2 -translate-x-1/2 flex-row";

  const innerClasses = orientation === 'vertical'
    ? "flex-col gap-2 max-h-[85vh] overflow-y-auto"
    : "flex-row gap-2 max-w-[90vw] overflow-x-auto";

  return (
    <div className={cn("absolute z-50 flex items-center", containerClasses)}>
      <div className={cn(
        "flex p-2.5 bg-card/95 backdrop-blur-md border border-border",
        "shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[24px] items-center",
        "no-scrollbar",
        innerClasses
      )}>
        <div className={`flex gap-1 ${orientation === 'vertical' ? 'flex-col' : 'flex-row'}`}>
          {tools.map((tool) => (
            <ToolbarButton
              key={tool.id}
              icon={tool.icon}
              label={tool.label}
              isActive={currentTool === tool.id}
              onClick={() => handleToolClick(tool.id)}
              activeColor={tool.color}
              orientation={orientation}
            />
          ))}
        </div>
        
        <Separator orientation={orientation} />
        
        <div className={`flex gap-1 ${orientation === 'vertical' ? 'flex-col' : 'flex-row'}`}>
          {shapes.map((shape) => (
            <ToolbarButton
              key={shape.id}
              icon={shape.icon}
              label={shape.label}
              isActive={currentTool === shape.id}
              onClick={() => handleToolClick(shape.id)}
              activeColor={shape.color}
              orientation={orientation}
            />
          ))}
        </div>
        
        <Separator orientation={orientation} />
        
        <ToolbarButton
          icon={ImageIcon}
          label="Upload Image"
          isActive={false}
          onClick={() => document.getElementById('toolbar-image-upload')?.click()}
          activeColor="blue"
          orientation={orientation}
        />
        <input
          id="toolbar-image-upload"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onImageUpload}
        />
      </div>
      
      {/* Visual indicator for current tool */}
      {/* <div className={`
        px-3 py-1 bg-slate-900/10 backdrop-blur-sm rounded-full border border-slate-900/5
        ${orientation === 'vertical' ? 'mt-4' : 'ml-4'}
      `}>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {currentTool}
        </span>
      </div> */}
    </div>
  );
};

export default memo(EditorToolbar);
