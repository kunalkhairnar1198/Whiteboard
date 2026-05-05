export const applyFilter = (canvas, element, index, filter, onFilterChange) => {
  if (!element.filters) element.filters = [];
  element.filters[index] = filter;
  element.applyFilters();
  const realCanvas = canvas && canvas.current ? canvas.current : canvas;
  if (realCanvas && typeof realCanvas.renderAll === 'function') realCanvas.renderAll();
  if (onFilterChange) onFilterChange(element);
};
