import { db } from '../../db/db';
import { users, type User } from '../../db/schema';
import { eq } from 'drizzle-orm';

//creating a user 
export async function createUser(
  name: string,
  schoolId: number
): Promise<User> {
  const createdAt = Date.now();

  try {
    const [user] = await db
      .insert(users)
      .values({
        name,
        schoolId,
        createdAt,
      })
      .returning();

    return user;
  } catch (error: any) {
    if (error.message?.includes('FOREIGN KEY') || error.message?.includes('SQLITE_CONSTRAINT')) {
      const err: any = new Error('Invalid schoolId');
      err.statusCode = 400;
      throw err;
    }
    const err: any = new Error('Failed to create user');
    err.statusCode = 500;
    throw err;
  }
}

//getting a user by id
export async function getUserById(userId: number): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  return user || null;
}

export type { User };
