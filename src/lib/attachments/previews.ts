import { PREVIEW_MAX_EDGE } from "@/lib/attachments/kinds";

/**
 * Browser-only preview generation, run when a file is picked. Each returns
 * a PNG, or null if the browser could not read the file: the attachment is
 * still posted, shown as a file card instead of a picture.
 */

type PdfJs = typeof import("pdfjs-dist");
let pdfjsPromise: Promise<PdfJs> | null = null;

/** Loads pdf.js on first use, so it stays out of every other page's bundle. */
export function loadPdfJs(): Promise<PdfJs> {
  pdfjsPromise ??= import("pdfjs-dist").then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    return pdfjs;
  });
  return pdfjsPromise;
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/** Renders page 1 of a PDF. */
export async function pdfFirstPage(
  file: Blob,
): Promise<{ preview: Blob | null; pages: number | undefined }> {
  try {
    const pdfjs = await loadPdfJs();
    const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
    try {
      const document_ = await task.promise;
      const page = await document_.getPage(1);
      const base = page.getViewport({ scale: 1 });
      const scale = PREVIEW_MAX_EDGE / Math.max(base.width, base.height);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      await page.render({ canvas, viewport }).promise;
      return { preview: await canvasToPng(canvas), pages: document_.numPages };
    } finally {
      void task.destroy();
    }
  } catch (error) {
    console.error("PDF preview failed:", error);
    return { preview: null, pages: undefined };
  }
}

/** Captures a frame from near the start of a video. */
export async function videoFrame(
  file: Blob,
): Promise<{ preview: Blob | null; duration: number | undefined }> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  try {
    const result = await new Promise<{ preview: Blob | null; duration: number | undefined }>(
      (resolve) => {
        let duration: number | undefined;
        const giveUp = window.setTimeout(() => resolve({ preview: null, duration }), 10000);
        const done = (preview: Blob | null) => {
          window.clearTimeout(giveUp);
          resolve({ preview, duration });
        };

        video.addEventListener("error", () => done(null), { once: true });
        video.addEventListener(
          "loadedmetadata",
          () => {
            duration = Number.isFinite(video.duration) ? video.duration : undefined;
            // A moment in, to skip the black frame many videos open on.
            video.currentTime = Math.min(1, (duration ?? 0) / 2);
          },
          { once: true },
        );
        video.addEventListener(
          "seeked",
          () => {
            const { videoWidth, videoHeight } = video;
            if (!videoWidth || !videoHeight) return done(null);
            const scale = Math.min(1, PREVIEW_MAX_EDGE / Math.max(videoWidth, videoHeight));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(videoWidth * scale);
            canvas.height = Math.round(videoHeight * scale);
            const context = canvas.getContext("2d");
            if (!context) return done(null);
            try {
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
            } catch {
              return done(null);
            }
            void canvasToPng(canvas).then(done);
          },
          { once: true },
        );
        video.src = url;
        video.load();
      },
    );
    return result;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
