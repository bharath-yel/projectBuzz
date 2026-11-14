"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/**
 * Spends one of the signed-in user's streak freezes on the week it applies
 * to (last week if it was missed, otherwise this week). The database picks
 * the week and enforces the limit of two per semester.
 */
export async function spendStreakFreeze(): Promise<{ ok: true } | { ok: false; message: string }> {
  await getCurrentUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("use_streak_freeze");
  if (!error) return { ok: true };

  console.error("spendStreakFreeze failed:", error.code, error.message);
  // 23514 carries a message written for people: no week to freeze, or none left.
  return {
    ok: false,
    message:
      error.code === "23514" ? error.message : "We couldn't use a freeze. Try again in a moment.",
  };
}
