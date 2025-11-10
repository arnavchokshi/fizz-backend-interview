import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';

export const schools = sqliteTable('schools', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
});

export type School = typeof schools.$inferSelect;

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    schoolId: integer('schoolId').notNull().references(() => schools.id),
    createdAt: integer('createdAt').notNull(),
  },
  (table) => ({})
);

export type User = typeof users.$inferSelect;

export const posts = sqliteTable(
  'posts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('userId').notNull().references(() => users.id),
    schoolId: integer('schoolId').notNull().references(() => schools.id),
    content: text('content').notNull(),
    mediaUrl: text('mediaUrl'),
    createdAt: integer('createdAt').notNull(),
    upvotes: integer('upvotes').notNull().default(0),
    downvotes: integer('downvotes').notNull().default(0),
    commentsCount: integer('commentsCount').notNull().default(0),
  },
  (table) => ({
    schoolCreatedIdx: index('idx_posts_school_created').on(
      table.schoolId,
      table.createdAt
    ),
  })
);

export type Post = typeof posts.$inferSelect;

export const comments = sqliteTable(
  'comments',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    postId: integer('postId').notNull().references(() => posts.id),
    userId: integer('userId').notNull().references(() => users.id),
    content: text('content').notNull(),
    mediaUrl: text('mediaUrl'),
    createdAt: integer('createdAt').notNull(),
    upvotes: integer('upvotes').notNull().default(0),
    downvotes: integer('downvotes').notNull().default(0),
  },
  (table) => ({
    postCreatedIdx: index('idx_comments_post_created').on(
      table.postId,
      table.createdAt
    ),
  })
);

export type Comment = typeof comments.$inferSelect;

