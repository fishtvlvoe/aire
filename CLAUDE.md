<!-- SPECTRA:START v1.0.2 -->

# Spectra Instructions

This project uses Spectra for Spec-Driven Development(SDD). Specs live in `openspec/specs/`, change proposals in `openspec/changes/`.

## Use `/spectra-*` skills when:

- A discussion needs structure before coding → `/spectra-discuss`
- User wants to plan, propose, or design a change → `/spectra-propose`
- Tasks are ready to implement → `/spectra-apply`
- There's an in-progress change to continue → `/spectra-ingest`
- User asks about specs or how something works → `/spectra-ask`
- Implementation is done → `/spectra-archive`
- Commit only files related to a specific change → `/spectra-commit`

## Workflow

discuss? → propose → apply ⇄ ingest → archive

- `discuss` is optional — skip if requirements are clear
- Requirements change mid-work? Plan mode → `ingest` → resume `apply`

## Parked Changes

Changes can be parked（暫存）— temporarily moved out of `openspec/changes/`. Parked changes won't appear in `spectra list` but can be found with `spectra list --parked`. To restore: `spectra unpark <name>`. The `/spectra-apply` and `/spectra-ingest` skills handle parked changes automatically.

<!-- SPECTRA:END -->

## 業務邏輯（必讀，不要再問 Fish）

核心概念：`docs/aire-business-logic.md`

重點：
- **草稿書**（Draft）= 地政 API + AI 產出的暫定範本，業務拿去現場簽約用
- **說明書**（Official）= 簽約回來後，前面內容不變，最後加客戶簽名頁
- 補件 = 業務現場回補的照片/格局圖/缺漏欄位，嵌入頁面不是 popup

@AGENTS.md
