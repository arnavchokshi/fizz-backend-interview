import {
  getPostsBySchoolId,
  getAllPostsBySchoolId,
  type Post,
} from './postService';

export type FeedPost = Post;

export interface FeedResponse {
  posts: FeedPost[];
  next_cursor: string | null;
  has_more: boolean;
  preload_hint?: string;
}

/**
 * Get newest feed - simple time-based sorting
 * Uses cursor-based pagination with timestamp
 */
export async function getNewestFeed(
  schoolId: number,
  limit: number = 30,
  cursor?: string
): Promise<FeedResponse> {
  const cursorTimestamp = cursor ? parseInt(cursor, 10) : undefined;
  const posts = await getPostsBySchoolId(schoolId, limit + 1, cursorTimestamp);

  const hasMore = posts.length > limit;
  const resultPosts = hasMore ? posts.slice(0, limit) : posts;

  const lastPost = resultPosts[resultPosts.length - 1];
  const nextCursor = lastPost ? lastPost.createdAt.toString() : null;

  return {
    posts: resultPosts,
    next_cursor: nextCursor,
    has_more: hasMore,
    preload_hint: undefined,
  };
}

/**
 * Get trending feed - algorithm-based sorting
 * Fetches all posts, calculates scores, sorts by trending score
 */
export async function getTrendingFeed(
  schoolId: number
): Promise<FeedResponse> {
  const posts = await getAllPostsBySchoolId(schoolId);

  // Calculate scores and sort
  const sortedPosts = posts
    .map((post) => ({ post, score: calculateTrendingScore(post) }))
    .sort((a, b) => b.score - a.score)
    .map((sp) => sp.post);

  return {
    posts: sortedPosts,
    next_cursor: null,
    has_more: false,
  };
}

/**
 * Calculate trending score: (Engagement × Velocity) × 50% + Recency × 50%
 */
function calculateTrendingScore(post: Post): number {
  const now = Date.now();
  const hoursOld = (now - post.createdAt) / (1000 * 60 * 60);

  // Engagement: votes (1x) + comments (10x), normalized by time
  const totalEngagement = Math.abs(post.votes) + post.commentsCount * 10;
  const baseEngagementScore = totalEngagement / Math.max(hoursOld + 1, 0.5);

  // Velocity bonus: up to 2x for fast-rising posts (first 6 hours)
  let velocityBonus = 1.0;
  if (hoursOld < 6) {
    const engagementRate = totalEngagement / Math.max(hoursOld, 0.1);
    velocityBonus = 1.0 + Math.min(engagementRate / 10, 1.0);
  }

  // Recency: exponential decay (1.0 for new, ~0.37 at 24h)
  const recencyScore = Math.exp(-hoursOld / 24);

  // Final score: 50% engagement, 50% recency
  const adjustedEngagementScore = baseEngagementScore * velocityBonus;
  return adjustedEngagementScore * 0.5 + recencyScore * 0.5;
}