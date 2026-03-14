import type { APIRoute } from 'astro'
import { db, todos } from '../../../db'
import { eq } from 'drizzle-orm'

export const PATCH: APIRoute = async ({ params, request }) => {
  const id = Number(params.id)
  const body = await request.json()

  const [updated] = await db
    .update(todos)
    .set({ completed: body.completed })
    .where(eq(todos.id, id))
    .returning()

  if (!updated) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json(updated)
}

export const DELETE: APIRoute = async ({ params }) => {
  const id = Number(params.id)

  const [deleted] = await db
    .delete(todos)
    .where(eq(todos.id, id))
    .returning()

  if (!deleted) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return new Response(null, { status: 204 })
}
