import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const todos = sqliteTable('todos', {
  id: integer().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  done: integer({ mode: 'boolean' }).default(false),
  createdAt: text().default(sql`CURRENT_TIMESTAMP`),
});

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
