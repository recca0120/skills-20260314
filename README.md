# Claude Code Skill Workshop — 2026/03/14

> 本專案為 **Claude Code Skill 從 0 到 1：打造個人化 AI Coding 助手** 工作坊的實作範例與教學材料。

活動連結：https://www.accupass.com/event/2601231259442549387150

---

## 活動資訊

| 項目 | 內容 |
|------|------|
| 日期 | 2026 年 3 月 14 日（六）|
| 時間 | 13:30 – 17:00（UTC+8）|
| 地點 | WensCo 文心會議室－松竹館，台中市南興三路 317 號 1 號 |
| 主辦 | Cash Wu Geek |

## 講者

- **Cash Wu** — Cash Wu Geek 創辦人
- **Recca Tsai** — Laravel/PHP 開發者（[@recca0120](https://github.com/recca0120)）

---

## 工作坊主題

你是否曾有以下困擾？

- 每次開新對話都要重新跟 Claude Code 解釋專案規格
- 希望 AI 助手能遵循團隊的 coding 規範
- 想讓 Claude Code 理解特定的業務流程或工具鏈

**Skill** 是 Claude Code 最新推出的擴充機制，讓你可以把這些知識與工作流程一次教給 Claude，之後就能持續沿用。

---

## 議程

1. 建立 Skill 的檔案結構
2. 撰寫有效的 `SKILL.md` 說明文件
3. 測試與迭代你的 Skill
4. Q&A
5. Bonus（時間允許）：一言不合就寫了一個轉錄軟體 Whispify

---

## 環境需求

參加工作坊前請確認以下環境已就緒：

- [ ] Claude Pro 或 Max 訂閱
- [ ] Claude Code CLI 已安裝
- [ ] 筆電與開發環境（編輯器、終端機）
- [ ] 具備基本 Claude Code 使用經驗（建議）

---

## 快速開始

```bash
# 安裝 Claude Code CLI（若尚未安裝）
npm install -g @anthropic-ai/claude-code

# 進入專案目錄
cd skills-20260314

# 啟動 Claude Code
claude
```

---

## 專案結構

```
skills-20260314/
└── .claude/
    └── skills/          # 本次工作坊產出的 Skill 檔案
```

---

## 參考資源

- [Claude Code 官方文件](https://docs.anthropic.com/claude-code)
- [Skill 撰寫指南](.claude/skills/)
