import { redirect } from "next/navigation";
import { cache } from "react";
import type { Tables } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type Profile = Tables<"profiles">;

/**
 * The signed-in user, or a redirect to /login. Verifies the session token;
 * it does not just trust the cookie. Reads the request, so call it from a
 * component inside a <Suspense> boundary. Deduped per request.
 */
export const getCurrentUser = cache(async (): Promise<{ id: string }> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) {
    redirect("/login");
  }
  return { id: userId };
});

/** The signed-in user's profile row. Deduped per request. */
export const getCurrentProfile = cache(async (): Promise<Profile> => {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load your profile: ${error.message}`);
  }
  if (!data) {
    // A session without a profile row means the account was removed.
    redirect("/login");
  }
  return data;
});
