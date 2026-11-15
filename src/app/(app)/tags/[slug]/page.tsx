import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import { FollowButton } from "@/components/FollowButton";
import { ProjectCards } from "@/components/profile/ProjectGrid";
import { buttonSecondary } from "@/components/ui/styles";
import { getCurrentUser } from "@/lib/auth/session";
import { getProjectsByTag, getTagBySlug } from "@/lib/explore/queries";
import { getFollowerCount, getMyFollows } from "@/lib/follows/queries";
import { TAG_TYPE_LABEL } from "@/lib/projects/constants";
import { withProjectStreaks } from "@/lib/streaks/queries";

export const metadata: Metadata = { title: "Tag" };

const TYPE_NAME = { category: "Category", class: "Class", club: "Club" } as const;

export default function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={<div className="h-96 animate-pulse rounded-2xl border border-border bg-background" aria-busy="true" />}
    >
      {params.then(({ slug }) => (
        <TagView slug={slug} />
      ))}
    </Suspense>
  );
}

async function TagView({ slug }: { slug: string }) {
  const user = await getCurrentUser();
  const tag = /^[a-z0-9-]{1,80}$/.test(slug) ? await getTagBySlug(slug) : null;

  if (!tag) {
    return (
      <div className="flex flex-col items-center gap-4">
        <EmptyState icon="🔍" title="Tag not found">
          That tag doesn&apos;t exist. Browse the full list instead.
        </EmptyState>
        <Link href="/explore" className={buttonSecondary}>
          Browse tags
        </Link>
      </div>
    );
  }

  const [projects, follows, followers] = await Promise.all([
    getProjectsByTag(tag.id).then(withProjectStreaks),
    getMyFollows(user.id),
    getFollowerCount("tag", tag.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-2xl border border-border bg-background p-5">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
          <Link href="/explore" className="hover:underline" aria-label={`All ${TAG_TYPE_LABEL[tag.type].toLowerCase()}`}>
            {TYPE_NAME[tag.type]}
          </Link>
        </p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h1 className="min-w-0 text-2xl font-bold tracking-tight break-words text-gt-navy">
            {tag.name}
          </h1>
          <FollowButton
            type="tag"
            targetId={tag.id}
            initialFollowing={follows.tags.includes(tag.id)}
            label={tag.name}
          />
        </div>
        <p className="mt-2 text-sm text-muted">
          {projects.length} {projects.length === 1 ? "project" : "projects"} · {followers}{" "}
          {followers === 1 ? "follower" : "followers"}
        </p>
        <Link href={`/?tag=${tag.slug}`} className={`${buttonSecondary} mt-4`}>
          See posts in Buzzing Now
        </Link>
      </header>

      {projects.length > 0 ? (
        <ProjectCards projects={projects} />
      ) : (
        <EmptyState icon="🌱" title="No projects here yet">
          Tag a project with {tag.name} and it will be the first one here.
        </EmptyState>
      )}
    </div>
  );
}
