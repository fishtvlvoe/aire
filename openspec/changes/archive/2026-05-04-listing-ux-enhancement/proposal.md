## Why

物件列表目前是平坦清單，當物件數量增加後難以管理。用戶無法分類物件、無法隱藏已完成案件、也無法快速搜尋特定物件。需要資料夾分類、封存機制、搜尋功能三者配合，讓房仲能高效管理大量物件。

## What Changes

- 新增自定資料夾功能（樹狀式，一物件一夾），用戶可建立/重新命名/刪除資料夾
- 新增物件封存狀態，封存後從主列表隱藏，保留所有資料，可隨時還原
- 新增物件搜尋功能，支援全文搜尋（地址/案名/屋主/房型）+ 篩選器 + 資料夾篩選
- 封存物件預設不出現在搜尋結果，需勾選「包含封存」才搜尋

## Non-Goals

- 不做巢狀資料夾（只有一層）
- 不做自動封存規則（純手動封存）
- 不做跨用戶共享資料夾（單機系統無此需求）
- 不做全文索引引擎（SQLite LIKE + FTS5 即可）

## Capabilities

### New Capabilities

- `listing-folders`: 物件資料夾管理，包含建立/重新命名/刪除資料夾、將物件移入資料夾、資料夾列表顯示
- `listing-archive`: 物件封存機制，包含封存/還原操作、封存物件隱藏於主列表、封存狀態顯示
- `listing-search`: 物件搜尋功能，包含全文搜尋、欄位篩選器、資料夾篩選、封存物件包含/排除選項

### Modified Capabilities

- `listing-workflow`: 物件狀態流轉新增「封存」狀態，列表 API 需支援資料夾篩選與封存過濾
- `listing-ui-flow`: 列表頁面新增資料夾側欄、搜尋列、封存按鈕

## Impact

- Affected specs: listing-workflow, listing-ui-flow（需修改）；listing-folders, listing-archive, listing-search（新建）
- Affected code:
  - New: `src/lib/listings/folders.ts`, `src/lib/listings/archive.ts`, `src/lib/listings/search.ts`, `src/app/api/listings/folders/route.ts`, `src/app/api/listings/search/route.ts`
  - Modified: `src/app/listings/page.tsx`（列表頁加側欄和搜尋）, `src/app/api/listings/route.ts`（加篩選參數）, `src/lib/db/schema.sql`（加 folders 表 + archive 欄位）
  - Removed: 無
- Dependencies 新增: 無（使用 SQLite FTS5 內建功能）
- 環境變數新增: 無
