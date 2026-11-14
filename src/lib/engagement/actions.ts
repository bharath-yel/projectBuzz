"use server";

import { getCurrentUser } from "@/lib/auth/session";
import {
  COMMENT_MAX_LENGTH,
  REACTION_TYPES,
  type CommentThread,
  type PostComment,
  type ReactionType,
} from "@/lib/engagement/types";
import { isUuid } from "@/lib/projects/constants";
import { createClient } from "@/lib/supabase/server";

const COMMENT_COLUMNS =
  "id, body, created_at, parent_id, author_id, author:profiles!comments_author_id_fkey(id, name, avatar_url)" as const;

/** Adds or removes one of the signed-in user's reactions on a post. */
export async function setReaction(
  postId: string,
  type: ReactionType,
  on: boolean,
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!isUuid(postId) || !REACTION_TYPES.includes(type)) return { ok: false };
  const supabase = await createClient();

  if (on) {
    const { error } = await supabase.from("reactions").insert({ post_id: postId, type });
    // 23505: already reacted. That is the state we wanted.
    if (error && error.code !== "23505") {
      console.error("setReaction failed:", error.code, error.message);
      return { ok: false };
    }
    return { ok: true };
  }

  const { error } = await supabase
    .from("reactions")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .eq("type", type);
  if (error) console.error("setReaction failed:", error.code, error.message);
  return { ok: !error };
}

/** A post's comments as threads: top-level comments, each with its replies. */
export async function getComments(postId: string): Promise<CommentThread[]> {
  const user = await getCurrentUser();
  if (!isUuid(postId)) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select(COMMENT_COLUMNS)
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw new Error(`Could not load comments: ${error.message}`);

  const threads = new Map<string, CommentThread>();
  const toComment = (row: (typeof data)[number]): PostComment => ({
    id: row.id,
    body: row.body,
    created_at: row.created_at,
    author: row.author,
    mine: row.author_id === user.id,
  });
  for (const row of data) {
    if (!row.parent_id) threads.set(row.id, { ...toComment(row), replies: [] });
  }
  for (const row of data) {
    if (row.parent_id) threads.get(row.parent_id)?.replies.push(toComment(row));
  }
  return [...threads.values()];
}

export type AddCommentResult =
  | { ok: true; comment: PostComment; parentId: string | null }
  | { ok: false; message: string };

/**
 * Adds a comment, or a reply when `parentId` is given. Threads are one level
 * deep: a reply to a reply is filed under the same top-level comment.
 */
export async function addComment(input: {
  postId: string;
  body: string;
  parentId: string | null;
}): Promise<AddCommentResult> {
  await getCurrentUser();
  const body = String(input.body ?? "").trim();
  if (!isUuid(input.postId)) return { ok: false, message: "That post no longer exists." };
  if (!body) return { ok: false, message: "Write something first." };
  if (body.length > COMMENT_MAX_LENGTH) {
    return { ok: false, message: `Keep it under ${COMMENT_MAX_LENGTH} characters.` };
  }

  const supabase = await createClient();
  let parentId: string | null = null;
  if (input.parentId) {
    if (!isUuid(input.parentId)) return { ok: false, message: "That comment no longer exists." };
    const { data: parent } = await supabase
      .from("comments")
      .select("id, parent_id, post_id")
      .eq("id", input.parentId)
      .maybeSingle();
    if (!parent || parent.post_id !== input.postId) {
      return { ok: false, message: "That comment no longer exists." };
    }
    parentId = parent.parent_id ?? parent.id;
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: input.postId, body, parent_id: parentId })
    .select(COMMENT_COLUMNS)
    .single();
  if (error || !data) {
    console.error("addComment failed:", error?.code, error?.message);
    return { ok: false, message: "We couldn't post that. Try again in a moment." };
  }
  return {
    ok: true,
    parentId,
    comment: {
      id: data.id,
      body: data.body,
      created_at: data.created_at,
      author: data.author,
      mine: true,
    },
  };
}

/** Deletes one of the signed-in user's own comments (and its replies). */
export async function deleteComment(commentId: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!isUuid(commentId)) return { ok: false };
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("comments")
    .delete({ count: "exact" })
    .eq("id", commentId)
    .eq("author_id", user.id);
  if (error) console.error("deleteComment failed:", error.code, error.message);
  return { ok: !error && count === 1 };
}
