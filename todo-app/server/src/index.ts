import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serve } from '@hono/node-server'
import { todosRoute } from './routes/todos'

const app = new Hono()

app.use('*', logger())
app.use('/api/*', cors())

const routes = app.route('/api/todos', todosRoute)

export type AppType = typeof routes

const port = Number(process.env.PORT) || 3000
serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running at http://localhost:${port}`)
})
