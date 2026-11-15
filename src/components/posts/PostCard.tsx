import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { AttachmentCarousel } from "@/components/posts/AttachmentCarousel";
import { AttachmentTile } from "@/components/posts/AttachmentTile";
import { PostEngagement } from "@/components/posts/PostEngagement";
import type { Enums } from "@/lib/database.types";
import { STAGE_LABEL } from "@/lib/projects/constants";
import type { TimelinePost } from "@/lib/projects/queries";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "America/New_York",
});

const KIND_LABEL: Record<TimelinePost["kind"], string> = {
  ship: "Ship",
  milestone: "Milestone",
};

type PostCardProps = {
  post: TimelinePost;
  /** Shown in the feed, where posts from many projects sit together. */
  project?: { id: string; title: string; stage: Enums<"project_stage"> };
};

/** One progress update: on a project's timeline, or in the feed. */
export function PostCard({ post, project }: PostCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-background p-4">
      <header className="flex items-center gap-3">
        <Link
          href={`/u/${post.author.id}`}
          aria-label={`${post.author.name}'s profile`}
          className="shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy"
        >
          <Avatar src={post.author.avatar_url} name={post.author.name} size={40} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-gt-navy">
            <Link href={`/u/${post.author.id}`} className="hover:underline">
              {post.author.name}
            </Link>
          </p>
          <p className="text-xs text-muted">
            <time dateTime={post.created_at}>{dateFormat.format(new Date(post.created_at))}</time>
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            post.kind === "milestone" ? "bg-gt-navy text-white" : "bg-gt-gold/30 text-gt-navy"
          }`}
        >
          {KIND_LABEL[post.kind]}
        </span>
      </header>

      {project ? (
        <Link
          href={`/projects/${project.id}`}
          className="mt-3 flex min-h-11 items-center gap-2 rounded-xl bg-surface px-3 py-2 transition-colors hover:bg-gt-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy"
        >
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gt-navy">
            {project.title}
          </span>
          <span className="shrink-0 rounded-full bg-gt-gold/30 px-2 py-0.5 text-xs font-medium text-gt-navy">
            {STAGE_LABEL[project.stage]}
          </span>
        </Link>
      ) : null}

      {post.body ? (
        <p className="mt-3 text-[15px] leading-relaxed break-words whitespace-pre-line text-foreground">
          {post.body}
        </p>
      ) : null}

      {post.attachments.length > 0 ? (
        <div className="mt-3">
          <AttachmentCarousel
            slides={post.attachments.map((attachment) => (
              <AttachmentTile key={attachment.id} attachment={attachment} />
            ))}
          />
        </div>
      ) : null}

      <PostEngagement
        postId={post.id}
        reactions={post.reactions}
        commentCount={post.commentCount}
        answerCount={post.answerCount}
        answeredByMe={post.answeredByMe}
        feedbackQuestion={post.feedback_question}
      />
    </article>
  );
}
