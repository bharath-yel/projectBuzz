import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import { FeedList } from "@/components/feed/FeedList";
import { FollowButton } from "@/components/FollowButton";
import { PageHeader } from "@/components/PageHeader";
import { buttonPrimary, buttonSecondary } from "@/components/ui/styles";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyFollows } from "@/lib/follows/queries";
import { getFeedPage, type FeedTab } from "@/lib/posts/feed";
import { getAllTags, type Tag } from "@/lib/projects/queries";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function FeedPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Feed" subtitle="What Yellow Jackets are building" />
      <Suspense fallback={<FeedSkeleton />}>
        {searchParams.then((query) => (
          <Feed
            tab={query.tab === "following" ? "following" : "all"}
            tagSlug={typeof query.tag === "string" ? query.tag : null}
          />
        ))}
      </Suspense>
    </>
  );
}

function feedHref(tab: FeedTab, tagSlug: string | null): string {
  const params = new URLSearchParams();
  if (tab === "following") params.set("tab", "following");
  if (tagSlug) params.set("tag", tagSlug);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

async function Feed({ tab, tagSlug }: { tab: FeedTab; tagSlug: string | null }) {
  const user = await getCurrentUser();
  const [tags, follows] = await Promise.all([getAllTags(), getMyFollows(user.id)]);
  const activeTag = tagSlug ? (tags.find((tag) => tag.slug === tagSlug) ?? null) : null;
  const page = await getFeedPage({
    userId: user.id,
    tab,
    tagId: activeTag?.id ?? null,
    cursor: null,
  });

  // Chips: the active tag, then tags you follow, then every category.
  const followed = new Set(follows.tags);
  const chips: Tag[] = [];
  for (const tag of [
    ...(activeTag ? [activeTag] : []),
    ...tags.filter((tag) => followed.has(tag.id)),
    ...tags.filter((tag) => tag.type === "category"),
  ]) {
    if (!chips.some((chip) => chip.id === tag.id)) chips.push(tag);
  }

  const tabs: { value: FeedTab; label: string }[] = [
    { value: "all", label: "For you" },
    { value: "following", label: "Following" },
  ];
  const chipClass = (active: boolean) =>
    `inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy ${
      active
        ? "border-gt-navy bg-gt-navy font-medium text-white"
        : "border-border bg-background text-foreground hover:border-gt-navy"
    }`;

  return (
    <>
      <nav aria-label="Feed" className="mb-3 grid grid-cols-2 rounded-xl border border-border bg-background p-1">
        {tabs.map((option) => (
          <Link
            key={option.value}
            href={feedHref(option.value, tagSlug)}
            aria-current={tab === option.value ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center rounded-lg text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy ${
              tab === option.value ? "bg-gt-navy text-white" : "text-muted hover:text-gt-navy"
            }`}
          >
            {option.label}
          </Link>
        ))}
      </nav>

      <nav
        aria-label="Filter by tag"
        className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:-mx-6 md:px-6 [&::-webkit-scrollbar]:hidden"
      >
        <Link href={feedHref(tab, null)} aria-current={!activeTag ? "true" : undefined} className={chipClass(!activeTag)}>
          All
        </Link>
        {chips.map((tag) => (
          <Link
            key={tag.id}
            href={feedHref(tab, tag.slug)}
            aria-current={activeTag?.id === tag.id ? "true" : undefined}
            className={chipClass(activeTag?.id === tag.id)}
          >
            {tag.name}
          </Link>
        ))}
        <Link href="/explore" className={`${chipClass(false)} border-dashed text-muted`}>
          More tags
        </Link>
      </nav>

      {activeTag ? (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3">
          <p className="min-w-0 text-sm text-muted">
            Posts tagged{" "}
            <Link href={`/tags/${activeTag.slug}`} className="font-semibold text-gt-navy hover:underline">
              {activeTag.name}
            </Link>
          </p>
          <FollowButton
            key={activeTag.id}
            type="tag"
            targetId={activeTag.id}
            initialFollowing={followed.has(activeTag.id)}
            label={activeTag.name}
          />
        </div>
      ) : null}

      {page.posts.length > 0 ? (
        <FeedList
          key={`${tab}:${activeTag?.id ?? ""}`}
          initialPosts={page.posts}
          initialCursor={page.nextCursor}
          tab={tab}
          tagId={activeTag?.id ?? null}
        />
      ) : (
        <div className="flex flex-col items-center gap-4">
          {tab === "following" && page.followsNothing ? (
            <>
              <EmptyState icon="🧭" title="You're not following anything yet">
                Follow people, projects and tags, and their updates will collect
                here.
              </EmptyState>
              <Link href="/explore" className={buttonPrimary}>
                Find things to follow
              </Link>
            </>
          ) : tab === "following" ? (
            <>
              <EmptyState icon="🐝" title="Nothing new yet">
                {activeTag
                  ? `Nothing from what you follow is tagged ${activeTag.name} yet.`
                  : "The people and projects you follow haven't posted yet."}
              </EmptyState>
              <Link href={feedHref("all", tagSlug)} className={buttonSecondary}>
                See everyone&apos;s posts
              </Link>
            </>
          ) : (
            <>
              <EmptyState icon="🐝" title={activeTag ? `No ${activeTag.name} posts yet` : "It's quiet in here"}>
                Be the first to post. Rough drafts and half-working demos are
                welcome.
              </EmptyState>
              <Link href="/post" className={buttonPrimary}>
                Post an update
              </Link>
            </>
          )}
        </div>
      )}
    </>
  );
}

function FeedSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4" aria-busy="true" aria-label="Loading feed">
      <div className="h-13 rounded-xl border border-border bg-background" />
      <div className="h-11 w-2/3 rounded-full bg-background" />
      <div className="h-72 rounded-2xl border border-border bg-background" />
      <div className="h-72 rounded-2xl border border-border bg-background" />
    </div>
  );
}
