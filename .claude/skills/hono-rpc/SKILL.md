---
name: hono-rpc
description: Hono RPC 前後端型別共享指南。當需要設定 Hono RPC client、匯出 AppType、與 TanStack Query v5 整合、設定 monorepo 型別共享、使用 InferRequestType/InferResponseType、用 $path() 作為 queryKey，或解決 RPC 型別推斷失效問題時使用。只要 code 裡有 `hc<`、`AppType`、`InferResponseType`、`InferRequestType`、`$path()`、`$get`/`$post`/`$put`/`$delete`，或用戶提到「Hono RPC」、「hono client」、「前後端型別共享」，都應該觸發此 skill。
---

# Hono RPC 前後端型別共享指南

> Hono v4.12.7 | TanStack Query v5
> 詳細參考：`references/best-practices.md`

## 核心原則

- **方法鏈（Method Chaining）是關鍵**：`AppType` 必須從方法鏈末端匯出，不能用分散的 `app.get()`
- **明確標記 HTTP 狀態碼**：`c.json(data, 200)` 讓 client 端知道不同狀態的型別
- **`$path()` 作為 queryKey**：路由改變時自動同步，不需手動維護字串
- **`strict: true` 兩邊都要開**：server 和 client 的 tsconfig 都需要

## Server 端：正確匯出 AppType

```ts
// server/src/index.ts

// ✅ 方法鏈保留型別
const routes = app
  .get('/posts', (c) => c.json({ posts: [] }, 200))
  .post('/posts', zValidator('json', schema), (c) => {
    const data = c.req.valid('json')
    return c.json({ id: 1, ...data }, 201)
  })
  .get('/posts/:id', (c) => c.json({ id: c.req.param('id') }, 200))
  .delete('/posts/:id', (c) => c.json({ ok: true }, 200))

// ✅ 從 routes（而非 app）匯出型別
export type AppType = typeof routes
export default app
```

```ts
// ❌ 常見錯誤：分散呼叫型別會丟失
const app = new Hono()
app.get('/posts', handler)  // 型別丟失！
export type AppType = typeof app  // 沒有 route 型別資訊
```

## 多 Route 模組合併

```ts
// server/routes/users.ts
const usersRouter = new Hono()
  .get('/', (c) => c.json([{ id: 1, name: 'Alice' }], 200))
  .post('/', zValidator('json', insertSchema), (c) => c.json({ ok: true }, 201))
  .get('/:id', (c) => c.json({ id: c.req.param('id') }, 200))
export default usersRouter

// server/routes/posts.ts
const postsRouter = new Hono()
  .get('/', (c) => c.json([], 200))
  .delete('/:id', (c) => c.json({ ok: true }, 200))
export default postsRouter

// server/src/index.ts
const app = new Hono()
const routes = app
  .route('/users', usersRouter)
  .route('/posts', postsRouter)

export type AppType = typeof routes  // ← routes，不是 app
export default app
```

## Client 初始化

```ts
// client/src/lib/api.ts
import { hc } from 'hono/client'
import type { AppType } from '../../server/src'

// Singleton（避免每次 render 重建）
export const client = hc<AppType>(import.meta.env.VITE_API_URL ?? 'http://localhost:8787/')

// 大型 monorepo 效能優化：預先計算型別
export type HonoClient = ReturnType<typeof hc<AppType>>
```

## 型別工具

```ts
import type { InferRequestType, InferResponseType } from 'hono/client'

// Response 型別（帶狀態碼）
type PostsRes = InferResponseType<typeof client.posts.$get, 200>

// Request body 型別
type CreatePostBody = InferRequestType<typeof client.posts.$post>['json']

// 全域錯誤型別（v4.12.0+）
import type { ApplyGlobalResponse } from 'hono/client'
type ClientWithErrors = ApplyGlobalResponse<AppType, {
  401: { json: { error: string } }
  500: { json: { error: string } }
}>
const client = hc<ClientWithErrors>('/')
```

## $path() / $url()（v4.12.0+）

```ts
// $path() → 路徑字串，適合作為 queryKey
client.posts.$path()                                    // '/posts'
client.posts[':id'].$path({ param: { id: '123' } })    // '/posts/123'
client.posts.$path({ query: { page: '1' } })            // '/posts?page=1'

// $url() → URL 物件
const url = client.posts[':id'].$url({ param: { id: '1' } })
url.pathname  // '/posts/1'
```

## Headers 設定

```ts
// 全域 headers（靜態）
const client = hc<AppType>('/', {
  headers: { Authorization: 'Bearer token' }
})

// 全域 headers（動態，每次請求重新計算）
const client = hc<AppType>('/', {
  headers: () => ({ Authorization: `Bearer ${getToken()}` })
})

// Per-request headers
const res = await client.posts.$get(
  { query: { page: '1' } },
  { headers: { 'X-Request-Id': crypto.randomUUID() } }
)

// Abort signal
const controller = new AbortController()
const res = await client.posts.$get({}, { init: { signal: controller.signal } })
```

## TanStack Query v5 整合

### Query Options 模式（推薦）

```ts
// src/api/queries/posts.ts
import { queryOptions } from '@tanstack/react-query'
import { client } from '@/lib/api'

export const postQueries = {
  all: () => queryOptions({
    queryKey: [client.posts.$path()],  // '/posts' — 型別安全
    queryFn: async () => {
      const res = await client.posts.$get()
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    },
    staleTime: 1000 * 30,
  }),

  detail: (id: string) => queryOptions({
    queryKey: [client.posts[':id'].$path({ param: { id } })],  // '/posts/123'
    queryFn: async () => {
      const res = await client.posts[':id'].$get({ param: { id } })
      if (res.status === 404) throw new Error('Not found')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    },
    enabled: !!id,
  }),
}

// 使用（useQuery / prefetchQuery 共用同一份設定）
function PostList() {
  const { data, isLoading } = useQuery(postQueries.all())
  // ...
}
```

### useMutation 範例

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { InferRequestType, InferResponseType } from 'hono/client'

type CreateBody = InferRequestType<typeof client.posts.$post>['json']
type CreateResponse = InferResponseType<typeof client.posts.$post, 201>

export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation<CreateResponse, Error, CreateBody>({
    mutationFn: async (body) => {
      const res = await client.posts.$post({ json: body })
      // ✅ 必須手動 throw，否則 onError 不會觸發
      if (!res.ok) throw new Error(`Create failed: ${res.status}`)
      return res.json() as Promise<CreateResponse>
    },
    onSuccess: () => {
      // 用 $path() 精確 invalidate
      queryClient.invalidateQueries({ queryKey: [client.posts.$path()] })
    },
  })
}
```

### 樂觀更新

```ts
return useMutation({
  mutationFn: async ({ id, data }) => {
    const res = await client.posts[':id'].$patch({ param: { id }, json: data })
    if (!res.ok) throw new Error(`Update failed`)
    return res.json()
  },
  onMutate: async ({ id, data }) => {
    // 取消進行中的查詢
    await queryClient.cancelQueries({ queryKey: [client.posts[':id'].$path({ param: { id } })] })
    // 快照舊資料
    const previous = queryClient.getQueryData(postQueries.detail(id).queryKey)
    // 樂觀更新
    queryClient.setQueryData(postQueries.detail(id).queryKey, (old) => old ? { ...old, ...data } : old)
    return { previous }
  },
  onError: (err, { id }, context) => {
    queryClient.setQueryData(postQueries.detail(id).queryKey, context?.previous)
  },
})
```

## Monorepo 型別共享架構

### pnpm workspaces 設定

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

```json
// apps/server/package.json
{
  "name": "server",
  "exports": { ".": "./src/index.ts" }
}

// apps/client/package.json
{
  "dependencies": { "server": "workspace:*" }
}
```

```ts
// apps/client/src/lib/api.ts
import { hc } from 'hono/client'
import type { AppType } from 'server'  // 直接 import TypeScript 源碼

export const client = hc<AppType>(import.meta.env.VITE_API_URL)
```

### tsconfig 設定（兩邊都必須 strict: true）

```json
// packages/tsconfig/base.json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

```ts
// vite.config.ts（client）
import tsconfigPaths from 'vite-tsconfig-paths'
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
})
```

## 型別推斷失效排查

| 問題 | 原因 | 解法 |
|------|------|------|
| `client.xxx` 型別為 `any` | 未使用方法鏈 | 改用 `.get().post()...` 串接 |
| `AppType` 無 route 型別 | 從 `app` 匯出而非 `routes` | `export type AppType = typeof routes` |
| `res.json()` 型別為 `unknown` | 未標記狀態碼 | 明確寫 `c.json(data, 200)` |
| `onError` 不觸發 | mutationFn 未 throw | 檢查 `res.ok`，不 ok 時 throw |
| 前端型別不同步 | strict 未開啟 | 兩邊 tsconfig 加 `"strict": true` |
| Monorepo 型別錯誤 | 兩邊 hono 版本不同 | 確保版本完全一致 |
| IDE 型別計算慢 | 每次重新計算 `hc<AppType>` | 用 `ReturnType<typeof hc<AppType>>` |

## 完整測試範例

```ts
// 用 app.fetch 直接測試，不起真實 server
import { hc } from 'hono/client'
import app from './index'
import type { AppType } from './index'

const client = hc<AppType>('http://localhost/', { fetch: app.fetch.bind(app) })

it('creates a post', async () => {
  const res = await client.posts.$post({ json: { title: 'Hello', body: 'World' } })
  expect(res.status).toBe(201)
  const data = await res.json()
  expect(data.ok).toBe(true)
})
```

---

詳細程式碼範例請參考 `references/best-practices.md`。
