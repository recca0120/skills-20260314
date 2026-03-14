# Workshop Demo 準備流程

> Claude Code Skill 從 0 到 1：打造個人化 AI Coding 助手
> 2026/03/14 · WensCo 文心會議室－松竹館，台中

本文件記錄 workshop demo 的完整準備步驟，參與者可照著重現整個過程。

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

## Phase 02 — 建立 Skills

> Branch: `phase/02-skill-creator`

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

---

## Phase 03 — 有 Skill 的狀況

> Branch: `phase/03-with-skill`

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

範圍限定在 Todo App 功能範圍內的延伸需求，避免被帶到無法收場的方向。
