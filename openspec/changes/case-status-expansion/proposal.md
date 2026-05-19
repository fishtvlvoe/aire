## Why

目前案件狀態只有 `draft`、`completed`、`exported` 三種，無法反映業務回到店面後「正在 Key 入資料」這個中間狀態。業務把案件帶出現場回來後，使用者無法從列表區分「尚未開始填入」與「已在 Key 入中」的案件。

## What Changes

- 新增 `keyin` 狀態（介於 `draft` 與 `completed` 之間）
- 新增 SQLite migration：更新 `cases` 表 status CHECK 約束，加入 `keyin`
- 新增 Rust IPC 命令 `mark_keyin`：`draft → keyin` 轉換
- 更新 `mark_completed`：允許 `keyin → completed`（目前只接受 `draft → completed`）
- 更新 TypeScript `CaseRow.status` union type 加入 `"keyin"`
- 更新案件列表 `StatusBadge`：`keyin` 顯示「填入中」藍色 Badge，`exported` 顯示「已匯出」獨立 Badge（目前 `completed`/`exported` 都顯示同一個「完成」Badge，造成混淆）
- `KeyinSplitPage` 開啟時自動呼叫 `mark_keyin`（draft → keyin 無痛自動轉換）

## Non-Goals

- 不新增「退回草稿」功能（不允許反向轉換 keyin → draft）
- 不變更 `exported` 相關邏輯（export_pdf 命令不動）
- 不新增案件狀態篩選功能（列表仍顯示所有狀態）

## Capabilities

### New Capabilities

- `case-keyin-status`: 案件「填入中」狀態管理 — 新增 keyin 狀態、mark_keyin 命令、自動轉換邏輯，以及前端 Badge 顯示

### Modified Capabilities

（無需異動現有 spec）

## Impact

- Affected specs: `case-keyin-status`（新建）
- Affected code:
  - New: `src-tauri/migrations/004_case_status_keyin.sql`
  - Modified: `src-tauri/src/commands/cases.rs`
  - Modified: `src-tauri/src/db/cases.rs`
  - Modified: `src/lib/cases-api.ts`
  - Modified: `src/app/(dashboard)/cases/page.tsx`
  - Modified: `src/components/KeyinSplitPage.tsx`
