import type { Metadata } from "next";
import { Suspense } from "react";
import {
  ProfileSkeleton,
  ProfileView,
  profileTabFrom,
  type ProfileTab,
} from "@/components/profile/ProfileView";
import { getCurrentProfile } from "@/lib/auth/session";
import { getFollowerCount, getFollowingCount } from "@/lib/follows/queries";
import { getFeedPage } from "@/lib/posts/feed";
import { getProfileProjects } from "@/lib/profile/queries";
import { getActivityWeeks, getMyStreakStatus, withProjectStreaks } from "@/lib/streaks/queries";

export const metadata: Metadata = { title: "Profile" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function ProfilePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      {searchParams.then((query) => (
        <OwnProfile tab={profileTabFrom(query.tab)} />
      ))}
    </Suspense>
  );
}

async function OwnProfile({ tab }: { tab: ProfileTab }) {
  const profile = await getCurrentProfile();
  const [followers, following, projects, status, activity, recent] = await Promise.all([
    getFollowerCount("user", profile.id),
    getFollowingCount(profile.id),
    getProfileProjects(profile.id).then(withProjectStreaks),
    getMyStreakStatus(),
    getActivityWeeks(profile.id),
    tab === "recent"
      ? getFeedPage({ userId: profile.id, tab: "all", tagId: null, cursor: null, authorId: profile.id })
      : undefined,
  ]);
  return (
    <ProfileView
      profile={profile}
      tab={tab}
      basePath="/profile"
      recent={recent}
      projects={projects}
      isOwn
      streak={status.streak}
      followers={followers}
      following={following}
      activity={activity}
    />
  );
}
