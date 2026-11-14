import type { ReactNode } from "react";

function RailCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-background p-4">
      <h2 className="text-sm font-semibold text-gt-navy">{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}

/** Desktop-only side column (1024px and up). Placeholder cards for now. */
export function RightRail() {
  return (
    <aside
      aria-label="Highlights"
      className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col gap-4 overflow-y-auto px-4 py-8 lg:flex xl:w-80"
    >
      <RailCard title="Your streak">
        <p className="text-2xl font-bold text-gt-navy">
          0 <span className="text-sm font-medium text-muted">weeks</span>
        </p>
        <p className="mt-1">
          Post once a week to start a streak. Rough progress counts.
        </p>
      </RailCard>
      <RailCard title="Trending tags">
        <p>Categories, classes and clubs will trend here as people post.</p>
      </RailCard>
      <RailCard title="Suggested projects">
        <p>Projects you might want to follow will show up here.</p>
      </RailCard>
    </aside>
  );
}
