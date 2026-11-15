import Image from "next/image";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Avatar } from "@/components/Avatar";
import { FollowButton } from "@/components/FollowButton";
import { getCurrentUser } from "@/lib/auth/session";
import { getPeopleToFollow, getPopularProjects } from "@/lib/explore/suggestions";
import { STAGE_LABEL } from "@/lib/projects/constants";
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

const rowLink =
  "flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy";

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

async function PopularProjects() {
  await getCurrentUser();
  // The rail is on every page: a failed lookup shows the empty state, not an error.
  const projects = await getPopularProjects().catch(() => []);
  if (projects.length === 0) {
    return <p>No public projects yet. Start one and it will show up here.</p>;
  }
  return (
    <ul className="-my-1 flex flex-col">
      {projects.map((project) => (
        <li key={project.id}>
          <Link href={`/projects/${project.id}`} className={`${rowLink} group py-1`}>
            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface">
              {project.cover_url ? (
                <Image src={project.cover_url} alt="" fill unoptimized sizes="44px" className="object-cover" />
              ) : (
                <span
                  aria-hidden
                  className="flex h-full w-full items-center justify-center bg-gt-navy text-base font-bold text-gt-gold"
                >
                  {project.title.trim().charAt(0).toUpperCase()}
                </span>
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-gt-navy group-hover:underline">
                {project.title}
              </span>
              <span className="block truncate text-xs text-muted">
                {project.followers > 0
                  ? plural(project.followers, "follower")
                  : project.reactions > 0
                    ? plural(project.reactions, "reaction")
                    : STAGE_LABEL[project.stage]}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function WhoToFollow() {
  const user = await getCurrentUser();
  const people = await getPeopleToFollow(user.id).catch(() => []);
  if (people.length === 0) {
    return <p>You follow everyone here so far. New people will show up as they join.</p>;
  }
  return (
    <ul className="-my-1 flex flex-col">
      {people.map((person) => (
        <li key={person.id} className="flex items-center gap-2 py-1">
          <Link href={`/u/${person.id}`} className={`${rowLink} group`}>
            <Avatar src={person.avatar_url} name={person.name} size={40} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-gt-navy group-hover:underline">
                {person.name}
              </span>
              <span className="block truncate text-xs text-muted">{person.major}</span>
            </span>
          </Link>
          <FollowButton type="user" targetId={person.id} initialFollowing={false} label={person.name} />
        </li>
      ))}
    </ul>
  );
}

const listFallback = <p className="h-36 animate-pulse rounded-lg bg-surface" aria-busy="true" />;

/** Desktop-only side column (1024px and up). */
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
      <RailCard title="Popular projects">
        <Suspense fallback={listFallback}>
          <PopularProjects />
        </Suspense>
      </RailCard>
      <RailCard title="Who to follow">
        <Suspense fallback={listFallback}>
          <WhoToFollow />
        </Suspense>
      </RailCard>
    </aside>
  );
}
