"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { isUuid } from "@/lib/projects/constants";
import { createClient } from "@/lib/supabase/server";

const ROLE_LABEL_MAX = 60;

export type UserResult = {
  id: string;
  name: string;
  avatar_url: string | null;
  major: string | null;
  gt_email: string;
};

type Result = { ok: true } | { ok: false; message: string };

/**
 * Finds Georgia Tech users by name or email, for adding to a project.
 * Leaves out the owner and people already on the project.
 */
export async function searchUsersForProject(
  projectId: string,
  query: string,
): Promise<UserResult[]> {
  await getCurrentUser();
  // Drop characters that have meaning in a LIKE pattern or a filter string.
  const term = String(query ?? "").replace(/[%_,()\\*"]/g, " ").trim().slice(0, 60);
  if (!isUuid(projectId) || term.length < 2) return [];

  const supabase = await createClient();
  const [{ data: project }, { data: members }] = await Promise.all([
    supabase.from("projects").select("owner_id").eq("id", projectId).maybeSingle(),
    supabase.from("project_members").select("user_id").eq("project_id", projectId),
  ]);
  if (!project) return [];
  const exclude = [project.owner_id, ...(members ?? []).map((member) => member.user_id)];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, avatar_url, major, gt_email")
    .or(`name.ilike.%${term}%,gt_email.ilike.%${term}%`)
    .not("id", "in", `(${exclude.join(",")})`)
    .order("name")
    .limit(8);
  if (error) {
    console.error("searchUsersForProject failed:", error.message);
    return [];
  }
  return data;
}

/** Adds a contributor. Row level security allows this for the project owner only. */
export async function addContributor(input: {
  projectId: string;
  userId: string;
  roleLabel: string;
}): Promise<Result> {
  await getCurrentUser();
  if (!isUuid(input.projectId) || !isUuid(input.userId)) {
    return { ok: false, message: "Pick someone to add." };
  }
  const roleLabel = String(input.roleLabel ?? "").trim();
  if (roleLabel.length > ROLE_LABEL_MAX) {
    return { ok: false, message: `Keep the role under ${ROLE_LABEL_MAX} characters.` };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("project_members").insert({
    project_id: input.projectId,
    user_id: input.userId,
    role_label: roleLabel || null,
  });
  if (error) {
    console.error("addContributor failed:", error.code, error.message);
    return {
      ok: false,
      message:
        error.code === "23505"
          ? "They're already on this project."
          : error.code === "42501"
            ? "Only the project owner can add contributors."
            : "We couldn't add them. Try again in a moment.",
    };
  }
  return { ok: true };
}

/**
 * Removes a contributor. The owner can remove anyone; a contributor can
 * remove themselves (leave). Their past posts stay on the project.
 */
export async function removeContributor(projectId: string, userId: string): Promise<Result> {
  await getCurrentUser();
  if (!isUuid(projectId) || !isUuid(userId)) return { ok: false, message: "Nothing to remove." };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("project_members")
    .delete({ count: "exact" })
    .eq("project_id", projectId)
    .eq("user_id", userId);
  if (error || count !== 1) {
    if (error) console.error("removeContributor failed:", error.code, error.message);
    return { ok: false, message: "We couldn't remove them. Try again in a moment." };
  }
  return { ok: true };
}
