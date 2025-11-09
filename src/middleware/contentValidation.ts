import { Request, Response, NextFunction } from 'express';
import OpenAI from "openai";
import { db } from '../../db/db';
import { posts, comments } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { decrementCommentCount } from '../services/postService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const CATEGORY_MESSAGES: Record<string, string> = {
  "hate": "Content contains hate speech or slurs. We prohibit prejudice based on race, ethnicity, gender identity, sexual orientation, or other protected characteristics.",
  "hate/threatening": "Content contains threatening hate speech. Violence and threats have no place on Fizz.",
  "harassment": "Content contains personal attacks or bullying. Fizz is a community where students are required to respect the dignity of their peers.",
  "harassment/threatening": "Content contains threats or menacing harassment. Violence and threats have no place on Fizz.",
  "self-harm": "Content discusses or glorifies self-harm.",
  "self-harm/intent": "Content indicates self-harm intent.",
  "self-harm/instructions": "Content contains self-harm instructions.",
  "sexual": "Content contains explicit sexual material. Explicit content is not permitted on Fizz.",
  "sexual/minors": "Content involves sexual content with minors (strictly prohibited).",
  "violence": "Content promotes or depicts violence. Violence has no place on Fizz.",
  "violence/graphic": "Content contains graphic violence. Explicit content is not permitted on Fizz.",
  "illicit": "Content gives advice or instruction on how to commit illicit acts. Fizz complies with all legal regulations and prohibits discussion of illegal activities.",
  "illicit/violent": "Content gives advice or instruction on committing illicit acts involving violence or weapons. Fizz complies with all legal regulations and prohibits discussion of illegal activities.",
};

// Quick synchronous validation - check content exists, is non-empty, and within character limit
export async function validateRequest(req: Request, res: Response, next: NextFunction) {
  if (req.body.content !== undefined) {
    if (typeof req.body.content !== 'string' || req.body.content.length === 0) {
      return res.status(400).json({ error: { message: 'content must be a non-empty string', statusCode: 400 } });
    }
    if (req.body.content.length > 300) {
      return res.status(400).json({ error: { message: 'content must be 300 characters or less', statusCode: 400 } });
    }
  }
  next();
}

// Async content moderation using OpenAI - deletes post/comment if it fails
async function checkContentModeration(text: string): Promise<string | null> {
  if (!text || typeof text !== "string") return null;

  if (!process.env.OPENAI_API_KEY) {
    console.warn("Warning: OPENAI_API_KEY not set. Content moderation is disabled.");
    return null;
  }

  try {
    const resp = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: text,
    });

    const result = resp.results?.[0];
    if (!result) return null;

    if (!result.flagged) return null;

    const categories = result.categories as unknown as Record<string, boolean>;
    const scores = (result.category_scores ?? {}) as unknown as Record<string, number>;

    let chosen = "";
    let max = -1;
    for (const [cat, isFlagged] of Object.entries(categories)) {
      if (isFlagged) {
        const score = Number(scores[cat] ?? 0);
        if (score > max) {
          max = score;
          chosen = cat;
        }
      }
    }

    const base = CATEGORY_MESSAGES[chosen] ?? "Content violates Fizz community guidelines. Please review our community standards and try again.";
    
    if (chosen.startsWith("self-harm")) {
      return `${base} If you are in crisis, please contact the Suicide Prevention Lifeline or Crisis Text Line.`;
    }
    
    return base;
  } catch (err) {
    console.error("Error checking content moderation:", err);
    return null;
  }
}

// Async moderation for posts - deletes post if moderation fails
// Comments are automatically deleted via ON DELETE CASCADE foreign key constraint
export async function moderatePostAsync(postId: number, content: string): Promise<void> {
  const moderationError = await checkContentModeration(content);
  if (moderationError) {
    try {
      await db.delete(posts).where(eq(posts.id, postId));
      console.log(`Post ${postId} deleted due to content moderation failure: ${moderationError}`);
    } catch (error) {
      console.error(`Failed to delete post ${postId} after moderation failure:`, error);
    }
  }
}

// Async moderation for comments - deletes comment if moderation fails
export async function moderateCommentAsync(commentId: number, postId: number, content: string): Promise<void> {
  const moderationError = await checkContentModeration(content);
  if (moderationError) {
    try {
      await db.delete(comments).where(eq(comments.id, commentId));
      // Decrement post's comment count since comment was deleted
      await decrementCommentCount(postId);
      console.log(`Comment ${commentId} deleted due to content moderation failure: ${moderationError}`);
    } catch (error) {
      console.error(`Failed to delete comment ${commentId} after moderation failure:`, error);
    }
  }
}
