## Context

`desktop-fullflow-r02-cop-parity` 是本期主線，`desktop-auto-update-macos-windows` 是下一期。兩者中間需要一個清楚的驗收 gate：桌面完整版沒有通過前，不准開始自動更新，也不應給客戶正式試用。

本 SR 不改產品功能，而是把驗收內容寫成可執行清單與報告要求，讓新對話或工程 agent 知道完成順序與證據標準。

## Goals / Non-Goals

### Goals

- 定義 AIRE Desktop fullflow 的 release gate。
- 明確列出 P0/P1/P2 後續工作與驗收順序。
- 明確要求 macOS 與 Windows 都跑真實 App 驗收。
- 明確要求查詢 JSON、費用、cache、error log 與 PDF artifact 留在系統或報告中。
- 明確要求 OO 授權、AIRE entitlement 與客戶 COP 設定分層驗收。

### Non-Goals

- 不實作 UI、API、R02、COP 或 updater。
- 不重做既有本機 UI/UX。
- 不把 SaaS 當成本期完整交付面。

## Decisions

### Decision 1: Acceptance gate blocks auto-update work

`desktop-auto-update-macos-windows` SHALL NOT start implementation until this gate has passing evidence for desktop fullflow on macOS and Windows.

### Decision 2: Evidence must be product-visible or artifact-visible

驗收不能只寫「測過」。每個項目都必須留下產品內可查紀錄或 artifact，例如 screenshot、Playwright report、JSON sample、ledger row、error log、PDF、installer smoke report。

### Decision 3: P0 validates the product workflow

P0 驗收順序 SHALL cover desktop fullflow, true E2E, R02/candidate gate, COP formal lookup, query records, supplement preview and PDF output.

### Decision 4: P1 validates entitlement and installability

P1 SHALL cover OO/AIRE entitlement, customer COP credential setup, macOS packaging, and Windows packaging.

### Decision 5: P2 starts only after P0/P1 pass

Auto-update, release documentation polish, and handoff refinements SHALL be P2 work after Desktop fullflow is accepted.

## Acceptance Report Shape

The implementation SHALL create or update `docs/release/desktop-fullflow-acceptance-report.md` with:

- tested branch and commit
- macOS environment and result
- Windows environment and result
- test addresses or fixture cases used
- registry confirmation evidence
- COP credential mode used
- JSON, billing, cache, and error log evidence
- PDF artifact evidence
- known blockers and unresolved risks

## Risk Controls

| Risk | Gate rule |
| --- | --- |
| UI looks done but backend is mock only | require true E2E with query records and artifacts |
| Windows not actually tested | require Windows installer or VM smoke evidence |
| repeated object burns API cost | require cache hit row with zero cost |
| COP credential belongs to Fish | require customer-owned credential mode documented |
| PDF triggers new paid query | require PDF output from saved JSON |
| auto-update ships half-finished app | updater SR blocked until this gate passes |
