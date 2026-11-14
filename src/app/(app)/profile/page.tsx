import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfileSkeleton, ProfileView } from "@/components/profile/ProfileView";
import { getCurrentProfile } from "@/lib/auth/session";
import { getProfileProjects } from "@/lib/profile/queries";
import { getActivityWeeks, getMyStreakStatus, withProjectStreaks } from "@/lib/streaks/queries";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <OwnProfile />
    </Suspense>
  );
}

async function OwnProfile() {
  const profile = await getCurrentProfile();
  const [projects, status, activity] = await Promise.all([
    getProfileProjects(profile.id).then(withProjectStreaks),
    getMyStreakStatus(),
    getActivityWeeks(profile.id),
  ]);
  return (
    <ProfileView
      profile={profile}
      projects={projects}
      isOwn
      streak={status.streak}
      activity={activity}
      freeze={status}
    />
  );
}
