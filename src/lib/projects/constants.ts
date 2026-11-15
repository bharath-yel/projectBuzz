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

/** Where a project stands for its owner. Separate from stage. */
export const STATUSES: { value: Enums<"project_status">; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "dropped", label: "Dropped" },
];

export const STATUS_LABEL: Record<Enums<"project_status">, string> = {
  active: "Active",
  completed: "Completed",
  dropped: "Dropped",
};

/** Tint for a whole project box: yellow active, green completed, red dropped. */
export const STATUS_BOX: Record<Enums<"project_status">, string> = {
  active: "border-gt-gold/70 bg-gt-gold/20",
  completed: "border-emerald-300 bg-emerald-50",
  dropped: "border-red-200 bg-red-50",
};

/** The dot beside a status name, so the status never relies on the tint alone. */
export const STATUS_DOT: Record<Enums<"project_status">, string> = {
  active: "bg-gt-gold",
  completed: "bg-emerald-600",
  dropped: "bg-red-500",
};
