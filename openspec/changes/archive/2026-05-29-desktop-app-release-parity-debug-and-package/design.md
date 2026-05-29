## Context

本機 Web 開發模式透過 `safeInvoke` fallback 到 `mock-backend`；Tauri App 則走 Rust IPC 與本機 SQLite。這個分叉讓 Web 可以看起來成功，但 App 或正式資料路徑失敗。使用者在新竹案件上看到台北和平東路資料，是正式匯入 fallback 回 mock/demo payload 的直接證據。

## Goals / Non-Goals

**Goals:**

- 阻止本機 Web 正式匯入保存 mock/demo 地政資料。
- 保留本機 Web 可展示地址 discovery 與候選確認，但正式匯入必須使用真實來源或明確阻擋。
- 讓候選確認、正式匯入與 PDF 檢查在工作台中以全寬可讀版型呈現。
- 以 macOS App 與 Windows runtime evidence 作為壓 App 前的 release gate。

**Non-Goals:**

- 不處理 Windows code signing 與 SmartScreen 信任鏈。
- 不處理 auto-update。
- 不重做全站導覽或整個案件工作台。
- 不把 Web mock 作為正式地政資料來源。

## Decisions

### Decision: Formal import uses real IPC or explicit blocking

正式資料匯入的 source of truth 是 Tauri/Rust IPC。Web development fallback 若沒有真實正式匯入來源，必須回傳可讀錯誤，不得產生 `moi_api`、`trustedForPdf=true` 或 demo 台北 payload。

Alternatives Considered:

- 保留 mock formal import 但加警示：否決，因為使用者仍會在物件總覽與 PDF 檢查看到錯誤正式資料。
- 讓本機 Web 直接呼叫 COP：否決，本期不擴大憑證與隱私邊界；Web dev 只作對照與非正式 discovery。

### Decision: Candidate and formal import become full-width work surfaces

候選確認、正式資料匯入與 PDF 檢查改為工作台主內容的全寬區塊，表格欄位包含候選 key、摘要、狀態、費用與操作，避免塞在窄欄造成誤選。

Alternatives Considered:

- 使用 modal：否決，候選多筆與 PDF 檢查欄位多，modal 會增加捲動與焦點管理成本。
- 建立獨立 route：否決，本期要保留案件工作台脈絡，避免狀態同步與導頁成本。

### Decision: Release parity evidence is platform-specific

同一套功能修正先用 unit/component tests 鎖契約，再以本機 Web、macOS App、Windows runtime smoke 分別保存 evidence。Windows 沒有實機時使用 GitHub Windows runner 加 UTM/Windows VM evidence，並明確標示限制。

Alternatives Considered:

- 只看 `pnpm tauri build`：否決，build 成功不能證明 App runtime 正常。
- 等 Windows 實機才修：否決，共用 IPC 與 Web mock 污染可以先在目前環境修正並驗證。

## Implementation Contract

- Behavior: 本機 Web development 按正式資料匯入時，若不在 Tauri App 且沒有真實正式來源，使用者看到明確錯誤，案件資料不會新增正式地政 entries。
- Interface / data shape: `land_registry_formal_pull_data` fallback error MUST be distinguishable by code/message and MUST NOT return `results` with `source: "api"` for mock data.
- Failure modes: Web dev formal import blocking is surfaced in `PullParcelDataButton` as customer-readable text. Address discovery and candidate creation remain usable.
- Acceptance criteria: 新竹案件的物件資料總覽與 PDF 檢查 MUST NOT contain `台北市大安區和平東路`, `建號 778-2`, or `北松字第012345號`; tests and manual smoke both verify this.
- Scope boundaries: This change covers formal import fallback, workbench layout, app runtime evidence, and packaging evidence. It excludes signing trust and auto-update.

## Risks / Trade-offs

- [Risk] Web dev can no longer demo a full formal import without App/Rust IPC → Mitigation: keep address discovery and candidate confirmation available, and show explicit desktop-App-required message for formal import.
- [Risk] Layout changes can break existing tests that assume candidate buttons are inside the summary panel → Mitigation: update tests to query by region names and verify visible behavior rather than old grid placement.
- [Risk] Windows evidence can lag if VM interaction fails → Mitigation: use GitHub Windows runtime smoke as fallback artifact and mark limitations in SR tasks.

## Migration Plan

- Deploy steps: land the fallback guard and UI tests, verify local Web, verify macOS Tauri dev/app, build desktop bundles, then run Windows runtime smoke.
- Rollback strategy: revert the workbench layout and mock fallback guard together if formal import becomes inaccessible in App; keep tests that reject demo payloads as release blockers.

## Open Questions

None.
