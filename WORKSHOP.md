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

**Hono + Node.js + pnpm + React + Vite + Hono RPC + Drizzle ORM + SQLite（@libsql/client）**

決策記錄：
- Bun runtime → Node.js + pnpm（環境相容性更廣，參與者不需額外安裝 Bun）
- better-sqlite3 → @libsql/client（純 WASM，不需 native binding，Node 23 相容）
- Bun 內建 SQLite → Drizzle ORM（簡報 Slide 12 明確列出，保持一致）

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
不要上網查任何資料，用你現有的知識幫我建一個
Hono + Node.js + React + Vite + Hono RPC + Drizzle + SQLite 的 Todo App，
功能：列出 todos、新增 todo、完成 / 刪除 todo
```

> **為什麼這樣下指令：** 呼應簡報 Slide 4「AI 的知識有截止日」，展示沒有 skill 時 AI 用舊版 API 或過時寫法的真實狀況。

```bash
cd todo-app
pnpm setup   # install + db:generate + db:migrate
pnpm dev     # 同時啟動 server + client
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
在建 skill 之前，先去 Hono 官網和 GitHub 查最新版本、breaking changes、推薦用法，然後再建 skill
在建 skill 之前，先去 Drizzle ORM 官網和 GitHub 查最新版本、breaking changes、推薦用法，然後再建 skill
在建 skill 之前，先去 React 和 Vite 官網查最新版本、推薦用法，專注在 hooks 和 component 設計，然後再建 skill
在建 skill 之前，先去 Hono RPC 官網和 GitHub 查最新版本、前後端型別共享的推薦用法，然後再建 skill
```

建完後移至專案：

```
把 hono、hono-rpc、react-vite、drizzle 這四個 skill 移到目前專案的 .claude/skills/ 裡
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
幫我建一個 Hono + Node.js + React + Vite + Hono RPC + Drizzle + SQLite 的 Todo App，
用 pnpm 管理套件，
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

**點 1 — Drizzle 初始化 API 版本（主打：AI 知識有截止日）**

> 「你看這邊，它用了舊版的 Drizzle 寫法，要先建 client 再傳進去。新版的 API 早就不用這樣了，直接一個 object 就搞定。功能一樣，但這就是沒有 skill 的結果 — 它用的是它訓練資料裡的版本，不是現在的版本。」

```ts
// 無 skill（舊版）
const client = createClient({ url: 'file:todos.db' })
export const db = drizzle(client, { schema })

// 有 skill（新版）
export const db = drizzle({
  connection: { url: 'file:todos.db' },
  schema,
})
```

---

**點 2 — 刪除回傳（主打：AI 跟你一樣用直覺寫）**

> 「這個我最喜歡。刪除成功它回傳 `{ success: true }`，這是很多人的直覺寫法，包括我以前也這樣寫。但 RESTful 標準刪除應該回 204 No Content，不需要 body。這不是版本問題，是設計問題 — 沒有 skill，它就跟你一樣憑直覺。」

```ts
// 無 skill
return c.json({ success: true })

// 有 skill
return c.body(null, 204)
```

---

**點 3 — PATCH 路徑語意（主打：skill 連設計決策都影響）**

> 「PATCH `/:id` 跟 PATCH `/:id/done` 功能一樣，但語意差很多。前者你不知道在 patch 什麼，後者一看就知道是『標記為完成』。這個告訴你，skill 不只是解決版本問題，連 API 設計的決策都會帶進來。」

```ts
// 無 skill
.patch('/:id', ...)

// 有 skill
.patch('/:id/done', ...)
```

---

## Before / After 對比

### Schema（`db/schema.ts`）

| | 無 Skill | 有 Skill |
|---|---|---|
| import | `int`（簡寫）| `integer`（正確命名）|
| 欄位宣告 | `int()` | `integer('id')`（明確帶欄位名）|
| 完成狀態欄位 | `completed` | `done` |
| `createdAt` 預設值 | JS `$defaultFn` | SQL `CURRENT_TIMESTAMP` |

### Routes（`todos.ts`）

| | 無 Skill | 有 Skill |
|---|---|---|
| export 方式 | `export default app` | `export const todosRoute` |
| 排序 | `orderBy(todos.createdAt)` | `orderBy(desc(...))` 新到舊 |
| PATCH 路徑 | `/:id` | `/:id/done`（語意更清楚）|
| 刪除回傳 | `{ success: true }` | `204 No Content`（RESTful）|
| 錯誤處理 | 無 | 有 404 處理 |

### Server（`index.ts`）

| | 無 Skill | 有 Skill |
|---|---|---|
| Logger | 無 | `hono/logger` middleware |
| CORS | 寫死 `localhost:5173` | 通用 `/api/*` |
| Port | 寫死 `3000` | 支援 `process.env.PORT` |

### Drizzle API 版本

| | 無 Skill | 有 Skill |
|---|---|---|
| 初始化 | `drizzle(client, { schema })` | `drizzle({ connection, schema })`（新版 API）|
| Migration | `generate + migrate` | `db:push`（更簡潔）|

---

## Step 8 — 聽眾出題

**出題方向：讓 skill 的效果在現場發生**

不是加功能，而是給一個容易踩雷的需求，讓觀眾親眼看到有 skill / 沒有 skill 的差異。

**示範題目：加 zod validation（title 不能空白、不能超過 100 字）**

```
幫我在新增 todo 的 API 加上 validation：
- title 不能空白
- title 不能超過 100 字
```

**流程：**
1. 切到 `phase/01-no-skill`，在沒有 skill 的環境下執行這個需求
2. 切到 `phase/02-with-skill`，同樣的需求再跑一次
3. 對比兩者的做法

**預期差異：**
- 無 skill → 可能手動 if 判斷，或用 zod 但沒有搭配 `zValidator` middleware
- 有 skill → 正確使用 `zValidator('json', z.object(...))` 搭配 Hono 的 middleware 機制

**邊界：** 只接受跟 Todo App 現有功能相關的需求，不開放登入、多人協作等大型功能。
