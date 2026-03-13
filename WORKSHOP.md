# Workshop Demo 準備流程

> Claude Code Skill 從 0 到 1：打造個人化 AI Coding 助手
> 2026/03/14 · WensCo 文心會議室－松竹館，台中

本文件記錄 workshop demo 的完整準備步驟，參與者可照著重現整個過程。

---

## 前置作業

### Step 1 — 建立 GitHub Repo

**做了什麼：** 建立專案 repo 並上傳簡報

**為什麼：** 集中管理所有 workshop 相關檔案，方便參與者取得

**怎麼做：**
```bash
git init
git add README.md
git commit -m "Initial commit"
gh repo create skills-20260314 --public --source=. --remote=origin --push
```

**結果：** https://github.com/recca0120/skills-20260314

---

### Step 2 — 確認簡報內容正確性

**做了什麼：** 上網查證簡報中的技術資訊是否正確

**為什麼：** 避免在 workshop 現場講錯誤的資訊

**怎麼做：**
1. 確認 `skill-creator` 存在於 `anthropics/skills/tree/main/skills/skill-creator`
2. 確認安裝指令正確

**結果：**
- `/plugin marketplace add anthropics/skills` ✅ 正確
- `skill-creator` 官方存在 ✅
- meta-skill → tech skills → 迭代的工作流是講者自創方法論，非官方術語，但概念正確 ✅

---

## Phase 01 — 沒有 Skill 的狀況（對照組）

> Branch: `phase/01-no-skill`

**目的：** 展示沒有 skill 時 AI 開發的問題，讓觀眾感受 before 的痛點

### Step 3 — 用沒有 skill 的 Claude Code 建 Todo App

**做了什麼：** 在沒有任何 skill 的環境下，請 Claude Code 建一個 Hono + Drizzle + React Todo App

**為什麼：** 展示 AI 在沒有 skill 的情況下可能用舊版 API、忽略最佳實踐、輸出不穩定

**怎麼做：**
```
幫我建一個 Hono + Node.js + React + Vite + Hono RPC + Drizzle + SQLite 的 Todo App，
功能：列出 todos、新增 todo、完成 / 刪除 todo
```

**結果：** 待執行

---

## Phase 02 — 建立 Skills

> Branch: `phase/02-skill-creator`

**目的：** 安裝 skill-creator，為每個技術建立 skill

### Step 4 — 安裝 skill-creator

**做了什麼：** 在 Claude Code 裡安裝 Anthropic 官方的 skill-creator

**為什麼：** skill-creator 會確保之後建立的每個 skill 都符合官方規範

**怎麼做：**
1. 開啟 Claude Code session
2. 執行：
   ```
   /plugin marketplace add anthropics/skills
   ```
3. 選擇 `Browse and install plugins`
4. 找到並安裝 `skill-creator`

**結果：** skill-creator 安裝完成 ✅

---

### Step 5 — 討論技術選型

**做了什麼：** 跟 Claude Code 討論 Todo App 要用什麼技術棧

**為什麼：** 先確定技術選型，再建對應的 skill，避免白做工

**怎麼做：**
```
我要建一個 Todo App 做 workshop demo 用，
需求是簡單、能展示現代全端開發，
你建議用什麼技術棧？
```

**結果：** 確認技術棧為 **Hono + Node.js + pnpm + React + Vite + Hono RPC + Drizzle ORM + SQLite**

決策補充：
- Claude Code 原本建議 Bun runtime，改為 Node.js + pnpm，環境相容性更廣
- Claude Code 原本建議 Bun 內建 SQLite，但簡報 Slide 12 明確列出 Drizzle，保持一致

---

### Step 6 — 用 skill-creator 建技術 skill

**做了什麼：** 針對確定的技術棧，用 skill-creator 各建一份 skill

**為什麼：** 讓 Claude Code 在開發過程中自動套用各技術的最新最佳實踐

**怎麼做：**
在 Claude Code session 裡依序執行（每次都明確要求先查再建）：
```
在建 skill 之前，先去 Hono 官網和 GitHub 查最新版本、breaking changes、推薦用法，然後再建 skill
在建 skill 之前，先去 Drizzle ORM 官網和 GitHub 查最新版本、breaking changes、推薦用法，然後再建 skill
在建 skill 之前，先去 React 和 Vite 官網查最新版本、推薦用法，專注在 hooks 和 component 設計，然後再建 skill
在建 skill 之前，先去 Hono RPC 官網和 GitHub 查最新版本、前後端型別共享的推薦用法，然後再建 skill
```

建完後把 skill 移至專案 `.claude/skills/`：
```
把 hono、hono-rpc、react-vite、drizzle 這四個 skill 移到目前專案的 .claude/skills/ 裡
```

**結果：** 四個 skill 建立完成，透過 git 共享給參與者 ✅

---

## Phase 03 — 有 Skill 的狀況

> Branch: `phase/03-with-skill`

**目的：** 展示有 skill 後 AI 開發的差異，對比 Phase 01

### Step 7 — 用有 skill 的 Claude Code 建 Todo App

**做了什麼：** 在有 skill 的環境下，用同樣的需求請 Claude Code 建 Todo App

**為什麼：** 展示 skill 帶來的差異：正確版本、最佳實踐、輸出穩定

**怎麼做：**
```
幫我建一個 Hono + Node.js + React + Vite + Hono RPC + Drizzle + SQLite 的 Todo App，用 pnpm 管理套件，
功能：列出 todos、新增 todo、完成 / 刪除 todo
```

**結果：** Todo App 建立完成，三個功能全部驗證 OK ✅

---

### Step 8 — 設計聽眾出題範圍

**做了什麼：** 設定聽眾現場出題的邊界

**為什麼：** 避免被帶到無法收場的方向

**範圍限定：** Todo App 功能範圍內的延伸需求

**結果：** 待確認
