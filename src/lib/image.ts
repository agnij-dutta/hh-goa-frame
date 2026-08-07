export type LoadedImage = ImageBitmap | HTMLImageElement;

function isHeic(file: File): boolean {
  const t = (file.type || "").toLowerCase();
  const n = file.name.toLowerCase();
  return (
    t.includes("heic") || t.includes("heif") ||
    n.endsWith(".heic") || n.endsWith(".heif")
  );
}

async function blobToImage(blob: Blob): Promise<LoadedImage> {
  // createImageBitmap applies EXIF orientation ("from-image" is the default
  // in modern browsers, but pass it explicitly where supported).
  try {
    return await createImageBitmap(blob, { imageOrientation: "from-image" });
  } catch {
    try {
      return await createImageBitmap(blob);
    } catch {
      // Fallback: <img> decode (browsers apply EXIF orientation here too)
      const url = URL.createObjectURL(blob);
      try {
        const img = new Image();
        img.src = url;
        await img.decode();
        return img;
      } finally {
        // revoke after decode; the raster is already in memory
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
    }
  }
}

export async function loadPhoto(file: File): Promise<LoadedImage> {
  if (isHeic(file)) {
    // Some browsers (Safari on Apple hardware) decode HEIC natively — try that first.
    try {
      return await blobToImage(file);
    } catch {
      /* fall through to conversion */
    }
    const heic2any = (await import("heic2any")).default;
    const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
    const jpeg = Array.isArray(out) ? out[0] : out;
    return blobToImage(jpeg);
  }
  return blobToImage(file);
}

export function imgSize(img: LoadedImage): { w: number; h: number } {
  if (img instanceof HTMLImageElement) {
    return { w: img.naturalWidth, h: img.naturalHeight };
  }
  return { w: img.width, h: img.height };
}
