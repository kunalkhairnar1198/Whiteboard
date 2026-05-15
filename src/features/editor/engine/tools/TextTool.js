import { createInteractiveShape } from '@/features/editor/lib/canvasUtils';

import { Tool } from './Tool';

/**
 * TextTool — click on empty canvas to create an editable IText; click
 * an existing object to select it. Defers save until editing exits
 * (so an empty discarded text doesn't push history).
 */
export class TextTool extends Tool {
  constructor(engine) {
    super(engine);
    this._isCreating = false;
  }

  activate() {
    const fabric = this.engine.canvas.fabric;
    if (!fabric) return;
    fabric.selection = true;
    fabric.isDrawingMode = false;
  }

  deactivate() {
    this._isCreating = false;
  }

  /**
   * Engine-level handleObjectAdded consults this to skip saving while
   * text is being created (commit-on-edit flow).
   */
  shouldDeferSaveOnAdd(target) {
    return this._isCreating && (target?.type === 'i-text' || target?.type === 'textbox');
  }

  onMouseDown(opt) {
    if (this.engine.canvas.tryStartPan(opt, { keyOnly: true })) return;

    const fabric = this.engine.canvas.fabric;
    if (!fabric) return;
    if (this._isCreating) return;

    // Click on existing object → select.
    if (opt.target?.data?.id) {
      fabric.setActiveObject(opt.target);
      this.engine.render.schedule();
      return;
    }

    const pointer = fabric.getPointer(opt.e);
    const ctx = this.context;
    const counter = ctx.elementCounterRef?.current ?? 0;
    const id = `element-${counter}`;
    const textObject = createInteractiveShape({
      type: 'text',
      id,
      x: pointer.x,
      y: pointer.y,
      textColor: ctx.textColor,
    });
    if (!textObject) return;

    this._isCreating = true;

    fabric.add(textObject);
    fabric.setActiveObject(textObject);
    textObject.set({
      selectable: true,
      evented: true,
      editable: true,
      hasControls: true,
      hasBorders: true,
      objectCaching: false,
    });
    this.engine.render.schedule();
    ctx.incrementElementCounter?.();

    textObject.on('editing:exited', () => {
      const trimmed = textObject.text?.trim() || '';
      this._isCreating = false;

      if (!trimmed) {
        fabric.remove(textObject);
        fabric.discardActiveObject();
        this.engine.render.schedule();
        ctx.safeSaveState?.();
        return;
      }

      textObject.setCoords();
      fabric.setActiveObject(textObject);
      this.engine.render.schedule();
      ctx.safeSaveState?.();
    });

    requestAnimationFrame(() => {
      fabric.setActiveObject(textObject);
      textObject.enterEditing();
      textObject.selectAll?.();
      this.engine.render.schedule();
    });
  }

  onMouseMove(opt) {
    this.engine.canvas.panMove(opt);
  }

  onMouseUp() {
    this.engine.canvas.endPan();
  }
}

export default TextTool;
