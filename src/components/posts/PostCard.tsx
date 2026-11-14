import Image from "next/image";
import { Avatar } from "@/components/Avatar";
import { LinkCard } from "@/components/posts/LinkCard";
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

/** One progress update on a project's timeline. */
export function PostCard({ post }: { post: TimelinePost }) {
  return (
    <article className="rounded-2xl border border-border bg-background p-4">
      <header className="flex items-center gap-3">
        <Avatar src={post.author.avatar_url} name={post.author.name} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-gt-navy">{post.author.name}</p>
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

      {post.body ? (
        <p className="mt-3 text-[15px] leading-relaxed break-words whitespace-pre-line text-foreground">
          {post.body}
        </p>
      ) : null}

      <div className="mt-3 flex flex-col gap-2.5">
        {post.attachments.map((attachment) => (
          <Attachment key={attachment.id} attachment={attachment} />
        ))}
      </div>

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
