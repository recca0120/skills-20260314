import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { db } from '../db'
import { todos } from '../db/schema'

export const todosRoute = new Hono()
  .get('/', async (c) => {
    const all = await db.select().from(todos).orderBy(desc(todos.createdAt))
    return c.json(all)
  })
  .post(
    '/',
    zValidator('json', z.object({ title: z.string().min(1) })),
    async (c) => {
      const { title } = c.req.valid('json')
      const [todo] = await db.insert(todos).values({ title }).returning()
      return c.json(todo, 201)
    }
  )
  .patch('/:id/done', async (c) => {
    const id = Number(c.req.param('id'))
    const [todo] = await db
      .update(todos)
      .set({ done: true })
      .where(eq(todos.id, id))
      .returning()
    if (!todo) return c.json({ error: 'Not found' }, 404)
    return c.json(todo)
  })
  .delete('/:id', async (c) => {
    const id = Number(c.req.param('id'))
    await db.delete(todos).where(eq(todos.id, id))
    return c.body(null, 204)
  })
