"use server";

import { getCurrentUser } from "@/lib/auth/session";
import type { FileMeta } from "@/lib/attachments/kinds";
import { ATTACHMENT_BUCKET } from "@/lib/posts/constants";
import { isUuid } from "@/lib/projects/constants";
import { createClient } from "@/lib/supabase/server";

export type AttachmentAccess = {
  type: "photo" | "pdf" | "video" | "file";
  name: string;
  size: number | null;
  /** Short-lived URL for viewing in the app. Null for files that can only be downloaded. */
  viewUrl: string | null;
  /** Short-lived URL that saves the original. Null when downloads are off. */
  downloadUrl: string | null;
};

const URL_LIFETIME_SECONDS = 15 * 60;

/**
 * Called when someone taps an attachment: returns short-lived URLs for the
 * original file. Row level security decides whether they can see the
 * attachment at all; `allow_download` decides whether they get a download
 * link (the author always does).
 */
export async function getAttachmentAccess(attachmentId: string): Promise<AttachmentAccess | null> {
  const user = await getCurrentUser();
  if (!isUuid(attachmentId)) return null;

  const supabase = await createClient();
  const { data: attachment } = await supabase
    .from("attachments")
    .select("id, type, file_url, allow_download, meta, post:posts!inner(author_id)")
    .eq("id", attachmentId)
    .maybeSingle();

  if (!attachment || attachment.type === "link" || /^https?:\/\//i.test(attachment.file_url)) {
    return null;
  }

  const meta = (attachment.meta ?? {}) as Partial<FileMeta>;
  const name =
    typeof meta.name === "string" && meta.name
      ? meta.name
      : (attachment.file_url.split("/").pop() ?? "file");
  const canDownload = attachment.allow_download || attachment.post.author_id === user.id;
  // Photos, PDFs and videos are viewed in the app. Other files can only be downloaded.
  const viewable = attachment.type !== "file";

  const bucket = supabase.storage.from(ATTACHMENT_BUCKET);
  const [view, download] = await Promise.all([
    viewable ? bucket.createSignedUrl(attachment.file_url, URL_LIFETIME_SECONDS) : null,
    canDownload
      ? bucket.createSignedUrl(attachment.file_url, URL_LIFETIME_SECONDS, { download: name })
      : null,
  ]);

  return {
    type: attachment.type,
    name,
    size: typeof meta.size === "number" ? meta.size : null,
    viewUrl: view?.data?.signedUrl ?? null,
    downloadUrl: download?.data?.signedUrl ?? null,
  };
}
