import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/EmptyState";
import { FeedList } from "@/components/feed/FeedList";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProjectGrid } from "@/components/profile/ProjectGrid";
import { buttonPrimary, buttonSecondary } from "@/components/ui/styles";
import { isProfileComplete } from "@/lib/auth/post-sign-in";
import type { Profile } from "@/lib/auth/session";
import type { FeedPage } from "@/lib/posts/feed";
import type { ProfileProject } from "@/lib/profile/queries";
import type { ActivityWeek } from "@/lib/streaks/queries";

export type ProfileTab = "recent" | "projects";

/** Reads the tab from a page's search params. Recent is the default. */
export function profileTabFrom(value: string | string[] | undefined): ProfileTab {
  return value === "projects" ? "projects" : "recent";
}

type ProfileViewProps = {
  profile: Profile;
  /** Which tab is showing under the profile card. */
  tab: ProfileTab;
  /** This profile's URL, used for the tab links. */
  basePath: string;
  /** First page of the person's posts. Only loaded on the Recent tab. */
  recent?: FeedPage;
  projects: (ProfileProject & { streak?: number })[];
  isOwn: boolean;
  /** Personal streak, in weeks. */
  streak: number;
  followers: number;
  following: number;
  /** Weekly activity for the contribution grid, oldest first. */
  activity: ActivityWeek[];
  /** Shown in the header on someone else's profile, e.g. a follow button. */
  action?: ReactNode;
};

/** A person's profile. Works for your own profile and, later, anyone else's. */
export function ProfileView({
  profile,
  tab,
  basePath,
  recent,
  projects,
  isOwn,
  action,
  streak,
  followers,
  following,
  activity,
}: ProfileViewProps) {
  const tabs: { value: ProfileTab; label: string; href: string }[] = [
    { value: "recent", label: "Recent", href: basePath },
    { value: "projects", label: "Projects", href: `${basePath}?tab=projects` },
  ];

  // data-wide: the app shell widens the main column for this screen on desktop.
  return (
    <div data-wide className="flex flex-col gap-3">
      {isOwn && !isProfileComplete(profile) ? (
        <Link
          href="/onboarding"
          className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-gt-gold/25 px-4 py-3 text-sm font-semibold text-gt-navy transition-colors hover:bg-gt-gold/35"
        >
          Finish setting up your profile
          <span aria-hidden>→</span>
        </Link>
      ) : null}

      {/* Profile card on top, tabs and posts underneath, at every width. */}
      <div className="flex flex-col gap-3">
        <div>
          <ProfileHeader
            profile={profile}
            isOwn={isOwn}
            action={action}
            streak={streak}
            followers={followers}
            following={following}
            projectCount={projects.length}
            activity={activity}
            seeking={projects.filter(
              (project) => project.role === "owner" && project.seeking_collaborators,
            )}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-col gap-3">
            <nav
              aria-label="Profile sections"
              className="grid grid-cols-2 rounded-xl border border-border bg-background p-1"
            >
              {tabs.map((option) => (
                <Link
                  key={option.value}
                  href={option.href}
                  scroll={false}
                  aria-current={tab === option.value ? "page" : undefined}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-lg text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy ${
                    tab === option.value ? "bg-gt-navy text-white" : "text-muted hover:text-gt-navy"
                  }`}
                >
                  {option.label}
                  {option.value === "projects" && projects.length > 0 ? (
                    <span className="text-sm font-normal opacity-75">{projects.length}</span>
                  ) : null}
                </Link>
              ))}
            </nav>

            {tab === "recent" ? (
              recent && recent.posts.length > 0 ? (
                <FeedList
                  initialPosts={recent.posts}
                  initialCursor={recent.nextCursor}
                  tab="all"
                  tagId={null}
                  authorId={profile.id}
                />
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <EmptyState icon="🐝" title="No posts yet">
                    {isOwn
                      ? "Your updates will show up here. Rough drafts and half-working demos are welcome."
                      : "Nothing posted yet. Check back soon."}
                  </EmptyState>
                  {isOwn ? (
                    <Link href="/post" className={buttonPrimary}>
                      Post an update
                    </Link>
                  ) : null}
                </div>
              )
            ) : (
              <section aria-label="Projects" className="flex flex-col gap-3">
                {isOwn ? (
                  <Link href="/projects/new" className={`${buttonSecondary} self-end`}>
                    New project
                  </Link>
                ) : null}
                <ProjectGrid projects={projects} isOwn={isOwn} />
              </section>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

/** Shown while the profile loads. Same outline as the real thing. */
export function ProfileSkeleton() {
  return (
    <div
      data-wide
      className="flex animate-pulse flex-col gap-3"
      aria-busy="true"
      aria-label="Loading profile"
    >
      <div className="rounded-2xl border border-border bg-background p-5">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 rounded-full bg-surface" />
          <div className="flex-1 space-y-2.5">
            <div className="h-6 w-40 max-w-full rounded bg-surface" />
            <div className="h-4 w-56 max-w-full rounded bg-surface" />
          </div>
        </div>
        <div className="mt-5 h-4 w-full rounded bg-surface" />
        <div className="mt-2 h-4 w-2/3 rounded bg-surface" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-13 rounded-xl border border-border bg-background" />
        <div className="h-72 rounded-2xl border border-border bg-background" />
      </div>
    </div>
  );
}
