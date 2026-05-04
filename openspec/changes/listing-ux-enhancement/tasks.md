## 1. 資料庫 Schema 擴展（d1：資料夾 db schema, d2：搜尋用 sqlite fts5）

- [x] 1.1 建立 `folders` 表（id, name, created_at, updated_at）並新增 `listings` 表的 `folder_id`（REFERENCES folders ON DELETE SET NULL）和 `archived_at`（TEXT DEFAULT NULL）欄位。實現 d1：資料夾 db schema [Tool: copilot-codex]
- [x] 1.2 建立 FTS5 虛擬表 `listings_fts`（address, property_type, content='listings', content_rowid='id'）及 INSERT/UPDATE/DELETE 同步觸發器。實現 d2：搜尋用 sqlite fts5 [Tool: copilot-codex]

## 2. Folders CRUD API（Spec: listing-folders）

- [x] 2.1 實作 Create folder（POST /api/listings/folders）：接受 name 參數，重複名稱回 400 "資料夾名稱已存在"。對應 Requirement "Create folder" [Tool: copilot-codex]
- [x] 2.2 實作 Rename folder（PATCH /api/listings/folders/[id]）：更新 name。對應 Requirement "Rename folder" [Tool: copilot-codex]
- [x] 2.3 實作 Delete folder（DELETE /api/listings/folders/[id]）：刪除資料夾，contained listings 的 folder_id SET NULL。對應 Requirement "Delete folder" [Tool: copilot-codex]
- [x] 2.4 實作 Move listing to folder（PATCH /api/listings/[id]/folder）：設定 listing 的 folder_id。對應 Requirement "Move listing to folder" [Tool: copilot-codex]
- [x] 2.5 實作 GET /api/listings/folders：列出所有資料夾（含各夾 listing 數量）。對應 Requirement "Filter listings by folder" 的資料來源 [Tool: copilot-codex]

## 3. 列表 API 擴展（Spec: listing-search, listing-archive, listing-workflow; d3：列表 api 篩選參數）

- [x] 3.1 修改 GET /api/listings 加入 folder_id、archived（false/true/all）、q 查詢參數。q 使用 FTS5 MATCH 搜尋。實現 d3：列表 api 篩選參數。對應 Requirements "Search API"、"Full-text search"、"Search with folder filter"、"Search archived listings opt-in"、"Filter listings by folder"、"Listing API supports folder and archive filtering" [Tool: copilot-codex]
- [x] 3.2 實作 POST /api/listings/[id]/archive（設 archived_at = now）和 POST /api/listings/[id]/restore（設 archived_at = NULL）。對應 Requirements "Archive listing"、"Restore archived listing"、"Listing status includes archived state" [Tool: copilot-codex]

## 4. 前端 UI（Spec: listing-ui-flow; d4：ui 佈局）

- [x] 4.1 建立左側資料夾側欄元件 FolderSidebar：顯示「全部」/各用戶資料夾/「未分類」/「封存區」+ 「新增資料夾」按鈕。點擊切換 folder_id 篩選。實現 Design D4 佈局。對應 Requirement "Listings page includes folder sidebar" [Tool: copilot-codex]
- [x] 4.2 建立搜尋列元件 SearchBar：搜尋框（300ms debounce 觸發）+ 「包含封存」checkbox。對應 Requirements "Listings page includes search bar"、"Search archived listings opt-in" [Tool: copilot-codex]
- [x] 4.3 整合 FolderSidebar + SearchBar 到 listings/page.tsx，串接 GET /api/listings 的 folder_id、archived、q 參數。對應 Requirement "Filter listings by folder" 前端實現 [Tool: copilot-codex]
- [x] 4.4 列表每行加入「封存」/「還原」按鈕（呼叫 3.2 的 API）+ 「移動到資料夾」下拉選單（呼叫 2.4 的 API）。對應 Requirements "Archive action on listing row"、"View archived listings" [Tool: copilot-codex]

## 5. 測試

- [x] 5.1 E2E 測試：Create folder → Move listing → Filter by folder → Search → Archive → Restore → View archived 完整流程驗證。覆蓋所有 specs 的 scenarios [Tool: sonnet]
