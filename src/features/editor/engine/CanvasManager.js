import {
  drawGrid,
  setCanvasBackgroundColor,
  setCanvasBackgroundImage,
} from '@/features/editor/lib/canvasUtils';

/**
 * CanvasManager — owns Fabric canvas lifecycle and the high-level
 * canvas-level operations: size, background, grid, viewport/zoom, and
 * the cross-cutting pan behavior (space-press / right-click / pan
 * tool).
 *
 * Phase B: introduced manager + size/background/grid/zoom.
 * Phase D: pan state + space-pressed state move here so tools can
 * coordinate without React state churn.
 */
export class CanvasManager {
  constructor(engine) {
    this.engine = engine;
    this.fabric = null;
    this._gridGroupRef = { current: null };

    // Pan state — managed by tools via the methods below.
    this._isPanning = false;
    this._lastPanPos = { x: 0, y: 0 };
    this.isSpacePressed = false;
  }

  attach(fabricCanvas) {
    this.fabric = fabricCanvas;
    this.engine.bus.emit('canvas:attached', { fabric: fabricCanvas });
  }

  detach() {
    this.fabric = null;
    this._gridGroupRef.current = null;
    this._isPanning = false;
    this.engine.bus.emit('canvas:detached');
  }

  isReady() {
    return Boolean(this.fabric);
  }

  // -------------------------
  // Size
  // -------------------------
  setSize({ width, height }) {
    if (!this.fabric) return;
    this.fabric.setDimensions({ width, height });
    this.engine.render.schedule();
  }

  // -------------------------
  // Background
  // -------------------------
  setBackgroundColor(color) {
    if (!this.fabric) return;
    setCanvasBackgroundColor(this.fabric, color);
  }

  async setBackgroundImage(url, canvasSize) {
    if (!this.fabric) return false;
    try {
      await setCanvasBackgroundImage(this.fabric, url, canvasSize);
      this.engine.render.schedule();
      return true;
    } catch (err) {
      console.warn('CanvasManager.setBackgroundImage rejected', err);
      return false;
    }
  }

  // -------------------------
  // Grid
  // -------------------------
  setGrid({ show, size, canvasSize }) {
    if (!this.fabric) return;
    drawGrid(this.fabric, show, size, canvasSize, this._gridGroupRef);
  }

  getGridGroup() {
    return this._gridGroupRef.current;
  }

  // -------------------------
  // Export
  // -------------------------

  /**
   * Render the canvas to a data URL (grid hidden during the snapshot)
   * and trigger a browser download. `format` is 'png' or 'jpg'.
   */
  exportImage({ format = 'png', fileName = 'canvas', multiplier = 2 } = {}) {
    if (!this.fabric) return false;
    const grid = this._gridGroupRef.current;
    const wasGridVisible = Boolean(grid?.visible);
    try {
      if (grid && wasGridVisible) grid.set('visible', false);
      const dataURL = this.fabric.toDataURL({
        format: format === 'jpg' ? 'jpeg' : 'png',
        multiplier,
      });
      if (grid && wasGridVisible) {
        grid.set('visible', true);
        this.fabric.renderAll();
      }
      const link = document.createElement('a');
      link.download = `${fileName}.${format}`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch (err) {
      console.error('Error exporting canvas:', err);
      if (grid && wasGridVisible) {
        grid.set('visible', true);
        this.fabric.renderAll();
      }
      return false;
    }
  }

  // -------------------------
  // Viewport / Zoom
  // -------------------------
  setZoom(zoom) {
    if (!this.fabric) return;
    this.fabric.setZoom(zoom);
    this.engine.render.schedule();
  }

  zoomToPoint(point, zoom) {
    if (!this.fabric) return;
    this.fabric.zoomToPoint(point, zoom);
    this.engine.render.schedule();
  }

  resetViewport() {
    if (!this.fabric) return;
    this.fabric.setZoom(1);
    this.fabric.setViewportTransform([1, 0, 0, 1, 0, 0]);
    this.engine.render.schedule();
  }

  // -------------------------
  // Pan
  // -------------------------
  setSpacePressed(value) {
    this.isSpacePressed = Boolean(value);
  }

  isPanning() {
    return this._isPanning;
  }

  /**
   * Attempt to start a pan. If `keyOnly` is true, only triggers when
   * space is pressed or the right mouse button is held. Returns true
   * if a pan started, false otherwise.
   */
  tryStartPan(opt, { keyOnly = false } = {}) {
    if (!this.fabric) return false;
    const evt = opt.e;
    if (keyOnly && !this.isSpacePressed && evt.button !== 2) return false;
    this._isPanning = true;
    this._lastPanPos = { x: evt.clientX, y: evt.clientY };
    this.fabric.selection = false;
    this.engine.bus.emit('canvas:pan:started');
    return true;
  }

  panMove(opt) {
    if (!this._isPanning || !this.fabric) return false;
    const evt = opt.e;
    const vpt = this.fabric.viewportTransform;
    vpt[4] += evt.clientX - this._lastPanPos.x;
    vpt[5] += evt.clientY - this._lastPanPos.y;
    this._lastPanPos = { x: evt.clientX, y: evt.clientY };
    this.engine.render.schedule();
    return true;
  }

  endPan() {
    if (!this._isPanning) return false;
    this._isPanning = false;
    this.engine.bus.emit('canvas:pan:ended');
    return true;
  }

  dispose() {
    this.detach();
  }
}

export default CanvasManager;
