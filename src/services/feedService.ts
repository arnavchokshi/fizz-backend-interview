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
 * Fetches all posts in past week, calculates scores, sorts by trending score
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
 * Calculate trending score: (Normalized Engagement × Velocity) × Recency
 * 
 * Example: Post with 500 upvotes, 100 downvotes, 5 comments, 2 hours old
 * 1. voteScore = max(|400|, 600×0.5) = 400
 * 2. totalEngagement = 400 + 5×10 = 450
 * 3. normalizedEngagement = 450 / 2 = 225 per hour
 * 4. velocityBonus = 1.0 + min(225/100, 0.5) = 1.5x (fast-rising)
 * 5. recencyFactor = exp(-2/12) ≈ 0.85
 * 6. Final score = 225 × 1.5 × 0.85 ≈ 287
 */
function calculateTrendingScore(post: Post): number {
  const now = Date.now();
  const hoursOld = (now - post.createdAt) / (1000 * 60 * 60);

  // Step 1: Calculate vote score
  const voteCount = post.upvotes - post.downvotes;
  const totalVoteEngagement = post.upvotes + post.downvotes;
  const voteScore = Math.max(
    Math.abs(voteCount),           // Polarized: 1000/0 or 0/1000
    totalVoteEngagement * 0.5      // Controversial: 1000/1000
  );
  
  // Step 2: Add comments (10x weight)
  const totalEngagement = voteScore + post.commentsCount * 10;

  // Step 3: Normalize by time (engagement per hour)
  const perHourEngagement = totalEngagement / Math.max(hoursOld, 0.75);

  // Step 4: Velocity bonus for fast-rising posts (< 6 hours)
  let velocityBonus = 1.0;
  if (hoursOld < 6) {
    velocityBonus = 1.5 + Math.min(perHourEngagement / 100, 0.5);
  }

  // Step 5: Recency decay
  const recencyFactor = Math.exp(-hoursOld / 12);

  // Step 6: Final score
  return perHourEngagement * velocityBonus * recencyFactor;
}