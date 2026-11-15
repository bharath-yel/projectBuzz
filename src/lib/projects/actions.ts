"use server";

import { getCurrentUser } from "@/lib/auth/session";
import {
  coverUrlPrefix,
  isUuid,
  PROJECT_LIMITS,
  STAGES,
  STATUSES,
} from "@/lib/projects/constants";
import { createClient } from "@/lib/supabase/server";

export type CreateProjectInput = {
  title: string;
  problem: string;
  stage: string;
  visibility: string;
  tagIds: string[];
};

export type CreateProjectResult =
  | { ok: true; id: string }
  | { ok: false; errors: Partial<Record<"title" | "problem" | "form", string>> };

/**
 * Creates a project owned by the signed-in user, with its tags. The cover is
 * uploaded afterwards (storage only accepts files for a project that exists)
 * and attached with setProjectCover.
 */
export async function createProject(
  input: CreateProjectInput,
): Promise<CreateProjectResult> {
  await getCurrentUser();

  const title = String(input.title ?? "").trim();
  const problem = String(input.problem ?? "").trim();
  const stage = STAGES.find((option) => option.value === input.stage)?.value;
  const visibility = input.visibility === "private" ? "private" : "public";
  const tagIds = [...new Set((input.tagIds ?? []).filter(isUuid))].slice(
    0,
    PROJECT_LIMITS.tags,
  );

  const errors: Extract<CreateProjectResult, { ok: false }>["errors"] = {};
  if (!title) errors.title = "Give your project a title.";
  else if (title.length > PROJECT_LIMITS.title)
    errors.title = `Keep the title under ${PROJECT_LIMITS.title} characters.`;
  if (problem.length > PROJECT_LIMITS.problem)
    errors.problem = `Keep this under ${PROJECT_LIMITS.problem} characters.`;
  if (!stage) errors.form = "Pick a stage.";
  if (Object.keys(errors).length > 0 || !stage) return { ok: false, errors };

  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("projects")
    .insert({ title, problem: problem || null, stage, visibility })
    .select("id")
    .single();

  if (error || !project) {
    console.error("createProject failed:", error?.code, error?.message);
    return {
      ok: false,
      errors: { form: "We couldn't create the project. Try again in a moment." },
    };
  }

  if (tagIds.length > 0) {
    const { error: tagError } = await supabase
      .from("project_tags")
      .insert(tagIds.map((tag_id) => ({ project_id: project.id, tag_id })));
    // The project exists; missing tags are not worth failing over.
    if (tagError) console.error("createProject tags failed:", tagError.message);
  }

  return { ok: true, id: project.id };
}

/** Points a project at a cover image already uploaded to its covers folder. */
export async function setProjectCover(
  projectId: string,
  coverUrl: string,
): Promise<{ ok: boolean }> {
  await getCurrentUser();
  if (!isUuid(projectId) || !coverUrl.startsWith(coverUrlPrefix(projectId))) {
    return { ok: false };
  }
  const supabase = await createClient();
  // Row level security limits this to the owner and contributors.
  const { error } = await supabase
    .from("projects")
    .update({ cover_url: coverUrl })
    .eq("id", projectId);
  if (error) console.error("setProjectCover failed:", error.message);
  return { ok: !error };
}

/** Marks a project active, completed or dropped. Only its owner can. */
export async function setProjectStatus(
  projectId: string,
  status: string,
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  const value = STATUSES.find((option) => option.value === status)?.value;
  if (!isUuid(projectId) || !value) return { ok: false };
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("projects")
    .update({ status: value }, { count: "exact" })
    .eq("id", projectId)
    .eq("owner_id", user.id);
  if (error) console.error("setProjectStatus failed:", error.message);
  return { ok: !error && count === 1 };
}

/** Turns a project's "Looking for collaborators" badge on or off. Only its owner can. */
export async function setSeekingCollaborators(
  projectId: string,
  on: boolean,
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!isUuid(projectId)) return { ok: false };
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("projects")
    .update({ seeking_collaborators: on === true }, { count: "exact" })
    .eq("id", projectId)
    .eq("owner_id", user.id);
  if (error) console.error("setSeekingCollaborators failed:", error.message);
  return { ok: !error && count === 1 };
}
