# Workshop Demo 準備流程

> Claude Code Skill 從 0 到 1：打造個人化 AI Coding 助手
> 2026/03/14 · WensCo 文心會議室－松竹館，台中

本文件記錄 workshop demo 的完整準備步驟，參與者可照著重現整個過程。

---

## Step 1 — 建立 GitHub Repo

**做了什麼：** 建立專案 repo 並上傳簡報

**為什麼：** 集中管理所有 workshop 相關檔案，方便參與者取得

**怎麼做：**
```bash
# 初始化 git
git init
git add README.md
git commit -m "Initial commit"

# 建立 GitHub repo 並推上去
gh repo create skills-20260314 --public --source=. --remote=origin --push
```

**結果：** https://github.com/recca0120/skills-20260314

---

## Step 2 — 確認簡報內容正確性

**做了什麼：** 上網查證簡報中的技術資訊是否正確

**為什麼：** 避免在 workshop 現場講錯誤的資訊

**怎麼做：**
1. 用 Claude Code 抓取 `anthropics/skills` GitHub repo 內容
2. 確認 `skill-creator` 存在於 `anthropics/skills/tree/main/skills/skill-creator`
3. 確認安裝指令正確

**結果：**
- `/plugin marketplace add anthropics/skills` ✅ 正確
- `skill-creator` 官方存在 ✅
- meta-skill → tech skills → 迭代的工作流是講者自創方法論，非官方術語，但概念正確 ✅

---

## Step 3 — 安裝 skill-creator

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

**結果：** skill-creator 安裝完成，之後建 skill 時會自動套用

---

## Step 4 — 討論技術選型

**做了什麼：** 跟 Claude Code 討論 Todo App 要用什麼技術棧

**為什麼：** 先確定技術選型，再建對應的 skill，避免白做工

**怎麼做：**
在 Claude Code session 裡輸入：
```
我要建一個 Todo App 做 workshop demo 用，
需求是簡單、能展示現代全端開發，
你建議用什麼技術棧？
```

**結果：** 確認技術棧為 **Hono + Bun + React + Vite + Hono RPC + Drizzle ORM + SQLite**

補充決策：Claude Code 原本建議用 Bun 內建 SQLite 即可，但因為簡報 Slide 12 明確列出 Drizzle，為了與簡報一致，強制加入 Drizzle ORM。

---

## Step 5 — 用 skill-creator 建技術 skill

**做了什麼：** 針對確定的技術棧，用 skill-creator 各建一份 skill

**為什麼：** 讓 Claude Code 在開發過程中自動套用各技術的最新最佳實踐

**怎麼做：**
在 Claude Code session 裡依序執行：
```
在建 skill 之前，先去 Hono 官網和 GitHub 查最新版本、breaking changes、推薦用法，然後再建 skill
在建 skill 之前，先去 Drizzle ORM 官網和 GitHub 查最新版本、breaking changes、推薦用法，然後再建 skill
在建 skill 之前，先去 React 和 Vite 官網查最新版本、推薦用法，專注在 hooks 和 component 設計，然後再建 skill
在建 skill 之前，先去 Hono RPC 官網和 GitHub 查最新版本、前後端型別共享的推薦用法，然後再建 skill
```

**結果：** 四個 skill 建立完成並移至專案 `.claude/skills/`，透過 git 共享給參與者

---

## Step 6 — 建 Todo App Starter Project

**做了什麼：** 用 Claude Code 建立基礎的 Todo App

**為什麼：** Demo 時從這個基礎開始展示，不從零建，節省時間

**功能範圍（刻意保持簡單）：**
- 列出 todos
- 新增 todo
- 完成 / 刪除 todo

**怎麼做：** 待規劃（依 Step 4 技術選型決定）

**結果：** 待執行

---

## Step 7 — 設計犯錯劇本

**做了什麼：** 預先設計 2–3 個 AI 容易做錯的點

**為什麼：** 不能依賴 AI 自然犯錯，要確保「糾正 → 更新 skill」的流程能在 demo 中流暢示範

**怎麼做：** 待規劃，方向是找各技術的版本差異或常見誤用

**結果：** 待執行

---

## Step 8 — 準備聽眾出題範圍

**做了什麼：** 設定聽眾現場出題的邊界

**為什麼：** 避免被帶到無法收場的方向

**範圍限定：** Todo App 功能範圍內的延伸需求

**結果：** 待確認
