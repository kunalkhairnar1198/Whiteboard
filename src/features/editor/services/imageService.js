/**
 * imageService — image ingestion helpers.
 *
 * Phase A: thin wrapper around FileReader, preserving the current
 * dataURL pipeline so behavior is unchanged. Later phases will move
 * this to createImageBitmap + OffscreenCanvas + Blob storage.
 */

export const isImageFile = (file) => Boolean(file && typeof file.type === 'string' && file.type.startsWith('image/'));

export const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    if (!isImageFile(file)) {
      reject(new Error('Not an image file'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

export const loadHTMLImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });

export const readFileAsHTMLImage = async (file) => {
  const dataUrl = await readFileAsDataURL(file);
  return loadHTMLImage(dataUrl);
};
