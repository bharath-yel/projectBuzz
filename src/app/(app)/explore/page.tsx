import type { Metadata } from "next";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Explore" };

export default function ExplorePage() {
  return (
    <>
      <PageHeader
        title="Explore"
        subtitle="Browse projects by category, class and club"
      />
      <EmptyState icon="🧭" title="Nothing to explore yet">
        Projects from across campus will appear here once people start
        posting. Yours could be the first.
      </EmptyState>
    </>
  );
}
