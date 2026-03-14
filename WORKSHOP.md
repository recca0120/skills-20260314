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

Phase 01 的 App 在 dev 模式下功能正常，但打開程式碼就能看到問題。

**核心敘事轉換：**
> 重點不是「AI 犯了什麼錯」，而是「有 skill 時你不需要知道這些細節」。
> Skill 幫你承擔認知負擔，不是讓 AI 變聰明，是讓你不需要那麼聰明。

---

**點 1 — `prerender = false`（主打：skill 幫你記住你不知道的細節）**

> 「我問你，你知道 Astro v5 的 API routes 預設是靜態的嗎？要加 `prerender = false` 才會是動態 endpoint？我不知道。但你看有 skill 的版本，它自動加了。沒有 skill 的版本沒加。這就是差別 — 不是我比較厲害，是 skill 幫我記住了這個細節。你不需要知道這件事，skill 知道就夠了。」

```ts
// 無 skill（缺少，dev 能跑但 build 後 API 消失）
export const GET: APIRoute = async () => { ... }

// 有 skill（自動加上）
export const prerender = false;  // ✅ skill 記住了，你不用記
export const GET: APIRoute = async () => { ... }
```

---

**點 2 — `output: 'server'`（主打：AI 用舊知識，skill 更新知識）**

> 「這邊 `astro.config.mjs` 加了 `output: 'server'`。這在 Astro v4 是必填的，v5、v6 已經不需要了。AI 的訓練資料有截止日，它不知道這個版本變了。但 skill 在建立前有去查最新文件，所以有 skill 的版本沒有這行。」

```js
// 無 skill（v4 舊寫法，AI 訓練資料裡的版本）
export default defineConfig({
  output: 'server',  // ❌ v5/v6 已不需要
  adapter: node({ mode: 'standalone' }),
})

// 有 skill（正確，skill 查了最新文件）
export default defineConfig({
  adapter: node({ mode: 'standalone' }),
  security: { checkOrigin: false },
})
```

---

**點 3 — 刪除回傳 204（主打：skill 帶入設計決策）**

> 「刪除成功它回傳 `{ success: true }`，這是很直覺的寫法，很多人包括我以前也這樣寫。RESTful 標準刪除應該回 204 No Content。這不是版本問題，是設計決策。沒有 skill，AI 跟你一樣憑直覺。有 skill，這個決策被記錄下來，每次都照做。」

```ts
// 無 skill（直覺寫法）
return Response.json({ success: true })

// 有 skill（skill 記錄了這個設計決策）
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
