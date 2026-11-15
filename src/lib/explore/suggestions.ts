import type { Enums } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type PopularProject = {
  id: string;
  title: string;
  stage: Enums<"project_stage">;
  cover_url: string | null;
  followers: number;
  reactions: number;
};

export type SuggestedPerson = {
  id: string;
  name: string;
  major: string | null;
  avatar_url: string | null;
};

/** How many rows of activity to rank from. Plenty at campus scale. */
const SAMPLE = 2000;

function tally(ids: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return counts;
}

/**
 * Public projects with the most followers and reactions. When nothing has
 * any yet, the newest public projects fill in, so the list is never empty
 * while public projects exist.
 */
export async function getPopularProjects(limit = 4): Promise<PopularProject[]> {
  const supabase = await createClient();
  const [projects, follows, reactions] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, stage, cover_url, created_at")
      .eq("visibility", "public")
      .neq("status", "dropped")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("follows").select("target_id").eq("target_type", "project").limit(SAMPLE),
    supabase
      .from("reactions")
      .select("post:posts!inner(project_id)")
      .order("created_at", { ascending: false })
      .limit(SAMPLE),
  ]);
  if (projects.error) throw new Error(`Could not load projects: ${projects.error.message}`);

  const followers = tally((follows.data ?? []).map((row) => row.target_id));
  const reacted = tally((reactions.data ?? []).map((row) => row.post.project_id));

  // The sort is stable, so ties keep the newest-first order from the query.
  return projects.data
    .map((project) => ({
      id: project.id,
      title: project.title,
      stage: project.stage,
      cover_url: project.cover_url,
      followers: followers.get(project.id) ?? 0,
      reactions: reacted.get(project.id) ?? 0,
    }))
    .sort((a, b) => b.followers * 2 + b.reactions - (a.followers * 2 + a.reactions))
    .slice(0, limit);
}

/**
 * People the viewer does not follow yet: those with the most followers and
 * recent posts first, then the newest members.
 */
export async function getPeopleToFollow(userId: string, limit = 4): Promise<SuggestedPerson[]> {
  const supabase = await createClient();
  const [people, mine, follows, posts] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, major, year, avatar_url")
      .neq("id", userId)
      .order("created_at", { ascending: false })
      .limit(300),
    supabase.from("follows").select("target_id").eq("follower_id", userId).eq("target_type", "user"),
    supabase.from("follows").select("target_id").eq("target_type", "user").limit(SAMPLE),
    supabase
      .from("posts")
      .select("author_id")
      .order("created_at", { ascending: false })
      .limit(SAMPLE),
  ]);
  if (people.error) throw new Error(`Could not load people: ${people.error.message}`);

  const already = new Set((mine.data ?? []).map((row) => row.target_id));
  const followers = tally((follows.data ?? []).map((row) => row.target_id));
  const posted = tally((posts.data ?? []).map((row) => row.author_id));
  const score = (id: string) => (followers.get(id) ?? 0) * 2 + (posted.get(id) ?? 0);

  return people.data
    // Skip people already followed and anyone who has not finished signing up.
    .filter((person) => !already.has(person.id) && person.name.trim() && person.major && person.year)
    .sort((a, b) => score(b.id) - score(a.id))
    .slice(0, limit)
    .map(({ id, name, major, avatar_url }) => ({ id, name, major, avatar_url }));
}
