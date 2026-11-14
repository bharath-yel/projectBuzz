import type { Metadata } from "next";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Post" };

export default function PostPage() {
  return (
    <>
      <PageHeader title="Post" subtitle="Share a progress update" />
      <EmptyState icon="🛠️" title="Posting is coming soon">
        You&apos;ll be able to attach a photo, video, PDF, link or file to a
        project. It doesn&apos;t have to be finished to be worth sharing.
      </EmptyState>
    </>
  );
}
