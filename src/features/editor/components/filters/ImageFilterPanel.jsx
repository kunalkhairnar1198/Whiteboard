import React, { useState, useEffect, useCallback } from 'react';
import * as fabric from 'fabric';
import { FILTER_INDICES } from '@/features/editor/constants/filterIndices';

const ImageFilterPanel = ({ canvas, selectedElement, onFilterChange }) => {
  const [grayscale, setGrayscale] = useState(false);
  const [grayscaleMode, setGrayscaleMode] = useState('average');
  const [invert, setInvert] = useState(false);
  const [sepia, setSepia] = useState(false);
  const [brownie, setBrownie] = useState(false);
  const [brightnessChecked, setBrightnessChecked] = useState(false);
  const [brightness, setBrightness] = useState(0);
  const [contrastChecked, setContrastChecked] = useState(false);
  const [contrast, setContrast] = useState(0);
  const [saturationChecked, setSaturationChecked] = useState(false);
  const [saturation, setSaturation] = useState(0);
  const [noiseChecked, setNoiseChecked] = useState(false);
  const [noise, setNoise] = useState(0);
  const [pixelateChecked, setPixelateChecked] = useState(false);
  const [pixelSize, setPixelSize] = useState(6);
  const [blurChecked, setBlurChecked] = useState(false);
  const [blur, setBlur] = useState(0);
  const [sharpen, setSharpen] = useState(false);
  const [technicolor, setTechnicolor] = useState(false);
  const [polaroid, setPolaroid] = useState(false);
  const [hueChecked, setHueChecked] = useState(false);
  const [hueValue, setHueValue] = useState(0);

  // Add this helper function to get the fabric object
  // Memoized so its identity is stable and effects depending on it don't run every render
  const getFabricObject = useCallback(() => {
    if (!selectedElement || !canvas) return null;

    const realCanvas = canvas.current || canvas;
    const activeObject = realCanvas.getActiveObject();

    let fabricObject = activeObject;

    if (!fabricObject && selectedElement.id) {
      const objects = realCanvas.getObjects();
      fabricObject = objects.find((obj) => obj.data && obj.data.id === selectedElement.id);
    }

    if (fabricObject && fabricObject.type === 'image') {
      return fabricObject;
    }

    return null;
  }, [selectedElement, canvas]);

  // NEW: Load existing filters from the fabric object when selectedElement changes
  useEffect(() => {
    if (!selectedElement || selectedElement.type !== 'image') return;

    const fabricObject = getFabricObject();
    if (!fabricObject || !fabricObject.filters) return;

    const filters = fabricObject.filters;

    // Read existing filters and update state
    const grayscaleFilter = filters[FILTER_INDICES.GRAYSCALE];
    if (grayscaleFilter) {
      setGrayscale(true);
      setGrayscaleMode(grayscaleFilter.mode || 'average');
    } else {
      setGrayscale(false);
    }

    setInvert(!!filters[FILTER_INDICES.INVERT]);
    setSepia(!!filters[FILTER_INDICES.SEPIA]);
    setBrownie(!!filters[FILTER_INDICES.BROWNIE]);

    const brightnessFilter = filters[FILTER_INDICES.BRIGHTNESS];
    if (brightnessFilter) {
      setBrightnessChecked(true);
      setBrightness(brightnessFilter.brightness || 0);
    } else {
      setBrightnessChecked(false);
      setBrightness(0);
    }

    const contrastFilter = filters[FILTER_INDICES.CONTRAST];
    if (contrastFilter) {
      setContrastChecked(true);
      setContrast(contrastFilter.contrast || 0);
    } else {
      setContrastChecked(false);
      setContrast(0);
    }

    const saturationFilter = filters[FILTER_INDICES.SATURATION];
    if (saturationFilter) {
      setSaturationChecked(true);
      setSaturation(saturationFilter.saturation || 0);
    } else {
      setSaturationChecked(false);
      setSaturation(0);
    }

    const noiseFilter = filters[FILTER_INDICES.NOISE];
    if (noiseFilter) {
      setNoiseChecked(true);
      setNoise(noiseFilter.noise || 0);
    } else {
      setNoiseChecked(false);
      setNoise(0);
    }

    const pixelateFilter = filters[FILTER_INDICES.PIXELATE];
    if (pixelateFilter) {
      setPixelateChecked(true);
      setPixelSize(pixelateFilter.blocksize || 6);
    } else {
      setPixelateChecked(false);
      setPixelSize(6);
    }

    const blurFilter = filters[FILTER_INDICES.BLUR];
    if (blurFilter) {
      setBlurChecked(true);
      setBlur(blurFilter.blur || 0);
    } else {
      setBlurChecked(false);
      setBlur(0);
    }

    setSharpen(!!filters[FILTER_INDICES.SHARPEN]);
    setTechnicolor(!!filters[FILTER_INDICES.TECHNICOLOR]);
    setPolaroid(!!filters[FILTER_INDICES.POLAROID]);

    const hueFilter = filters[FILTER_INDICES.HUE];
    if (hueFilter) {
      setHueChecked(true);
      setHueValue(hueFilter.rotation || 0);
    } else {
      setHueChecked(false);
      setHueValue(0);
    }
  }, [selectedElement, getFabricObject]); // Run when selectedElement changes

  const applyFilter = useCallback(
    (index, filter) => {
      if (!selectedElement || !canvas) return;

      const realCanvas = canvas.current || canvas;
      const activeObject = realCanvas.getActiveObject();

      let fabricObject = activeObject;

      if (!fabricObject && selectedElement.id) {
        const objects = realCanvas.getObjects();
        fabricObject = objects.find((obj) => obj.data && obj.data.id === selectedElement.id);
      }

      if (!fabricObject || fabricObject.type !== 'image') {
        console.error('No valid fabric image object found');
        return;
      }

      // Initialize filters array if it doesn't exist
      if (!fabricObject.filters) {
        fabricObject.filters = new Array(Object.keys(FILTER_INDICES).length).fill(null);
      }

      // Apply the filter
      fabricObject.filters[index] = filter || null;

      try {
        fabricObject.applyFilters();
        realCanvas.requestRenderAll();
      } catch (err) {
        console.error('Error applying filters:', err);
        try {
          realCanvas.renderAll();
        } catch (renderErr) {
          console.error('Backup render failed:', renderErr);
        }
      }

      onFilterChange?.(fabricObject);
    },
    [selectedElement, canvas, onFilterChange],
  );

  // Apply filters when state changes (but NOT when selectedElement changes)
  useEffect(() => {
    if (!selectedElement || selectedElement.type !== 'image') return;

    if (!fabric?.filters) {
      console.error('Fabric.js filters not available');
      return;
    }

    const applyFilterSafely = (index, condition, createFilter) => {
      if (!fabric?.filters) return;
      try {
        const filter = condition ? createFilter() : null;
        applyFilter(index, filter);
      } catch (error) {
        console.error(`Failed to apply filter at index ${index}:`, error);
      }
    };

    try {
      applyFilterSafely(
        FILTER_INDICES.GRAYSCALE,
        grayscale,
        () => new fabric.filters.Grayscale({ mode: grayscaleMode }),
      );

      applyFilterSafely(FILTER_INDICES.INVERT, invert, () => new fabric.filters.Invert());

      applyFilterSafely(FILTER_INDICES.SEPIA, sepia, () => new fabric.filters.Sepia());

      applyFilterSafely(FILTER_INDICES.BROWNIE, brownie, () => new fabric.filters.Brownie());

      applyFilterSafely(
        FILTER_INDICES.BRIGHTNESS,
        brightnessChecked,
        () => new fabric.filters.Brightness({ brightness }),
      );

      applyFilterSafely(
        FILTER_INDICES.CONTRAST,
        contrastChecked,
        () => new fabric.filters.Contrast({ contrast }),
      );

      applyFilterSafely(
        FILTER_INDICES.SATURATION,
        saturationChecked,
        () => new fabric.filters.Saturation({ saturation }),
      );

      applyFilterSafely(
        FILTER_INDICES.NOISE,
        noiseChecked,
        () => new fabric.filters.Noise({ noise: parseInt(noise, 10) }),
      );

      applyFilterSafely(
        FILTER_INDICES.PIXELATE,
        pixelateChecked,
        () => new fabric.filters.Pixelate({ blocksize: parseInt(pixelSize, 10) }),
      );

      applyFilterSafely(FILTER_INDICES.BLUR, blurChecked, () => new fabric.filters.Blur({ blur }));

      applyFilterSafely(
        FILTER_INDICES.SHARPEN,
        sharpen,
        () =>
          new fabric.filters.Convolute({
            matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0],
          }),
      );

      applyFilterSafely(
        FILTER_INDICES.TECHNICOLOR,
        technicolor,
        () => new fabric.filters.Technicolor(),
      );

      applyFilterSafely(FILTER_INDICES.POLAROID, polaroid, () => new fabric.filters.Polaroid());

      applyFilterSafely(
        FILTER_INDICES.HUE,
        hueChecked,
        () => new fabric.filters.HueRotation({ rotation: parseFloat(hueValue) }),
      );
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  }, [
    // REMOVED selectedElement from dependencies - only filter state should trigger this
    grayscale,
    grayscaleMode,
    invert,
    sepia,
    brownie,
    brightnessChecked,
    brightness,
    contrastChecked,
    contrast,
    saturationChecked,
    saturation,
    noiseChecked,
    noise,
    pixelateChecked,
    pixelSize,
    blurChecked,
    blur,
    sharpen,
    technicolor,
    polaroid,
    hueChecked,
    hueValue,
    applyFilter,
  ]);

  const clearFilters = () => {
    setGrayscale(false);
    setInvert(false);
    setSepia(false);
    setBrownie(false);
    setBrightnessChecked(false);
    setBrightness(0);
    setContrastChecked(false);
    setContrast(0);
    setSaturationChecked(false);
    setSaturation(0);
    setNoiseChecked(false);
    setNoise(0);
    setPixelateChecked(false);
    setPixelSize(6);
    setBlurChecked(false);
    setBlur(0);
    setSharpen(false);
    setTechnicolor(false);
    setPolaroid(false);
    setHueChecked(false);
    setHueValue(0);

    if (selectedElement && canvas) {
      const realCanvas = canvas.current || canvas;
      const activeObject = realCanvas.getActiveObject();

      let fabricObject = activeObject;
      if (!fabricObject && selectedElement.id) {
        const objects = realCanvas.getObjects();
        fabricObject = objects.find((obj) => obj.data && obj.data.id === selectedElement.id);
      }

      if (fabricObject) {
        fabricObject.filters = [];
        fabricObject.applyFilters();
        realCanvas.requestRenderAll();
      }
    }
  };

  if (!selectedElement || selectedElement.type !== 'image') {
    return (
      <div className="text-sm text-gray-500 text-center py-8">Select an image to apply filters</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold text-gray-700">Image Filters</h4>
        <button
          onClick={clearFilters}
          className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-3 text-sm max-h-[60vh] overflow-y-auto pr-2">
        {/* Basic Filters */}
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-gray-600 uppercase">Basic</h5>

          <div className="flex items-center justify-between">
            <span>Grayscale</span>
            <input
              type="checkbox"
              checked={grayscale}
              onChange={(e) => setGrayscale(e.target.checked)}
              className="w-4 h-4"
            />
          </div>
          {grayscale && (
            <div className="grid grid-cols-3 gap-1 pl-4">
              <label className="text-xs flex items-center gap-1">
                <input
                  type="radio"
                  checked={grayscaleMode === 'average'}
                  onChange={() => setGrayscaleMode('average')}
                />
                Avg
              </label>
              <label className="text-xs flex items-center gap-1">
                <input
                  type="radio"
                  checked={grayscaleMode === 'luminosity'}
                  onChange={() => setGrayscaleMode('luminosity')}
                />
                Lum
              </label>
              <label className="text-xs flex items-center gap-1">
                <input
                  type="radio"
                  checked={grayscaleMode === 'lightness'}
                  onChange={() => setGrayscaleMode('lightness')}
                />
                Light
              </label>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span>Invert</span>
            <input
              type="checkbox"
              checked={invert}
              onChange={(e) => setInvert(e.target.checked)}
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <span>Sepia</span>
            <input
              type="checkbox"
              checked={sepia}
              onChange={(e) => setSepia(e.target.checked)}
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <span>Brownie</span>
            <input
              type="checkbox"
              checked={brownie}
              onChange={(e) => setBrownie(e.target.checked)}
              className="w-4 h-4"
            />
          </div>
        </div>

        {/* Adjustments */}
        <div className="space-y-2 pt-2 border-t">
          <h5 className="text-xs font-semibold text-gray-600 uppercase">Adjustments</h5>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs">Brightness</label>
              <input
                type="checkbox"
                checked={brightnessChecked}
                onChange={(e) => setBrightnessChecked(e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            {brightnessChecked && (
              <>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={brightness}
                  onChange={(e) => setBrightness(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-right">
                  {Math.round(brightness * 100)}%
                </div>
              </>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs">Contrast</label>
              <input
                type="checkbox"
                checked={contrastChecked}
                onChange={(e) => setContrastChecked(e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            {contrastChecked && (
              <>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={contrast}
                  onChange={(e) => setContrast(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-right">
                  {Math.round(contrast * 100)}%
                </div>
              </>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs">Saturation</label>
              <input
                type="checkbox"
                checked={saturationChecked}
                onChange={(e) => setSaturationChecked(e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            {saturationChecked && (
              <>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={saturation}
                  onChange={(e) => setSaturation(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-right">
                  {Math.round(saturation * 100)}%
                </div>
              </>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs">Hue Rotation</label>
              <input
                type="checkbox"
                checked={hueChecked}
                onChange={(e) => setHueChecked(e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            {hueChecked && (
              <>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={hueValue}
                  onChange={(e) => setHueValue(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-right">
                  {Math.round(hueValue * 180)}°
                </div>
              </>
            )}
          </div>
        </div>

        {/* Effects */}
        <div className="space-y-2 pt-2 border-t">
          <h5 className="text-xs font-semibold text-gray-600 uppercase">Effects</h5>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs">Noise</label>
              <input
                type="checkbox"
                checked={noiseChecked}
                onChange={(e) => setNoiseChecked(e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            {noiseChecked && (
              <>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="1"
                  value={noise}
                  onChange={(e) => setNoise(parseInt(e.target.value, 10))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-right">{noise}</div>
              </>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs">Pixelate</label>
              <input
                type="checkbox"
                checked={pixelateChecked}
                onChange={(e) => setPixelateChecked(e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            {pixelateChecked && (
              <>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={pixelSize}
                  onChange={(e) => setPixelSize(parseInt(e.target.value, 10))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-right">{pixelSize}px</div>
              </>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs">Blur</label>
              <input
                type="checkbox"
                checked={blurChecked}
                onChange={(e) => setBlurChecked(e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            {blurChecked && (
              <>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={blur}
                  onChange={(e) => setBlur(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-right">{Math.round(blur * 100)}%</div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span>Sharpen</span>
            <input
              type="checkbox"
              checked={sharpen}
              onChange={(e) => setSharpen(e.target.checked)}
              className="w-4 h-4"
            />
          </div>
        </div>

        {/* Vintage Effects */}
        <div className="space-y-2 pt-2 border-t">
          <h5 className="text-xs font-semibold text-gray-600 uppercase">Vintage</h5>

          <div className="flex items-center justify-between">
            <span>Technicolor</span>
            <input
              type="checkbox"
              checked={technicolor}
              onChange={(e) => setTechnicolor(e.target.checked)}
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <span>Polaroid</span>
            <input
              type="checkbox"
              checked={polaroid}
              onChange={(e) => setPolaroid(e.target.checked)}
              className="w-4 h-4"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageFilterPanel;
