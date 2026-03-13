import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'

const client = createClient({ url: 'file:todos.db' })
const db = drizzle(client)

await migrate(db, { migrationsFolder: './drizzle' })
console.log('Migration done!')
client.close()
