import type { Enums } from "@/lib/database.types";
import type { Tag } from "@/lib/projects/queries";
import { createClient } from "@/lib/supabase/server";

export type ProjectSummary = {
  id: string;
  title: string;
  stage: Enums<"project_stage">;
  status: Enums<"project_status">;
  seeking_collaborators: boolean;
  visibility: Enums<"project_visibility">;
  cover_url: string | null;
  created_at: string;
};

const SUMMARY = "id, title, stage, status, seeking_collaborators, visibility, cover_url, created_at" as const;

/** Newest public projects, optionally narrowed by a title search. */
export async function getPublicProjects(search: string | null): Promise<ProjectSummary[]> {
  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select(SUMMARY)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(30);
  // Strip characters that have meaning in a LIKE pattern or a filter string.
  const term = search?.replace(/[%_,()\\]/g, " ").trim();
  if (term) query = query.ilike("title", `%${term}%`);

  const { data, error } = await query;
  if (error) throw new Error(`Could not load projects: ${error.message}`);
  return data;
}

export type PersonResult = {
  id: string;
  name: string;
  major: string | null;
  year: string | null;
  avatar_url: string | null;
};

/** People whose name matches the search. Empty when there is no search. */
export async function searchPeople(search: string | null): Promise<PersonResult[]> {
  // Strip characters that have meaning in a LIKE pattern or a filter string.
  const term = search?.replace(/[%_,()\\]/g, " ").trim();
  if (!term) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, major, year, avatar_url")
    .ilike("name", `%${term}%`)
    .order("name")
    .limit(12);
  if (error) throw new Error(`Could not search people: ${error.message}`);
  return data;
}

export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, type, name, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Could not load the tag: ${error.message}`);
  return data;
}

/** Public projects carrying a tag, newest first. */
export async function getProjectsByTag(tagId: string): Promise<ProjectSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_tags")
    .select(`project:projects!inner(${SUMMARY})`)
    .eq("tag_id", tagId)
    .eq("project.visibility", "public")
    .limit(60);
  if (error) throw new Error(`Could not load projects: ${error.message}`);
  return data
    .map((row) => row.project)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Any signed-in user's profile row (profiles are visible to all signed-in users). */
export async function getProfileById(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(`Could not load the profile: ${error.message}`);
  return data;
}
