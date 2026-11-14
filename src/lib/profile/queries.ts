import type { Enums } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type ProfileProject = {
  id: string;
  title: string;
  problem: string | null;
  stage: Enums<"project_stage">;
  visibility: Enums<"project_visibility">;
  cover_url: string | null;
  created_at: string;
  /** How this person relates to the project. */
  role: "owner" | "contributor";
  /** The label the owner gave a contributor, e.g. "Firmware". */
  roleLabel: string | null;
};

const PROJECT_COLUMNS =
  "id, title, problem, stage, visibility, cover_url, created_at" as const;

/**
 * Projects a person owns or contributes to, newest first. Row level security
 * decides what the viewer may see, so someone else's private projects are
 * simply absent from the result.
 */
export async function getProfileProjects(userId: string): Promise<ProfileProject[]> {
  const supabase = await createClient();
  const [owned, contributed] = await Promise.all([
    supabase.from("projects").select(PROJECT_COLUMNS).eq("owner_id", userId),
    supabase
      .from("project_members")
      .select(`role_label, project:projects(${PROJECT_COLUMNS})`)
      .eq("user_id", userId),
  ]);

  if (owned.error) throw new Error(`Could not load projects: ${owned.error.message}`);
  if (contributed.error)
    throw new Error(`Could not load projects: ${contributed.error.message}`);

  const projects: ProfileProject[] = [
    ...owned.data.map((project) => ({
      ...project,
      role: "owner" as const,
      roleLabel: null,
    })),
    ...contributed.data.flatMap((row) =>
      row.project
        ? [{ ...row.project, role: "contributor" as const, roleLabel: row.role_label }]
        : [],
    ),
  ];

  return projects.sort((a, b) => b.created_at.localeCompare(a.created_at));
}
