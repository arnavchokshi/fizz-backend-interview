import { Request, Response, NextFunction } from 'express';
import { getUserById } from '../services/userService';

export async function userMiddleware(req: Request, res: Response, next: NextFunction) {
  const userIdParam = req.body?.userId || req.query.userId;
  if (!userIdParam) {
    return res.status(400).json({ error: { message: 'userId is required', statusCode: 400 } });
  }

  const userId = typeof userIdParam === 'string' ? parseInt(userIdParam, 10) : userIdParam;

  const user = await getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: { message: 'User not found', statusCode: 404 } });
  }

  req.user = user;
  next();
}

