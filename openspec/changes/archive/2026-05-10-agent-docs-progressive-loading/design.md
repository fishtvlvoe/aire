## Overview

本 change 建立一個 Codex 專用的 agent docs governance 流程。核心設計是：全域 Skill 保存方法，專案 `AGENTS.md` 保存入口規則，`docs/agents/` 保存按需載入內容，驗證腳本負責機械檢查。

## Decisions

### D1: 使用 Skill 承載全域方法，不使用 hook 作為主要入口

Codex SHALL use the global `agent-progressive-loading` skill as the reusable method for future project agent-doc work.

Alternatives Considered:

- Hook：被否決，因為 hook 適合阻擋錯誤，不適合承載判斷、分類與遷移策略。
- 單一全域腳本：被否決，因為腳本能掃描與驗證，但無法在不同專案脈絡下替代理做設計判斷。

### D2: 掃描先產生建議，不預設批次覆蓋所有專案

The scanner SHALL classify projects before migration. Codex SHALL only edit a project when the classification indicates a clear migration path or the user asks for batch migration.

Alternatives Considered:

- 直接批次改所有專案：被否決，因為不同 repo 的 `CLAUDE.md` / `AGENTS.md` 可能有不同用途，直接覆蓋會損壞上下文。
- 永遠只報告不修改：被否決，因為 Fish 要的是未來自動完成，而不是每次只產生建議。

### D3: 專案事實留在專案，全域 Skill 只保存方法

The migration SHALL NOT copy product-specific rules from one repository into the global skill. Project-specific facts SHALL remain in each repo.

Alternatives Considered:

- 把 AIRE 的完整模式做成全域模板：被否決，因為會把房仲產品規則污染其他專案。
- 每個專案完全自創格式：被否決，因為未來 Codex 無法穩定地自動掃描與驗證。

## Risks / Trade-offs

- [Risk] 某些專案的 `CLAUDE.md` 是特殊工具設定，不適合遷移 → Mitigation: classification includes `skip` and `manual-review` outcomes.
- [Risk] 遷移後入口文件太短，漏掉重要規則 → Mitigation: preserve non-negotiable rules in `AGENTS.md` and link detailed domain files.
- [Risk] 批次掃描範圍太大 → Mitigation: default scan root is `/Users/fishtv/Development`, with hidden/vendor directories ignored.

## Migration Plan

部署步驟：

1. 保留目前已建立的 `agent-progressive-loading` global Skill。
2. 在本 change 中定義 scanner/classifier/migrator/verifier 行為。
3. 後續實作掃描腳本與候選專案報告。
4. 對單一專案先驗證遷移，再擴大到批次。

回滾策略：

1. 專案遷移前保留 git diff。
2. 每個專案只修改 agent docs 與驗證腳本。
3. 若驗證失敗，停止該專案遷移並標記 manual-review。

## Open Questions

- 批次遷移預設是否應只處理 git clean 的專案。
- 報告檔是否要集中存在一個全域位置，或存在各專案的 `docs/agents/`.
