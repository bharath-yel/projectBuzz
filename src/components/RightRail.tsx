import { Suspense, type ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyStreakStatus } from "@/lib/streaks/queries";

function RailCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-background p-4">
      <h2 className="text-sm font-semibold text-gt-navy">{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}

async function MyStreak() {
  await getCurrentUser();
  // The rail is on every page: a failed lookup shows zero instead of an error.
  const { streak } = await getMyStreakStatus().catch(() => ({ streak: 0 }));
  return (
    <>
      <p className="text-2xl font-bold text-gt-navy">
        {streak}{" "}
        <span className="text-sm font-medium text-muted">{streak === 1 ? "week" : "weeks"}</span>
      </p>
      <p className="mt-1">
        {streak > 0
          ? "Post once a week to keep it going. Rough progress counts."
          : "Post once a week to start a streak. Rough progress counts."}
      </p>
    </>
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
        <Suspense
          fallback={<p className="h-14 animate-pulse rounded-lg bg-surface" aria-busy="true" />}
        >
          <MyStreak />
        </Suspense>
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
