import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import { todos } from './schema'

const client = createClient({ url: 'file:todos.db' })

export const db = drizzle(client, { schema: { todos } })
export { todos }
