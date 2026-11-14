"use client";

import { useRef, useState, type ReactNode } from "react";

/**
 * Swipeable row of attachment previews, one per screen. Swipe on touch
 * screens; the arrow buttons do the same job with a mouse or keyboard.
 */
export function AttachmentCarousel({ slides }: { slides: ReactNode[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  if (slides.length === 1) return <>{slides[0]}</>;

  function goTo(next: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(slides.length - 1, next));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
  }

  const arrow =
    "absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/95 text-gt-navy shadow-sm ring-1 ring-border transition-opacity disabled:opacity-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy";

  return (
    <div className="relative" role="group" aria-roledescription="carousel" aria-label="Attachments">
      <div
        ref={trackRef}
        onScroll={(event) => {
          const track = event.currentTarget;
          setIndex(Math.round(track.scrollLeft / Math.max(1, track.clientWidth)));
        }}
        className="flex snap-x snap-mandatory items-center overflow-x-auto overscroll-x-contain rounded-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, slideIndex) => (
          <div
            key={slideIndex}
            className="w-full shrink-0 snap-center"
            aria-label={`${slideIndex + 1} of ${slides.length}`}
          >
            {slide}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => goTo(index - 1)}
        disabled={index === 0}
        aria-label="Previous attachment"
        className={`${arrow} left-2`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m15 6-6 6 6 6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => goTo(index + 1)}
        disabled={index === slides.length - 1}
        aria-label="Next attachment"
        className={`${arrow} right-2`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>

      <div className="mt-2 flex items-center justify-center gap-1.5" aria-hidden>
        {slides.map((_, dot) => (
          <span
            key={dot}
            className={`h-1.5 rounded-full transition-all ${dot === index ? "w-4 bg-gt-navy" : "w-1.5 bg-border"}`}
          />
        ))}
      </div>
    </div>
  );
}
