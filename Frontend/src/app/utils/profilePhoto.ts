const MAX_DIMENSION = 400;
const JPEG_QUALITY = 0.82;
const MAX_FILE_BYTES = 8 * 1024 * 1024;

/**
 * Resize and compress an image file for profile storage as a data URL.
 */
export async function compressProfilePhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Image is too large. Please choose a file under 8 MB.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight, MAX_DIMENSION);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not process image.');
    }
    ctx.drawImage(img, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    if (dataUrl.length > 500_000) {
      throw new Error('Image is still too large after compression. Try a smaller photo.');
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read image file.'));
    img.src = src;
  });
}

function fitWithin(width: number, height: number, max: number) {
  if (width <= max && height <= max) {
    return { width, height };
  }
  const scale = Math.min(max / width, max / height);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}
