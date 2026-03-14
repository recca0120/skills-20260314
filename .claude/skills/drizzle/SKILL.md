---
name: drizzle
description: Drizzle ORM 開發指南。當需要用 Drizzle ORM 定義 schema、執行 migrations、查詢資料庫、設定 relations、處理 transactions，或整合到 Hono/Cloudflare D1/Bun/Turso/Neon/PlanetScale 時使用。只要 code 裡有 `drizzle-orm`、`drizzle-kit`、`pgTable`、`sqliteTable`、`mysqlTable`、`db.query`、`defineRelations`，或用戶提到「Drizzle」、「drizzle-kit migrate」、「Drizzle Studio」，都應該觸發此 skill。
---

# Drizzle ORM 開發指南

> 版本：drizzle-orm v1.0.0-beta（穩定版 v0.40.x）、drizzle-kit v0.30.x
> 詳細參考：`references/best-practices.md`

## 核心原則

- **Type Safety**：`$inferSelect` / `$inferInsert` 取得型別，無需手動定義
- **SQL-like API**：Drizzle 的 query API 貼近 SQL，容易推理行為
- **Validator 直接整合**：v1 後用 `drizzle-orm/zod` 取代獨立的 `drizzle-zod` 套件
- **所有 schema 必須 export**：drizzle-kit 需要找到所有 export 才能運作

## 快速上手

```bash
npm i drizzle-orm
npm i -D drizzle-kit

# 依資料庫選一個 driver
npm i postgres          # PostgreSQL
npm i better-sqlite3    # SQLite（Node.js）
npm i mysql2            # MySQL
npm i @libsql/client    # Turso / libsql
```

## Schema 定義

```ts
// src/db/schema.ts
import { pgTable, integer, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// 可重用的 timestamp columns
const timestamps = {
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp({ withTimezone: true }),
}

export const users = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(), // PostgreSQL 推薦，取代 serial
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  bio: text(),
  ...timestamps,
})

export const posts = pgTable('posts', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 255 }).notNull(),
  content: text(),
  published: boolean().default(false),
  userId: integer().notNull().references(() => users.id),
  ...timestamps,
})

// 型別推導（自動，無需手動寫）
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

### SQLite（Bun / Cloudflare D1）

```ts
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const todos = sqliteTable('todos', {
  id: integer().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  done: integer({ mode: 'boolean' }).default(false),
  createdAt: text().default(sql`CURRENT_TIMESTAMP`),
})
```

## drizzle.config.ts

```ts
import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',      // 'postgresql' | 'mysql' | 'sqlite' | 'turso'
  casing: 'snake_case',       // TS camelCase → DB snake_case 自動轉換
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

## Migration 工作流

```bash
# 1. Schema 有變更 → 產生 SQL migration 檔
npx drizzle-kit generate

# 2. 套用到資料庫
npx drizzle-kit migrate

# 原型開發：直接推送（不產生 migration 檔）
npx drizzle-kit push

# 檢視資料
npx drizzle-kit studio
```

## DB 初始化

```ts
// src/db/index.ts（PostgreSQL）
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle({ client, schema, casing: 'snake_case' })
```

```ts
// Bun SQLite
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'
import * as schema from './schema'

const sqlite = new Database('app.db')
export const db = drizzle({ client: sqlite, schema })
```

```ts
// Cloudflare D1（每個 request 建立）
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './db/schema'

const db = drizzle(c.env.DB, { schema })
```

## Queries

```ts
import { eq, and, or, like, gte, lte, inArray, isNull, desc, asc, count } from 'drizzle-orm'

// SELECT
const allUsers = await db.select().from(users)
const admins = await db.select().from(users).where(eq(users.role, 'admin'))
const paginated = await db.select().from(users)
  .orderBy(desc(users.createdAt))
  .limit(10).offset(0)

// JOIN
const withPosts = await db.select({
  userName: users.name,
  postTitle: posts.title,
}).from(users).innerJoin(posts, eq(posts.userId, users.id))

// INSERT + RETURNING
const [user] = await db.insert(users)
  .values({ name: 'Alice', email: 'alice@example.com' })
  .returning()

// UPDATE
const [updated] = await db.update(users)
  .set({ name: 'Alice Updated' })
  .where(eq(users.id, 1))
  .returning()

// DELETE
await db.delete(users).where(eq(users.id, 1))

// COUNT
const total = await db.$count(users, eq(users.role, 'admin'))
```

## Relations（v1 推薦：defineRelations）

```ts
// src/db/relations.ts
import { defineRelations } from 'drizzle-orm'
import * as schema from './schema'

export const relations = defineRelations(schema, (r) => ({
  users: {
    posts: r.many.posts(),
  },
  posts: {
    author: r.one.users({
      from: r.posts.userId,
      to: r.users.id,
    }),
    comments: r.many.comments(),
  },
}))

// DB 初始化時傳入
const db = drizzle({ client, schema, relations })
```

```ts
// Relational Query（型別安全的巢狀查詢）
const users = await db.query.users.findMany({
  with: {
    posts: {
      with: { comments: true },
      limit: 5,
      orderBy: { createdAt: 'desc' },
    },
  },
  where: { role: 'admin' },
  limit: 10,
})

const user = await db.query.users.findFirst({
  where: { id: 1 },
  with: { posts: true },
})
```

## Transactions

```ts
const result = await db.transaction(async (tx) => {
  const [from] = await tx.select().from(accounts).where(eq(accounts.id, fromId))

  if (from.balance < amount) tx.rollback()

  await tx.update(accounts)
    .set({ balance: sql`balance - ${amount}` })
    .where(eq(accounts.id, fromId))

  await tx.update(accounts)
    .set({ balance: sql`balance + ${amount}` })
    .where(eq(accounts.id, toId))

  return { success: true }
})
```

## Zod 整合（v1 用法）

```ts
// v1 後直接從 drizzle-orm/zod 引入，不需安裝 drizzle-zod
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/zod'

const insertUserSchema = createInsertSchema(users, {
  email: (s) => s.email('Invalid email'),
  name: (s) => s.min(2).max(100),
})

const updateUserSchema = createUpdateSchema(users) // 所有欄位 optional

// 與 Hono 搭配
import { zValidator } from '@hono/zod-validator'

app.post('/users', zValidator('json', insertUserSchema), async (c) => {
  const data = c.req.valid('json')
  const [user] = await db.insert(users).values(data).returning()
  return c.json(user, 201)
})
```

## 與 Hono 完整整合範例

```ts
// src/routes/users.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { users } from '../db/schema'
import { createInsertSchema, createUpdateSchema } from 'drizzle-orm/zod'

const insertSchema = createInsertSchema(users).omit({ id: true, createdAt: true })
const updateSchema = createUpdateSchema(users).omit({ id: true, createdAt: true })

export const usersRoute = new Hono()
  .get('/', async (c) => {
    return c.json(await db.query.users.findMany())
  })
  .get('/:id', async (c) => {
    const user = await db.query.users.findFirst({ where: { id: Number(c.req.param('id')) } })
    if (!user) return c.json({ error: 'Not found' }, 404)
    return c.json(user)
  })
  .post('/', zValidator('json', insertSchema), async (c) => {
    const [user] = await db.insert(users).values(c.req.valid('json')).returning()
    return c.json(user, 201)
  })
  .put('/:id', zValidator('json', updateSchema), async (c) => {
    const [user] = await db.update(users)
      .set(c.req.valid('json'))
      .where(eq(users.id, Number(c.req.param('id'))))
      .returning()
    if (!user) return c.json({ error: 'Not found' }, 404)
    return c.json(user)
  })
  .delete('/:id', async (c) => {
    await db.delete(users).where(eq(users.id, Number(c.req.param('id'))))
    return c.body(null, 204)
  })
```

## 各環境連線速查

| 環境 | Package | Import |
|------|---------|--------|
| Bun SQLite | 內建 | `drizzle-orm/bun-sqlite` |
| Cloudflare D1 | 內建 | `drizzle-orm/d1` |
| Turso | `@libsql/client` | `drizzle-orm/libsql` |
| Neon | `@neondatabase/serverless` | `drizzle-orm/neon-http` |
| Node.js PostgreSQL | `postgres` | `drizzle-orm/postgres-js` |
| Node.js MySQL | `mysql2` | `drizzle-orm/mysql2` |
| Node.js SQLite | `better-sqlite3` | `drizzle-orm/better-sqlite3` |

---

詳細程式碼範例請參考 `references/best-practices.md`。
