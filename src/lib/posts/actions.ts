"use server";

import { getCurrentUser } from "@/lib/auth/session";
import type { Json } from "@/lib/database.types";
import type { LinkPreview } from "@/lib/link-preview/types";
import { attachmentFolder, POST_LIMITS } from "@/lib/posts/constants";
import { isUuid } from "@/lib/projects/constants";
import { createClient } from "@/lib/supabase/server";

export type NewAttachment =
  | { type: "photo"; filePath: string; previewPath: string }
  | { type: "link"; preview: LinkPreview };

export type CreatePostInput = {
  projectId: string;
  kind: string;
  body: string;
  feedbackQuestion: string;
  attachments: NewAttachment[];
};

export type CreatePostResult = { ok: true; postId: string } | { ok: false; message: string };

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.slice(0, max) : null;

/**
 * Creates a post and its attachments in one database transaction (the
 * create_post function). Photos must already be uploaded to the caller's
 * folder for this project; this only records where they are.
 */
export async function createPost(input: CreatePostInput): Promise<CreatePostResult> {
  const user = await getCurrentUser();

  if (!isUuid(input.projectId)) {
    return { ok: false, message: "Pick a project to post to." };
  }
  const attachments = Array.isArray(input.attachments) ? input.attachments : [];
  if (attachments.length === 0) {
    return { ok: false, message: "Add at least one photo or link to post." };
  }
  if (attachments.length > POST_LIMITS.attachments) {
    return {
      ok: false,
      message: `A post can have at most ${POST_LIMITS.attachments} attachments.`,
    };
  }
  const body = String(input.body ?? "").trim();
  const feedbackQuestion = String(input.feedbackQuestion ?? "").trim();
  if (body.length > POST_LIMITS.body) {
    return { ok: false, message: `Keep the post under ${POST_LIMITS.body} characters.` };
  }
  if (feedbackQuestion.length > POST_LIMITS.feedbackQuestion) {
    return {
      ok: false,
      message: `Keep the feedback question under ${POST_LIMITS.feedbackQuestion} characters.`,
    };
  }

  const folder = attachmentFolder(input.projectId, user.id);
  const rows: Json[] = [];
  for (const attachment of attachments) {
    if (attachment.type === "photo") {
      const { filePath, previewPath } = attachment;
      const inFolder = (path: unknown) =>
        typeof path === "string" && path.startsWith(folder) && !path.includes("..");
      if (!inFolder(filePath) || !inFolder(previewPath)) {
        return { ok: false, message: "One of the photos didn't upload correctly. Remove it and try again." };
      }
      rows.push({ type: "photo", file_url: filePath, preview_url: previewPath });
    } else if (attachment.type === "link") {
      const preview = attachment.preview;
      if (!preview || !isHttpUrl(preview.url)) {
        return { ok: false, message: "One of the links isn't a valid web address." };
      }
      // Rebuild the metadata field by field: never store client JSON as-is.
      const meta: LinkPreview = {
        url: preview.url,
        kind: preview.kind === "github" ? "github" : "page",
        title: text(preview.title, 300) ?? preview.url,
        description: text(preview.description, 500),
        siteName: text(preview.siteName, 100),
        image: isHttpUrl(preview.image) ? preview.image : null,
        icon: isHttpUrl(preview.icon) ? preview.icon : null,
        github:
          preview.kind === "github" && preview.github
            ? {
                fullName: text(preview.github.fullName, 200) ?? "",
                stars: Number(preview.github.stars) || 0,
                forks: Number(preview.github.forks) || 0,
                language: text(preview.github.language, 50),
                ownerAvatar: isHttpUrl(preview.github.ownerAvatar)
                  ? preview.github.ownerAvatar
                  : null,
              }
            : null,
      };
      rows.push({
        type: "link",
        file_url: meta.url,
        preview_url: meta.image,
        meta: meta as unknown as Json,
      });
    } else {
      return { ok: false, message: "That attachment type isn't supported yet." };
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_post", {
    p_project_id: input.projectId,
    p_attachments: rows,
    p_kind: input.kind === "milestone" ? "milestone" : "ship",
    p_body: body,
    p_feedback_question: feedbackQuestion,
  });

  if (error || !data) {
    console.error("createPost failed:", error?.code, error?.message);
    return {
      ok: false,
      message:
        error?.code === "42501"
          ? "You can only post to projects you own or contribute to."
          : "We couldn't publish your post. Try again in a moment.",
    };
  }
  return { ok: true, postId: data.id };
}
