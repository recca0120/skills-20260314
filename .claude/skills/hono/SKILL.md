---
name: hono
description: Hono framework 開發指南。當需要使用 Hono 建立 API、Web 服務、後端路由、middleware、RPC client、資料驗證、部署到 Cloudflare Workers/Bun/Node.js/Vercel/AWS Lambda，或詢問任何 Hono 相關問題時使用。只要 code 裡有 `from 'hono'`、`new Hono()`、`hc<`、`zValidator`、`createMiddleware`、`wrangler.toml`，或用戶提到「Hono」、「Cloudflare Workers API」、「edge runtime API」，都應該觸發此 skill。
---

# Hono Framework 開發指南

> 版本：Hono v4.12.x（最新 v4.12.7）
> 詳細參考：`references/best-practices.md`

## 核心原則

- **Web Standards First**：Hono 基於 Web Standard APIs（Request/Response/URL），跨執行環境零修改
- **Type Safety**：善用 TypeScript 泛型定義 `Bindings`、`Variables`，讓 `c.env`、`c.get()` 都有型別
- **方法鏈保留型別**：RPC 必須用方法鏈（`.get().post()`）才能正確推斷 `AppType`
- **Validator 掛在 handler 上**：不能用 `app.use()` 加 validator，否則型別推斷失效

## 快速上手

```bash
npm create hono@latest my-app
# 選擇：cloudflare-workers / nodejs / bun / vercel / aws-lambda
```

## 標準專案結構

```
src/
├── index.ts          # 入口：組合路由 + 全域 middleware + 錯誤處理
├── types.ts          # Bindings, Variables, HonoApp 型別
├── middleware/       # 自訂 middleware（createMiddleware）
├── routes/           # 各模組路由（new Hono().route()）
└── lib/              # db、errors 等輔助
```

## 路由

```ts
// 基本
app.get('/users', handler)
app.post('/users', handler)
app.on(['PUT', 'DELETE'], '/users/:id', handler)

// 路由分組
const users = new Hono()
users.get('/', listHandler)
users.post('/', createHandler)
app.route('/users', users)

// Base path
const api = new Hono().basePath('/api')
```

## Middleware（洋蔥模型）

```ts
import { createMiddleware } from 'hono/factory'
import { logger, cors, secureHeaders, bearerAuth } from 'hono/...'

// 內建
app.use(logger())
app.use(cors({ origin: 'https://example.com' }))
app.use('/api/*', bearerAuth({ token: env.TOKEN }))
app.use(secureHeaders())

// 自訂（帶型別）
const authMiddleware = createMiddleware<{
  Variables: { userId: string }
}>(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  c.set('userId', token)
  await next()
})
```

## Validation（zod 推薦）

```ts
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

app.post(
  '/users',
  zValidator('json', z.object({
    name: z.string().min(1),
    email: z.string().email(),
  })),
  (c) => {
    const { name, email } = c.req.valid('json')  // 型別安全
    return c.json({ created: true }, 201)
  }
)

// 其他 target：'query' | 'param' | 'header' | 'cookie' | 'form'
```

## 型別定義

```ts
// types.ts
export type Bindings = {
  DB: D1Database      // Cloudflare D1
  KV: KVNamespace     // Cloudflare KV
  JWT_SECRET: string
}

export type Variables = {
  userId: string
  user: { id: string; name: string }
}

export type HonoApp = { Bindings: Bindings; Variables: Variables }

// 使用
const app = new Hono<HonoApp>()
// c.env.DB, c.env.JWT_SECRET — 型別安全
// c.get('userId') — 型別安全
```

## RPC（全端型別安全）

```ts
// server.ts — 用方法鏈保留型別
const routes = app
  .get('/posts', (c) => c.json({ posts: [] }, 200))
  .post('/posts', zValidator('json', schema), (c) => {
    const data = c.req.valid('json')
    return c.json({ id: '1', ...data }, 201)
  })

export type AppType = typeof routes  // 匯出型別

// client.ts — 完整 IDE 自動補全
import { hc } from 'hono/client'
import type { AppType } from './server'

const client = hc<AppType>('http://localhost:8787/')
const res = await client.posts.$get()
const created = await client.posts.$post({ json: { title: 'Hello' } })

// React Query queryKey 用 $path()
const queryKey = [client.posts.$path()]
```

## Error Handling

```ts
import { HTTPException } from 'hono/http-exception'

// 在 handler 中拋出
throw new HTTPException(404, { message: 'Not found' })
throw new HTTPException(401, { cause: originalError })

// 全域處理（放在最後）
app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse()
  console.error(err)
  return c.json({ error: 'Internal Server Error' }, 500)
})
app.notFound((c) => c.json({ error: 'Not Found' }, 404))
```

## 部署

| 平台 | 安裝 / 設定 |
|------|------------|
| Cloudflare Workers | 原生支援，`wrangler deploy` |
| Node.js | `npm i @hono/node-server`，`serve({ fetch: app.fetch, port: 3000 })` |
| Bun | `export default { port: 3000, fetch: app.fetch }` |
| Vercel | `import { handle } from 'hono/vercel'`，`export default handle(app)` |
| AWS Lambda | `import { handle } from 'hono/aws-lambda'`，`export const handler = handle(app)` |

### Cloudflare Workers 完整設定

```ts
// src/index.ts
const app = new Hono<{ Bindings: { KV: KVNamespace; SECRET: string } }>()
app.get('/data', async (c) => {
  const val = await c.env.KV.get('key')
  return c.json({ val })
})
export default app
```

```toml
# wrangler.toml
name = "my-app"
main = "src/index.ts"
compatibility_date = "2024-01-01"
[[kv_namespaces]]
binding = "KV"
id = "xxxx"
```

## Testing（Vitest）

```ts
import { describe, it, expect } from 'vitest'
import app from './index'

it('GET /posts', async () => {
  const res = await app.request('/posts')
  expect(res.status).toBe(200)
})

it('POST /posts', async () => {
  const res = await app.request('/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Hello' }),
  })
  expect(res.status).toBe(201)
})

// 測試 Cloudflare Bindings
it('with mock env', async () => {
  const res = await app.request('/data', {}, {
    KV: { get: async (k: string) => `mock-${k}` },
    SECRET: 'test-secret',
  })
  expect(res.status).toBe(200)
})
```

## OpenAPI / Swagger

```ts
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'

const app = new OpenAPIHono()

const route = createRoute({
  method: 'get',
  path: '/users/{id}',
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      content: { 'application/json': { schema: UserSchema } },
      description: 'User found',
    },
  },
})

app.openapi(route, (c) => {
  const { id } = c.req.valid('param')
  return c.json({ id, name: 'John' }, 200)
})

app.doc('/openapi.json', { openapi: '3.0.0', info: { title: 'API', version: '1.0.0' } })
app.get('/docs', swaggerUI({ url: '/openapi.json' }))
```

## 完整 index.ts 範例

```ts
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import type { HonoApp } from './types'
import users from './routes/users'
import posts from './routes/posts'

const app = new Hono<HonoApp>()

app.use('*', logger())
app.use('*', secureHeaders())
app.use('/api/*', cors({ origin: '*' }))

app.route('/api/users', users)
app.route('/api/posts', posts)

app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse()
  return c.json({ error: 'Internal Server Error' }, 500)
})
app.notFound((c) => c.json({ error: 'Not Found' }, 404))

export default app
export type AppType = typeof app
```

---

詳細程式碼範例請參考 `references/best-practices.md`。
