import { Request, Response, NextFunction } from 'express';
import OpenAI from "openai";
import { db } from '../../db/db';
import { posts, comments } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { decrementCommentCount } from '../services/postService';

const getOpenAIClient = () => {
  const githubToken = process.env.GITHUB_TOKEN;
  const githubEndpoint = process.env.GITHUB_MODELS_ENDPOINT || "https://models.github.ai/inference";
  
  if (!githubToken) {
    throw new Error("GITHUB_TOKEN is required for content moderation");
  }
  
  return new OpenAI({
    baseURL: githubEndpoint,
    apiKey: githubToken,
  });
};

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

async function checkContentModeration(text: string): Promise<string | null> {
  if (!text || typeof text !== "string") return null;

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    console.error("[Moderation] GITHUB_TOKEN is required");
    return null;
  }

  const client = getOpenAIClient();

  try {
    const model = "openai/gpt-4o";
    
    const moderationPrompt = `You are a content moderation system for Fizz, a student social media platform. Analyze the following content and determine if it violates community guidelines.

Content to analyze: "${text}"

Check if the content contains:
- Harmful speech targeting groups
- Threats or intimidation
- Personal attacks or bullying
- Self-harm references
- Explicit adult content
- Graphic descriptions of harm
- Instructions for illegal activities
- Any other content inappropriate for a student platform

Respond ONLY with a JSON object in this exact format:
{
  "flagged": true/false,
  "category": "category_name" or null
}

If content is appropriate, set flagged to false. If inappropriate, set flagged to true and provide a brief category name.`;

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: "You are a content moderation system. Respond only with valid JSON." },
        { role: "user", content: moderationPrompt }
      ],
      temperature: 0.1,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    try {
      const moderationResult = JSON.parse(content.trim());
      if (!moderationResult.flagged) return null;

      return "Content violates community guidelines";
    } catch (parseErr) {
      console.error(`[Moderation] Failed to parse response:`, parseErr);
      return null;
    }
  } catch (err: any) {
    if (err.status === 401) {
      console.error(`[Moderation] Authentication failed - check GITHUB_TOKEN and 'models:read' permission`);
    } else if (err.status === 429) {
      console.error(`[Moderation] Rate limit hit`);
    } else if (err.status === 400 && err.message?.includes('content management policy')) {
      // If the prompt itself is filtered, try a simpler approach
      console.warn(`[Moderation] Prompt filtered, using fallback moderation`);
      // Fallback: check for obvious violations using simple keyword matching
      const dangerousKeywords = ['murder', 'kill', 'weapon', 'bomb', 'terrorist', 'suicide'];
      const lowerText = text.toLowerCase();
      if (dangerousKeywords.some(keyword => lowerText.includes(keyword))) {
        return "Content violates community guidelines";
      }
    } else {
      console.error(`[Moderation] Error:`, err.message);
    }
    return null;
  }
}

export async function moderatePostAsync(postId: number, content: string): Promise<void> {
  const moderationError = await checkContentModeration(content);
  if (moderationError) {
    try {
      await db.delete(posts).where(eq(posts.id, postId));
    } catch (error) {
      console.error(`Failed to delete post ${postId}:`, error);
    }
  }
}

export async function moderateCommentAsync(commentId: number, postId: number, content: string): Promise<void> {
  const moderationError = await checkContentModeration(content);
  if (moderationError) {
    try {
      await db.delete(comments).where(eq(comments.id, commentId));
      await decrementCommentCount(postId);
    } catch (error) {
      console.error(`Failed to delete comment ${commentId}:`, error);
    }
  }
}
