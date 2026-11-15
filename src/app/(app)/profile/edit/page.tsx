import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { getCurrentProfile } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Edit profile" };

export default function EditProfilePage() {
  return (
    <>
      <PageHeader title="Edit profile" />
      <div className="rounded-2xl border border-border bg-background p-5">
        <Suspense
          fallback={
            <div className="h-96 animate-pulse rounded-xl bg-surface" aria-busy="true" />
          }
        >
          <EditForm />
        </Suspense>
      </div>
    </>
  );
}

async function EditForm() {
  const profile = await getCurrentProfile();
  return (
    <ProfileForm
      mode="edit"
      userId={profile.id}
      initial={{
        name: profile.name,
        major: profile.major ?? "",
        year: profile.year ?? "",
        bio: profile.bio ?? "",
        linkedin: profile.linkedin_url ?? "",
        github: profile.github_url ?? "",
        website: profile.website_url ?? "",
        skills: profile.skills,
        avatarUrl: profile.avatar_url,
      }}
    />
  );
}
