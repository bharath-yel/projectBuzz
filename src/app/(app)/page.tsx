import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

export default function FeedPage() {
  return (
    <>
      <PageHeader title="Feed" subtitle="What Yellow Jackets are building" />
      <EmptyState icon="🐝" title="It's quiet in here">
        Progress updates from projects you follow will show up here. Rough
        drafts and half-working demos are welcome.
      </EmptyState>
    </>
  );
}
