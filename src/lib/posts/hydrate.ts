import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Enums, Json } from "@/lib/database.types";
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
    sort_order: number;
  }[];
};

function isExternalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

/**
 * Turns stored attachment locations into URLs a browser can load. Files in
 * the private attachments bucket get a one-hour signed URL.
 *
 * `originals: false` is for the feed: it resolves previews only, so the feed
 * never has a URL for a full-size file, let alone loads one.
 */
export async function hydratePosts<Row extends PostRow>(
  supabase: SupabaseClient<Database>,
  rows: Row[],
  options: { originals: boolean },
): Promise<(TimelinePost & { row: Row })[]> {
  const paths = new Set<string>();
  for (const post of rows) {
    for (const attachment of post.attachments) {
      const values = options.originals
        ? [attachment.file_url, attachment.preview_url]
        : [attachment.preview_url];
      for (const value of values) {
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

  return rows.map((post) => ({
    row: post,
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
          // A link's "file" is just its address, which is always safe to expose.
          fileUrl: isLink || options.originals ? resolve(attachment.file_url) : null,
          previewUrl: resolve(attachment.preview_url),
          link: isLink ? (attachment.meta as unknown as LinkPreview) : null,
        };
      }),
  }));
}
