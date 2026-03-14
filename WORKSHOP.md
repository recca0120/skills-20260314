# Workshop Demo 準備流程

> Claude Code Skill 從 0 到 1：打造個人化 AI Coding 助手
> 2026/03/14 · WensCo 文心會議室－松竹館，台中

本文件記錄 workshop demo 的完整準備步驟，參與者可照著重現整個過程。

---

## Branch 說明

| Branch | 用途 |
|---|---|
| `prepare/skills` | 事先建好的 skill 備案，live coding 時間不夠可直接複製使用 |
| `phase/01-no-skill` | 無 skill 的 Todo App（對照組）|
| `phase/02-with-skill` | 有 skill 的 Todo App |

**Demo 流程（Live Coding）：**
1. 全新乾淨專案，無 skill → 建 Todo App，展示問題
2. 安裝 skill-creator，建 skill（時間不夠 → 從 `prepare/skills` 複製 `.claude/skills/`）
3. 同樣需求重做 → 對比差異

---

## 技術棧

**Astro（API routes）+ Node.js + pnpm + React + Vite + Drizzle ORM + SQLite（@libsql/client）**

決策記錄：
- 後端選 Astro API routes（不是 Hono），因為 Astro 有大量 breaking changes（v4→v5→v6），能清楚展示「AI 用舊知識」的問題
- Bun runtime → Node.js + pnpm（環境相容性更廣，參與者不需額外安裝 Bun）
- better-sqlite3 → @libsql/client（純 WASM，不需 native binding，Node 23 相容）
- 前端維持 Vite + React

---

## 前置作業

### Step 1 — 建立 GitHub Repo

```bash
git init
git add README.md
git commit -m "Initial commit"
gh repo create skills-20260314 --public --source=. --remote=origin --push
```

Repo：https://github.com/recca0120/skills-20260314

---

### Step 2 — 確認簡報內容正確性

用 Claude Code 查證：
- `skill-creator` 官方存在：`anthropics/skills/tree/main/skills/skill-creator` ✅
- 安裝指令 `/plugin marketplace add anthropics/skills` ✅
- meta-skill → tech skills → 迭代是講者自創方法論，非官方術語，但概念正確 ✅

---

## Phase 01 — 沒有 Skill 的狀況（對照組）

> Branch: `phase/01-no-skill`

### Step 3 — 用沒有 skill 的 Claude Code 建 Todo App

不要上網查，模擬 AI 只用訓練資料的情況：

```
不要上網查任何資料，用你現有的知識幫我建一個 Todo App：
- 後端：Astro API routes
- 前端：Vite + React
- DB：Drizzle ORM + SQLite（@libsql/client）
- 套件管理：pnpm
功能：列出 todos、新增 todo、完成 / 刪除 todo
```

> **為什麼這樣下指令：** 呼應簡報 Slide 4「AI 的知識有截止日」，展示沒有 skill 時 AI 用舊版 Astro 寫法（`output: 'server'`、`Response.json()` 等過時語法）的真實狀況。

```bash
cd todo-app
pnpm install
pnpm dev
```

---

## 準備工作 — 建立 Skills

> Branch: `prepare/skills`（備案，非 Demo 的一部分）

### Step 4 — 安裝 skill-creator

```
/plugin marketplace add anthropics/skills
```

選擇 `Browse and install plugins` → 找到並安裝 `skill-creator`

---

### Step 5 — 討論技術選型

```
我要建一個 Todo App 做 workshop demo 用，
需求是簡單、能展示現代全端開發，
你建議用什麼技術棧？
```

---

### Step 6 — 用 skill-creator 建技術 skill

每次明確要求先查再建：

```
在建 skill 之前，先去 Astro 官網和 GitHub 查最新版本、breaking changes、推薦用法，特別注意 API routes 的寫法，然後再建 skill
在建 skill 之前，先去 Drizzle ORM 官網和 GitHub 查最新版本、breaking changes、推薦用法，然後再建 skill
在建 skill 之前，先去 React 和 Vite 官網查最新版本、推薦用法，專注在 hooks 和 component 設計，然後再建 skill
```

建完後移至專案：

```
把 astro、react-vite、drizzle 這三個 skill 移到目前專案的 .claude/skills/ 裡
```

**時間不夠時的備案：** 直接從 `prepare/skills` branch 複製 `.claude/skills/` 到目前專案

```bash
git checkout prepare/skills -- .claude/skills/
```

---

## Phase 02 — 有 Skill 的狀況

> Branch: `phase/02-with-skill`

### Step 7 — 用有 skill 的 Claude Code 建 Todo App

同樣的需求，這次有 skill：

```
幫我建一個 Todo App：
- 後端：Astro API routes
- 前端：Vite + React
- DB：Drizzle ORM + SQLite（@libsql/client）
- 套件管理：pnpm
功能：列出 todos、新增 todo、完成 / 刪除 todo
```

```bash
cd todo-app
pnpm install
pnpm dev
```

---

## 講者點評台詞（Phase 01 跑完後）

Phase 01 的 App 功能上沒問題，但打開程式碼就能看到問題。

**點 1 — `output: 'server'` 已移除（主打：AI 知識有截止日）**

> 「你看這邊，`astro.config.mjs` 裡它加了 `output: 'server'`。這在 Astro v4 是必填的，但 v5、v6 這個設定已經不需要了，甚至在某些情況會造成問題。這就是沒有 skill 的結果 — 它用的是訓練資料裡的寫法，不是現在的寫法。」

```js
// 無 skill（舊版 v4 寫法）
export default defineConfig({
  output: 'server',  // ❌ v5/v6 已不需要
  adapter: node({ mode: 'standalone' }),
})

// 有 skill（正確寫法）
export default defineConfig({
  adapter: node({ mode: 'standalone' }),
  security: { checkOrigin: false },
})
```

---

**點 2 — 缺少 `prerender = false`（主打：AI 跳過關鍵設定）**

> 「Astro v5 開始，API routes 預設是靜態的，必須明確加 `prerender = false` 才會變成動態 endpoint。沒加的話，build 完根本不會有這個 API。它沒加，因為它不知道 v5 有這個 breaking change。」

```ts
// 無 skill（缺少）
export const GET: APIRoute = async () => { ... }

// 有 skill（正確）
export const prerender = false;  // ✅ 必須加
export const GET: APIRoute = async () => { ... }
```

---

**點 3 — `Response.json()` 快捷寫法（主打：省事但不完整）**

> 「`Response.json()` 是 Web 標準的快捷方法，但它不會自動帶 Content-Type。新版的正確做法是 `new Response(JSON.stringify(...), { headers })`，明確設定 Content-Type，行為更可預測。」

```ts
// 無 skill
return Response.json(allTodos)

// 有 skill
return new Response(JSON.stringify(all), {
  headers: { 'Content-Type': 'application/json' },
})
```

---

**點 4 — 刪除回傳（主打：API 設計決策）**

> 「刪除成功它回傳 `{ success: true }`，這是很多人的直覺寫法。但 RESTful 標準刪除應該回 204 No Content，不需要 body。這不是版本問題，是設計決策 — skill 把這個決策帶進來了。」

```ts
// 無 skill
return Response.json({ success: true })

// 有 skill
return new Response(null, { status: 204 })
```

---

## Before / After 對比

### astro.config.mjs

| | 無 Skill | 有 Skill |
|---|---|---|
| `output: 'server'` | ❌ 有（v4 舊寫法）| ✅ 不需要（v5/v6）|
| security | 無 | `security: { checkOrigin: false }` |

### API Routes（`todos/index.ts`）

| | 無 Skill | 有 Skill |
|---|---|---|
| `prerender = false` | ❌ 缺少 | ✅ 有 |
| Response 寫法 | `Response.json()` | `new Response(JSON.stringify(), { headers })` |
| 刪除回傳 | `{ success: true }` | `204 No Content`（RESTful）|
| 排序 | `orderBy(todos.createdAt)` | `orderBy(desc(...))` 新到舊 |

### Schema（`db/schema.ts`）

| | 無 Skill | 有 Skill |
|---|---|---|
| `createdAt` 預設值 | JS `$defaultFn` | SQL `CURRENT_TIMESTAMP` |

---

## Step 8 — 聽眾互動

**方式：現場討論程式碼差異，而不是出題加功能**

直接打開 phase/01 和 phase/02 的程式碼，讓觀眾自己找差異，說服力更強。

**討論引導：**
> 「你覺得這兩個版本哪裡不一樣？為什麼有 skill 的版本長這樣？」

重點讓觀眾看的地方：
1. `output: 'server'` 的有無
2. `prerender = false` 的有無
3. `Response.json()` vs `new Response(JSON.stringify(), { headers })`
4. 刪除回傳 `{ success: true }` vs `204 No Content`

**邊界：** 若觀眾硬要出題，限定在 Todo App 現有功能的小改動，不開放登入、多人協作等大型功能。
