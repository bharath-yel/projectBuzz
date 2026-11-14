import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import { FollowButton } from "@/components/FollowButton";
import { ProfileSkeleton, ProfileView } from "@/components/profile/ProfileView";
import { buttonSecondary } from "@/components/ui/styles";
import { getCurrentUser } from "@/lib/auth/session";
import { getProfileById } from "@/lib/explore/queries";
import { getMyFollows } from "@/lib/follows/queries";
import { getProfileProjects } from "@/lib/profile/queries";
import { isUuid } from "@/lib/projects/constants";

export const metadata: Metadata = { title: "Profile" };

export default function UserPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      {params.then(({ id }) => (
        <UserProfile id={id} />
      ))}
    </Suspense>
  );
}

async function UserProfile({ id }: { id: string }) {
  const user = await getCurrentUser();
  if (id === user.id) redirect("/profile");

  const profile = isUuid(id) ? await getProfileById(id) : null;
  if (!profile) {
    return (
      <div className="flex flex-col items-center gap-4">
        <EmptyState icon="🔍" title="Profile not found">
          That person isn&apos;t on ProjectBuzz, or the link is wrong.
        </EmptyState>
        <Link href="/" className={buttonSecondary}>
          Back to the feed
        </Link>
      </div>
    );
  }

  const [projects, follows] = await Promise.all([
    getProfileProjects(profile.id),
    getMyFollows(user.id),
  ]);

  return (
    <ProfileView
      profile={profile}
      projects={projects}
      isOwn={false}
      action={
        <FollowButton
          type="user"
          targetId={profile.id}
          initialFollowing={follows.users.includes(profile.id)}
          label={profile.name}
        />
      }
    />
  );
}
