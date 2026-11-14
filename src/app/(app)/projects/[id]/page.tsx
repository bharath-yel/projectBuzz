import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import { FollowButton } from "@/components/FollowButton";
import { ProjectSkeleton, ProjectView } from "@/components/projects/ProjectView";
import { buttonSecondary } from "@/components/ui/styles";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyFollows } from "@/lib/follows/queries";
import { isUuid } from "@/lib/projects/constants";
import { getProject, getProjectPosts } from "@/lib/projects/queries";

export const metadata: Metadata = { title: "Project" };

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<ProjectSkeleton />}>
      {params.then(({ id }) => (
        <Project id={id} />
      ))}
    </Suspense>
  );
}

async function Project({ id }: { id: string }) {
  const user = await getCurrentUser();
  const project = isUuid(id) ? await getProject(id) : null;

  if (!project) {
    // Missing and private-to-someone-else look the same on purpose.
    return (
      <div className="flex flex-col items-center gap-4">
        <EmptyState icon="🔍" title="Project not found">
          It may be private, or the link may be wrong.
        </EmptyState>
        <Link href="/" className={buttonSecondary}>
          Back to the feed
        </Link>
      </div>
    );
  }

  const [posts, follows] = await Promise.all([
    getProjectPosts(project.id),
    getMyFollows(user.id),
  ]);
  const canPost =
    project.owner.id === user.id ||
    project.contributors.some((person) => person.id === user.id);

  return (
    <ProjectView
      project={project}
      posts={posts}
      canPost={canPost}
      action={
        canPost ? null : (
          <FollowButton
            type="project"
            targetId={project.id}
            initialFollowing={follows.projects.includes(project.id)}
            label={project.title}
          />
        )
      }
    />
  );
}
