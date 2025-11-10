import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const dbPath = process.env.DB_PATH || 'mydb.sqlite';
const sqlite = new Database(dbPath);

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

// Export sqlite instance for raw SQL operations when needed
export { sqlite };

// Initialize database schema (create tables if they don't exist)
export async function initDb() {
  // Create schools table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS schools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `);

  // Create users table with camelCase columns
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      schoolId INTEGER NOT NULL,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (schoolId) REFERENCES schools(id)
    )
  `);

  // Create posts table with camelCase columns
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      schoolId INTEGER NOT NULL,
      content TEXT NOT NULL,
      mediaUrl TEXT,
      createdAt INTEGER NOT NULL,
      upvotes INTEGER NOT NULL DEFAULT 0,
      downvotes INTEGER NOT NULL DEFAULT 0,
      commentsCount INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (schoolId) REFERENCES schools(id)
    )
  `);

  // Create comments table with camelCase columns
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      postId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      content TEXT NOT NULL,
      mediaUrl TEXT,
      createdAt INTEGER NOT NULL,
      upvotes INTEGER NOT NULL DEFAULT 0,
      downvotes INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // Create indexes with camelCase column names
  // Index for posts: Optimizes feed queries that filter by schoolId and order by createdAt DESC
  // Used in getPostsBySchoolId and getAllPostsBySchoolId for efficient time-based sorting
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_posts_school_created ON posts(schoolId, createdAt DESC)
  `);
  
  // Composite index for comments: Optimizes getCommentsByPostId queries
  // Supports filtering by postId, ordering by createdAt DESC, and cursor-based pagination
  // This index can also be used for queries that only filter by postId (leftmost column)
  // This index allows SQLite to efficiently filter and sort without a separate sort operation
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(postId, createdAt DESC)
  `);
  

  return db;
}
