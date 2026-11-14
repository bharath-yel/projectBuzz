/** Upload size cap per file, matching the attachments bucket limit. */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

/** Longest edge of a generated PDF or video preview image. */
export const PREVIEW_MAX_EDGE = 1000;

export type FileKind = "photo" | "pdf" | "video" | "file";

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|heic|heif|avif|bmp)$/i;
const VIDEO_EXTENSIONS = /\.(mp4|mov|webm|m4v)$/i;

/**
 * How a picked file is attached. Anything that is not a photo, PDF or video
 * is a generic file: CAD (.step, .stl), archives, documents and so on.
 */
export function classifyFile(file: { name: string; type: string }): FileKind {
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) return "pdf";
  // SVGs are documents, not photos: they must not be redrawn through a canvas.
  if (file.type === "image/svg+xml") return "file";
  if (file.type.startsWith("image/") || IMAGE_EXTENSIONS.test(file.name)) return "photo";
  if (file.type.startsWith("video/") || VIDEO_EXTENSIONS.test(file.name)) return "video";
  return "file";
}

/** Lower-case extension safe to use in a storage path, e.g. "step". */
export function safeExtension(name: string): string {
  const match = /\.([a-z0-9]{1,8})$/i.exec(name);
  return match ? match[1].toLowerCase() : "bin";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** File details stored in an attachment's `meta` for PDFs, videos and files. */
export type FileMeta = {
  name: string;
  size: number;
  mime: string;
  /** PDF page count, when known. */
  pages?: number;
  /** Video length in seconds, when known. */
  duration?: number;
};
