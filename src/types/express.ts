import type { User } from '../services/userService';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// This file ensures type augmentation is loaded
export {};

