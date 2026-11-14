import Image from "next/image";
import type { LinkPreview } from "@/lib/link-preview/types";

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function compact(count: number): string {
  return count >= 1000 ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k` : String(count);
}

/**
 * How a link attachment looks, in the composer and on a post. Three shapes:
 * a GitHub repo card, an image card (Open Graph image), or a fallback card
 * with the site's icon and the page title.
 */
export function LinkCard({ preview }: { preview: LinkPreview }) {
  const host = preview.siteName ?? hostOf(preview.url);

  if (preview.kind === "github" && preview.github) {
    const repo = preview.github;
    return (
      <div className="flex gap-3 rounded-xl border border-border bg-background p-3.5">
        {repo.ownerAvatar ? (
          <Image
            src={repo.ownerAvatar}
            alt=""
            width={44}
            height={44}
            unoptimized
            className="h-11 w-11 shrink-0 rounded-lg bg-surface"
          />
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-gt-navy">{repo.fullName}</p>
          {preview.description ? (
            <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-muted">
              {preview.description}
            </p>
          ) : null}
          <p className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-muted">
            <span>GitHub</span>
            {repo.language ? <span>{repo.language}</span> : null}
            <span>★ {compact(repo.stars)}</span>
            <span>{compact(repo.forks)} forks</span>
          </p>
        </div>
      </div>
    );
  }

  if (preview.image) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <div className="relative aspect-[1200/630] bg-surface">
          <Image
            src={preview.image}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 768px) 560px, 100vw"
            className="object-cover"
          />
        </div>
        <div className="p-3.5">
          <p className="line-clamp-2 text-[15px] leading-snug font-semibold text-gt-navy">
            {preview.title}
          </p>
          <p className="mt-1 truncate text-xs text-muted">{host}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3.5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface">
        {preview.icon ? (
          <Image
            src={preview.icon}
            alt=""
            width={24}
            height={24}
            unoptimized
            className="h-6 w-6 rounded"
          />
        ) : (
          <span aria-hidden className="text-lg">
            🔗
          </span>
        )}
      </span>
      <div className="min-w-0">
        <p className="line-clamp-2 text-[15px] leading-snug font-semibold text-gt-navy">
          {preview.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted">{host}</p>
      </div>
    </div>
  );
}
