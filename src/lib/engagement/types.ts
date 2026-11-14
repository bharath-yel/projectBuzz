import type { Enums } from "@/lib/database.types";

export type ReactionType = Enums<"reaction_type">;

/** "kudos" is the one-tap like, shown as Buzz. The other three are signals. */
export const SIGNAL_REACTIONS: { type: ReactionType; label: string }[] = [
  { type: "use_this", label: "I'd use this" },
  { type: "can_help", label: "I can help" },
  { type: "tried_this", label: "I've tried this" },
];

export const REACTION_TYPES: ReactionType[] = ["kudos", "use_this", "can_help", "tried_this"];

export type ReactionSummary = {
  counts: Record<ReactionType, number>;
  /** The reactions the signed-in user has given. */
  mine: ReactionType[];
};

export const EMPTY_REACTIONS: ReactionSummary = {
  counts: { kudos: 0, use_this: 0, can_help: 0, tried_this: 0 },
  mine: [],
};

export const COMMENT_MAX_LENGTH = 2000;

export type PostComment = {
  id: string;
  body: string;
  created_at: string;
  author: { id: string; name: string; avatar_url: string | null };
  /** True when the signed-in user wrote it (so they can delete it). */
  mine: boolean;
};

/** A top-level comment and its replies, oldest first. */
export type CommentThread = PostComment & { replies: PostComment[] };
