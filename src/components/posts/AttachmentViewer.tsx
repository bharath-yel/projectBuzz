"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FileCard } from "@/components/posts/FileCard";
import { PdfPages } from "@/components/posts/PdfPages";
import { getAttachmentAccess, type AttachmentAccess } from "@/lib/attachments/actions";

type AttachmentViewerProps = {
  attachmentId: string;
  /** Shown while the file's address is being fetched. */
  title: string;
  onClose: () => void;
};

/**
 * Full-screen viewer, opened by tapping an attachment. The original file's
 * address is requested only now, so lists of posts never load full files.
 */
export function AttachmentViewer({ attachmentId, title, onClose }: AttachmentViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [access, setAccess] = useState<AttachmentAccess | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    let cancelled = false;
    getAttachmentAccess(attachmentId)
      .then((result) => {
        if (cancelled) return;
        if (result) setAccess(result);
        else setFailed(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [attachmentId]);

  const name = access?.name ?? title;
  const barButton =
    "inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label={name}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-[#0b1620] p-0 text-white backdrop:bg-black"
    >
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b border-white/15 px-3 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-2">
          <p className="min-w-0 flex-1 truncate px-1 text-sm font-semibold">{name}</p>
          {access?.downloadUrl ? (
            <a href={access.downloadUrl} className={`${barButton} bg-gt-gold text-gt-navy hover:bg-gt-gold/90`}>
              Download
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => {
              dialogRef.current?.close();
              // Do not rely on the dialog's close event alone to unmount.
              onClose();
            }}
            className={`${barButton} bg-white/10 hover:bg-white/20`}
          >
            Close
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col items-center overflow-auto px-3 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {failed ? (
            <p role="alert" className="m-auto max-w-xs text-center text-sm leading-relaxed">
              This attachment couldn&apos;t be opened. It may have been removed, or your
              connection dropped.
            </p>
          ) : !access ? (
            <p className="m-auto text-sm text-white/80">Opening…</p>
          ) : access.type === "photo" && access.viewUrl ? (
            <div className="relative min-h-0 w-full flex-1">
              <Image src={access.viewUrl} alt={name} fill unoptimized sizes="100vw" className="object-contain" />
            </div>
          ) : access.type === "video" && access.viewUrl ? (
            <video
              src={access.viewUrl}
              controls
              playsInline
              autoPlay
              className="m-auto max-h-full w-full max-w-4xl rounded-lg bg-black"
            />
          ) : access.type === "pdf" && access.viewUrl ? (
            <PdfPages url={access.viewUrl} />
          ) : (
            <div className="m-auto w-full max-w-sm">
              <FileCard kind="file" name={name} size={access.size} />
              <p className="mt-3 text-center text-sm leading-relaxed text-white/80">
                {access.downloadUrl
                  ? "This file type can't be previewed here. Download it to open it."
                  : "The author hasn't turned on downloads for this file."}
              </p>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
