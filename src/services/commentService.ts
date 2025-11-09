import { db } from '../../db/db';
import { comments, type Comment } from '../../db/schema';
import { getPostById, incrementCommentCount } from './postService';
import { eq, and, desc, lt } from 'drizzle-orm';
import { moderateCommentAsync } from '../middleware/contentValidation';

export async function createComment(
  postId: number,
  userId: number,
  content: string,
  mediaUrl?: string
): Promise<Comment> {
  // Verify post exists
  const post = await getPostById(postId);
  if (!post) {
    const err: any = new Error('Post not found');
    err.statusCode = 404;
    throw err;
  }

  const createdAt = Date.now();

  try {
    const [comment] = await db
      .insert(comments)
      .values({
        postId,
        userId,
        content,
        mediaUrl: mediaUrl || null,
        createdAt,
        votes: 0,
      })
      .returning();

    // Update post's comment count (don't wait for it)
    incrementCommentCount(postId).catch((err) => {
      console.error('Failed to increment comment count:', err);
    });

    // Async moderation - don't wait for it, delete comment if it fails
    moderateCommentAsync(comment.id, postId, content).catch((err) => {
      console.error('Failed to moderate comment:', err);
    });

    return comment;
  } catch (error) {
    const err: any = new Error('Failed to create comment');
    err.statusCode = 500;
    throw err;
  }
}

export interface CommentsResponse {
  comments: Comment[];
  next_cursor: string | null;
  has_more: boolean;
}

export async function getCommentsByPostId(
  postId: number,
  limit: number = 10,
  cursor?: number
): Promise<CommentsResponse> {
  let allComments;
  
  if (cursor) {
    allComments = await db
      .select()
      .from(comments)
      .where(and(eq(comments.postId, postId), lt(comments.createdAt, cursor)))
      .orderBy(desc(comments.createdAt))
      .limit(limit + 1);
  } else {
    allComments = await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt))
      .limit(limit + 1);
  }

  const hasMore = allComments.length > limit;
  const resultComments = hasMore ? allComments.slice(0, limit) : allComments;

  const lastComment = resultComments[resultComments.length - 1];
  const nextCursor = lastComment ? lastComment.createdAt.toString() : null;

  return {
    comments: resultComments,
    next_cursor: nextCursor,
    has_more: hasMore,
  };
}

export type { Comment };
