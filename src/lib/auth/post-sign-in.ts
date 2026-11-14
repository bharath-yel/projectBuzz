import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/database.types";

/**
 * A profile is complete once onboarding's required fields are filled in.
 * New accounts start with only a name (taken from the email address).
 */
export function isProfileComplete(
  profile: Pick<Tables<"profiles">, "name" | "major" | "year">,
): boolean {
  return Boolean(profile.name.trim() && profile.major && profile.year);
}

/**
 * Where to send someone who has just signed in: onboarding if their profile
 * is not set up yet, otherwise where they were headed (default: the feed).
 *
 * Every sign-in method ends here. The magic-link callback uses it today; a
 * 6-digit code screen should call it after `verifyOtp` succeeds.
 */
export async function getPostSignInPath(
  supabase: SupabaseClient<Database>,
  userId: string,
  next?: string | null,
): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, major, year")
    .eq("id", userId)
    .maybeSingle();

  if (!profile || !isProfileComplete(profile)) {
    return "/onboarding";
  }
  return next ?? "/";
}
