## Context

AIRE 目前的 `cases` 表有 `land_lot_no TEXT NOT NULL`（單一地號）和 `building_lot_no TEXT`（單一建號）欄位。台灣不動產物件常見一物件跨多筆地號，例如透天厝三層包含三筆不同地號。業務填寫說明書「土地標示」時，目前只能把多地號手動拼成一字串塞進 `land_lot_no`，無結構化儲存。

## Goals / Non-Goals

**Goals:**

- 新增 `land_lots` 欄位（JSON 陣列），正式儲存多筆地號
- 保持 `land_lot_no` 向後相容（同步為 `land_lots[0]`）
- 案件建立 / 編輯 UI 支援動態新增 / 刪除地號 row
- 說明書 HTML 預覽正確渲染多筆地號

**Non-Goals:**

- 不支援每筆地號的個別持分面積（字串陣列，無 object 結構）
- 不修改 `building_lot_no`（建號通常唯一）
- 不從地政 API 自動拉取多地號（保留未來整合）

## Decisions

### 儲存方式：JSON 陣列文字欄位

在現有 `cases` 表新增 `land_lots TEXT DEFAULT '[]'`，儲存 JSON 陣列字串（如 `["123-4","456-7"]`）。SQLite 無原生陣列型別，TEXT 最直觀，且 rusqlite 可直接讀寫字串。

回溯相容策略：`land_lot_no` 保持為 `land_lots[0]`（空時為空字串）。IPC 命令 `create_case` / `update_case` 接受 `land_lots: Option<Vec<String>>`；若提供則自動同步 `land_lot_no`。

### UI：內嵌多值輸入

案件建立精靈（`cases/new/page.tsx`）和編輯頁（`cases/[id]/edit/page.tsx`）的地號欄位改為：
- 最少 1 個 input row
- 右側有「＋」按鈕加一個空 row
- 每個 row（>1 個時）右側有「ㄧ」刪除按鈕
- 空字串 row 在儲存時過濾掉

### 說明書渲染：逐筆顯示

`disclosure-form-residential.tsx` 和 `disclosure-form-land.tsx` 讀取 `land_lots` 陣列，在「土地標示」區塊用 `ul/li` 逐筆渲染。現有 `land_lot_no` 單值欄位顯示保持不變（顯示 `land_lots[0]` 即可）。

## Implementation Contract

### Behavior

- 使用者在案件建立 / 編輯頁可新增多筆地號，每筆獨立 input。
- 儲存後，案件資料包含 `land_lots: string[]`（至少 1 筆）。
- `land_lot_no` 欄位自動同步為 `land_lots[0]`。
- 說明書 HTML 預覽的「土地標示」區塊按陣列順序列出所有地號。
- 地號陣列空字串項目在儲存時被過濾。

### Interface / Data Shape

```typescript
// cases-api.ts
interface CaseRow {
  land_lot_no: string;      // 保留（同步為 land_lots[0]）
  land_lots: string[];      // NEW
}

interface CreateCaseInput {
  land_lots?: string[];     // NEW，若省略則從 land_lot_no 衍生
}
interface UpdateCaseInput {
  land_lots?: string[];     // NEW
}
```

```rust
// db/cases.rs
pub struct Case {
    pub land_lots: Vec<String>,  // NEW, serialized as JSON TEXT
}
```

IPC 命令名稱不變（`create_case` / `update_case`），新增可選參數 `land_lots`。

### Failure Modes

- `land_lots` 全為空字串 → IPC 回傳 `missing_field` 錯誤（至少需 1 個非空地號）
- JSON 反序列化失敗（DB 損壞） → fallback 為 `vec![land_lot_no.clone()]`
- UI 刪除到最後 1 筆 → 禁用刪除按鈕，不允許清空

### Acceptance Criteria

1. `cargo test` Rust 單元測試：`create_case_with_multiple_lots`（驗證 land_lots JSON 寫入 + land_lot_no 同步）
2. TS 單元測試：`CaseLotInput` 元件新增 / 刪除 row
3. 案件列表頁：含多地號案件正確顯示所有地號（`data-testid="land-lots-list"`）
4. 建立案件時輸入 2 筆地號，讀回 `land_lots.length === 2`

### Scope Boundaries

In scope: DB migration、IPC 命令參數更新、UI 多值輸入元件、說明書渲染多地號。
Out of scope: 建號多值（building_lot_no）、地號面積/持分、地政 API 自動拉取。

## Risks / Trade-offs

- **向後相容**：舊資料 `land_lots` 為空時，fallback 到 `land_lot_no` 單值，不破壞現有案件。
- **SQLite TEXT JSON**：無 schema validation，但 Rust 端序列化/反序列化可確保格式正確。
