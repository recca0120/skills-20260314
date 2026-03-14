import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const todos = sqliteTable('todos', {
  id: int('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  completed: int('completed', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
})

export type Todo = typeof todos.$inferSelect
export type NewTodo = typeof todos.$inferInsert
