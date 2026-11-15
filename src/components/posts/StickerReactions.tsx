"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { STICKER_REACTIONS, type ReactionType } from "@/lib/engagement/types";

type StickerProps = {
  counts: Record<ReactionType, number>;
  mine: ReactionType[];
  onToggle: (type: ReactionType) => void;
};

/**
 * The "add a sticker" button and the tray it opens, so a post only ever shows
 * the stickers people have actually used. The tray floats above the nearest
 * positioned ancestor (the action row), not the button: the button moves right
 * as chips appear, and a tray pinned to it would run off a phone screen.
 */
export function StickerPicker({
  mine,
  onToggle,
}: Omit<StickerProps, "counts">) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={root}>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label="React with a sticker"
        title="React with a sticker"
        className={`inline-flex size-11 items-center justify-center rounded-full border text-gt-navy transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy ${
          open
            ? "border-gt-navy bg-surface"
            : "border-border hover:border-gt-navy hover:bg-surface"
        }`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M20.5 11.5a8.5 8.5 0 1 1-8-8" />
          <path d="M8.5 14.5a4.2 4.2 0 0 0 7 0" />
          <path d="M9 9.5h.01M15 9.5h.01" />
          <path d="M19 2v6M16 5h6" />
        </svg>
      </button>

      {open ? (
        <div
          role="group"
          aria-label="Stickers"
          className="absolute bottom-full left-0 z-20 mb-2 grid w-max origin-bottom-left grid-cols-5 gap-1 rounded-3xl border border-border bg-background p-2 shadow-lg motion-safe:animate-[sticker-tray-in_140ms_ease-out]"
        >
          {STICKER_REACTIONS.map(({ type, label, src }) => {
            const active = mine.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onToggle(type);
                  setOpen(false);
                  trigger.current?.focus();
                }}
                aria-pressed={active}
                aria-label={label}
                title={label}
                className={`flex size-12 items-center justify-center rounded-2xl transition-transform focus-visible:outline-2 focus-visible:outline-gt-navy motion-safe:hover:scale-125 motion-safe:active:scale-110 ${
                  active ? "bg-gt-gold/30" : "hover:bg-surface"
                }`}
              >
                <Image src={src} alt="" width={40} height={40} />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/**
 * One chip per sticker that has been used on the post, laid out inline by the
 * parent row. Tap to add or remove yours.
 */
export function StickerChips({ counts, mine, onToggle }: StickerProps) {
  const used = STICKER_REACTIONS.filter(({ type }) => counts[type] > 0);
  if (used.length === 0) return null;
  return (
    <>
      {used.map(({ type, label, src }) => {
        const active = mine.includes(type);
        return (
          <button
            key={type}
            type="button"
            onClick={() => onToggle(type)}
            aria-pressed={active}
            aria-label={`${label}, ${counts[type]}`}
            title={label}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border py-1 pr-3 pl-2 text-sm font-semibold text-gt-navy tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy ${
              active
                ? "border-gt-gold bg-gt-gold/25 hover:bg-gt-gold/35"
                : "border-border bg-background hover:border-gt-navy"
            }`}
          >
            <Image src={src} alt="" width={30} height={30} />
            {counts[type]}
          </button>
        );
      })}
    </>
  );
}
