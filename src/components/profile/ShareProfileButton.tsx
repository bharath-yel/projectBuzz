"use client";

import { useEffect, useState } from "react";

type ShareProfileButtonProps = {
  /** Path of the profile to share, e.g. /u/<id>. */
  path: string;
  className: string;
};

/** Copies the profile's link and confirms with a short toast. */
export function ShareProfileButton({ path, className }: ShareProfileButtonProps) {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function copy() {
    const base = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/+$/, "");
    try {
      await navigator.clipboard.writeText(`${base}${path}`);
      setToast("Link copied");
    } catch {
      setToast("Couldn't copy the link");
    }
  }

  return (
    <>
      <button type="button" onClick={copy} className={className}>
        Share profile
      </button>
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 md:bottom-8"
      >
        {toast ? (
          <span className="rounded-full bg-gt-navy px-4 py-2.5 text-sm font-semibold text-white shadow-lg">
            {toast}
          </span>
        ) : null}
      </div>
    </>
  );
}
