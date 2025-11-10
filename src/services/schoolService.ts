import { db } from '../../db/db';
import { schools, type School } from '../../db/schema';

// Creating a school
export async function createSchool(name: string): Promise<School> {
  try {
    const [school] = await db
      .insert(schools)
      .values({
        name,
      })
      .returning();

    return school;
  } catch (error: any) {
    if (error.message?.includes('UNIQUE') || error.message?.includes('SQLITE_CONSTRAINT')) {
      const err: any = new Error('School with this name already exists');
      err.statusCode = 409;
      throw err;
    }
    const err: any = new Error('Failed to create school');
    err.statusCode = 500;
    throw err;
  }
}

export type { School };

