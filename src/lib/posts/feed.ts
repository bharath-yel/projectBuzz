import type { Enums } from "@/lib/database.types";
import { getMyFollows } from "@/lib/follows/queries";
import { hydratePosts } from "@/lib/posts/hydrate";
import type { TimelinePost } from "@/lib/projects/queries";
import { createClient } from "@/lib/supabase/server";

export const FEED_PAGE_SIZE = 10;

export type FeedTab = "all" | "following";

export type FeedPost = TimelinePost & {
  project: { id: string; title: string; stage: Enums<"project_stage"> };
};

export type FeedPage = {
  posts: FeedPost[];
  /** Pass back to get the next page; null when there are no more posts. */
  nextCursor: string | null;
  /** True when the Following tab is empty because the user follows nothing yet. */
  followsNothing?: boolean;
};

type FeedQuery = {
  userId: string;
  tab: FeedTab;
  /** Only posts from projects with this tag. */
  tagId: string | null;
  /** created_at of the last post already shown. */
  cursor: string | null;
};

const EMPTY: FeedPage = { posts: [], nextCursor: null };

/** Ids of the projects that carry any of these tags. */
async function projectIdsWithTags(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tagIds: string[],
): Promise<string[]> {
  if (tagIds.length === 0) return [];
  const { data, error } = await supabase
    .from("project_tags")
    .select("project_id")
    .in("tag_id", tagIds);
  if (error) throw new Error(`Could not load the feed: ${error.message}`);
  return [...new Set(data.map((row) => row.project_id))];
}

/**
 * One page of the feed: posts from public projects, newest first.
 * "following" narrows it to projects, people and tags the user follows.
 */
export async function getFeedPage({ userId, tab, tagId, cursor }: FeedQuery): Promise<FeedPage> {
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select(
      `id, kind, body, feedback_question, created_at,
       author:profiles!posts_author_id_fkey(id, name, avatar_url),
       project:projects!inner(id, title, stage, visibility),
       attachments(id, type, file_url, preview_url, meta, allow_download, sort_order)`,
    )
    .eq("project.visibility", "public")
    .order("created_at", { ascending: false })
    .limit(FEED_PAGE_SIZE + 1);

  if (cursor) query = query.lt("created_at", cursor);

  if (tagId) {
    const projectIds = await projectIdsWithTags(supabase, [tagId]);
    if (projectIds.length === 0) return EMPTY;
    query = query.in("project_id", projectIds);
  }

  if (tab === "following") {
    const follows = await getMyFollows(userId);
    const projectIds = [
      ...new Set([
        ...follows.projects,
        ...(await projectIdsWithTags(supabase, follows.tags)),
      ]),
    ];
    const conditions: string[] = [];
    if (projectIds.length > 0) conditions.push(`project_id.in.(${projectIds.join(",")})`);
    if (follows.users.length > 0) conditions.push(`author_id.in.(${follows.users.join(",")})`);
    if (conditions.length === 0) return { ...EMPTY, followsNothing: true };
    query = query.or(conditions.join(","));
  }

  const { data, error } = await query;
  if (error) throw new Error(`Could not load the feed: ${error.message}`);

  const rows = data.slice(0, FEED_PAGE_SIZE);
  const hydrated = await hydratePosts(supabase, rows, userId);

  return {
    posts: hydrated.map(({ row, ...post }) => ({
      ...post,
      project: { id: row.project.id, title: row.project.title, stage: row.project.stage },
    })),
    nextCursor: data.length > FEED_PAGE_SIZE ? rows[rows.length - 1].created_at : null,
  };
}
