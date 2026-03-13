# 讓 AI 自己學會你的專案 — 用 Skills 驅動 AI 開發工作流

> Skills · AI Workflow · 2026

---

## Slide 1 — 標題

**讓 AI 自己學會你的專案**
用 Skills 驅動 AI 開發工作流

---

## Slide 2 — 問題

**你有沒有遇過這些問題？**

1. 同樣的錯誤，AI 一直重複犯
2. 每次新對話都要重新解釋專案背景
3. 輸出品質不穩定，看心情

---

## Slide 3 — 根本原因 01：AI 沒有記憶

1. 每次對話對 AI 來說都是全新的開始
2. 它不知道你的專案規則
3. 你說過的話，下次還要再說一次

---

## Slide 4 — 根本原因 02：AI 的知識有截止日

1. 工具一直在更新，但模型訓練資料有截止日
2. 你叫它做一件事，它用的可能是六個月前的方式
3. 新功能、新 API、新最佳實踐，它不一定知道

---

## Slide 5 — 核心原則

**先查**

> 在叫 AI 做任何事之前，先讓它上網查。

---

## Slide 6 — Skills 是什麼？

1. **專案專屬** — 不是通用模板，是為這個專案量身訂做的知識
2. **活的文件** — 不是設定檔，不是 prompt，會隨專案演進持續更新
3. **AI 的記憶體** — 讓 AI 在執行任務前知道「這個專案怎麼做事」

---

## Slide 7 — 核心工作方式

```
你          ⟵  ⟶         AI
負責決策和糾正        負責學習、執行、維護
```

---

## Slide 8 — 三個階段的工作流

1. **建立 meta-skill** — 讓 AI 先學會怎麼寫 skill
2. **專案初期建 skills** — 針對每個技術建立最佳實踐
3. **執行中迭代更新** — 發現錯誤，當下糾正並更新

---

## Slide 9 — Phase 01（以前）：官方還沒有 skill-creator 時

1. 以 Claude Code 為例
2. 叫 Claude Code 上官網研究 skill 的最佳實踐
3. 產出一份「如何寫 skill 的 skill」
4. 之後所有 skill 都照這份來建

---

## Slide 10 — Phase 01（現在）：Anthropic 官方出了 skill-creator

```bash
/plugin marketplace add anthropics/skills
```

裝了之後，Claude Code 在建 skill 時會自動套用 skill-creator 的規範，不需要你額外引導。

> **這代表什麼：**「先查再做」這個原則，已經被 Anthropic 內建化了。你不需要再手動叫它去查。

---

## Slide 11 — 原則不變

| 以前 | 你手動叫 AI 去查最佳實踐 |
|------|--------------------------|
| 現在 | Anthropic 把這件事做成 skill-creator |

> **先查，再做。這個原則永遠成立。**

---

## Slide 12 — Phase 02：技術棧 Hono + Drizzle + React

1. 讓 Claude Code 上網查各技術的最新最佳實踐
2. 用 skill-creator 為每個技術寫成獨立的 skill
3. 每個技術一份，拆開管理

▶ **DEMO**

---

## Slide 13 — Phase 03：AI 做錯了，怎麼辦？

1. **指出錯誤** — 「這樣不對，正確做法是 xxx」
2. **更新 skill** — 叫 AI 把正確做法寫回 skill

> Skills 是活的，糾正的當下就更新，不要累積。你不需要自己動手改，讓 AI 改。

▶ **DEMO**

---

## Slide 14 — 團隊共享 Skills

```
.claude/skills/
      ↓
用 git 就解決了
```

---

## Slide 15 — Demo

**Demo 時間** — 以 Claude Code 為例 · Hono + Drizzle + React Todo App

1. 讓 Claude Code 建 starter project
2. 建立各技術的 skills
3. 執行功能、犯錯、糾正、更新 skill
4. 開放聽眾出題，現場實作

---

## Slide 16 — 討論

- **Q1** 你現在用 AI 寫程式，最常遇到什麼問題？
- **Q2** 團隊開發，skills 要怎麼共享？
- **Q3** 什麼情況下 skill 該拆？什麼情況下該合？

---

## Slide 17 — 結語

> 工具會一直變，但「先查再做」這個習慣不會過時。
>
> **謝謝**
