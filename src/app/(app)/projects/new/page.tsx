import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { getCurrentUser } from "@/lib/auth/session";
import { getAllTags } from "@/lib/projects/queries";

export const metadata: Metadata = { title: "New project" };

export default function NewProjectPage() {
  return (
    <>
      <PageHeader
        title="New project"
        subtitle="It doesn't have to be finished, or even started."
      />
      <div className="rounded-2xl border border-border bg-background p-5">
        <Suspense
          fallback={<div className="h-96 animate-pulse rounded-xl bg-surface" aria-busy="true" />}
        >
          <NewProjectForm />
        </Suspense>
      </div>
    </>
  );
}

async function NewProjectForm() {
  await getCurrentUser();
  const tags = await getAllTags();
  return <ProjectForm tags={tags} />;
}
