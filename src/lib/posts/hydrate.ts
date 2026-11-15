import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Enums, Json } from "@/lib/database.types";
import type { FileMeta } from "@/lib/attachments/kinds";
import { emptyReactions, type ReactionSummary } from "@/lib/engagement/types";
import type { LinkPreview } from "@/lib/link-preview/types";
import { ATTACHMENT_BUCKET } from "@/lib/posts/constants";
import type { TimelinePost } from "@/lib/projects/queries";

/** A post as selected from the database, before attachment URLs are resolved. */
export type PostRow = {
  id: string;
  kind: Enums<"post_kind">;
  body: string | null;
  feedback_question: string | null;
  created_at: string;
  author: { id: string; name: string; avatar_url: string | null };
  attachments: {
    id: string;
    type: Enums<"attachment_type">;
    file_url: string;
    preview_url: string | null;
    meta: Json;
    allow_download: boolean;
    sort_order: number;
  }[];
};

function isExternalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

/**
 * Turns stored preview locations into URLs a browser can load (a one-hour
 * signed URL for files in the private attachments bucket).
 *
 * Only previews are resolved. Lists of posts never get a URL for an original
 * file; the viewer asks for one when someone taps an attachment.
 */
export async function hydratePosts<Row extends PostRow>(
  supabase: SupabaseClient<Database>,
  rows: Row[],
  /** The viewer, so each post knows which reactions are theirs. */
  userId: string,
): Promise<(TimelinePost & { row: Row })[]> {
  const paths = new Set<string>();
  for (const post of rows) {
    for (const attachment of post.attachments) {
      const value = attachment.preview_url;
      if (value && !isExternalUrl(value)) paths.add(value);
    }
  }

  const signed = new Map<string, string>();
  if (paths.size > 0) {
    const { data: urls } = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .createSignedUrls([...paths], 60 * 60);
    for (const entry of urls ?? []) {
      if (entry.path && entry.signedUrl)
        signed.set(entry.path, entry.signedUrl);
    }
  }
  const resolve = (value: string | null) =>
    !value ? null : isExternalUrl(value) ? value : (signed.get(value) ?? null);

  // Reactions and comment counts for every post on the page, in two queries.
  const postIds = rows.map((post) => post.id);
  const reactions = new Map<string, ReactionSummary>();
  const comments = new Map<
    string,
    { total: number; feedback: number; answeredByMe: boolean }
  >();
  for (const id of postIds) {
    reactions.set(id, emptyReactions());
    comments.set(id, { total: 0, feedback: 0, answeredByMe: false });
  }
  if (postIds.length > 0) {
    const [reactionRows, commentRows] = await Promise.all([
      supabase
        .from("reactions")
        .select("post_id, user_id, type")
        .in("post_id", postIds),
      supabase
        .from("comments")
        .select("post_id, is_feedback, author_id")
        .in("post_id", postIds),
    ]);
    for (const row of reactionRows.data ?? []) {
      const summary = reactions.get(row.post_id);
      if (!summary) continue;
      summary.counts[row.type] += 1;
      if (row.user_id === userId) summary.mine.push(row.type);
    }
    for (const row of commentRows.data ?? []) {
      const count = comments.get(row.post_id);
      if (!count) continue;
      count.total += 1;
      if (row.is_feedback) {
        count.feedback += 1;
        if (row.author_id === userId) count.answeredByMe = true;
      }
    }
  }

  return rows.map((post) => ({
    row: post,
    reactions: reactions.get(post.id)!,
    commentCount: comments.get(post.id)!.total,
    answerCount: comments.get(post.id)!.feedback,
    answeredByMe: comments.get(post.id)!.answeredByMe,
    id: post.id,
    kind: post.kind,
    body: post.body,
    feedback_question: post.feedback_question,
    created_at: post.created_at,
    author: post.author,
    attachments: [...post.attachments]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((attachment) => {
        const isLink = attachment.type === "link";
        return {
          id: attachment.id,
          type: attachment.type,
          // A link's "file" is just its address. Stored files have no URL here.
          fileUrl: isLink ? resolve(attachment.file_url) : null,
          previewUrl: resolve(attachment.preview_url),
          link: isLink ? (attachment.meta as unknown as LinkPreview) : null,
          file:
            attachment.type === "pdf" ||
            attachment.type === "video" ||
            attachment.type === "file"
              ? (attachment.meta as unknown as Partial<FileMeta>)
              : null,
          allowDownload: attachment.allow_download,
        };
      }),
  }));
}
