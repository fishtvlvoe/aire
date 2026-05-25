## Why

AIRE 已有 Step 3 直傳格局圖與現場手稿 SVG 兩條輸出流，但新設計的 `case_assets` 尚未落地，導致格局圖資料來源、審核規則與 PDF 頁面可能分裂。現在先做 bridge，讓新上傳圖資進入本機資產模型，同時保留舊案件 PDF 不退化。

## What Changes

- 新增 `src-tauri/migrations/010_case_assets.sql`，建立本機 case asset metadata table 與 floor plan 查詢 index。
- 新增 `src-tauri/src/db/case_assets.rs` 與 `src-tauri/src/commands/case_assets.rs`，提供 import/list/read/delete floor plan raster asset 的本機 IPC。
- 新增 `src/lib/floor-plan-assets.ts`，集中前端型別、MIME 驗證與 IPC wrapper。
- 修改 `src/components/case-wizard/CaseWizardStep3Disclosure.tsx`，讓新上傳格局圖/土地規劃圖寫入 `case_assets`，不再把新圖塞進 `land_registry_data.floor_plan_photo`。
- 修改 `src/lib/pdf-engine/assemble-dossier-data.ts`，PDF data assembly 優先讀 `case_assets`，再 fallback 舊 `land_registry_data.floor_plan_photo`。
- 修改 `src/app/(dashboard)/cases/[id]/preview/page.tsx`，桌面匯出路徑使用 PDF bytes 寫檔合約，不直接送 HTML 給 `export_pdf`。
- 保留現場手稿 SVG 的既有 approved conversion 輸出，這次不把 SVG conversion 搬進 `case_assets`。

## Non-Goals

- 不實作多圖資產管理 UI、pending/approved/rejected 審核面板或 primary selector。
- 不實作 OpenAI/ChatGPT 格局示意圖生成。
- 不接 Magicplan、Homestyler、CubiCasa、RoomSketcher、Apple RoomPlan 的 vendor API。
- 不把 supastarter storage、S3 signed upload 或 opcOS 雲端儲存搬進 AIRE 桌面版。
- 不刪除舊 `land_registry_data.floor_plan_photo`；舊資料只作為 fallback。

## Capabilities

### New Capabilities

- `floor-plan-assets-bridge`: 案件格局圖 raster asset 的本機儲存、IPC 讀取、Step 3 上傳橋接與 PDF fallback 規則。

### Modified Capabilities

- `disclosure-document-generation`: 不動產說明書 PDF SHALL prefer approved local floor plan assets before legacy JSON photos and SHALL keep export using PDF bytes.

## Impact

- Affected specs: floor-plan-assets-bridge, disclosure-document-generation
- Affected code:
  - New: src-tauri/migrations/010_case_assets.sql
  - New: src-tauri/src/db/case_assets.rs
  - New: src-tauri/src/commands/case_assets.rs
  - New: src/lib/floor-plan-assets.ts
  - Modified: src-tauri/src/db/mod.rs
  - Modified: src-tauri/src/commands/mod.rs
  - Modified: src-tauri/src/lib.rs
  - Modified: src/components/case-wizard/CaseWizardStep3Disclosure.tsx
  - Modified: src/lib/pdf-engine/assemble-dossier-data.ts
  - Modified: src/app/(dashboard)/cases/[id]/preview/page.tsx
  - Modified: src/lib/mock-backend.ts
- Dependencies 新增: none
- 環境變數新增: none
