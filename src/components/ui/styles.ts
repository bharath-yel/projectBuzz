/** Shared class names for form controls and buttons (44px+ touch targets). */

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy";

export const buttonPrimary = `inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gt-navy px-5 text-[15px] font-semibold text-white transition-colors hover:bg-gt-navy/90 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

export const buttonSecondary = `inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 text-[15px] font-semibold text-gt-navy transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

export const buttonText = `inline-flex min-h-11 items-center justify-center rounded-lg px-2 text-sm font-semibold text-gt-navy underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline ${focusRing}`;

/** 16px text keeps iOS from zooming the page when a field is focused. */
export const inputClass =
  "block min-h-12 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-foreground placeholder:text-muted/70 focus:border-gt-navy focus:ring-2 focus:ring-gt-navy/15 focus:outline-none aria-invalid:border-red-600";
