import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = createClient({ url: REDIS_URL });

console.log('Initializing Redis connection for rate limiting...');

// Log connection events
redisClient.on('connect', () => console.log('✓ Redis connected for rate limiting'));
redisClient.on('ready', () => console.log('✓ Redis ready for rate limiting'));
redisClient.on('error', (err) => console.warn('⚠ Redis error:', err.message));
redisClient.on('end', () => console.warn('⚠ Redis connection ended'));
redisClient.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));

// Connect to Redis
redisClient.connect()
  .then(() => console.log('✓ Redis connected for rate limiting'))
  .catch((err) => console.warn('⚠ Redis connection failed, rate limiting disabled:', err.message));

// keeping a small rate limit for demo purposes
const RATE_LIMIT_REQUESTS = 20;
const RATE_LIMIT_WINDOW = 60;

export async function rateLimiter(req: Request, res: Response, next: NextFunction) {
  // Skip if Redis isn't connected
  if (!redisClient.isOpen) {
    return next();
  }

  try {
    // Get userId from query or body
    const userId = req.query.userId || req.body?.userId;
    
    // Skip rate limiting if no userId provided
    if (!userId) {
      return next();
    }
    
    // Create key for current time window
    const now = Math.floor(Date.now() / 1000);
    const windowStart = Math.floor(now / RATE_LIMIT_WINDOW) * RATE_LIMIT_WINDOW;
    const key = `rate_limit:user:${userId}:${windowStart}`;

    // Get current count
    const count = parseInt(await redisClient.get(key) || '0', 10);

    // Check if limit exceeded
    if (count >= RATE_LIMIT_REQUESTS) {
      res.setHeader('X-RateLimit-Limit', RATE_LIMIT_REQUESTS.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', (windowStart + RATE_LIMIT_WINDOW).toString());
      return res.status(429).json({ 
        error: { message: 'Rate limit exceeded. Please try again later.', statusCode: 429 } 
      });
    }

    // Increment and set expiration
    const newCount = count + 1;
    await redisClient.setEx(key, RATE_LIMIT_WINDOW, newCount.toString());

    // Set response headers
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_REQUESTS.toString());
    res.setHeader('X-RateLimit-Remaining', (RATE_LIMIT_REQUESTS - newCount).toString());
    res.setHeader('X-RateLimit-Reset', (windowStart + RATE_LIMIT_WINDOW).toString());

    next();
  } catch (error) {
    // On error, allow request (fail open)
    console.error('Rate limiter error:', error);
    next();
  }
}
