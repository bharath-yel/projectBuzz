"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  avatarUrlPrefix,
  cleanSkills,
  normalizeGitHub,
  normalizeLinkedIn,
  normalizeWebsite,
  PROFILE_LIMITS,
  YEAR_OPTIONS,
} from "@/lib/profile/constants";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = {
  errors: Partial<Record<"name" | "major" | "year" | "bio" | "linkedin" | "github" | "website" | "form", string>>;
};

function parseSkills(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? cleanSkills(parsed) : [];
  } catch {
    return [];
  }
}

/**
 * Saves the signed-in user's profile. Used by onboarding (then goes to the
 * feed) and by Edit profile (then goes back to the profile).
 */
export async function saveProfile(
  _previous: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await getCurrentUser();

  const name = String(formData.get("name") ?? "").trim();
  const major = String(formData.get("major") ?? "").trim();
  const year = String(formData.get("year") ?? "");
  const bio = String(formData.get("bio") ?? "").trim();
  const linkedinInput = String(formData.get("linkedin") ?? "").trim();
  const linkedin = linkedinInput ? normalizeLinkedIn(linkedinInput) : null;
  const githubInput = String(formData.get("github") ?? "").trim();
  const github = githubInput ? normalizeGitHub(githubInput) : null;
  const websiteInput = String(formData.get("website") ?? "").trim();
  const website = websiteInput ? normalizeWebsite(websiteInput) : null;
  const skills = parseSkills(formData.get("skills"));
  const avatarUrl = String(formData.get("avatar_url") ?? "");
  const mode = formData.get("mode") === "edit" ? "edit" : "onboarding";

  const errors: ProfileFormState["errors"] = {};
  if (!name) errors.name = "Add your name.";
  else if (name.length > PROFILE_LIMITS.name)
    errors.name = `Keep your name under ${PROFILE_LIMITS.name} characters.`;
  if (!major) errors.major = "Add your major.";
  else if (major.length > PROFILE_LIMITS.major)
    errors.major = `Keep your major under ${PROFILE_LIMITS.major} characters.`;
  if (!(YEAR_OPTIONS as readonly string[]).includes(year))
    errors.year = "Pick your year.";
  if (bio.length > PROFILE_LIMITS.bio)
    errors.bio = `Keep your bio under ${PROFILE_LIMITS.bio} characters.`;
  if (linkedinInput && !linkedin)
    errors.linkedin = "Paste your LinkedIn profile link, like linkedin.com/in/yourname.";
  if (githubInput && !github)
    errors.github = "Paste your GitHub profile link, like github.com/yourname.";
  if (websiteInput && !website)
    errors.website = "Enter a web address, like yourname.dev.";
  if (Object.keys(errors).length > 0) return { errors };

  // Only accept an avatar that lives in this user's own avatar folder.
  const avatar =
    avatarUrl && avatarUrl.startsWith(avatarUrlPrefix(user.id)) ? avatarUrl : null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      name,
      major,
      year,
      bio: bio || null,
      linkedin_url: linkedin,
      github_url: github,
      website_url: website,
      skills,
      avatar_url: avatar,
    })
    .eq("id", user.id);

  if (error) {
    console.error("saveProfile failed:", error.code, error.message);
    return {
      errors: { form: "We couldn't save your profile. Try again in a moment." },
    };
  }

  redirect(mode === "edit" ? "/profile" : "/");
}
