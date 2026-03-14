# Drizzle ORM 完整技術參考資料（2026 最新）

> 版本：drizzle-orm v1.0.0-beta / v0.40.x，drizzle-kit v0.30.x
> 整理日期：2026-03-14

以下為完整程式碼範例，供 SKILL.md 參考使用。

---

## 目錄

1. [Schema 定義](#1-schema-定義)
2. [Migrations（drizzle-kit）](#2-migrations)
3. [Queries（CRUD 操作）](#3-queries)
4. [Relations（關聯查詢）](#4-relations)
5. [各資料庫支援](#5-各資料庫支援)
6. [執行環境整合](#6-執行環境整合)
7. [Transactions](#7-transactions)
8. [型別安全](#8-型別安全)
9. [Drizzle Studio](#9-drizzle-studio)
10. [與 Hono 整合](#10-與-hono-整合)
11. [最新版本特性（v1.0 beta）](#11-最新版本特性)

---

## 1. Schema 定義

### 基本 Table 定義

**PostgreSQL：**
```typescript
import { pgTable, integer, varchar, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(), // 2025+ 推薦，取代 serial
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  createdAt: timestamp({ withTimezone: true, precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true, precision: 3 }).defaultNow().notNull(),
});
```

**MySQL：**
```typescript
import { mysqlTable, int, varchar, datetime } from "drizzle-orm/mysql-core";

export const users = mysqlTable('users', {
  id: int().primaryKey().autoincrement(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});
```

**SQLite：**
```typescript
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable('users', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  email: text().notNull().unique(),
  createdAt: text().notNull().default(sql`CURRENT_TIMESTAMP`),
});
```

### Column Naming Convention

```typescript
// 方式一：手動指定 column alias（TS camelCase → DB snake_case）
export const users = pgTable('users', {
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
});

// 方式二：自動 casing（推薦，drizzle 初始化時設定）
const db = drizzle({ connection: url, casing: 'snake_case' });
// TS: firstName → DB: first_name（自動轉換）
```

### 可重用 Column（Reusable Columns）

```typescript
const timestamps = {
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp({ withTimezone: true }),
};

export const users = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  ...timestamps,
});

export const posts = pgTable('posts', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 255 }).notNull(),
  ...timestamps,
});
```

### PostgreSQL 進階特性

```typescript
import { pgSchema, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";

// Enums
export const roleEnum = pgEnum('role', ['admin', 'user', 'moderator']);

// 自訂 Schema（namespace）
export const authSchema = pgSchema('auth');
export const authUsers = authSchema.table('users', { id: integer() });

// Index
export const users = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull(),
  role: roleEnum().default('user'),
}, (table) => [
  index('email_idx').on(table.email),
  uniqueIndex('email_unique').on(table.email),
]);
```

### $onUpdate 自動更新

```typescript
export const users = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  updatedAt: timestamp().$onUpdate(() => new Date()),
});
```

---

## 2. Migrations

### drizzle.config.ts 設定

```typescript
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',  // 'postgresql' | 'mysql' | 'sqlite' | 'turso'
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  casing: 'snake_case',
  verbose: true,
  strict: true,
});
```

### 核心命令

```bash
npx drizzle-kit generate   # 根據 schema 變更產生 SQL migration 檔案
npx drizzle-kit migrate    # 將 migration 套用到資料庫
npx drizzle-kit push       # 直接推送 schema（原型開發用，不產生 migration）
npx drizzle-kit pull       # 從現有資料庫反向產生 schema
npx drizzle-kit check      # 檢查 migration 衝突
npx drizzle-kit studio     # 啟動 Drizzle Studio
npx drizzle-kit up         # 升級舊 snapshot 格式（升級到 v1 前執行）
```

### Migration 方式比較

| 方式 | 方法 | 適用場景 |
|------|------|----------|
| Option 1 | `pull` from database | Database-first 工作流 |
| Option 2 | `push` directly | 快速原型開發 |
| Option 3 | `generate` + CLI `migrate` | 傳統 CI/CD pipeline |
| Option 4 | `generate` + runtime migrate | Monolithic/serverless app |

### Runtime Migration（程式碼內執行）

```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

const db = drizzle(process.env.DATABASE_URL!);
await migrate(db, { migrationsFolder: './drizzle/migrations' });
```

---

## 3. Queries

### SELECT

```typescript
import { eq, lt, gte, ne, and, or, like, ilike, inArray, isNull, isNotNull, sql, asc, desc, count, sum, avg } from "drizzle-orm";

// 基本 select
const allUsers = await db.select().from(users);

// Partial select
const result = await db.select({
  id: users.id,
  name: users.name,
  fullName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
}).from(users);

// WHERE 條件
const filtered = await db.select().from(users)
  .where(and(
    eq(users.role, 'admin'),
    gte(users.createdAt, new Date('2024-01-01')),
    or(like(users.email, '%@gmail.com'), isNotNull(users.deletedAt))
  ));

// ORDER BY、LIMIT、OFFSET
const paginated = await db.select().from(users)
  .orderBy(asc(users.name), desc(users.createdAt))
  .limit(10).offset(20);

// JOIN
const withPosts = await db.select({
  userName: users.name,
  postTitle: posts.title,
}).from(users)
  .innerJoin(posts, eq(posts.userId, users.id))
  .leftJoin(comments, eq(comments.postId, posts.id));

// 聚合
const stats = await db.select({
  total: count(),
  avgAge: avg(users.age),
}).from(users).groupBy(users.role);

// $count 快捷方式
const userCount = await db.$count(users, eq(users.role, 'admin'));

// Prepared Statement
import { placeholder } from "drizzle-orm";
const prepared = db.select().from(users)
  .where(eq(users.id, placeholder('id')))
  .prepare('get_user_by_id');
const user = await prepared.execute({ id: 1 });
```

### INSERT

```typescript
// 單筆 insert + returning
const [newUser] = await db.insert(users)
  .values({ name: 'Alice', email: 'alice@example.com' })
  .returning();

// 批次 insert
await db.insert(users).values([
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' },
]);

// Upsert（PostgreSQL / SQLite）
await db.insert(users)
  .values({ id: 1, name: 'Alice', email: 'alice@example.com' })
  .onConflictDoUpdate({
    target: users.email,
    set: { name: 'Alice Updated', updatedAt: new Date() },
  });
```

### UPDATE / DELETE

```typescript
// UPDATE + returning
const [updated] = await db.update(users)
  .set({ name: 'Updated', updatedAt: new Date() })
  .where(eq(users.id, 1))
  .returning();

// DELETE + returning
const [deleted] = await db.delete(users)
  .where(eq(users.id, 1))
  .returning();
```

---

## 4. Relations

### Relational Queries v2（v1.0 推薦）

```typescript
import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  users: {
    posts: r.many.posts(),
    profile: r.one.profiles({
      from: r.users.id,
      to: r.profiles.userId,
    }),
    groups: r.many.groups({
      from: r.users.id.through(r.usersToGroups.userId),
      to: r.groups.id.through(r.usersToGroups.groupId),
    }),
  },
  posts: {
    author: r.one.users({
      from: r.posts.userId,
      to: r.users.id,
    }),
    comments: r.many.comments(),
  },
}));

const db = drizzle({ connection: url, relations });
```

### Relational Query 語法（v2）

```typescript
// findMany with 巢狀關聯
const usersWithPosts = await db.query.users.findMany({
  with: {
    posts: {
      with: { comments: { with: { author: true } } },
      limit: 5,
      orderBy: { createdAt: 'desc' },
    },
  },
  where: { role: 'admin' },
  limit: 10,
});

// partial columns
const partial = await db.query.users.findMany({
  columns: { id: true, name: true },
  with: { posts: { columns: { id: true, title: true } } },
});

// extras（計算欄位）
const withCount = await db.query.users.findMany({
  extras: {
    postCount: (table) => db.$count(posts, eq(posts.userId, table.id)),
    fullName: (users, { sql }) => sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
  },
});
```

### Relational Queries v1（舊版）

```typescript
import { relations } from "drizzle-orm";

export const usersRelations = relations(users, ({ many, one }) => ({
  posts: many(posts),
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.userId], references: [users.id] }),
  comments: many(comments),
}));
```

---

## 5. 各資料庫支援

### PostgreSQL

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle({ client });
```

### MySQL

```typescript
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const pool = mysql.createPool(process.env.DATABASE_URL!);
export const db = drizzle({ client: pool });
```

### SQLite / libsql

```typescript
// better-sqlite3（Node.js）
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
export const db = drizzle({ client: new Database('local.db') });

// libsql（Turso）
import { drizzle } from 'drizzle-orm/libsql';
export const db = drizzle({
  connection: {
    url: process.env.TURSO_CONNECTION_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
});
```

---

## 6. 執行環境整合

### Bun SQLite

```typescript
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';

export const db = drizzle({ client: new Database('local.db') });
// 或 in-memory
export const db = drizzle(':memory:');
```

### Cloudflare D1

```typescript
// wrangler.toml
// [[d1_databases]]
// binding = "DB"
// database_name = "my-database"
// database_id = "YOUR_DB_ID"

import { drizzle } from 'drizzle-orm/d1';
import * as schema from './db/schema';

// Hono 中每個 request 初始化
const db = drizzle(c.env.DB, { schema });
```

### Turso

```typescript
import { drizzle } from 'drizzle-orm/libsql';

export const db = drizzle({
  connection: {
    url: process.env.TURSO_CONNECTION_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
});
```

### Neon（Serverless PostgreSQL）

```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```

---

## 7. Transactions

```typescript
// 基本 transaction
const result = await db.transaction(async (tx) => {
  const [from] = await tx.select().from(accounts).where(eq(accounts.id, fromId));
  if (from.balance < amount) tx.rollback();

  await tx.update(accounts)
    .set({ balance: sql`balance - ${amount}` })
    .where(eq(accounts.id, fromId));

  await tx.update(accounts)
    .set({ balance: sql`balance + ${amount}` })
    .where(eq(accounts.id, toId));

  return { success: true };
});

// Nested transactions（savepoints）
await db.transaction(async (tx) => {
  await tx.insert(users).values({ name: 'Alice' });
  await tx.transaction(async (tx2) => {
    await tx2.insert(posts).values({ userId: 1, title: 'Hello' });
  });
});

// Transaction 設定（PostgreSQL）
await db.transaction(async (tx) => { ... }, {
  isolationLevel: 'serializable',
  accessMode: 'read write',
});
```

---

## 8. 型別安全

```typescript
// 型別推導
type User = typeof users.$inferSelect
type NewUser = typeof users.$inferInsert

// Zod 整合（v1 後用法）
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/zod';

const insertUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email('Invalid email'),
  name: (schema) => schema.min(2).max(100),
});
const updateUserSchema = createUpdateSchema(users); // 所有欄位 optional

// v1 前（舊版）
// import { createInsertSchema } from 'drizzle-zod';

// Valibot / ArkType / TypeBox（v1 後）
import { createInsertSchema } from 'drizzle-orm/valibot';
import { createInsertSchema } from 'drizzle-orm/arktype';
import { createInsertSchema } from 'drizzle-orm/typebox';
```

---

## 9. Drizzle Studio

```bash
npx drizzle-kit studio
# 在 https://local.drizzle.studio 開啟
# 功能：瀏覽/編輯/刪除資料、執行 SQL、查看 schema
```

---

## 10. 與 Hono 整合

### 完整 CRUD 範例

```typescript
// src/routes/users.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-orm/zod";

const insertSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
const updateSchema = createUpdateSchema(users).omit({ id: true, createdAt: true });

export const usersRoute = new Hono()
  .get('/', async (c) => c.json(await db.query.users.findMany()))
  .get('/:id', async (c) => {
    const user = await db.query.users.findFirst({ where: { id: Number(c.req.param('id')) } });
    if (!user) return c.json({ error: 'Not found' }, 404);
    return c.json(user);
  })
  .post('/', zValidator('json', insertSchema), async (c) => {
    const [user] = await db.insert(users).values(c.req.valid('json')).returning();
    return c.json(user, 201);
  })
  .put('/:id', zValidator('json', updateSchema), async (c) => {
    const [user] = await db.update(users)
      .set(c.req.valid('json'))
      .where(eq(users.id, Number(c.req.param('id'))))
      .returning();
    if (!user) return c.json({ error: 'Not found' }, 404);
    return c.json(user);
  })
  .delete('/:id', async (c) => {
    await db.delete(users).where(eq(users.id, Number(c.req.param('id'))));
    return c.body(null, 204);
  });
```

### Hono + Cloudflare D1

```typescript
import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema";

type Env = { DB: D1Database; JWT_SECRET: string };

const app = new Hono<{ Bindings: Env }>();

app.get("/users", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const users = await db.query.users.findMany();
  return c.json(users);
});

export default app;
```

### DB Middleware（注入到 Context）

```typescript
import { createMiddleware } from "hono/factory";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../db/schema";

export const dbMiddleware = createMiddleware<{
  Variables: { db: ReturnType<typeof drizzle> };
}>(async (c, next) => {
  const db = drizzle({ connection: { url: c.env.DATABASE_URL }, schema });
  c.set('db', db);
  await next();
});

// 使用
app.use('*', dbMiddleware);
app.get('/users', async (c) => {
  const db = c.get('db');  // 型別安全
  return c.json(await db.query.users.findMany());
});
```

### Hono + Drizzle + OpenAPI

```typescript
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { createSelectSchema, createInsertSchema } from "drizzle-orm/zod";

const UserSchema = createSelectSchema(users);
const NewUserSchema = createInsertSchema(users).omit({ id: true });

const createUserRoute = createRoute({
  method: "post",
  path: "/users",
  request: { body: { content: { "application/json": { schema: NewUserSchema } } } },
  responses: {
    201: { content: { "application/json": { schema: UserSchema } }, description: "Created" },
  },
});

const app = new OpenAPIHono();
app.openapi(createUserRoute, async (c) => {
  const [user] = await db.insert(users).values(c.req.valid("json")).returning();
  return c.json(user, 201);
});
```

---

## 11. 最新版本特性

### Drizzle ORM v1.0.0-beta 主要新特性

1. **Relational Queries v2（RQBv2）**
   - `defineRelations()` 取代分散的 relations 定義
   - 物件語法取代 callback 語法
   - Many-to-many 直接支援 `through` 語法
   - Nested pagination（`limit`/`offset` in `with`）

2. **Validator 套件整合**
   - `drizzle-zod` → `drizzle-orm/zod`
   - `drizzle-valibot` → `drizzle-orm/valibot`
   - `drizzle-arktype` → `drizzle-orm/arktype`

3. **Migration 系統重寫**
   - 移除 `journal.json`（減少 git conflicts）
   - Schema introspection 速度大幅提升

4. **新資料庫支援**：MSSQL、CockroachDB、Gel dialect

5. **`defineRelationsPart`**（拆分大型 relations）

```typescript
const userRelations = defineRelationsPart(schema, (r) => ({
  users: { posts: r.many.posts() },
}));
const postRelations = defineRelationsPart(schema, (r) => ({
  posts: { author: r.one.users({ from: r.posts.userId, to: r.users.id }) },
}));
const db = drizzle({ connection: url, relations: [userRelations, postRelations] });
```

### 升級到 v1

```bash
# 先更新套件
npm i drizzle-orm@beta drizzle-kit@beta

# 升級 migration 資料夾結構
npx drizzle-kit up
```

### 最佳實踐總結

```typescript
// ✅ 推薦
id: integer().primaryKey().generatedAlwaysAsIdentity()  // PostgreSQL，取代 serial
const db = drizzle({ connection: url, casing: 'snake_case' })  // 自動命名轉換
type User = typeof users.$inferSelect                           // 型別推導
import { createInsertSchema } from 'drizzle-orm/zod'          // v1 後的 zod 整合
const [user] = await db.insert(users).values(data).returning() // 減少額外查詢

// ❌ 避免
// serial（舊版 PostgreSQL auto-increment）
// 手動寫 InferSelectModel<typeof users>（用 $inferSelect 更簡潔）
// 在 serverless 環境使用長連線（應每個 request 建立新連線）
```
