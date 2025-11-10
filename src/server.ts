import './types/express';

import 'dotenv/config';
import express from 'express';
import { initDb } from '../db/db';
import { validateRequest } from './middleware/contentValidation';
import { rateLimiter } from './middleware/rateLimiter';
import { userMiddleware } from './middleware/userMiddleware';
import { createUser, getUserById } from './services/userService';
import { createPost, getPostById } from './services/postService';
import { createComment, getCommentsByPostId } from './services/commentService';
import { getNewestFeed, getTrendingFeed } from './services/feedService';
import { createSchool } from './services/schoolService';

const app = express();
const port = 3000;

// Initialize database
initDb();

app.use(express.json());

// Apply rate limiting to all routes
app.use(rateLimiter);

// Apply validation to all POST routes
app.use((req, res, next) => {
  if (req.method === 'POST') {
    return validateRequest(req, res, next);
  }
  next();
});

app.get("/", (req, res) => {
  console.log("Fizz Backend");
  res.send("Fizz Backend");
});

// POST /schools - Create a new school
app.post('/schools', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: { message: 'name is required', statusCode: 400 } });
    }
    const school = await createSchool(name);
    res.status(201).json(school);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    res.status(statusCode).json({ error: { message, statusCode } });
  }
});

// POST /users - Create a new user
app.post('/users', async (req, res) => {
  try {
    const { name, schoolId } = req.body;
    if (!name) {
      return res.status(400).json({ error: { message: 'name is required', statusCode: 400 } });
    }
    if (schoolId === undefined || schoolId === null) {
      return res.status(400).json({ error: { message: 'schoolId is required', statusCode: 400 } });
    }
    const schoolIdNumber = parseInt(schoolId, 10);
    if (isNaN(schoolIdNumber)) {
      return res.status(400).json({ error: { message: 'schoolId must be a valid number', statusCode: 400 } });
    }
    const user = await createUser(name, schoolIdNumber);
    res.status(201).json(user);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    res.status(statusCode).json({ error: { message, statusCode } });
  }
});

// GET /users/:id - Get a user by ID
app.get('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: { message: 'Invalid user ID', statusCode: 400 } });
    }

    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: { message: 'User not found', statusCode: 404 } });
    }

    res.status(200).json(user);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    res.status(statusCode).json({ error: { message, statusCode } });
  }
});

// POST /posts - Create a new post
app.post('/posts', userMiddleware, async (req, res) => {
  try {
    const { content, mediaUrl } = req.body;
    if (!content) {
      return res.status(400).json({ error: { message: 'content is required', statusCode: 400 } });
    }
    const post = await createPost(req.user!.id, req.user!.schoolId, content, mediaUrl);
    res.status(201).json(post);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    res.status(statusCode).json({ error: { message, statusCode } });
  }
});

// POST /comments - Create a new comment
app.post('/comments', userMiddleware, async (req, res) => {
  try {
    const { postId, content, mediaUrl } = req.body;
    if (!content) {
      return res.status(400).json({ error: { message: 'content is required', statusCode: 400 } });
    }
    if (postId === undefined || postId === null) {
      return res.status(400).json({ error: { message: 'postId is required', statusCode: 400 } });
    }
    const postIdNumber = parseInt(postId, 10);
    if (isNaN(postIdNumber)) {
      return res.status(400).json({ error: { message: 'postId must be a valid number', statusCode: 400 } });
    }
    const comment = await createComment(postIdNumber, req.user!.id, content, mediaUrl);
    res.status(201).json(comment);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    res.status(statusCode).json({ error: { message, statusCode } });
  }
});

// GET /feed/newest - Get newest feed (time-based)
app.get('/feed/newest', userMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 30;
    const cursor = req.query.cursor as string | undefined;

    const feed = await getNewestFeed(req.user!.schoolId, limit, cursor);
    
    // Add preload hint with userId if next_cursor exists
    if (feed.next_cursor) {
      feed.preload_hint = `/feed/newest?userId=${req.user!.id}&limit=${limit}&cursor=${feed.next_cursor}`;
    }
    
    res.status(200).json(feed);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    res.status(statusCode).json({ error: { message, statusCode } });
  }
});

// GET /feed/trending - Get trending feed (algorithm-based)
app.get('/feed/trending', userMiddleware, async (req, res) => {
  try {
    const feed = await getTrendingFeed(req.user!.schoolId);
    res.status(200).json(feed);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    res.status(statusCode).json({ error: { message, statusCode } });
  }
});

// GET /posts/:id - Get a post and its comments (paginated)
app.get('/posts/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const limit = parseInt(req.query.limit as string, 10) || 30;
    const cursor = req.query.cursor as string | undefined;

    if (isNaN(postId)) {
      return res.status(400).json({ error: { message: 'Invalid post ID', statusCode: 400 } });
    }

    const post = await getPostById(postId);

    if (!post) {
      return res.status(404).json({ error: { message: 'Post not found', statusCode: 404 } });
    }

    const cursorTimestamp = cursor ? parseInt(cursor, 10) : undefined;
    const commentsResponse = await getCommentsByPostId(postId, limit, cursorTimestamp);

    res.status(200).json({
      ...post,
      comments: commentsResponse.comments,
      comments_next_cursor: commentsResponse.next_cursor,
      comments_has_more: commentsResponse.has_more,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    res.status(statusCode).json({ error: { message, statusCode } });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
