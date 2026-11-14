"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { isUuid } from "@/lib/projects/constants";
import { createClient } from "@/lib/supabase/server";

type FollowType = "user" | "project" | "tag";

/**
 * Follows or unfollows a user, project or tag for the signed-in user.
 * Row level security checks the target exists and is visible to them.
 */
export async function setFollow(
  type: FollowType,
  targetId: string,
  follow: boolean,
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!["user", "project", "tag"].includes(type) || !isUuid(targetId)) {
    return { ok: false };
  }
  const supabase = await createClient();

  if (follow) {
    const { error } = await supabase
      .from("follows")
      .insert({ target_type: type, target_id: targetId });
    // 23505: already following. That is the state we wanted.
    if (error && error.code !== "23505") {
      console.error("setFollow failed:", error.code, error.message);
      return { ok: false };
    }
    return { ok: true };
  }

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("target_type", type)
    .eq("target_id", targetId);
  if (error) console.error("setFollow failed:", error.code, error.message);
  return { ok: !error };
}
