import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/Avatar";
import { ContributionGrid } from "@/components/profile/ContributionGrid";
import { SettingsMenu } from "@/components/profile/SettingsMenu";
import { ShareProfileButton } from "@/components/profile/ShareProfileButton";
import type { Profile } from "@/lib/auth/session";
import type { ActivityWeek } from "@/lib/streaks/queries";

type ProfileHeaderProps = {
  profile: Profile;
  /** True when the viewer is looking at their own profile. */
  isOwn: boolean;
  /** Shown on someone else's profile, e.g. a follow button. */
  action?: ReactNode;
  /** Personal streak, in weeks. */
  streak: number;
  /** People who follow this person, and people this person follows. */
  followers: number;
  following: number;
  /** How many projects show on this profile. */
  projectCount: number;
  /** Weekly activity for the contribution grid, oldest first. */
  activity: ActivityWeek[];
  /** This person's own projects that are looking for collaborators. */
  seeking: { id: string; title: string }[];
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy";

/** Header buttons: 44px tall, narrower than the form buttons so three fit on a phone. */
const headerButton = `inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold whitespace-nowrap text-gt-navy transition-colors hover:bg-surface sm:flex-none ${focusRing}`;

const labelledLink = `inline-flex min-h-11 max-w-full min-w-0 items-center gap-1.5 rounded-lg text-sm font-medium text-gt-navy underline-offset-4 hover:underline ${focusRing}`;

const linkIcon = "shrink-0 text-muted";

/** "https://www.site.dev/about" becomes "site.dev". */
function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Website";
  }
}

const addChip = `inline-flex min-h-11 items-center rounded-lg text-sm font-medium text-muted underline-offset-4 hover:text-gt-navy hover:underline ${focusRing}`;

const sectionLabel = "text-[11px] font-semibold tracking-wider text-muted uppercase";

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <dt className="order-2 text-muted">{label}</dt>
      <dd className="font-semibold text-gt-navy">{value}</dd>
    </div>
  );
}

/** Email, LinkedIn, GitHub and website: an icon and a label each, on one wrapping row. */
function SocialLinks({ profile, isOwn }: { profile: Profile; isOwn: boolean }) {
  const hasLinks = Boolean(profile.linkedin_url || profile.github_url || profile.website_url);
  return (
    <ul className="-my-1.5 flex flex-wrap items-center gap-x-5">
      <li className="max-w-full min-w-0">
        <a href={`mailto:${profile.gt_email}`} className={labelledLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={linkIcon}>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
          <span className="truncate">{profile.gt_email}</span>
        </a>
      </li>
      {profile.linkedin_url ? (
        <li>
          <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className={labelledLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden className={linkIcon}>
              <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4V21H3V9.75Zm6.5 0h3.8v1.6c.6-1.1 2-1.9 3.9-1.9 3.3 0 4.3 2.1 4.3 5.2V21h-4v-5.6c0-1.5-.5-2.5-1.9-2.5-1.5 0-2.1 1-2.1 2.5V21h-4V9.75Z" />
            </svg>
            LinkedIn
          </a>
        </li>
      ) : null}
      {profile.github_url ? (
        <li>
          <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className={labelledLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden className={linkIcon}>
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.13v3.16c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
            </svg>
            GitHub
          </a>
        </li>
      ) : null}
      {profile.website_url ? (
        <li>
          <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className={labelledLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={linkIcon}>
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span className="truncate">{hostLabel(profile.website_url)}</span>
          </a>
        </li>
      ) : null}
      {isOwn && !hasLinks ? (
        <li>
          <Link href="/profile/edit#linkedin" className={addChip}>
            + Add links
          </Link>
        </li>
      ) : null}
    </ul>
  );
}

export function ProfileHeader({
  profile,
  isOwn,
  action,
  streak,
  followers,
  following,
  projectCount,
  activity,
  seeking,
}: ProfileHeaderProps) {
  return (
    <header className="rounded-2xl border border-border bg-background p-4 sm:p-5">
      {/* Phone: one column. Desktop: details left, activity right, buttons under the details. */}
      <div className="grid gap-y-3 lg:grid-cols-[minmax(0,1fr)_17rem] lg:grid-rows-[auto_1fr] lg:gap-x-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3.5">
            <Avatar src={profile.avatar_url} name={profile.name} size={72} />
            <div className="min-w-0">
            <h1 className="text-xl leading-tight font-bold tracking-tight break-words text-gt-navy sm:text-2xl">
              {profile.name || "Unnamed Yellow Jacket"}
            </h1>
            {profile.major || profile.year ? (
              <p className="mt-0.5 text-sm text-muted">
                {profile.major}
                {profile.major && profile.year ? " · " : null}
                {profile.year ? <span className="whitespace-nowrap">{profile.year}</span> : null}
              </p>
            ) : null}
              <dl className="mt-1 flex flex-wrap gap-x-4 text-sm">
                <Stat value={followers} label={followers === 1 ? "follower" : "followers"} />
                <Stat value={following} label="following" />
                <Stat value={projectCount} label={projectCount === 1 ? "project" : "projects"} />
              </dl>
            </div>
          </div>

          <div className="mt-3 flex min-w-0 flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {profile.bio ? (
                <p className="max-w-full min-w-0 text-[15px] leading-snug whitespace-pre-line text-foreground">
                  {profile.bio}
                </p>
              ) : isOwn ? (
                <p className="max-w-full min-w-0 text-sm text-muted">
                  <Link
                    href="/profile/edit#bio"
                    className="font-medium text-gt-navy underline-offset-4 hover:underline"
                  >
                    Add a short bio
                  </Link>{" "}
                  so people know what you&apos;re into.
                </p>
              ) : null}

              {profile.skills.length > 0 ? (
                <ul aria-label="Skills" className="flex max-w-full min-w-0 flex-wrap gap-1.5">
                  {profile.skills.map((skill) => (
                    <li
                      key={skill}
                      className="max-w-full rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium break-words text-gt-navy"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              ) : isOwn ? (
                <Link href="/profile/edit#skills" className={`${addChip} -my-2`}>
                  + Add skills
                </Link>
              ) : null}
            </div>

            <SocialLinks profile={profile} isOwn={isOwn} />
          </div>
        </div>

        <section
          aria-label="Weekly activity"
          className="border-t border-border pt-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6"
        >
          <h2 className={sectionLabel}>Weekly activity</h2>
          <p className="mt-0.5 mb-2 text-lg leading-tight font-bold text-gt-navy">
            {streak > 0 ? (
              <>
                <span aria-hidden>🔥 </span>
                {streak}-week streak
              </>
            ) : (
              <span className="text-sm font-medium text-muted">
                {isOwn ? "Post this week to start a streak" : "No streak right now"}
              </span>
            )}
          </p>
          <ContributionGrid weeks={activity} />
        </section>

        <div className="flex items-center gap-2 self-start lg:col-start-1 lg:row-start-2">
          {isOwn ? (
            <Link href="/profile/edit" className={headerButton}>
              Edit profile
            </Link>
          ) : (
            action
          )}
          <ShareProfileButton path={`/u/${profile.id}`} className={headerButton} />
          {isOwn ? <SettingsMenu /> : null}
        </div>
      </div>

      {seeking.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 rounded-xl border-l-4 border-gt-navy bg-surface px-3.5">
          <p className={sectionLabel}>Looking for collaborators on</p>
          <ul className="flex min-w-0 flex-wrap gap-x-4">
            {seeking.map((project) => (
              <li key={project.id} className="min-w-0">
                <Link
                  href={`/projects/${project.id}`}
                  className={`inline-flex min-h-11 max-w-full items-center rounded-lg text-sm font-semibold text-gt-navy underline-offset-4 hover:underline ${focusRing}`}
                >
                  <span className="truncate">{project.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </header>
  );
}
