type StreakBadgeProps = {
  /** Length of the streak in weeks. Nothing is shown for zero. */
  weeks: number;
  /** "compact" for project cards, "full" for profile and project headers. */
  variant?: "compact" | "full";
};

/** A streak of consecutive weeks with a post. */
export function StreakBadge({ weeks, variant = "full" }: StreakBadgeProps) {
  if (weeks <= 0) return null;
  const label = `${weeks}-week streak`;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-gt-navy font-semibold text-white ${
        variant === "compact" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      }`}
      aria-label={label}
      title={label}
    >
      <span aria-hidden>🔥</span>
      {variant === "compact" ? `${weeks} wk` : label}
    </span>
  );
}
