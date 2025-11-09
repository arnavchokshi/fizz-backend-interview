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
      votes INTEGER NOT NULL DEFAULT 0,
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
      votes INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // Create indexes with camelCase column names
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_posts_school_created ON posts(schoolId, createdAt DESC)
  `);
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_comments_postId ON comments(postId)
  `);
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_schoolId ON users(schoolId)
  `);

  return db;
}
