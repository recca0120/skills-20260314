import type { APIRoute } from 'astro'
import { db, todos } from '../../../db'
import { desc } from 'drizzle-orm'

export const GET: APIRoute = async () => {
  const allTodos = await db.select().from(todos).orderBy(desc(todos.createdAt))
  return Response.json(allTodos)
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json()
  const title = body?.title?.trim()

  if (!title) {
    return Response.json({ error: 'Title is required' }, { status: 400 })
  }

  const [todo] = await db.insert(todos).values({ title }).returning()
  return Response.json(todo, { status: 201 })
}
