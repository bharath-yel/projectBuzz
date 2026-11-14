const COLUMNS = 20;
const ROWS = 5;

/**
 * Stand-in for the contribution grid. The real one will colour a square for
 * each week with a post; this only reserves the space and sets expectations.
 */
export function ContributionGridPlaceholder() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-background p-4">
      <div
        aria-hidden
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: COLUMNS * ROWS }, (_, index) => (
          <span key={index} className="aspect-square rounded-[3px] bg-surface" />
        ))}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Coming soon: a week-by-week view of posting activity and streaks.
      </p>
    </div>
  );
}
