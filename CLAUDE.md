# Claude Code Skill Workshop — 2026/03/14

這個 repo 是 **Claude Code Skill 從 0 到 1** workshop 的示範專案。

## Branch 結構

| Branch | 說明 |
|---|---|
| `main` | 完整流程文件（WORKSHOP.md）|
| `prepare/skills` | 事先建好的四個技術 skill（hono / drizzle / react-vite / hono-rpc）|
| `phase/01-no-skill` | 無 skill 的 Todo App（對照組）|
| `phase/02-with-skill` | 有 skill 的 Todo App |

## 從哪裡開始

1. 閱讀 `WORKSHOP.md` 了解完整流程
2. 切換到 `phase/01-no-skill` 看沒有 skill 時的結果
3. 切換到 `phase/02-with-skill` 看有 skill 時的差異

## 技術棧

Hono + Node.js + pnpm + React + Vite + Hono RPC + Drizzle ORM + SQLite（@libsql/client）

## 啟動專案

```bash
pnpm setup   # 安裝依賴 + 建立 DB + 執行 migration
pnpm dev     # 同時啟動 server (port 3000) + client (port 5173)
```
