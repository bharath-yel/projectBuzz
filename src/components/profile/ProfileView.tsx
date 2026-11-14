import Link from "next/link";
import { ContributionGridPlaceholder } from "@/components/profile/ContributionGridPlaceholder";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProjectGrid } from "@/components/profile/ProjectGrid";
import { buttonSecondary } from "@/components/ui/styles";
import { isProfileComplete } from "@/lib/auth/post-sign-in";
import type { Profile } from "@/lib/auth/session";
import type { ProfileProject } from "@/lib/profile/queries";

type ProfileViewProps = {
  profile: Profile;
  projects: ProfileProject[];
  isOwn: boolean;
};


/** A person's profile. Works for your own profile and, later, anyone else's. */
export function ProfileView({ profile, projects, isOwn }: ProfileViewProps) {
  return (
    <div className="flex flex-col gap-7">
      {isOwn && !isProfileComplete(profile) ? (
        <Link
          href="/onboarding"
          className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-gt-gold/25 px-4 py-3 text-sm font-semibold text-gt-navy transition-colors hover:bg-gt-gold/35"
        >
          Finish setting up your profile
          <span aria-hidden>→</span>
        </Link>
      ) : null}

      <ProfileHeader profile={profile} isOwn={isOwn} />

      <section aria-labelledby="skills-heading">
        <h2 id="skills-heading" className="mb-3 text-lg font-semibold text-gt-navy">
          Skills
        </h2>
        {profile.skills.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <li
                key={skill}
                className="rounded-full bg-gt-gold/25 px-3 py-1.5 text-sm font-medium text-gt-navy"
              >
                {skill}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-relaxed text-muted">
            {isOwn
              ? "No skills listed yet. Add a few so collaborators know what to ask you about."
              : "No skills listed yet."}
          </p>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-baseline gap-2 text-lg font-semibold text-gt-navy">
            Projects
            {projects.length > 0 ? (
              <span className="text-sm font-normal text-muted">{projects.length}</span>
            ) : null}
          </h2>
          {isOwn ? (
            <Link href="/projects/new" className={buttonSecondary}>
              New project
            </Link>
          ) : null}
        </div>
        <ProjectGrid projects={projects} isOwn={isOwn} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gt-navy">Activity</h2>
        <ContributionGridPlaceholder />
      </section>
    </div>
  );
}

/** Shown while the profile loads. Same outline as the real thing. */
export function ProfileSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-7" aria-busy="true" aria-label="Loading profile">
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="aspect-[4/5] rounded-2xl border border-border bg-background" />
        <div className="aspect-[4/5] rounded-2xl border border-border bg-background" />
      </div>
    </div>
  );
}
