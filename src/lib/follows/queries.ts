import { createClient } from "@/lib/supabase/server";

export type MyFollows = { users: string[]; projects: string[]; tags: string[] };

/** Everything the signed-in user follows, as ids grouped by kind. */
export async function getMyFollows(userId: string): Promise<MyFollows> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("follows")
    .select("target_type, target_id")
    .eq("follower_id", userId);
  if (error) throw new Error(`Could not load follows: ${error.message}`);

  const follows: MyFollows = { users: [], projects: [], tags: [] };
  for (const row of data) {
    if (row.target_type === "user") follows.users.push(row.target_id);
    else if (row.target_type === "project") follows.projects.push(row.target_id);
    else follows.tags.push(row.target_id);
  }
  return follows;
}

/** How many people follow one user, project or tag. */
export async function getFollowerCount(
  type: "user" | "project" | "tag",
  targetId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("target_type", type)
    .eq("target_id", targetId);
  return count ?? 0;
}
