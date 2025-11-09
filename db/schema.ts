import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';

export const schools = sqliteTable('schools', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
});

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    schoolId: integer('schoolId').notNull().references(() => schools.id),
    createdAt: integer('createdAt').notNull(),
  },
  (table) => ({
    schoolIdIdx: index('idx_users_schoolId').on(table.schoolId),
  })
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
    votes: integer('votes').notNull().default(0),
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
    votes: integer('votes').notNull().default(0),
  },
  (table) => ({
    postIdIdx: index('idx_comments_postId').on(table.postId),
  })
);

export type Comment = typeof comments.$inferSelect;
export type School = typeof schools.$inferSelect;

