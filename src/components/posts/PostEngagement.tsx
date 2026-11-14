"use client";

import Link from "next/link";
import { useId, useState, useTransition, type FormEvent } from "react";
import { Avatar } from "@/components/Avatar";
import { buttonPrimary, buttonText, inputClass } from "@/components/ui/styles";
import {
  addComment,
  deleteComment,
  getComments,
  setReaction,
} from "@/lib/engagement/actions";
import {
  COMMENT_MAX_LENGTH,
  SIGNAL_REACTIONS,
  type CommentThread,
  type PostComment,
  type ReactionSummary,
  type ReactionType,
} from "@/lib/engagement/types";

type PostEngagementProps = {
  postId: string;
  reactions: ReactionSummary;
  commentCount: number;
  answerCount: number;
  /** When set, comments are framed as answers to this question. */
  feedbackQuestion: string | null;
};

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "America/New_York",
});

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** Reactions and comments for one post. */
export function PostEngagement({
  postId,
  reactions,
  commentCount,
  answerCount,
  feedbackQuestion,
}: PostEngagementProps) {
  const [counts, setCounts] = useState(reactions.counts);
  const [mine, setMine] = useState<ReactionType[]>(reactions.mine);
  const [reactionError, setReactionError] = useState(false);
  const [, startReaction] = useTransition();

  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState<CommentThread[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [total, setTotal] = useState(commentCount);
  const [answers, setAnswers] = useState(answerCount);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  /** Show the change at once; put it back if saving fails. */
  function toggle(type: ReactionType) {
    const on = !mine.includes(type);
    const apply = (turnOn: boolean) => {
      setMine((current) => (turnOn ? [...current, type] : current.filter((item) => item !== type)));
      setCounts((current) => ({
        ...current,
        [type]: Math.max(0, current[type] + (turnOn ? 1 : -1)),
      }));
    };
    apply(on);
    setReactionError(false);
    startReaction(async () => {
      const result = await setReaction(postId, type, on).catch(() => ({ ok: false }));
      if (!result.ok) {
        apply(!on);
        setReactionError(true);
      }
    });
  }

  function loadComments() {
    setLoadFailed(false);
    getComments(postId)
      .then(setThreads)
      .catch(() => setLoadFailed(true));
  }

  function toggleComments() {
    const next = !open;
    setOpen(next);
    if (next && threads === null) loadComments();
  }

  function handleAdded(comment: PostComment, parentId: string | null) {
    setThreads((current) => {
      const list = current ?? [];
      if (!parentId) return [...list, { ...comment, replies: [] }];
      return list.map((thread) =>
        thread.id === parentId ? { ...thread, replies: [...thread.replies, comment] } : thread,
      );
    });
    setTotal((count) => count + 1);
    if (!parentId) setAnswers((count) => count + 1);
    setReplyTo(null);
  }

  async function handleDelete(comment: PostComment, parentId: string | null) {
    const result = await deleteComment(comment.id).catch(() => ({ ok: false }));
    if (!result.ok) return;
    setThreads((current) => {
      if (!current) return current;
      if (!parentId) return current.filter((thread) => thread.id !== comment.id);
      return current.map((thread) =>
        thread.id === parentId
          ? { ...thread, replies: thread.replies.filter((reply) => reply.id !== comment.id) }
          : thread,
      );
    });
    if (!parentId) {
      const removed = threads?.find((thread) => thread.id === comment.id);
      setTotal((count) => Math.max(0, count - 1 - (removed?.replies.length ?? 0)));
      setAnswers((count) => Math.max(0, count - 1));
    } else {
      setTotal((count) => Math.max(0, count - 1));
    }
  }

  const buzzed = mine.includes("kudos");
  const commentsLabel = feedbackQuestion ? plural(answers, "answer") : plural(total, "comment");

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => toggle("kudos")}
          aria-pressed={buzzed}
          aria-label={`Buzz, ${plural(counts.kudos, "person")}`}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy ${
            buzzed
              ? "bg-gt-gold text-gt-navy hover:bg-gt-gold/85"
              : "border border-gt-gold bg-gt-gold/15 text-gt-navy hover:bg-gt-gold/30"
          }`}
        >
          <span aria-hidden className={buzzed ? "" : "grayscale"}>
            🐝
          </span>
          {buzzed ? "Buzzed" : "Buzz"}
          <span className="tabular-nums">{counts.kudos}</span>
        </button>

        <button
          type="button"
          onClick={toggleComments}
          aria-expanded={open}
          className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-gt-navy transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
          </svg>
          {commentsLabel}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {SIGNAL_REACTIONS.map(({ type, label }) => {
          const active = mine.includes(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggle(type)}
              aria-pressed={active}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy ${
                active
                  ? "border-gt-navy bg-gt-navy font-medium text-white"
                  : "border-border bg-background text-foreground hover:border-gt-navy"
              }`}
            >
              {label}
              {counts[type] > 0 ? <span className="tabular-nums opacity-80">{counts[type]}</span> : null}
            </button>
          );
        })}
      </div>
      {reactionError ? (
        <p role="alert" className="mt-2 text-xs text-red-700">
          That didn&apos;t save. Check your connection and try again.
        </p>
      ) : null}

      {open ? (
        <section className="mt-4" aria-label={feedbackQuestion ? "Answers" : "Comments"}>
          <CommentForm
            postId={postId}
            parentId={null}
            label={feedbackQuestion ? `Answer: ${feedbackQuestion}` : "Add a comment"}
            placeholder={feedbackQuestion ? "Share what you think" : "Say something helpful"}
            submitLabel={feedbackQuestion ? "Answer" : "Comment"}
            onAdded={handleAdded}
          />

          {loadFailed ? (
            <p role="alert" className="mt-4 text-sm text-red-700">
              Couldn&apos;t load {feedbackQuestion ? "answers" : "comments"}.{" "}
              <button type="button" onClick={loadComments} className="font-semibold underline">
                Try again
              </button>
            </p>
          ) : threads === null ? (
            <p className="mt-4 text-sm text-muted">Loading…</p>
          ) : threads.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              {feedbackQuestion
                ? "No answers yet. Yours could be the first."
                : "No comments yet. Start the conversation."}
            </p>
          ) : (
            <ol className="mt-4 flex flex-col gap-4">
              {threads.map((thread) => (
                <li key={thread.id}>
                  <CommentItem
                    comment={thread}
                    onReply={() => setReplyTo(replyTo === thread.id ? null : thread.id)}
                    onDelete={() => handleDelete(thread, null)}
                  />
                  {thread.replies.length > 0 || replyTo === thread.id ? (
                    <div className="mt-3 ml-5 flex flex-col gap-3 border-l-2 border-border pl-4">
                      {thread.replies.map((reply) => (
                        <CommentItem
                          key={reply.id}
                          comment={reply}
                          onReply={() => setReplyTo(thread.id)}
                          onDelete={() => handleDelete(reply, thread.id)}
                        />
                      ))}
                      {replyTo === thread.id ? (
                        <CommentForm
                          postId={postId}
                          parentId={thread.id}
                          label={`Reply to ${thread.author.name}`}
                          placeholder="Write a reply"
                          submitLabel="Reply"
                          autoFocus
                          onAdded={handleAdded}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </section>
      ) : null}
    </div>
  );
}

function CommentItem({
  comment,
  onReply,
  onDelete,
}: {
  comment: PostComment;
  onReply: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-2.5">
      <Link href={`/u/${comment.author.id}`} aria-label={`${comment.author.name}'s profile`} className="shrink-0 self-start rounded-full">
        <Avatar src={comment.author.avatar_url} name={comment.author.name} size={32} />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <Link href={`/u/${comment.author.id}`} className="font-semibold text-gt-navy hover:underline">
            {comment.author.name}
          </Link>{" "}
          <time dateTime={comment.created_at} className="text-xs text-muted">
            {dateFormat.format(new Date(comment.created_at))}
          </time>
        </p>
        <p className="mt-0.5 text-[15px] leading-relaxed break-words whitespace-pre-line text-foreground">
          {comment.body}
        </p>
        <div className="-ml-2 flex gap-1">
          <button type="button" onClick={onReply} className={buttonText}>
            Reply
          </button>
          {comment.mine ? (
            <button type="button" onClick={onDelete} className={`${buttonText} text-muted`}>
              Delete
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CommentForm({
  postId,
  parentId,
  label,
  placeholder,
  submitLabel,
  autoFocus,
  onAdded,
}: {
  postId: string;
  parentId: string | null;
  label: string;
  placeholder: string;
  submitLabel: string;
  autoFocus?: boolean;
  onAdded: (comment: PostComment, parentId: string | null) => void;
}) {
  const id = useId();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) {
      setError("Write something first.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await addComment({ postId, body, parentId }).catch(() => null);
      if (!result) setError("We couldn't post that. Check your connection.");
      else if (!result.ok) setError(result.message);
      else {
        setBody("");
        onAdded(result.comment, result.parentId);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor={id} className="mb-1.5 block text-sm leading-snug font-semibold break-words text-gt-navy">
        {label}
      </label>
      <textarea
        id={id}
        rows={2}
        value={body}
        maxLength={COMMENT_MAX_LENGTH}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(event) => {
          setBody(event.target.value);
          if (error) setError(null);
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${inputClass} resize-y leading-relaxed`}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <div className="mt-2 flex justify-end">
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending ? "Posting…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
