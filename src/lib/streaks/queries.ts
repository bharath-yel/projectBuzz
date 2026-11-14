import { createClient } from "@/lib/supabase/server";

export type ActivityWeek = {
  /** The Monday of the week, as YYYY-MM-DD. */
  week_start: string;
  post_count: number;
  paused: boolean;
  frozen: boolean;
};

export type MyStreakStatus = {
  streak: number;
  freezesLeft: number;
  /** The week a freeze would cover right now, or null if none needs one. */
  freezableWeek: string | null;
};

/** Someone's personal streak, in weeks. */
export async function getUserStreak(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("user_streak", { p_user_id: userId });
  if (error) throw new Error(`Could not load the streak: ${error.message}`);
  return data ?? 0;
}

/** The signed-in user's streak and freeze allowance. */
export async function getMyStreakStatus(): Promise<MyStreakStatus> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_streak_status");
  if (error) throw new Error(`Could not load your streak: ${error.message}`);
  const row = data?.[0];
  return {
    streak: row?.streak ?? 0,
    freezesLeft: row?.freezes_left ?? 0,
    freezableWeek: row?.freezable_week ?? null,
  };
}

/** One entry per week for the contribution grid, oldest first. */
export async function getActivityWeeks(userId: string, weeks = 26): Promise<ActivityWeek[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("user_activity_weeks", {
    p_user_id: userId,
    p_weeks: weeks,
  });
  if (error) throw new Error(`Could not load activity: ${error.message}`);
  return data ?? [];
}

/** Adds each project's streak (in weeks) to a list of projects, in one query. */
export async function withProjectStreaks<Project extends { id: string }>(
  projects: Project[],
): Promise<(Project & { streak: number })[]> {
  if (projects.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("project_streaks", {
    p_project_ids: projects.map((project) => project.id),
  });
  // A missing streak should not take the page down: show the cards without one.
  if (error) console.error("project_streaks failed:", error.message);
  const streaks = new Map((data ?? []).map((row) => [row.project_id, row.streak]));
  return projects.map((project) => ({ ...project, streak: streaks.get(project.id) ?? 0 }));
}
