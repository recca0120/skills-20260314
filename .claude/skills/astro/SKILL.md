---
name: astro
description: 當使用者要建立、修改或詢問 Astro 專案時觸發，包含新增頁面、API routes（endpoints）、Content Collections、Islands 元件、SSR/SSG 設定、middleware、部署等任何 Astro 相關開發任務。特別注意：Astro v3 到 v6 有大量 breaking changes，只要涉及 Astro 就必須觸發此 skill，確保使用最新正確語法，不使用舊版寫法。
---

# Astro 開發指南

**最新穩定版：Astro 6.0.4（2026/03/12）**

> Astro 已於 2026/01 被 Cloudflare 收購，持續 MIT 授權、完全開源。

---

## 版本演進與 Breaking Changes

| 版本 | API Routes 關鍵變更 |
|------|-------------------|
| v1~v2 | 小寫函式（`get`、`post`）、回傳 `{ body }` 物件 |
| v3 | **大寫函式（`GET`、`POST`）**、**回傳 `Response` 物件** |
| v4 | SSR 需設定 `output: 'server'` 或 `output: 'hybrid'` |
| v5 | `hybrid` 模式合併入 `static`；CSRF 預設開啟；`Astro.glob()` 移除 |
| v6 | **Node 22+ 必要**；帶副檔名 endpoint 禁止 trailing slash；Zod 4；Vite 7 |

---

## API Routes（Endpoints）正確寫法

### 基礎 GET endpoint

```typescript
// src/pages/api/hello.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, request, url }) => {
  return new Response(
    JSON.stringify({ message: "Hello" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
```

### 多種 HTTP 方法

```typescript
// src/pages/api/todos.ts
import type { APIRoute } from "astro";

export const prerender = false; // 啟用 SSR（v5+ 不需要全域設定 output: 'server'）

export const GET: APIRoute = async ({ url }) => {
  const data = await fetchTodos();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  if (!body.title) {
    return new Response(JSON.stringify({ error: "title is required" }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }
  const result = await createTodo(body);
  return new Response(JSON.stringify(result), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  await deleteTodo(params.id);
  return new Response(null, { status: 204 }); // 正確：DELETE 回 204 No Content
};

// Catch-all 處理不支援的方法
export const ALL: APIRoute = async ({ request }) => {
  return new Response(
    JSON.stringify({ error: `Method ${request.method} not allowed` }),
    { status: 405, headers: { "Content-Type": "application/json" } }
  );
};
```

### 動態路由

```typescript
// src/pages/api/todos/[id].ts
import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const todo = await getTodoById(params.id);
  if (!todo) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify(todo), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const PATCH: APIRoute = async ({ params, request }) => {
  const body = await request.json();
  const updated = await updateTodo(params.id, body);
  return new Response(JSON.stringify(updated), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
```

---

## 常見錯誤（舊版寫法）

```typescript
// ❌ 錯誤：v3 以前的舊寫法
export const get: APIRoute = ({ params }) => {
  return { body: JSON.stringify({ id: params.id }) }; // 回傳物件，不是 Response
};

export const del: APIRoute = () => {           // del 已廢棄，用 DELETE
  return { body: JSON.stringify({ ok: true }) };
};

// ❌ v5 以前：需要設定 output: 'hybrid'
// astro.config.mjs
export default defineConfig({ output: 'hybrid' }); // v5+ 已不需要
```

```typescript
// ✅ 正確：現代寫法（v6）
export const GET: APIRoute = async ({ params }) => {
  return new Response(JSON.stringify({ id: params.id }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async () => {
  return new Response(null, { status: 204 });
};
```

---

## v6 注意事項

- **Node 22+ 必要**（移除 Node 18、20 支援）
- **Zod 4**（如有使用 Content Collections）
- **帶副檔名 endpoint 禁止 trailing slash**：`/api/data.json/` → 改用 `/api/data.json`
- `Astro.glob()` 已完全移除，改用 `import.meta.glob()`
- `<ViewTransitions />` 舊元件已移除
- CSRF 保護（`security.checkOrigin`）預設為 `true`

---

## SSR 設定（v5+）

```typescript
// astro.config.mjs — 不需要設定 output: 'hybrid'
import { defineConfig } from 'astro/config';

export default defineConfig({
  // 預設 static，個別路由加 export const prerender = false 即可啟用 SSR
});
```

```typescript
// 個別路由啟用 SSR
export const prerender = false;
```

---

## Middleware

```typescript
// src/middleware.ts
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const token = context.cookies.get("auth_token")?.value;
  if (token) {
    context.locals.user = await verifyToken(token);
  }
  return next();
});
```

---

## 最佳實踐

1. **永遠回傳 `Response` 物件**，加上 `Content-Type` header
2. **HTTP 方法用大寫**：`GET`、`POST`、`PATCH`、`DELETE`
3. **DELETE 回 `204 No Content`**，不需要 body
4. **動態路由加 `export const prerender = false`** 啟用 SSR
5. **params 永遠是字串**，不能是數字（v6 強制）
6. **HEAD 不需要另外定義**，Astro 自動處理
7. **型別安全**：用 `satisfies APIRoute` 或 `const fn: APIRoute = async ...`
