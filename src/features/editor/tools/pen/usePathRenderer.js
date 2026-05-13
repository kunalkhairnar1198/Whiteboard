// Pure path-string builders. Exported standalone so the engine can
// consume them without pulling in React. The hook below is a thin
// wrapper kept for existing callers.

export const buildSVGPath = (path) => {
  if (!path || path.points.length === 0) return '';

  const points = path.points;
  let d = `M ${points[0].x} ${points[0].y}`;

  const n = points.length;
  for (let i = 0; i < n; i++) {
    const current = points[i];
    const next = points[i + 1] || (path.closed ? points[0] : null);

    if (!next) break;

    // If next is points[0] (closed loop), it NEVER has moveTo
    if (next.moveTo) {
      d += ` M ${next.x} ${next.y}`;
      continue;
    }

    const h1 = current.handleOut;
    const h2 = next.handleIn;

    if (h1 && h2) {
      // Cubic bezier
      d += ` C ${current.x + h1.x} ${current.y + h1.y} ${next.x + h2.x} ${next.y + h2.y} ${next.x} ${next.y}`;
    } else if (h1) {
      // Quadratic (fallback from cubic if only one handle)
      d += ` Q ${current.x + h1.x} ${current.y + h1.y} ${next.x} ${next.y}`;
    } else if (h2) {
      // Quadratic (fallback from cubic if only one handle)
      d += ` Q ${next.x + h2.x} ${next.y + h2.y} ${next.x} ${next.y}`;
    } else {
      // Line
      d += ` L ${next.x} ${next.y}`;
    }
  }

  if (path.closed) {
    d += ' Z';
  }

  return d;
};

export const buildPreviewPath = (activePath, previewPoint) => {
  if (!activePath || activePath.points.length === 0 || !previewPoint) return '';
  const lastPoint = activePath.points[activePath.points.length - 1];
  const h1 = lastPoint.handleOut;

  let d = `M ${lastPoint.x} ${lastPoint.y}`;
  if (h1) {
    d += ` Q ${lastPoint.x + h1.x} ${lastPoint.y + h1.y} ${previewPoint.x} ${previewPoint.y}`;
  } else {
    d += ` L ${previewPoint.x} ${previewPoint.y}`;
  }
  return d;
};

export const usePathRenderer = () => ({ buildSVGPath, buildPreviewPath });
