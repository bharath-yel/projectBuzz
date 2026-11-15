import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import { FollowButton } from "@/components/FollowButton";
import {
  ProfileSkeleton,
  ProfileView,
  profileTabFrom,
  type ProfileTab,
} from "@/components/profile/ProfileView";
import { buttonSecondary } from "@/components/ui/styles";
import { getCurrentUser } from "@/lib/auth/session";
import { getProfileById } from "@/lib/explore/queries";
import { getFollowerCount, getFollowingCount, getMyFollows } from "@/lib/follows/queries";
import { getFeedPage } from "@/lib/posts/feed";
import { getProfileProjects } from "@/lib/profile/queries";
import { isUuid } from "@/lib/projects/constants";
import { getActivityWeeks, getUserStreak, withProjectStreaks } from "@/lib/streaks/queries";

export const metadata: Metadata = { title: "Profile" };

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function UserPage({ params, searchParams }: PageProps) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      {Promise.all([params, searchParams]).then(([{ id }, query]) => (
        <UserProfile id={id} tab={profileTabFrom(query.tab)} />
      ))}
    </Suspense>
  );
}

async function UserProfile({ id, tab }: { id: string; tab: ProfileTab }) {
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
          Back to Buzzing Now
        </Link>
      </div>
    );
  }

  const [followers, following, recent, projects, follows, streak, activity] = await Promise.all([
    getFollowerCount("user", profile.id),
    getFollowingCount(profile.id),
    tab === "recent"
      ? getFeedPage({ userId: user.id, tab: "all", tagId: null, cursor: null, authorId: profile.id })
      : undefined,
    getProfileProjects(profile.id).then(withProjectStreaks),
    getMyFollows(user.id),
    getUserStreak(profile.id),
    getActivityWeeks(profile.id),
  ]);

  return (
    <ProfileView
      profile={profile}
      tab={tab}
      basePath={`/u/${profile.id}`}
      recent={recent}
      projects={projects}
      isOwn={false}
      streak={streak}
      followers={followers}
      following={following}
      activity={activity}
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
