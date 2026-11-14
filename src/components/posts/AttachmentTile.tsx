"use client";

import Image from "next/image";
import { useState } from "react";
import { AttachmentViewer } from "@/components/posts/AttachmentViewer";
import { FileCard } from "@/components/posts/FileCard";
import { LinkCard } from "@/components/posts/LinkCard";
import type { TimelineAttachment } from "@/lib/projects/queries";

function formatDuration(seconds: number): string {
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

const TYPE_NAME = { photo: "photo", pdf: "PDF", video: "video", file: "file" } as const;

/**
 * One attachment on a post, drawn from its preview image only. Tapping it
 * opens the full-screen viewer; links open in a new tab.
 */
export function AttachmentTile({ attachment }: { attachment: TimelineAttachment }) {
  const [open, setOpen] = useState(false);

  if (attachment.type === "link") {
    if (!attachment.link || !attachment.fileUrl) return null;
    return (
      <a
        href={attachment.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy"
      >
        <LinkCard preview={attachment.link} />
      </a>
    );
  }

  const { type, file } = attachment;
  const name = file?.name ?? (type === "photo" ? "Photo" : "Attachment");
  // "12 pages" for a PDF, "1:23" for a video, when known.
  const fact =
    type === "pdf" && file?.pages
      ? `${file.pages} ${file.pages === 1 ? "page" : "pages"}`
      : type === "video" && file?.duration
        ? formatDuration(file.duration)
        : null;
  const badge =
    type === "pdf" || type === "video"
      ? [type === "pdf" ? "PDF" : "Video", fact].filter(Boolean).join(" · ")
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Open ${TYPE_NAME[type]}${type === "photo" ? "" : `: ${name}`}`}
        className="block w-full rounded-xl text-left transition-opacity hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy"
      >
        {attachment.previewUrl ? (
          <span className="relative block aspect-[4/3] overflow-hidden rounded-xl border border-border bg-surface">
            <Image
              src={attachment.previewUrl}
              alt={type === "photo" ? "Photo from this update" : ""}
              fill
              unoptimized
              sizes="(min-width: 768px) 560px, 100vw"
              className={type === "pdf" ? "object-contain" : "object-cover"}
            />
            {type === "video" ? (
              <span aria-hidden className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gt-navy/85 text-white">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5.5v13l11-6.5z" />
                  </svg>
                </span>
              </span>
            ) : null}
            {badge ? (
              <span className="absolute bottom-2 left-2 rounded-full bg-gt-navy/85 px-2.5 py-1 text-xs font-semibold text-white">
                {badge}
              </span>
            ) : null}
          </span>
        ) : type === "photo" ? (
          <span className="block rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
            This photo&apos;s preview is missing. Tap to open it.
          </span>
        ) : (
          <FileCard
            kind={type}
            name={name}
            size={file?.size}
            detail={
              type === "file" ? (attachment.allowDownload ? "Tap to download" : "Download off") : fact
            }
          />
        )}
      </button>
      {open ? (
        <AttachmentViewer attachmentId={attachment.id} title={name} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}
