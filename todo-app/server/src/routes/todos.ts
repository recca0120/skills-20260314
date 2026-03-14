import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/index.js'
import { todos } from '../db/schema.js'
import { eq } from 'drizzle-orm'

const app = new Hono()
  .get('/', async (c) => {
    const allTodos = await db.select().from(todos).orderBy(todos.createdAt)
    return c.json(allTodos)
  })
  .post('/', zValidator('json', z.object({ title: z.string().min(1).max(100) })), async (c) => {
    const { title } = c.req.valid('json')
    const [todo] = await db.insert(todos).values({ title }).returning()
    return c.json(todo, 201)
  })
  .patch('/:id', zValidator('json', z.object({ completed: z.boolean() })), async (c) => {
    const id = Number(c.req.param('id'))
    const { completed } = c.req.valid('json')
    const [todo] = await db.update(todos).set({ completed }).where(eq(todos.id, id)).returning()
    return c.json(todo)
  })
  .delete('/:id', async (c) => {
    const id = Number(c.req.param('id'))
    await db.delete(todos).where(eq(todos.id, id))
    return c.json({ success: true })
  })

export default app
export type TodosRoute = typeof app
