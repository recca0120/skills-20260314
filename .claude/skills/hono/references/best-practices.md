# Hono Framework 最佳實踐完整技術參考

> 版本：Hono v4.12.x（最新版 v4.12.7，2026-03-10）
> 整理日期：2026-03-14

---

## 目錄

1. [路由設計 (Routing)](#1-路由設計)
2. [Middleware 使用](#2-middleware-使用)
3. [RPC / Hono Client](#3-rpc--hono-client)
4. [Validation 驗證](#4-validation-驗證)
5. [部署 (Deployment)](#5-部署)
6. [環境變數與 Bindings](#6-環境變數與-bindings)
7. [Error Handling](#7-error-handling)
8. [Testing Patterns](#8-testing-patterns)
9. [OpenAPI / Swagger](#9-openapi--swagger)
10. [Hono v4.x 最新特性](#10-hono-v4x-最新特性)

---

## 1. 路由設計

### 基本 HTTP 方法

```ts
app.get('/hello', (c) => c.text('Hello!'))
app.post('/posts', handler)
app.put('/posts/:id', handler)
app.delete('/posts/:id', handler)
app.all('/any', handler)           // 所有 HTTP methods
app.on('PURGE', '/cache', handler) // 自訂 method
app.on(['PUT', 'DELETE'], '/post', handler) // 多 methods
app.on('GET', ['/hello', '/ja/hello'], handler) // 多路徑
```

### 路徑參數

```ts
// 單一參數
app.get('/user/:name', (c) => {
  const name = c.req.param('name')
  return c.text(`Hello ${name}`)
})

// 多參數
app.get('/posts/:id/comment/:commentId', (c) => {
  const { id, commentId } = c.req.param()
  return c.json({ id, commentId })
})

// 可選參數
app.get('/api/animal/:type?', (c) => {
  const type = c.req.param('type') // 可能為 undefined
  return c.json({ type })
})

// Regex 約束
app.get('/post/:date{[0-9]+}/:title{[a-z]+}', handler)

// 含副檔名
app.get('/posts/:filename{.+\\.png}', handler)
```

### 萬用字元 (Wildcard)

```ts
app.get('/wild/*/card', handler)  // 中間萬用
app.get('/api/*', handler)        // 路徑前綴
```

### 路由分組與巢狀 (Grouping & Nesting)

```ts
// books.ts
const book = new Hono()
book.get('/', (c) => c.text('List Books'))       // GET /book/
book.get('/:id', (c) => c.text('Get Book'))      // GET /book/:id
book.post('/', (c) => c.text('Create Book'))     // POST /book/
export default book

// authors.ts
const author = new Hono()
author.get('/', handler)
author.post('/', handler)
export default author

// index.ts
import { Hono } from 'hono'
import book from './book'
import author from './author'

const app = new Hono()
app.route('/book', book)
app.route('/author', author)
export default app
```

### Base Path 設定

```ts
const api = new Hono().basePath('/api')
api.get('/users', handler)  // 實際路徑：/api/users
```

### Method Chaining

```ts
app
  .get('/endpoint', getHandler)
  .post('/endpoint', postHandler)
  .delete('/endpoint', deleteHandler)
```

### 路由執行順序

路由與 middleware 按**註冊順序**執行。Middleware 需寫在 handler 之前；fallback handler 寫在最後。

```ts
// 正確：middleware 在 handler 前
app.use('/api/*', authMiddleware)
app.get('/api/users', getUsersHandler)

// Wildcard 若先註冊會先匹配
app.get('*', fallbackHandler) // 寫在最後
```

### Hostname-based Routing

```ts
const app = new Hono({
  getPath: (req) => req.url.replace(/^https?:\/\/([^/]+)/, '/$1')
})
app.get('/api.example.com/posts', handler)
app.get('/web.example.com/posts', handler)
```

---

## 2. Middleware 使用

### 執行順序原則

Middleware 遵循**洋蔥模型**（Onion Model）：

```
MW1 開始 → MW2 開始 → MW3 開始 → Handler
         ← MW3 結束 ← MW2 結束 ← MW1 結束
```

```ts
app.use(async (c, next) => {
  console.log('MW1 before')
  await next()
  console.log('MW1 after')
})
```

### 內建 Middleware (Built-in)

```ts
import { logger } from 'hono/logger'
import { basicAuth } from 'hono/basic-auth'
import { bearerAuth } from 'hono/bearer-auth'
import { cors } from 'hono/cors'
import { compress } from 'hono/compress'
import { etag } from 'hono/etag'
import { poweredBy } from 'hono/powered-by'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import { csrf } from 'hono/csrf'
import { cache } from 'hono/cache'
import { timeout } from 'hono/timeout'
import { ipRestriction } from 'hono/ip-restriction'
import { trailingSlash } from 'hono/trailing-slash'

app.use(logger())
app.use(cors({ origin: 'https://example.com' }))
app.use('/api/*', bearerAuth({ token: 'my-token' }))
app.use(secureHeaders())
```

### 自訂 Middleware (createMiddleware)

```ts
import { createMiddleware } from 'hono/factory'

// 基本自訂 middleware
const requestLogger = createMiddleware(async (c, next) => {
  const start = Date.now()
  await next()
  const duration = Date.now() - start
  console.log(`${c.req.method} ${c.req.url} - ${duration}ms`)
})

// 帶型別的 middleware（設置 Context Variables）
const authMiddleware = createMiddleware<{
  Variables: {
    userId: string
    user: { id: string; name: string }
  }
}>(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  c.set('userId', token)
  await next()
})

app.use('/api/*', authMiddleware)
app.get('/api/me', (c) => {
  const userId = c.get('userId') // 型別安全
  return c.json({ userId })
})
```

### Factory Pattern（推薦用於大型應用）

```ts
import { createFactory } from 'hono/factory'

const factory = createFactory<{ Variables: { userId: string } }>()

// 建立 handler（保留型別推斷）
const handlers = factory.createHandlers(
  authMiddleware,
  (c) => {
    const userId = c.get('userId') // 完整型別支援
    return c.json({ userId })
  }
)

app.get('/users/me', ...handlers)
```

### Combine Middleware

```ts
import { some, every, except } from 'hono/combine'

// some：任一通過即繼續
app.use('/api/*', some(isPublicRoute, bearerAuth({ token })))

// every：全部通過才繼續
app.use('/admin/*', every(isAuthenticated, hasAdminRole))

// except：排除特定路徑
app.use('/api/*', except('/api/public/*', rateLimiter))
```

### Path / Method 指定

```ts
// 只在特定路徑生效
app.use('/api/*', corsMiddleware)

// 只在特定 method 生效
app.post('/api/*', bodyParser)
```

---

## 3. RPC / Hono Client

### Server 端設定

```ts
// server.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

// 重要：使用方法鏈來保留型別
const routes = app
  .get('/posts', (c) => {
    return c.json({ posts: [] }, 200)
  })
  .post(
    '/posts',
    zValidator('json', z.object({
      title: z.string(),
      body: z.string(),
    })),
    (c) => {
      const data = c.req.valid('json')
      return c.json({ ok: true, id: '1', ...data }, 201)
    }
  )
  .get('/posts/:id', (c) => {
    const id = c.req.param('id')
    return c.json({ id, title: 'Hello' }, 200)
  })
  .delete('/posts/:id', (c) => {
    return c.json({ ok: true }, 200)
  })

// 匯出型別（RPC 核心）
export type AppType = typeof routes

export default app
```

### Client 端使用

```ts
// client.ts
import { hc } from 'hono/client'
import type { AppType } from './server'

const client = hc<AppType>('http://localhost:8787/')

// GET 請求（IDE 自動補全路徑與參數）
const res = await client.posts.$get()
const data = await res.json()
// data 型別自動推斷為 { posts: never[] }

// POST 請求
const createRes = await client.posts.$post({
  json: { title: 'Hello Hono', body: 'It is awesome' }
})
const created = await createRes.json()

// 路徑參數
const postRes = await client.posts[':id'].$get({
  param: { id: '123' },
})

// DELETE
await client.posts[':id'].$delete({ param: { id: '123' } })
```

### Headers 與進階選項

```ts
// 全域 headers
const client = hc<AppType>('/api', {
  headers: {
    Authorization: `Bearer ${token}`,
    'X-App-Version': '1.0.0',
  },
})

// 單次請求 headers
const res = await client.posts.$get({}, {
  headers: { 'X-Request-ID': 'abc123' }
})

// Abort Signal
const controller = new AbortController()
const res = await client.posts.$get({}, {
  init: { signal: controller.signal }
})
```

### URL / Path 輔助

```ts
// $url() 返回完整 URL 物件
const url = client.posts.$url()
// URL { href: 'http://localhost:8787/posts' }

// $path() 返回路徑字串（v4.12.0+，適合快取 key）
const path = client.posts.$path()
// '/posts'

// 帶 query 的 $path()
const pathWithQuery = client.posts.$path({ query: { page: '1' } })
// '/posts?page=1'
```

### 型別推斷工具

```ts
import type { InferRequestType, InferResponseType } from 'hono/client'

// 推斷請求型別
type CreatePostReq = InferRequestType<typeof client.posts.$post>['json']
// { title: string; body: string }

// 推斷回應型別（帶狀態碼）
type CreatePostRes = InferResponseType<typeof client.posts.$post, 201>

// 在 React Query 中使用
const mutation = useMutation({
  mutationFn: async (data: CreatePostReq) => {
    const res = await client.posts.$post({ json: data })
    return res.json() as Promise<CreatePostRes>
  }
})
```

### 全域錯誤回應型別（v4.12.0+）

```ts
import type { ApplyGlobalResponse } from 'hono/client'

// 讓所有路由都包含全域錯誤型別（如 401、500）
type ClientType = ApplyGlobalResponse<AppType, {
  401: { error: string }
  500: { error: string }
}>

const client = hc<ClientType>('/')
```

### Monorepo 設定

在 `tsconfig.json` 中確保：
```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

大型應用效能優化：先編譯 TypeScript 或使用 TypeScript Project References 減少型別推斷負擔。

---

## 4. Validation 驗證

### 驗證目標（Validation Targets）

| Target   | 說明                        |
|----------|-----------------------------|
| `json`   | Request body (JSON)         |
| `form`   | Form data                   |
| `query`  | Query string parameters     |
| `param`  | URL path parameters         |
| `header` | Request headers             |
| `cookie` | Cookie values               |

### Zod Validator（推薦）

```ts
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

// 基本使用
app.post(
  '/users',
  zValidator('json', z.object({
    name: z.string().min(1),
    email: z.string().email(),
    age: z.number().int().min(0).max(150),
  })),
  (c) => {
    const { name, email, age } = c.req.valid('json')
    return c.json({ created: true, name, email, age }, 201)
  }
)

// Query 參數驗證
app.get(
  '/posts',
  zValidator('query', z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  })),
  (c) => {
    const { page, limit } = c.req.valid('query')
    return c.json({ page, limit })
  }
)

// 自訂錯誤處理
app.post(
  '/users',
  zValidator('json', userSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: result.error.flatten() }, 400)
    }
  }),
  handler
)
```

### Standard Schema（統一介面）

```ts
import { sValidator } from '@hono/standard-validator'

// Zod
import { z } from 'zod'
const zodSchema = z.object({ name: z.string() })

// Valibot
import * as v from 'valibot'
const valibotSchema = v.object({ name: v.string() })

// ArkType
import { type } from 'arktype'
const arkSchema = type({ name: 'string' })

// 使用相同介面
app.post('/user', sValidator('json', zodSchema), handler)
app.post('/user', sValidator('json', valibotSchema), handler)
app.post('/user', sValidator('json', arkSchema), handler)
```

### Valibot Validator

```ts
import { vValidator } from '@hono/valibot-validator'
import * as v from 'valibot'

const schema = v.object({
  name: v.string(),
  age: v.pipe(v.number(), v.minValue(0)),
})

app.post('/users', vValidator('json', schema), (c) => {
  const data = c.req.valid('json')
  return c.json(data)
})
```

### 多目標驗證

```ts
app.post(
  '/api/users',
  zValidator('header', z.object({
    'authorization': z.string().startsWith('Bearer '),
  })),
  zValidator('json', z.object({
    name: z.string(),
    email: z.string().email(),
  })),
  (c) => {
    const headers = c.req.valid('header')
    const body = c.req.valid('json')
    return c.json({ ok: true })
  }
)
```

**注意事項：**
- 驗證 `json` 或 `form` 時，request 必須有對應的 `Content-Type` header
- Header 驗證使用小寫 key（如 `authorization`，非 `Authorization`）
- Validator middleware **必須直接加在 handler 上**，不能用 `app.use()` 添加（否則型別推斷失效）

---

## 5. 部署

### 5.1 Cloudflare Workers（推薦）

```ts
// src/index.ts
import { Hono } from 'hono'

type Bindings = {
  KV: KVNamespace
  DB: D1Database
  BUCKET: R2Bucket
  API_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/kv/:key', async (c) => {
  const value = await c.env.KV.get(c.req.param('key'))
  return c.json({ value })
})

export default app
```

```toml
# wrangler.toml
name = "my-app"
main = "src/index.ts"
compatibility_date = "2024-01-01"
minify = true

[[kv_namespaces]]
binding = "KV"
id = "xxxx"

[[d1_databases]]
binding = "DB"
database_name = "my-db"
database_id = "xxxx"
```

```
# .dev.vars（本地開發用，不提交到版控）
API_SECRET=dev-secret-value
```

部署：
```bash
npx wrangler deploy
```

CI/CD（GitHub Actions）：
```yaml
- uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### 5.2 Node.js

```ts
import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()
app.get('/', (c) => c.text('Hello Node.js!'))

serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`Server running at http://localhost:${info.port}`)
})
```

```bash
npm install @hono/node-server
```

### 5.3 Bun

```ts
import { Hono } from 'hono'
import { serve } from 'hono/bun'

const app = new Hono()
app.get('/', (c) => c.text('Hello Bun!'))

export default {
  port: 3000,
  fetch: app.fetch,
}
// 或
serve({ fetch: app.fetch, port: 3000 })
```

```bash
bun run src/index.ts
```

### 5.4 Deno

```ts
import { Hono } from 'npm:hono'
import { serve } from 'npm:hono/deno'

const app = new Hono()
app.get('/', (c) => c.text('Hello Deno!'))

serve(app, { port: 8000 })
// 或
Deno.serve(app.fetch)
```

### 5.5 Vercel

```ts
// api/index.ts（Vercel serverless function）
import { Hono } from 'hono'
import { handle } from 'hono/vercel'

export const config = { runtime: 'edge' } // 可選：edge runtime

const app = new Hono().basePath('/api')
app.get('/hello', (c) => c.json({ message: 'Hello Vercel!' }))

export default handle(app)
```

```bash
npx create-hono@latest my-app  # 選擇 vercel template
vercel deploy
```

### 5.6 AWS Lambda

```ts
import { Hono } from 'hono'
import { handle, streamHandle } from 'hono/aws-lambda'
import type { LambdaEvent } from 'hono/aws-lambda'

type Bindings = {
  event: LambdaEvent
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  const requestId = c.env.event.requestContext.requestId
  return c.json({ requestId, message: 'Hello Lambda!' })
})

// 標準 handler
export const handler = handle(app)

// Streaming handler（需在 Lambda 啟用 Response Streaming）
// export const handler = streamHandle(app)
```

```ts
// AWS CDK 設定
const fn = new NodejsFunction(this, 'MyFunction', {
  entry: 'lambda/index.ts',
  handler: 'handler',
  runtime: lambda.Runtime.NODEJS_22_X,
})
fn.addFunctionUrl({
  authType: lambda.FunctionUrlAuthType.NONE,
})
```

### 快速建立各平台專案

```bash
npm create hono@latest my-app
# 選擇：cloudflare-workers / cloudflare-pages / nodejs / bun / deno / vercel / aws-lambda / nextjs
```

---

## 6. 環境變數與 Bindings

### c.env（Cloudflare Workers）

```ts
type Bindings = {
  KV: KVNamespace
  DB: D1Database
  BUCKET: R2Bucket
  SECRET_KEY: string
  API_URL: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/data', async (c) => {
  // 直接從 c.env 存取，完整型別安全
  const secret = c.env.SECRET_KEY
  const data = await c.env.KV.get('my-key')
  const result = await c.env.DB.prepare('SELECT * FROM users').all()
  return c.json({ data, result: result.results })
})
```

### env() 跨執行環境輔助

```ts
import { env } from 'hono/adapter'

app.get('/env', (c) => {
  // 自動依執行環境取得：
  // Node.js/Bun → process.env.NAME
  // Cloudflare   → wrangler.toml 中的值
  // Deno         → Deno.env.get('NAME')
  const name = env<{ NAME: string }>(c).NAME
  return c.text(`Hello ${name}`)
})

// 指定特定執行環境
const value = env(c, 'workerd').MY_SECRET
```

### getRuntimeKey()

```ts
import { getRuntimeKey } from 'hono/adapter'

app.get('/runtime', (c) => {
  const runtime = getRuntimeKey()
  // 'workerd' | 'deno' | 'bun' | 'node' | 'edge-light' | 'fastly' | 'other'
  return c.text(`Running on: ${runtime}`)
})
```

### c.set() / c.get()（Context Variables）

```ts
type Variables = {
  user: { id: string; name: string; role: string }
  requestId: string
}

const app = new Hono<{ Variables: Variables }>()

app.use('*', async (c, next) => {
  c.set('requestId', crypto.randomUUID())
  await next()
})

app.use('/api/*', authMiddleware) // 在 middleware 中 c.set('user', ...)

app.get('/api/profile', (c) => {
  const user = c.get('user')   // 型別：{ id: string; name: string; role: string }
  const reqId = c.get('requestId')
  return c.json({ user, reqId })
})
```

---

## 7. Error Handling

### HTTPException

```ts
import { HTTPException } from 'hono/http-exception'

// 拋出標準 HTTP 錯誤
app.get('/posts/:id', async (c) => {
  const post = await db.find(c.req.param('id'))
  if (!post) {
    throw new HTTPException(404, { message: 'Post not found' })
  }
  return c.json(post)
})

// 帶自訂 Response（如特定 headers）
throw new HTTPException(401, {
  res: new Response('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Bearer realm="API"' },
  }),
})

// 帶 cause（除錯用）
try {
  await dangerousOperation()
} catch (e) {
  throw new HTTPException(500, {
    message: 'Internal error',
    cause: e,
  })
}
```

### app.onError（全域錯誤處理）

```ts
app.onError((err, c) => {
  // 處理 HTTPException
  if (err instanceof HTTPException) {
    // 可加上額外 headers
    return err.getResponse()
  }

  // 處理其他錯誤
  console.error('Unhandled error:', err)
  return c.json({ error: 'Internal Server Error' }, 500)
})
```

### app.notFound（404 處理）

```ts
// 必須在頂層 app 設定
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    path: c.req.path,
  }, 404)
})
```

### 路由層級錯誤處理

```ts
// 子路由的 onError 優先於父 app 的 onError
const api = new Hono()
api.onError((err, c) => {
  return c.json({ error: err.message }, 500)
})

app.route('/api', api)
```

### 完整錯誤處理範例

```ts
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'

const app = new Hono()

// 全域錯誤處理
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse()
  }

  if (err instanceof ZodError) {
    return c.json({ error: 'Validation failed', details: err.flatten() }, 400)
  }

  console.error('Unexpected error:', err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

app.notFound((c) => {
  return c.json({ error: `Route not found: ${c.req.path}` }, 404)
})
```

---

## 8. Testing Patterns

### 基本測試（app.request()）

```ts
// posts.test.ts
import { describe, it, expect } from 'vitest'
import app from './index'

describe('Posts API', () => {
  it('GET /posts should return 200', async () => {
    const res = await app.request('/posts')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ posts: [] })
  })

  it('POST /posts should create a post', async () => {
    const res = await app.request('/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Hello', body: 'World' }),
    })
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.title).toBe('Hello')
  })

  it('POST /posts with form data', async () => {
    const form = new FormData()
    form.append('title', 'Hello')
    form.append('body', 'World')

    const res = await app.request('/posts', {
      method: 'POST',
      body: form,
    })
    expect(res.status).toBe(201)
  })
})
```

### 環境變數模擬（Cloudflare Bindings）

```ts
const MOCK_ENV = {
  KV: {
    get: async (key: string) => `mocked-${key}`,
    put: async () => {},
  },
  DB: {
    prepare: (query: string) => ({
      all: async () => ({ results: [] }),
      run: async () => ({ success: true }),
    }),
  },
  SECRET_KEY: 'test-secret',
}

it('should access KV binding', async () => {
  const res = await app.request('/data/key123', {}, MOCK_ENV)
  expect(res.status).toBe(200)
  const data = await res.json()
  expect(data.value).toBe('mocked-key123')
})
```

### 使用 Native Request

```ts
it('should handle raw Request', async () => {
  const req = new Request('http://localhost/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Test' }),
  })
  const res = await app.request(req)
  expect(res.status).toBe(201)
})
```

### 測試 RPC Client（型別安全測試）

```ts
import { hc } from 'hono/client'
import type { AppType } from './index'

const client = hc<AppType>('http://localhost/', {
  fetch: app.fetch.bind(app) // 使用 app.fetch 直接測試，不起實際 server
})

it('should create post via client', async () => {
  const res = await client.posts.$post({
    json: { title: 'Hello', body: 'World' }
  })
  expect(res.status).toBe(201)
  const data = await res.json()
  expect(data.ok).toBe(true)
})
```

### Vitest 設定（Cloudflare Workers）

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'miniflare', // 使用 @cloudflare/vitest-pool-workers
  },
})
```

---

## 9. OpenAPI / Swagger

### 方案一：@hono/zod-openapi（官方推薦）

```ts
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'

const app = new OpenAPIHono()

// Schema 定義
const UserSchema = z.object({
  id: z.string().openapi({ example: '123' }),
  name: z.string().openapi({ example: 'John Doe' }),
  email: z.string().email().openapi({ example: 'john@example.com' }),
  age: z.number().int().openapi({ example: 30 }),
}).openapi('User')

const CreateUserSchema = z.object({
  name: z.string().min(1).openapi({ example: 'John Doe' }),
  email: z.string().email().openapi({ example: 'john@example.com' }),
  age: z.number().int().min(0).max(150).openapi({ example: 30 }),
})

const ParamsSchema = z.object({
  id: z.string().min(1).openapi({
    param: { name: 'id', in: 'path' },
    example: '123',
  }),
})

// 路由定義（同時定義 API 行為與 OpenAPI 文件）
const getUserRoute = createRoute({
  method: 'get',
  path: '/users/{id}',
  summary: 'Get user by ID',
  tags: ['Users'],
  request: {
    params: ParamsSchema,
  },
  responses: {
    200: {
      content: { 'application/json': { schema: UserSchema } },
      description: 'User found',
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({ error: z.string() }),
        },
      },
      description: 'User not found',
    },
  },
})

const createUserRoute = createRoute({
  method: 'post',
  path: '/users',
  summary: 'Create a new user',
  tags: ['Users'],
  request: {
    body: {
      content: { 'application/json': { schema: CreateUserSchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: UserSchema } },
      description: 'User created',
    },
  },
})

// Handler 實作
app.openapi(getUserRoute, (c) => {
  const { id } = c.req.valid('param')
  return c.json({ id, name: 'John', email: 'john@example.com', age: 30 }, 200)
})

app.openapi(createUserRoute, (c) => {
  const data = c.req.valid('json')
  return c.json({ id: '1', ...data }, 201)
})

// OpenAPI 文件端點
app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'My API',
    description: 'API Documentation',
  },
  servers: [
    { url: 'http://localhost:8787', description: 'Development' },
  ],
})

// Swagger UI
app.get('/docs', swaggerUI({ url: '/openapi.json' }))

export default app
```

安裝：
```bash
npm install @hono/zod-openapi @hono/swagger-ui
```

### 方案二：hono-openapi（Standard Schema 相容）

```ts
import { describeRoute } from 'hono-openapi'
import { resolver, validator as vValidator } from 'hono-openapi/valibot'
import * as v from 'valibot'

const UserSchema = v.object({
  name: v.string(),
  age: v.number(),
})

app.get(
  '/users/:id',
  describeRoute({
    description: 'Get user by ID',
    responses: {
      200: {
        description: 'User found',
        content: { 'application/json': { schema: resolver(UserSchema) } },
      },
    },
  }),
  vValidator('param', v.object({ id: v.string() })),
  (c) => {
    return c.json({ name: 'John', age: 30 })
  }
)

// 生成 OpenAPI spec
app.get('/openapi', openAPISpecs(app, {
  documentation: {
    info: { title: 'API', version: '1.0.0' },
  },
}))
```

安裝：
```bash
npm install hono-openapi
```

### Scalar UI（替代 Swagger UI）

```ts
import { apiReference } from '@scalar/hono-api-reference'

app.get('/reference', apiReference({
  spec: { url: '/openapi.json' },
  theme: 'saturn',
}))
```

---

## 10. Hono v4.x 最新特性

### 當前版本：v4.12.7（2026-03-10）

#### v4.12.0（2025-02-19）主要新功能

**Client 增強**
```ts
// $path() 方法（新）：返回路徑字串而非完整 URL
const path = client.posts.$path()               // '/posts'
const path = client.posts.$path({ query: { page: '1' } })  // '/posts?page=1'

// 適合用作 React Query 的 queryKey
const queryKey = [client.users[':id'].$path({ param: { id: userId } })]
```

**ApplyGlobalResponse 型別輔助（新）**
```ts
import type { ApplyGlobalResponse } from 'hono/client'

// 將全域錯誤回應型別套用到所有路由
type TypedClient = ApplyGlobalResponse<AppType, GlobalErrorResponses>
```

**Basic Auth onAuthSuccess 回呼（新）**
```ts
app.use(basicAuth({
  username: 'admin',
  password: 'secret',
  onAuthSuccess: (c) => {
    c.set('user', { name: 'admin', role: 'superadmin' })
    // 認證成功後可設定 context variables
  }
}))
```

**getConnInfo() 新平台支援**
```ts
import { getConnInfo } from 'hono/cloudflare-pages'  // 新增
import { getConnInfo } from 'hono/aws-lambda'         // 新增
import { getConnInfo } from 'hono/netlify'            // 新增

app.get('/', (c) => {
  const info = getConnInfo(c)
  return c.json({ remoteIP: info.remote.address })
})
```

**Trailing Slash alwaysRedirect（新）**
```ts
import { trailingSlash } from 'hono/trailing-slash'

// 修正萬用字元路由的 trailing slash 問題
app.use(trailingSlash({ alwaysRedirect: true }))
```

**Language Middleware RFC 4647 支援**
```ts
import { languageDetector } from 'hono/language'

app.use(languageDetector({
  supportedLanguages: ['en', 'ja', 'zh'],
  fallbackLanguage: 'en',
  // 支援 RFC 4647 Lookup 演算法的漸進式截斷
}))
```

#### 效能改進

| 改進項目 | 提升幅度 |
|---------|---------|
| TrieRouter 速度 | 1.5x–2.0x 更快 |
| c.json() 吞吐量 | +3.2% |
| Context 操作 | 減少記憶體分配 |

#### 安全性修復（v4.12.x）

- **v4.12.7**：防止 `parseBody({ dot: true })` 中的 Prototype Pollution（拒絕 `__proto__` 路徑段）
- **v4.12.4**：修正 SSE 欄位注入與 Cookie 屬性操作漏洞
- **v4.12.3**：JWT 安全改進、Form data 解析修正
- **v4.12.2**：AWS Lambda `X-Forwarded-For` IP 驗證加強

#### 重要概念：SmartRouter

Hono 預設使用 SmartRouter，應用啟動時自動選擇最快的路由器（RegExpRouter 或 TrieRouter）並持續使用：

```ts
// 預設（推薦）：SmartRouter 自動選擇
import { Hono } from 'hono'
const app = new Hono()

// 手動指定路由器（進階場景）
import { RegExpRouter } from 'hono/router/reg-exp-router'
import { TrieRouter } from 'hono/router/trie-router'
const app = new Hono({ router: new RegExpRouter() })
```

---

## 完整架構範例

### 企業級 Hono 應用結構

```
src/
├── index.ts          # 入口點，組合所有路由
├── types.ts          # 共用型別（Bindings, Variables）
├── middleware/
│   ├── auth.ts       # 認證 middleware
│   ├── logger.ts     # 自訂日誌
│   └── rateLimit.ts  # 速率限制
├── routes/
│   ├── users.ts      # /api/users
│   ├── posts.ts      # /api/posts
│   └── health.ts     # /health
└── lib/
    ├── db.ts         # 資料庫輔助
    └── errors.ts     # 自訂錯誤類別
```

```ts
// src/types.ts
export type Bindings = {
  DB: D1Database
  KV: KVNamespace
  JWT_SECRET: string
}

export type Variables = {
  userId: string
  user: { id: string; name: string; role: string }
}

export type HonoApp = { Bindings: Bindings; Variables: Variables }
```

```ts
// src/index.ts
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import type { HonoApp } from './types'
import users from './routes/users'
import posts from './routes/posts'
import health from './routes/health'

const app = new Hono<HonoApp>()

// 全域 Middleware
app.use('*', logger())
app.use('*', secureHeaders())
app.use('/api/*', cors({ origin: process.env.ALLOWED_ORIGIN || '*' }))

// 路由
app.route('/health', health)
app.route('/api/users', users)
app.route('/api/posts', posts)

// 錯誤處理
app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse()
  console.error(err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

app.notFound((c) => c.json({ error: 'Not Found' }, 404))

export default app

// 匯出 AppType 供 RPC 使用
export type AppType = typeof app
```

---

## 參考資源

- [Hono 官方文件](https://hono.dev/docs)
- [Hono GitHub](https://github.com/honojs/hono)
- [Hono Releases](https://github.com/honojs/hono/releases)
- [@hono/zod-openapi NPM](https://www.npmjs.com/package/@hono/zod-openapi)
- [Cloudflare Workers + Hono 官方指南](https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/hono/)
- [Vercel + Hono 部署](https://vercel.com/changelog/deploy-hono-backends-with-zero-configuration)
- [DeepWiki: Hono Adapters](https://deepwiki.com/honojs/hono/8.4-cloudflare-deno-bun-and-node.js-adapters)
