import type { Enums } from "@/lib/database.types";

export type ReactionType = Enums<"reaction_type">;

/** Yellow jacket stickers, in the order the picker shows them. Images are in public/stickers. */
export const STICKER_REACTIONS = [
  { type: "bee_love", label: "Love it", src: "/stickers/love.png" },
  { type: "bee_clap", label: "Applause", src: "/stickers/clap.png" },
  { type: "bee_party", label: "Celebrate", src: "/stickers/party.png" },
  { type: "bee_thumbs_up", label: "Thumbs up", src: "/stickers/thumbs-up.png" },
  { type: "bee_ok", label: "OK", src: "/stickers/ok.png" },
  { type: "bee_wow", label: "Wow", src: "/stickers/wow.png" },
  { type: "bee_curious", label: "Curious", src: "/stickers/curious.png" },
  { type: "bee_oof", label: "Oof", src: "/stickers/oof.png" },
  { type: "bee_cry", label: "Sad", src: "/stickers/cry.png" },
] as const satisfies readonly {
  type: ReactionType;
  label: string;
  src: string;
}[];

/**
 * "kudos" is the one-tap like, shown as Buzz. The three signal types are no
 * longer offered in the UI, but old rows may still carry them.
 */
export const REACTION_TYPES: ReactionType[] = [
  "kudos",
  "use_this",
  "can_help",
  "tried_this",
  ...STICKER_REACTIONS.map((sticker) => sticker.type),
];

export type ReactionSummary = {
  counts: Record<ReactionType, number>;
  /** The reactions the signed-in user has given. */
  mine: ReactionType[];
};

/** A fresh summary with every count at zero. */
export const emptyReactions = (): ReactionSummary => ({
  counts: Object.fromEntries(REACTION_TYPES.map((type) => [type, 0])) as Record<
    ReactionType,
    number
  >,
  mine: [],
});

export const EMPTY_REACTIONS: ReactionSummary = emptyReactions();

export const COMMENT_MAX_LENGTH = 2000;

export type PostComment = {
  id: string;
  body: string;
  created_at: string;
  author: { id: string; name: string; avatar_url: string | null };
  /** True when the signed-in user wrote it (so they can delete it). */
  mine: boolean;
  /** True when it answers the post's feedback question. Replies never do. */
  isFeedback: boolean;
};

/** A top-level comment and its replies, oldest first. */
export type CommentThread = PostComment & { replies: PostComment[] };
