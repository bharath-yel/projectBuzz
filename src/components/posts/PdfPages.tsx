"use client";

import { useEffect, useRef, useState } from "react";
import { loadPdfJs } from "@/lib/attachments/previews";

const MAX_PAGES = 40;

/** Renders a PDF's pages one under another. Works where browsers can't embed PDFs (phones). */
export function PdfPages({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let destroy: (() => void) | undefined;

    (async () => {
      try {
        const pdfjs = await loadPdfJs();
        const task = pdfjs.getDocument({ url });
        destroy = () => void task.destroy();
        const pdf = await task.promise;
        const width = Math.min(container.clientWidth, 900);
        const density = Math.min(window.devicePixelRatio || 1, 2);
        const count = Math.min(pdf.numPages, MAX_PAGES);

        for (let number = 1; number <= count; number++) {
          if (cancelled) return;
          const page = await pdf.getPage(number);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * density });
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(viewport.width);
          canvas.height = Math.round(viewport.height);
          canvas.style.width = "100%";
          canvas.style.maxWidth = `${width}px`;
          canvas.className = "mx-auto mb-3 block rounded bg-white";
          canvas.setAttribute("role", "img");
          canvas.setAttribute("aria-label", `Page ${number} of ${pdf.numPages}`);
          await page.render({ canvas, viewport }).promise;
          if (cancelled) return;
          container.appendChild(canvas);
          if (number === 1) setStatus("ready");
        }
        if (pdf.numPages > count) {
          setNote(`Showing the first ${count} of ${pdf.numPages} pages.`);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("PDF viewer failed:", error);
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      destroy?.();
      container.replaceChildren();
    };
  }, [url]);

  return (
    <div className="w-full">
      {status === "loading" ? <p className="py-10 text-center text-sm text-white/80">Loading PDF…</p> : null}
      {status === "error" ? (
        <p role="alert" className="py-10 text-center text-sm text-white">
          This PDF couldn&apos;t be displayed.
        </p>
      ) : null}
      <div ref={containerRef} />
      {note ? <p className="pb-4 text-center text-sm text-white/80">{note}</p> : null}
    </div>
  );
}
