import type { Metadata } from "next";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Profile" subtitle="Your projects, all in one place" />
      <EmptyState icon="🌱" title="No projects yet">
        Your project grid will live here. Start with an idea or a rough
        prototype and build your portfolio as you go.
      </EmptyState>
    </>
  );
}
