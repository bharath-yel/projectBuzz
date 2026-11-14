import type { Enums } from "@/lib/database.types";

/** Limits mirror the check constraints on public.projects. */
export const PROJECT_LIMITS = {
  title: 120,
  problem: 2000,
  tags: 8,
} as const;

export const STAGES: { value: Enums<"project_stage">; label: string; hint: string }[] = [
  { value: "idea", label: "Idea", hint: "Still on paper" },
  { value: "prototype", label: "Prototype", hint: "Something works" },
  { value: "launched", label: "Launched", hint: "People use it" },
];

export const STAGE_LABEL: Record<Enums<"project_stage">, string> = {
  idea: "Idea",
  prototype: "Prototype",
  launched: "Launched",
};

export const TAG_TYPE_LABEL: Record<Enums<"tag_type">, string> = {
  category: "Categories",
  class: "Classes",
  club: "Clubs",
};

export const COVER_BUCKET = "covers";

/** Public URL prefix for one project's cover folder. */
export function coverUrlPrefix(projectId: string): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${COVER_BUCKET}/${projectId}/`;
}

/**
 * The handle used to pick a project by typing `#` in the composer, derived
 * from its title: "Low-cost Prosthetic Hand" becomes "low-cost-prosthetic-hand".
 */
export function projectSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}
