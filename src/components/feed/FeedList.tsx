"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { PostCard } from "@/components/posts/PostCard";
import { buttonSecondary } from "@/components/ui/styles";
import type { FeedPost, FeedTab } from "@/lib/posts/feed";
import { loadFeedPage } from "@/lib/posts/feed-actions";

type FeedListProps = {
  initialPosts: FeedPost[];
  initialCursor: string | null;
  tab: FeedTab;
  tagId: string | null;
};

/**
 * The feed's posts with infinite scroll: the next page loads as the end of
 * the list nears the screen. A "Load more" button does the same by hand.
 */
export function FeedList({ initialPosts, initialCursor, tab, tagId }: FeedListProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  function loadMore() {
    if (!cursor || loadingRef.current) return;
    loadingRef.current = true;
    setFailed(false);
    startTransition(async () => {
      try {
        const page = await loadFeedPage({ tab, tagId, cursor });
        setPosts((current) => {
          const seen = new Set(current.map((post) => post.id));
          return [...current, ...page.posts.filter((post) => !seen.has(post.id))];
        });
        setCursor(page.nextCursor);
      } catch {
        setFailed(true);
      } finally {
        loadingRef.current = false;
      }
    });
  }

  // Keep the observer pointed at the latest loadMore without re-subscribing.
  const loadMoreRef = useRef(loadMore);
  useEffect(() => {
    loadMoreRef.current = loadMore;
  });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !cursor || failed) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMoreRef.current();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [cursor, failed]);

  return (
    <div>
      <ol className="flex flex-col gap-4">
        {posts.map((post) => (
          <li key={post.id}>
            <PostCard post={post} project={post.project} />
          </li>
        ))}
      </ol>

      <div ref={sentinelRef} className="mt-5 flex min-h-12 flex-col items-center justify-center gap-2">
        {failed ? (
          <p role="alert" className="text-sm text-red-700">
            Couldn&apos;t load more posts. Check your connection.
          </p>
        ) : null}
        {cursor ? (
          <button type="button" onClick={loadMore} disabled={pending} className={buttonSecondary}>
            {pending ? "Loading…" : failed ? "Try again" : "Load more"}
          </button>
        ) : (
          <p className="text-sm text-muted">You&apos;re all caught up.</p>
        )}
      </div>
    </div>
  );
}
