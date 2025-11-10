import { db } from '../../db/db';
import { posts, type Post } from '../../db/schema';
import { eq, and, desc, gte, lt, sql } from 'drizzle-orm';
import { moderatePostAsync } from '../middleware/contentValidation';

export async function createPost(
  userId: number,
  schoolId: number,
  content: string,
  mediaUrl?: string
): Promise<Post> {
  const createdAt = Date.now();

  try {
    const [post] = await db
      .insert(posts)
      .values({
        userId,
        schoolId,
        content,
        mediaUrl: mediaUrl || null,
        createdAt,
        upvotes: 0,
        downvotes: 0,
        commentsCount: 0,
      })
      .returning();

    // Async moderation. Will auto delete delete post if it detects inappropriate content
    moderatePostAsync(post.id, content).catch((err) => {
      console.error('Failed to moderate post:', err);
    });

    return post;
  } catch (error) {
    const err: any = new Error('Failed to create post');
    err.statusCode = 500;
    throw err;
  }
}

//getting a post by id
export async function getPostById(postId: number): Promise<Post | null> {
  const [post] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, postId));

  return post || null;
}

//getting posts for new feed
export async function getPostsBySchoolId(
  schoolId: number,
  limit: number = 30,
  cursor?: number
): Promise<Post[]> {
  if (cursor) {
    return await db
      .select()
      .from(posts)
      .where(and(eq(posts.schoolId, schoolId), lt(posts.createdAt, cursor)))
      .orderBy(desc(posts.createdAt))
      .limit(limit);
  } else {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.schoolId, schoolId))
      .orderBy(desc(posts.createdAt))
      .limit(limit);
  }
}

// getting posts for trending feed
export async function getAllPostsBySchoolId(
  schoolId: number,
  daysAgo: number = 7
): Promise<Post[]> {
  // Get posts for a school from the specified number of days ago
  const cutoffTime = Date.now() - daysAgo * 24 * 60 * 60 * 1000;

  return await db
    .select()
    .from(posts)
    .where(and(eq(posts.schoolId, schoolId), gte(posts.createdAt, cutoffTime)))
    .orderBy(desc(posts.createdAt));
}

// for when comments are added to a post
export async function incrementCommentCount(postId: number): Promise<void> {
  await db
    .update(posts)
    .set({ commentsCount: sql`commentsCount + 1` })
    .where(eq(posts.id, postId));
}

// for when comment is removed from post (deleted by content validation)
export async function decrementCommentCount(postId: number): Promise<void> {
  await db
    .update(posts)
    .set({ commentsCount: sql`commentsCount - 1` })
    .where(eq(posts.id, postId));
}

export type { Post };
