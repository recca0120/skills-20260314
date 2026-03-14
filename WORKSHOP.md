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

**前端：Vite + React**
**後端：Astro API routes（取代 Hono）**
**DB：Drizzle ORM + SQLite（@libsql/client）**

決策記錄：
- Hono 後端 → Astro API routes：Astro 目前已是 v7，但 AI 訓練資料約在 v5，沒有 skill 就會用舊版語法，差異明顯
- 選 Astro 的另一個原因：講者對 Astro 不熟，正好展示「skill 讓 AI 學會你不熟的技術」這個核心概念
- Bun runtime → Node.js + pnpm（環境相容性更廣）
- better-sqlite3 → @libsql/client（純 WASM，不需 native binding，Node 23 相容）

> **舊版（Hono 架構）保留在 `archive/phase-01-hono` 和 `archive/phase-02-hono`**

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

Phase 01 的 App 功能上可能跑不起來，但打開程式碼就能看到問題。

**點 1 — `output: 'server'`（主打：AI 知識有截止日）**

> 「你看 astro.config.mjs，它加了 `output: 'server'`。這是 Astro v4 的寫法，v5 之後已經不需要了，只要在個別路由加 `export const prerender = false` 就好。功能上可能還能跑，但這就是沒有 skill 的結果 — 它用的是訓練資料裡的舊版本寫法。」

```ts
// 無 skill（v4 舊寫法）
export default defineConfig({
  output: 'server',   // v5+ 不需要
  adapter: node({ mode: 'standalone' }),
})

// 有 skill（v5+ 正確寫法）
export default defineConfig({
  adapter: node({ mode: 'standalone' }),
  // 個別路由加 export const prerender = false 即可
})
```

---

**點 2 — `Response.json()` vs `new Response()`（主打：shorthand 的陷阱）**

> 「這邊它用了 `Response.json()`，看起來很方便，但這個 shorthand 在某些環境下不支援，而且少了 `Content-Type` header。有 skill 的版本用的是標準寫法 `new Response(JSON.stringify(...), { headers })`，這才是正確且跨環境相容的做法。」

```ts
// 無 skill
return Response.json(allTodos)

// 有 skill
return new Response(JSON.stringify(all), {
  headers: { 'Content-Type': 'application/json' },
})
```

---

**點 3 — 少了 `prerender = false`（主打：忘了就壞掉）**

> 「更嚴重的是這個。它沒有加 `export const prerender = false`，這代表 Astro 會把這個 API route 當成靜態頁面來處理，根本跑不動。這就是為什麼 phase/01 功能跑不起來。有 skill 的版本知道這件事，每個動態 route 都加了。」

```ts
// 無 skill — 沒有這行，動態 API 跑不起來
// （什麼都沒有）

// 有 skill
export const prerender = false;  // ✅ 必要
```

---

## Before / After 對比

### `astro.config.mjs`

| | 無 Skill | 有 Skill |
|---|---|---|
| output 模式 | `output: 'server'`（v4 舊寫法）| 不需要設定 |
| CSRF | 未設定 | `security: { checkOrigin: false }` |

### Schema（`db/schema.ts`）

| | 無 Skill | 有 Skill |
|---|---|---|
| import | `int` | `integer`（正確命名）|
| 完成狀態欄位 | `completed` | `done` |
| `createdAt` default | `(datetime('now'))` | `CURRENT_TIMESTAMP` |

### API Routes

| | 無 Skill | 有 Skill |
|---|---|---|
| `prerender` | 沒有（動態 route 無法運作）| `export const prerender = false` |
| 回傳方式 | `Response.json()` | `new Response(JSON.stringify(...), { headers })` |
| 錯誤 status | `400` | `422`（語意更正確）|

---

## Step 8 — 聽眾互動

**方式：現場討論程式碼差異，而不是出題加功能**

實測發現 validation 這類基礎需求，有沒有 skill AI 都做得到，對比效果不明顯。
直接打開 phase/01 和 phase/02 的程式碼，讓觀眾自己找差異，說服力更強。

**討論引導：**
> 「你覺得這兩個版本哪裡不一樣？為什麼有 skill 的版本長這樣？」

重點讓觀眾看的三個地方：
1. `output: 'server'` — v4 舊寫法 vs v5+ 不需要
2. `Response.json()` — shorthand vs 標準 `new Response`
3. `prerender = false` — 沒加就壞掉

**邊界：** 若觀眾硬要出題，限定在 Todo App 現有功能的小改動，不開放登入、多人協作等大型功能。
