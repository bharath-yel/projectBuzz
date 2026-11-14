import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { AttachmentCarousel } from "@/components/posts/AttachmentCarousel";
import { LinkCard } from "@/components/posts/LinkCard";
import type { Enums } from "@/lib/database.types";
import { STAGE_LABEL } from "@/lib/projects/constants";
import type { TimelineAttachment, TimelinePost } from "@/lib/projects/queries";

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

function Attachment({ attachment }: { attachment: TimelineAttachment }) {
  if (attachment.type === "link" && attachment.link && attachment.fileUrl) {
    return (
      <a
        href={attachment.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy"
      >
        <LinkCard preview={attachment.link} />
      </a>
    );
  }

  if (attachment.type === "photo" && attachment.previewUrl) {
    const photo = (
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-surface">
        <Image
          src={attachment.previewUrl}
          alt="Photo from this update"
          fill
          unoptimized
          sizes="(min-width: 768px) 560px, 100vw"
          className="object-cover"
        />
      </div>
    );
    return attachment.fileUrl ? (
      <a
        href={attachment.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open full-size photo"
        className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy"
      >
        {photo}
      </a>
    ) : (
      photo
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
      This attachment can&apos;t be shown yet.
    </div>
  );
}

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
              <Attachment key={attachment.id} attachment={attachment} />
            ))}
          />
        </div>
      ) : null}

      {post.feedback_question ? (
        <div className="mt-3 rounded-xl border-l-4 border-gt-gold bg-gt-gold/15 px-4 py-3">
          <p className="text-xs font-semibold tracking-wide text-gt-navy uppercase">
            Feedback wanted
          </p>
          <p className="mt-0.5 text-[15px] leading-snug font-medium break-words text-gt-navy">
            {post.feedback_question}
          </p>
        </div>
      ) : null}
    </article>
  );
}
