import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { getCurrentProfile } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Set up your profile" };

export default function OnboardingPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-gt-navy">
        Set up your profile
      </h1>
      <p className="mt-1.5 mb-6 text-sm leading-relaxed text-muted">
        This is how other Yellow Jackets will see you. You can change any of it
        later.
      </p>
      <Suspense fallback={<FormSkeleton />}>
        <OnboardingForm />
      </Suspense>
    </>
  );
}

async function OnboardingForm() {
  const profile = await getCurrentProfile();
  // New accounts get a placeholder name from their email address. Start the
  // field empty instead so people type their real name.
  const placeholderName = profile.gt_email.split("@")[0];

  return (
    <ProfileForm
      mode="onboarding"
      userId={profile.id}
      initial={{
        name: profile.name === placeholderName ? "" : profile.name,
        major: profile.major ?? "",
        year: profile.year ?? "",
        bio: profile.bio ?? "",
        skills: profile.skills,
        avatarUrl: profile.avatar_url,
      }}
    />
  );
}

function FormSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-5" aria-busy="true" aria-label="Loading">
      <div className="h-20 w-20 rounded-full bg-surface" />
      <div className="h-12 rounded-xl bg-surface" />
      <div className="h-12 rounded-xl bg-surface" />
      <div className="h-12 rounded-xl bg-surface" />
      <div className="h-24 rounded-xl bg-surface" />
    </div>
  );
}
