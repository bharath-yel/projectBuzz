import type { ActivityWeek } from "@/lib/streaks/queries";

const weekFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

function describe(week: ActivityWeek): string {
  const date = weekFormat.format(new Date(`${week.week_start}T00:00:00Z`));
  const posts =
    week.post_count === 0 ? "no posts" : `${week.post_count} post${week.post_count === 1 ? "" : "s"}`;
  const note = week.post_count > 0 ? "" : week.frozen ? ", streak frozen" : week.paused ? ", streak paused" : "";
  return `Week of ${date}: ${posts}${note}`;
}

function squareClass(week: ActivityWeek): string {
  if (week.post_count >= 4) return "bg-gt-navy";
  if (week.post_count >= 2) return "bg-gt-navy/65";
  if (week.post_count === 1) return "bg-gt-navy/35";
  if (week.frozen) return "bg-sky-200";
  if (week.paused) return "border border-dashed border-muted/60 bg-transparent";
  return "bg-surface";
}

/**
 * Week-by-week posting activity, oldest first: one square per week, darker
 * for more posts. Paused and frozen weeks are marked, since they keep a
 * streak alive without a post.
 */
export function ContributionGrid({ weeks }: { weeks: ActivityWeek[] }) {
  const active = weeks.filter((week) => week.post_count > 0).length;
  const legend = [
    { label: "No posts", className: "bg-surface" },
    { label: "1", className: "bg-gt-navy/35" },
    { label: "2–3", className: "bg-gt-navy/65" },
    { label: "4+", className: "bg-gt-navy" },
    { label: "Paused", className: "border border-dashed border-muted/60" },
    { label: "Frozen", className: "bg-sky-200" },
  ];

  return (
    <div>
      <ol
        className="grid gap-1"
        style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}
        aria-label="Posting activity by week, oldest first"
      >
        {weeks.map((week, index) => (
          <li
            key={week.week_start}
            title={describe(week)}
            className={`aspect-square rounded-[4px] ${squareClass(week)} ${
              index === weeks.length - 1 ? "ring-2 ring-gt-gold ring-offset-1" : ""
            }`}
          >
            <span className="sr-only">{describe(week)}</span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-muted">
        Posted in <span className="font-semibold text-gt-navy">{active}</span> of the last{" "}
        {weeks.length} weeks
      </p>
      <ul className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1 text-[11px] text-muted" aria-label="Legend">
        {legend.map((item) => (
          <li key={item.label} className="flex items-center gap-1">
            <span aria-hidden className={`h-2.5 w-2.5 rounded-[3px] ${item.className}`} />
            {item.label}
          </li>
        ))}
        <li className="flex items-center gap-1">
          <span aria-hidden className="h-2.5 w-2.5 rounded-[3px] bg-surface ring-2 ring-gt-gold" />
          This week
        </li>
      </ul>
    </div>
  );
}
