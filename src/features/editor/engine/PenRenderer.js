/**
 * PenRenderer — canvas-2D overlay that draws the pen tool's visuals
 * (path, anchors, handles, preview, hover indicators).
 *
 * Subscribed to `pen:state-changed` and `pen:preview-changed` on the
 * engine bus; redraws coalesced via requestAnimationFrame. React is
 * not involved per frame.
 *
 * The renderer applies the Fabric viewport transform so visuals stay
 * aligned with the underlying canvas during zoom and pan.
 */
const ANCHOR_SIZE = 4;
const HANDLE_RADIUS = 4;
const FIRST_POINT_CLOSE_RADIUS = 12;

export class PenRenderer {
  constructor(engine) {
    this.engine = engine;
    this.canvas = null;
    this.ctx = null;
    this._rafId = null;
    this._unsubs = [];
    this._cssWidth = 0;
    this._cssHeight = 0;
  }

  attach(canvasEl) {
    if (this.canvas) this.detach();
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    const trigger = () => this.schedule();
    this._unsubs.push(this.engine.bus.on('pen:state-changed', trigger));
    this._unsubs.push(this.engine.bus.on('pen:preview-changed', trigger));
    // Re-render when the underlying viewport changes too.
    this._unsubs.push(this.engine.bus.on('canvas:pan:started', trigger));
    this._unsubs.push(this.engine.bus.on('canvas:pan:ended', trigger));
    this.schedule();
  }

  detach() {
    this._unsubs.forEach((u) => u());
    this._unsubs = [];
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this.canvas = null;
    this.ctx = null;
  }

  setSize(width, height) {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.round(width * dpr));
    this.canvas.height = Math.max(1, Math.round(height * dpr));
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this._cssWidth = width;
    this._cssHeight = height;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.schedule();
  }

  schedule() {
    if (!this.ctx) return;
    if (this._rafId !== null) return;
    this._rafId = requestAnimationFrame(() => {
      this._rafId = null;
      this.render();
    });
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this._cssWidth, this._cssHeight);

    const pen = this.engine.pen;
    if (!pen) return;
    const state = pen.state;
    const path = state?.activePath;
    const preview = pen.previewPoint;

    if (!path && !preview) return;

    const fabric = this.engine.canvas.fabric;
    let vpt = null;
    if (fabric) vpt = fabric.viewportTransform;

    ctx.save();
    if (vpt) ctx.transform(vpt[0], vpt[1], vpt[2], vpt[3], vpt[4], vpt[5]);

    if (path) this._drawPath(ctx, path);
    if (path && preview) this._drawPreviewSegment(ctx, path, preview);
    if (path) this._drawHandles(ctx, path, state);
    if (path) this._drawAnchors(ctx, path, state);
    if (path && preview) this._drawSegmentHoverDot(ctx, state, preview);
    if (path && preview) this._drawCloseTarget(ctx, path, preview);

    ctx.restore();
  }

  _drawPath(ctx, path) {
    if (path.points.length === 0) return;
    ctx.beginPath();
    const pts = path.points;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length; i += 1) {
      const cur = pts[i];
      const next = pts[i + 1] || (path.closed ? pts[0] : null);
      if (!next) break;
      if (next.moveTo) {
        ctx.moveTo(next.x, next.y);
        continue;
      }
      const h1 = cur.handleOut;
      const h2 = next.handleIn;
      if (h1 && h2) {
        ctx.bezierCurveTo(cur.x + h1.x, cur.y + h1.y, next.x + h2.x, next.y + h2.y, next.x, next.y);
      } else if (h1) {
        ctx.quadraticCurveTo(cur.x + h1.x, cur.y + h1.y, next.x, next.y);
      } else if (h2) {
        ctx.quadraticCurveTo(next.x + h2.x, next.y + h2.y, next.x, next.y);
      } else {
        ctx.lineTo(next.x, next.y);
      }
    }
    if (path.closed) ctx.closePath();
    ctx.lineWidth = path.strokeWidth || 2;
    ctx.strokeStyle = path.stroke || '#1f2937';
    ctx.lineCap = path.strokeCap || 'round';
    ctx.lineJoin = path.strokeJoin || 'round';
    ctx.globalAlpha = path.opacity ?? 1;

    if (path.dashArray && path.dashArray.length > 0) {
      ctx.setLineDash(path.dashArray);
    } else {
      ctx.setLineDash([]);
    }

    if (path.fill && path.fill !== 'none' && path.fill !== 'transparent' && path.fill !== null) {
      ctx.fillStyle = path.fill;
      ctx.fill();
    }
    ctx.stroke();
    ctx.setLineDash([]); // Reset
    ctx.globalAlpha = 1;
  }

  _drawPreviewSegment(ctx, path, preview) {
    if (path.points.length === 0) return;
    const last = path.points[path.points.length - 1];
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    if (last.handleOut) {
      ctx.quadraticCurveTo(
        last.x + last.handleOut.x,
        last.y + last.handleOut.y,
        preview.x,
        preview.y,
      );
    } else {
      ctx.lineTo(preview.x, preview.y);
    }
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();
  }

  _drawHandles(ctx, path, state) {
    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    for (const p of path.points) {
      if (p.handleIn) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.handleIn.x, p.y + p.handleIn.y);
        ctx.stroke();
        const isHovered = state.hoveredPoint === `handleIn_${p.id}`;
        this._dot(
          ctx,
          p.x + p.handleIn.x,
          p.y + p.handleIn.y,
          HANDLE_RADIUS,
          isHovered ? '#3b82f6' : '#ffffff',
          '#3b82f6',
        );
      }
      if (p.handleOut) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.handleOut.x, p.y + p.handleOut.y);
        ctx.stroke();
        const isHovered = state.hoveredPoint === `handleOut_${p.id}`;
        this._dot(
          ctx,
          p.x + p.handleOut.x,
          p.y + p.handleOut.y,
          HANDLE_RADIUS,
          isHovered ? '#3b82f6' : '#ffffff',
          '#3b82f6',
        );
      }
    }
    ctx.restore();
  }

  _drawAnchors(ctx, path, state) {
    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    path.points.forEach((p, index) => {
      const isSelected = state.selectedPoints.includes(p.id);
      const isHovered = state.hoveredPoint === `anchor_${p.id}`;
      const isFirst = index === 0;
      const fill = isFirst ? '#10b981' : isSelected ? '#3b82f6' : '#ffffff';
      ctx.lineWidth = isHovered ? 2 : 1;
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.rect(p.x - ANCHOR_SIZE, p.y - ANCHOR_SIZE, ANCHOR_SIZE * 2, ANCHOR_SIZE * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
  }

  _drawSegmentHoverDot(ctx, state, preview) {
    if (!state.hoveredPoint?.startsWith('segment')) return;
    ctx.save();
    ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(preview.x, preview.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawCloseTarget(ctx, path, preview) {
    if (!path.points.length) return;
    const first = path.points[0];
    if (Math.hypot(first.x - preview.x, first.y - preview.y) >= 10) return;
    ctx.save();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(first.x, first.y, FIRST_POINT_CLOSE_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  _dot(ctx, x, y, r, fill, stroke) {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  dispose() {
    this.detach();
  }
}

export default PenRenderer;
