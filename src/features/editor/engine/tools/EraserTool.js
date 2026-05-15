import { Point } from '@/features/editor/utils/fabricFactory';

import { Tool } from './Tool';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const makeSquareCursor = (size) => {
  const visualSize = clamp(Math.round(size), 8, 64);
  const half = visualSize / 2;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${visualSize}" height="${visualSize}" viewBox="0 0 ${visualSize} ${visualSize}">
      <rect x="1" y="1" width="${visualSize - 2}" height="${visualSize - 2}" fill="rgba(255,255,255,0.35)" stroke="rgba(15,23,42,0.9)" stroke-width="2"/>
      <path d="M${half} 0v${visualSize}M0 ${half}h${visualSize}" stroke="rgba(239,68,68,0.85)" stroke-width="1"/>
    </svg>
  `.trim();
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${half} ${half}, crosshair`;
};

const isLayerObject = (obj) => Boolean(obj?.data?.id) && obj.excludeFromExport !== true;

/**
 * EraserTool — click or drag to remove layer objects under the
 * pointer. Uses engine.layers.remove so the projection stays in sync.
 */
export class EraserTool extends Tool {
  constructor(engine) {
    super(engine);
    this._isErasing = false;
    this._previousCursors = null;
  }

  activate() {
    const f = this.engine.canvas.fabric;
    if (!f) return;
    f.selection = false;
    f.isDrawingMode = false;
    this._previousCursors = {
      defaultCursor: f.defaultCursor,
      hoverCursor: f.hoverCursor,
      moveCursor: f.moveCursor,
    };
    this._applyCursor();
  }

  deactivate() {
    const f = this.engine.canvas.fabric;
    if (f && this._previousCursors) {
      f.defaultCursor = this._previousCursors.defaultCursor;
      f.hoverCursor = this._previousCursors.hoverCursor;
      f.moveCursor = this._previousCursors.moveCursor;
    }
    this._isErasing = false;
    this._previousCursors = null;
  }

  onContextUpdate() {
    this._applyCursor();
  }

  _getEraserSize() {
    const size = Number(this.context.eraserSize);
    return Number.isFinite(size) ? clamp(size, 1, 200) : 10;
  }

  _applyCursor() {
    const f = this.engine.canvas.fabric;
    if (!f) return;
    const cursor = makeSquareCursor(this._getEraserSize());
    f.defaultCursor = cursor;
    f.hoverCursor = cursor;
    f.moveCursor = cursor;
  }

  _getHitIds(opt) {
    const f = this.engine.canvas.fabric;
    if (!f) return [];

    const pointer = f.getPointer(opt.e);
    const zoom = f.getZoom?.() || 1;
    const half = this._getEraserSize() / Math.max(zoom, 0.01) / 2;
    const topLeft = new Point(pointer.x - half, pointer.y - half);
    const bottomRight = new Point(pointer.x + half, pointer.y + half);
    const pointerPoint = new Point(pointer.x, pointer.y);

    const ids = [];
    for (const obj of f.getObjects().slice().reverse()) {
      if (!isLayerObject(obj)) continue;
      obj.setCoords?.();

      const intersects =
        obj.intersectsWithRect?.(topLeft, bottomRight) ||
        obj.containsPoint?.(pointerPoint) ||
        obj === opt.target;

      if (intersects) ids.push(obj.data.id);
    }
    return ids;
  }

  _eraseAt(opt) {
    const ids = this._getHitIds(opt);
    if (ids.length === 0) return false;

    let removed = 0;
    ids.forEach((id) => {
      if (this.engine.layers.remove(id)) removed += 1;
    });

    if (removed > 0) {
      this.engine.selection.clear();
      this.engine.layers.refresh();
      this.context.safeSaveState?.();
      return true;
    }
    return false;
  }

  onMouseDown(opt) {
    if (this.engine.canvas.tryStartPan(opt, { keyOnly: true })) return;
    this._isErasing = true;
    this._eraseAt(opt);
  }

  onMouseMove(opt) {
    if (this.engine.canvas.panMove(opt)) return;
    if (!this._isErasing) return;
    this._eraseAt(opt);
  }

  onMouseUp() {
    if (this.engine.canvas.endPan()) return;
    this._isErasing = false;
  }
}

export default EraserTool;
