import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import todos from './routes/todos.js'

const app = new Hono()

app.use('*', cors({ origin: 'http://localhost:5173' }))

const routes = app.route('/api/todos', todos)

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log('Server running at http://localhost:3000')
})

export type AppType = typeof routes
