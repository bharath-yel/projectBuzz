"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { getFeedPage, type FeedPage, type FeedTab } from "@/lib/posts/feed";
import { isUuid } from "@/lib/projects/constants";

/** Next page of the feed, for infinite scroll. */
export async function loadFeedPage(input: {
  tab: FeedTab;
  tagId: string | null;
  cursor: string;
  authorId?: string | null;
}): Promise<FeedPage> {
  const user = await getCurrentUser();
  const cursor = new Date(input.cursor);
  if (Number.isNaN(cursor.getTime())) return { posts: [], nextCursor: null };
  return getFeedPage({
    userId: user.id,
    tab: input.tab === "following" ? "following" : "all",
    tagId: isUuid(input.tagId) ? input.tagId : null,
    cursor: input.cursor,
    authorId: isUuid(input.authorId) ? input.authorId : null,
  });
}
