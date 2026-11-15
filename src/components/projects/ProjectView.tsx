import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { PostCard } from "@/components/posts/PostCard";
import { StreakBadge } from "@/components/StreakBadge";
import { buttonPrimary } from "@/components/ui/styles";
import { STAGE_LABEL, STATUS_BOX, STATUS_DOT, STATUS_LABEL } from "@/lib/projects/constants";
import type { ProjectDetail, TimelinePost } from "@/lib/projects/queries";

type ProjectViewProps = {
  project: ProjectDetail;
  posts: TimelinePost[];
  /** True for the owner and contributors: they can post updates. */
  canPost: boolean;
  /** The project's streak, in weeks. */
  streak: number;
  /** Shown beside the title for people who are not on the project, e.g. a follow button. */
  action?: ReactNode;
  /** Shown under the people list: contributor management for the owner, or "leave" for a contributor. */
  manage?: ReactNode;
  /** The owner's control for changing the project's status. */
  statusControl?: ReactNode;
};

export function ProjectView({ project, posts, canPost, action, streak, manage, statusControl }: ProjectViewProps) {
  const people = [
    { ...project.owner, label: "Owner" },
    ...project.contributors.map((person) => ({
      ...person,
      label: person.role_label ?? "Contributor",
    })),
  ];

  return (
    <div className="flex flex-col gap-7">
      <header className="overflow-hidden rounded-2xl border border-border bg-background">
        <div className="relative aspect-[16/9] bg-surface">
          {project.cover_url ? (
            <Image
              src={project.cover_url}
              alt=""
              fill
              unoptimized
              priority
              sizes="(min-width: 768px) 600px, 100vw"
              className="object-cover"
            />
          ) : (
            <div
              aria-hidden
              className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gt-navy to-gt-navy/70 text-6xl font-bold text-gt-gold"
            >
              {project.title.trim().charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-gt-navy ${STATUS_BOX[project.status]}`}
              >
                <span aria-hidden className={`h-2 w-2 rounded-full ${STATUS_DOT[project.status]}`} />
                {STATUS_LABEL[project.status]}
              </span>
              <span className="rounded-full bg-gt-gold/30 px-2.5 py-1 text-gt-navy">
                {STAGE_LABEL[project.stage]}
              </span>
              {project.seeking_collaborators ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gt-navy px-2.5 py-1 text-gt-navy">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
                  <circle cx="9" cy="8" r="3.5" />
                  <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
                  <path d="M19 8v6" />
                  <path d="M16 11h6" />
                </svg>
                  Looking for collaborators
                </span>
              ) : null}
              {project.visibility === "private" ? (
                <span className="rounded-full bg-gt-navy px-2.5 py-1 text-white">Private</span>
              ) : null}
              <StreakBadge weeks={streak} />
            </div>
            {action}
          </div>
          <h1 className="mt-2.5 text-2xl font-bold tracking-tight break-words text-gt-navy">
            {project.title}
          </h1>
          {project.problem ? (
            <p className="mt-2 text-[15px] leading-relaxed break-words whitespace-pre-line text-foreground">
              {project.problem}
            </p>
          ) : null}

          {project.tags.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
              {project.tags.map((tag) => (
                <li key={tag.id}>
                  <Link
                    href={`/tags/${tag.slug}`}
                    className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm text-muted transition-colors hover:border-gt-navy hover:text-gt-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy"
                  >
                    {tag.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-3 border-t border-border pt-4">
            {people.map((person) => (
              <li key={person.id} className="min-w-0">
                <Link
                  href={`/u/${person.id}`}
                  className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy"
                >
                  <Avatar src={person.avatar_url} name={person.name} size={36} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-gt-navy">{person.name}</span>
                    <span className="block truncate text-xs text-muted">{person.label}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {statusControl}
          {manage}
        </div>
      </header>

      <section aria-labelledby="timeline-heading">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="timeline-heading" className="flex items-baseline gap-2 text-lg font-semibold text-gt-navy">
            Timeline
            {posts.length > 0 ? (
              <span className="text-sm font-normal text-muted">{posts.length}</span>
            ) : null}
          </h2>
          {canPost ? (
            <Link href={`/post?project=${project.id}`} className={buttonPrimary}>
              Post an update
            </Link>
          ) : null}
        </div>

        {posts.length > 0 ? (
          <ol className="flex flex-col gap-4">
            {posts.map((post) => (
              <li key={post.id}>
                <PostCard post={post} />
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState icon="🛠️" title="No updates yet">
            {canPost
              ? "Post your first update. A sketch, a broken build or a half-working demo all count."
              : "Nothing posted here yet. Check back soon."}
          </EmptyState>
        )}
      </section>
    </div>
  );
}

export function ProjectSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-7" aria-busy="true" aria-label="Loading project">
      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <div className="aspect-[16/9] bg-surface" />
        <div className="space-y-3 p-5">
          <div className="h-6 w-2/3 rounded bg-surface" />
          <div className="h-4 w-full rounded bg-surface" />
          <div className="h-4 w-1/2 rounded bg-surface" />
        </div>
      </div>
      <div className="h-40 rounded-2xl border border-border bg-background" />
    </div>
  );
}
