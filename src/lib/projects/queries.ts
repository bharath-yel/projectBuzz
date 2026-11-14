import type { Enums, Tables } from "@/lib/database.types";
import type { LinkPreview } from "@/lib/link-preview/types";
import { ATTACHMENT_BUCKET } from "@/lib/posts/constants";
import { createClient } from "@/lib/supabase/server";

export type Tag = Pick<Tables<"tags">, "id" | "type" | "name" | "slug">;

type Person = { id: string; name: string; avatar_url: string | null };

export type ProjectDetail = {
  id: string;
  title: string;
  problem: string | null;
  stage: Enums<"project_stage">;
  visibility: Enums<"project_visibility">;
  cover_url: string | null;
  created_at: string;
  owner: Person;
  contributors: (Person & { role_label: string | null })[];
  tags: Tag[];
};

export type TimelineAttachment = {
  id: string;
  type: Enums<"attachment_type">;
  /** Ready-to-use URL for the original (signed if it lives in storage). */
  fileUrl: string | null;
  /** Ready-to-use URL for the preview image, if there is one. */
  previewUrl: string | null;
  /** Link metadata saved when the post was written (link attachments only). */
  link: LinkPreview | null;
};

export type TimelinePost = {
  id: string;
  kind: Enums<"post_kind">;
  body: string | null;
  feedback_question: string | null;
  created_at: string;
  author: Person;
  attachments: TimelineAttachment[];
};

/** All tags, for the picker. Small, fixed reference data. */
export async function getAllTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, type, name, slug")
    .order("name");
  if (error) throw new Error(`Could not load tags: ${error.message}`);
  return data;
}

/** Projects the user can post to: ones they own or contribute to. */
export async function getPostableProjects(
  userId: string,
): Promise<{ id: string; title: string }[]> {
  const supabase = await createClient();
  const [owned, contributed] = await Promise.all([
    supabase.from("projects").select("id, title, created_at").eq("owner_id", userId),
    supabase
      .from("project_members")
      .select("project:projects(id, title, created_at)")
      .eq("user_id", userId),
  ]);
  if (owned.error) throw new Error(`Could not load projects: ${owned.error.message}`);
  if (contributed.error)
    throw new Error(`Could not load projects: ${contributed.error.message}`);

  return [...owned.data, ...contributed.data.flatMap((row) => (row.project ? [row.project] : []))]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(({ id, title }) => ({ id, title }));
}

/** One project with its owner, contributors and tags, or null if the viewer cannot see it. */
export async function getProject(projectId: string): Promise<ProjectDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      `id, title, problem, stage, visibility, cover_url, created_at,
       owner:profiles!projects_owner_id_fkey(id, name, avatar_url),
       project_members(role_label, profile:profiles!project_members_user_id_fkey(id, name, avatar_url)),
       project_tags(tag:tags(id, type, name, slug))`,
    )
    .eq("id", projectId)
    .maybeSingle();

  if (error) throw new Error(`Could not load the project: ${error.message}`);
  if (!data) return null;

  const { project_members, project_tags, ...project } = data;
  return {
    ...project,
    contributors: project_members.flatMap((member) =>
      member.profile ? [{ ...member.profile, role_label: member.role_label }] : [],
    ),
    tags: project_tags.flatMap((row) => (row.tag ? [row.tag] : [])),
  };
}

function isExternalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

/** A project's posts, newest first, with attachment URLs ready to render. */
export async function getProjectPosts(projectId: string): Promise<TimelinePost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(
      `id, kind, body, feedback_question, created_at,
       author:profiles!posts_author_id_fkey(id, name, avatar_url),
       attachments(id, type, file_url, preview_url, meta, sort_order)`,
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(`Could not load posts: ${error.message}`);

  // Files in the private attachments bucket need a signed URL to be viewed.
  const paths = new Set<string>();
  for (const post of data) {
    for (const attachment of post.attachments) {
      for (const value of [attachment.file_url, attachment.preview_url]) {
        if (value && !isExternalUrl(value)) paths.add(value);
      }
    }
  }
  const signed = new Map<string, string>();
  if (paths.size > 0) {
    const { data: urls } = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .createSignedUrls([...paths], 60 * 60);
    for (const entry of urls ?? []) {
      if (entry.path && entry.signedUrl) signed.set(entry.path, entry.signedUrl);
    }
  }
  const resolve = (value: string | null) =>
    !value ? null : isExternalUrl(value) ? value : (signed.get(value) ?? null);

  return data.map((post) => ({
    id: post.id,
    kind: post.kind,
    body: post.body,
    feedback_question: post.feedback_question,
    created_at: post.created_at,
    author: post.author,
    attachments: [...post.attachments]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((attachment) => ({
        id: attachment.id,
        type: attachment.type,
        fileUrl: resolve(attachment.file_url),
        previewUrl: resolve(attachment.preview_url),
        link:
          attachment.type === "link"
            ? (attachment.meta as unknown as LinkPreview)
            : null,
      })),
  }));
}
