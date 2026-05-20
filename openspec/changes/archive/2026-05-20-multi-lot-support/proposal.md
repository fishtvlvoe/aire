## Why

台灣不動產物件常跨多筆土地地號（例如透天厝橫跨三筆地號），現行 `cases` 表的 `land_lot_no` 欄位僅能儲存單一字串，無法完整描述物件。業務填寫說明書時須手動拼接地號，導致格式不一致且容易遺漏。

## What Changes

- `cases` 表新增 `land_lots` TEXT 欄位，儲存 JSON 陣列（`["123-1","123-2","123-3"]`）；現有 `land_lot_no` 欄位保留作回溯相容，值同步為 `land_lots[0]`
- 新增 IPC 命令 `update_land_lots(case_id, lots: Vec<String>)` 更新多地號
- 案件建立 / 編輯 UI：地號欄位改為多值輸入（新增 / 刪除地號 row）
- 說明書「土地標示」區塊渲染多筆地號（HTML 預覽 + PDF）
- 案件列表「狀態」欄旁顯示地號筆數 badge（≥2 筆才顯示）

## Non-Goals

- 不修改 `building_lot_no`（建號欄位，通常唯一）
- 不支援每筆地號的持分面積（本次只存地號字串，面積由說明書手動填）
- 不從地政 API 自動拉多筆地號（保留供未來整合）

## Capabilities

### New Capabilities

- `multi-lot-cases`: 案件可儲存並展示多筆土地地號

### Modified Capabilities

- `case-management`: 案件建立與更新接受多筆地號陣列
- `disclosure-form-residential`: 住宅說明書土地標示渲染多筆地號
- `disclosure-form-land`: 土地說明書土地標示渲染多筆地號

## Impact

- Affected specs: multi-lot-cases, case-management
- Affected code:
  - New: src-tauri/migrations/008_land_lots.sql
  - Modified: src-tauri/src/db/cases.rs
  - Modified: src-tauri/src/commands/cases.rs
  - Modified: src-tauri/src/lib.rs
  - Modified: src/lib/cases-api.ts
  - Modified: src/components/disclosure-form-residential.tsx
  - Modified: src/components/disclosure-form-land.tsx
  - Modified: src/app/(dashboard)/cases/new/page.tsx
