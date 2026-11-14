/**
 * Browser-only image resizing. Runs before upload so originals never leave
 * the device at full size.
 */

type ResizeOptions = {
  /** Longest edge of the output, in pixels. */
  maxEdge: number;
  /** "square" center-crops to a square (avatars). Default keeps the aspect ratio. */
  crop?: "square";
  /** JPEG quality, 0 to 1. */
  quality?: number;
};

async function decode(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      // Applies the photo's EXIF rotation.
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Fall through to <img> decoding.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Resizes an image file to a JPEG blob. Throws if the file is not a readable image. */
export async function resizeImage(file: Blob, options: ResizeOptions): Promise<Blob> {
  const { maxEdge, crop, quality = 0.85 } = options;
  const source = await decode(file);
  const sourceWidth = source.width;
  const sourceHeight = source.height;
  if (!sourceWidth || !sourceHeight) {
    throw new Error("Image has no size");
  }

  // Region of the source to draw.
  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;
  if (crop === "square") {
    const side = Math.min(sourceWidth, sourceHeight);
    sx = (sourceWidth - side) / 2;
    sy = (sourceHeight - side) / 2;
    sw = side;
    sh = side;
  }

  const scale = Math.min(1, maxEdge / Math.max(sw, sh));
  const width = Math.max(1, Math.round(sw * scale));
  const height = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available");
  // JPEG has no transparency: flatten onto white rather than black.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(source, sx, sy, sw, sh, 0, 0, width, height);
  if ("close" in source) source.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))),
      "image/jpeg",
      quality,
    );
  });
}
