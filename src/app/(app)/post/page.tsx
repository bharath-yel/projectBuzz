import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { PostComposer } from "@/components/posts/PostComposer";
import { buttonPrimary } from "@/components/ui/styles";
import { getCurrentUser } from "@/lib/auth/session";
import { getPostableProjects } from "@/lib/projects/queries";

export const metadata: Metadata = { title: "Post" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function PostPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Post" subtitle="Share a progress update" />
      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded-2xl border border-border bg-background" aria-busy="true" />
        }
      >
        {searchParams.then((query) => (
          <Composer project={typeof query.project === "string" ? query.project : null} />
        ))}
      </Suspense>
    </>
  );
}

async function Composer({ project }: { project: string | null }) {
  const user = await getCurrentUser();
  const projects = await getPostableProjects(user.id);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4">
        <EmptyState icon="🌱" title="Start with a project">
          Posts are updates on a project. Create one first; an idea with a
          working title is enough.
        </EmptyState>
        <Link href="/projects/new" className={buttonPrimary}>
          Create a project
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <PostComposer userId={user.id} projects={projects} initialProjectId={project} />
    </div>
  );
}
