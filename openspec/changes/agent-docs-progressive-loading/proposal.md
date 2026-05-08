## Why

目前每個專案的 `AGENTS.md` / `CLAUDE.md` 品質不一致，Codex 需要 Fish 重複提醒才會整理成漸進式載入。這會讓未來專案啟動成本變高，也容易讓長手冊佔滿上下文。

## What Changes

- 新增 agent docs governance 能力，讓 Codex 自動掃描專案內的 agent instruction files
- 新增分類規則，判斷每個專案應保留、拆分、補建或跳過
- 新增遷移規則，把過長的 `AGENTS.md` / `CLAUDE.md` 拆成短入口與 `docs/agents/` 分章文件
- 新增驗證腳本規格，檢查路由文件存在、入口文件保留核心區塊
- 新增全域 Skill 使用規則，未來不需要 Fish 重新講一次漸進式載入方法

## Non-Goals

- 不一次性覆蓋所有專案的 agent 文件
- 不把 three-ai 的商業規則複製到其他專案
- 不建立強制 blocking hook
- 不修改與 agent instructions 無關的專案程式碼
- 不取代各專案既有的 source-of-truth specs、ADR 或 docs

## Capabilities

### New Capabilities

- `agent-docs-governance`: Codex agent instruction 文件的自動掃描、分類、漸進式載入遷移與驗證

## Impact

- Affected specs: agent-docs-governance（新增）
- Affected code:
  - New: `openspec/changes/agent-docs-progressive-loading/specs/agent-docs-governance/spec.md`
  - New: `openspec/changes/agent-docs-progressive-loading/tasks.md`
  - New: `openspec/changes/agent-docs-progressive-loading/design.md`
  - Existing: `/Users/fishtv/Development/.claude/skills/agent-progressive-loading/SKILL.md`
- Dependencies 新增: 無
- 環境變數新增: 無
