import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import { FeedList } from "@/components/feed/FeedList";
import { FollowButton } from "@/components/FollowButton";
import { BeeBanner } from "@/components/feed/BeeBanner";
import { LogoMark } from "@/components/Logo";
import { PageHeader } from "@/components/PageHeader";
import { buttonPrimary, buttonSecondary } from "@/components/ui/styles";
import type { Enums } from "@/lib/database.types";
import { getCurrentUser } from "@/lib/auth/session";
import { getMyFollows } from "@/lib/follows/queries";
import { getFeedPage, type FeedTab } from "@/lib/posts/feed";
import { TAG_TYPE_LABEL } from "@/lib/projects/constants";
import { getAllTags, type Tag } from "@/lib/projects/queries";

const TAG_GROUPS: Enums<"tag_type">[] = ["category", "class", "club"];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function FeedPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <BeeBanner>
        <PageHeader
          title="Buzzing Now"
          subtitle="What Yellow Jackets are building"
          after={<LogoMark size={36} />}
          centered
          flush
          inverse
          loud
        />
      </BeeBanner>
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

  const followed = new Set(follows.tags);
  const groups: { label: string; tags: Tag[] }[] = [
    { label: "Tags you follow", tags: tags.filter((tag) => followed.has(tag.id)) },
    ...TAG_GROUPS.map((type) => ({
      label: TAG_TYPE_LABEL[type],
      tags: tags.filter((tag) => tag.type === type),
    })),
  ].filter((group) => group.tags.length > 0);

  const tabs: { value: FeedTab; label: string }[] = [
    { value: "all", label: "For you" },
    { value: "following", label: "Following" },
  ];
  const focusRing =
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy";
  const optionClass = (active: boolean) =>
    `flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 text-sm transition-colors hover:bg-surface ${focusRing} ${
      active ? "font-semibold text-gt-navy" : "text-foreground"
    }`;
  const check = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m5 12 5 5 9-10" />
    </svg>
  );

  return (
    <>
      {/* One quiet row: text tabs on the left, a single topic menu on the right. */}
      <div className="relative mb-4 flex items-end justify-between gap-3 border-b border-border">
        <nav aria-label="Buzzing Now" className="flex gap-5">
          {tabs.map((option) => (
            <Link
              key={option.value}
              href={feedHref(option.value, tagSlug)}
              aria-current={tab === option.value ? "page" : undefined}
              className={`-mb-px flex min-h-11 items-center border-b-2 text-[15px] font-semibold transition-colors ${focusRing} ${
                tab === option.value
                  ? "border-gt-gold text-gt-navy"
                  : "border-transparent text-muted hover:text-gt-navy"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </nav>

        {/* key: the menu closes itself after a topic is picked. */}
        <details key={`${tab}:${tagSlug ?? ""}`} className="group">
          <summary
            className={`flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-lg text-sm text-muted transition-colors hover:text-gt-navy [&::-webkit-details-marker]:hidden ${focusRing}`}
          >
            Topic
            <span className="max-w-[9rem] truncate font-semibold text-gt-navy">
              {activeTag ? activeTag.name : "All"}
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="transition-transform group-open:rotate-180">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </summary>
          <nav
            aria-label="Filter by topic"
            className="absolute top-full right-0 z-20 mt-2 max-h-[60vh] w-72 max-w-full overflow-y-auto rounded-2xl border border-border bg-background p-2 shadow-lg"
          >
            <Link href={feedHref(tab, null)} aria-current={!activeTag ? "true" : undefined} className={optionClass(!activeTag)}>
              All topics
              {!activeTag ? check : null}
            </Link>
            {groups.map((group) => (
              <div key={group.label} className="mt-2 border-t border-border pt-2">
                <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-muted uppercase">
                  {group.label}
                </p>
                {group.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={feedHref(tab, tag.slug)}
                    aria-current={activeTag?.id === tag.id ? "true" : undefined}
                    className={optionClass(activeTag?.id === tag.id)}
                  >
                    <span className="min-w-0 truncate">{tag.name}</span>
                    {activeTag?.id === tag.id ? check : null}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </details>
      </div>

      {activeTag ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="min-w-0 text-sm text-muted">
            Showing{" "}
            <Link href={`/tags/${activeTag.slug}`} className="font-semibold text-gt-navy hover:underline">
              {activeTag.name}
            </Link>
            <span aria-hidden className="mx-1.5">·</span>
            <Link href={feedHref(tab, null)} className="font-medium text-gt-navy underline underline-offset-4">
              Clear
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
    <div className="flex animate-pulse flex-col gap-4" aria-busy="true" aria-label="Loading Buzzing Now">
      <div className="h-11 border-b border-border" />
      <div className="h-72 rounded-2xl border border-border bg-background" />
      <div className="h-72 rounded-2xl border border-border bg-background" />
    </div>
  );
}
