import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import { FollowButton } from "@/components/FollowButton";
import { ContributorManager, LeaveProjectButton } from "@/components/projects/ContributorManager";
import { CollaboratorToggle } from "@/components/projects/CollaboratorToggle";
import { ProjectStatusPicker } from "@/components/projects/ProjectStatusPicker";
import { ProjectSkeleton, ProjectView } from "@/components/projects/ProjectView";
import { buttonSecondary } from "@/components/ui/styles";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyFollows } from "@/lib/follows/queries";
import { isUuid } from "@/lib/projects/constants";
import { getProject, getProjectPosts } from "@/lib/projects/queries";
import { withProjectStreaks } from "@/lib/streaks/queries";

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
          Back to Buzzing Now
        </Link>
      </div>
    );
  }

  const [posts, follows, [{ streak }]] = await Promise.all([
    getProjectPosts(project.id, user.id),
    getMyFollows(user.id),
    withProjectStreaks([{ id: project.id }]),
  ]);
  const canPost =
    project.owner.id === user.id ||
    project.contributors.some((person) => person.id === user.id);

  return (
    <ProjectView
      project={project}
      posts={posts}
      canPost={canPost}
      streak={streak}
      statusControl={
        project.owner.id === user.id ? (
          <>
            <ProjectStatusPicker projectId={project.id} initial={project.status} />
            <CollaboratorToggle projectId={project.id} initial={project.seeking_collaborators} />
          </>
        ) : null
      }
      manage={
        project.owner.id === user.id ? (
          <ContributorManager projectId={project.id} contributors={project.contributors} />
        ) : canPost ? (
          <LeaveProjectButton projectId={project.id} userId={user.id} />
        ) : null
      }
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
