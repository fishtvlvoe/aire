## Why

AIRE 目前的不動產說明書只有文字型格局欄位，缺少屋主與買方最直覺需要的主要格局圖。若沒有統一的格局圖資產流程，Magicplan、Homestyler、屋主提供圖片、AI 口述生成圖都會落在人工整理，難以進入 PDF 生產線與審核紀錄。

## What Changes

- 新增案件層級的 floor plan asset 能力，支援本機匯入 PNG、JPEG、WebP 與已轉圖的 PDF 頁面。
- 新增格局圖來源、審核狀態、信任等級與聲明文字，區分實測/外部工具匯入圖與 AI 口述生成示意圖。
- 新增 PDF 說明書的格局圖頁面資料契約，只有已審核通過的格局圖會進入輸出。
- 新增 OpenAI Image / ChatGPT Image Tool 的操作結構設計：以結構化問卷產生 schematic draft，不把口述生成圖標示為精準測量圖。
- 修改案件精靈與資料組裝流程，讓助理能在現況調查後上傳、標記來源、審核並輸出格局圖。

## Non-Goals

- 不在本次直接重寫完整 2D/3D 格局編輯器。
- 不把 AI 口述生成圖作為法律、權利範圍、建築測量或坪數認定依據。
- 不把屋主個資、案件地址或未審核圖資上傳到雲端儲存。
- 不在本次實作 Magicplan、Homestyler、CubiCasa 的完整雙向 API 帳號整合；本次以匯入外部工具輸出檔與保留 metadata 為主。
- 不把 supastarter-nextjs 的 S3 storage 直接搬進 Tauri 桌面版；僅作為未來 OPCOS/SaaS 雲端資產儲存參考。

## Capabilities

### New Capabilities

- `floor-plan-assets`: 案件格局圖資產的本機匯入、來源標示、審核、AI 示意圖生成資料契約與 PDF 輸出規則。

### Modified Capabilities

(none)

## Impact

- Affected specs: floor-plan-assets
- Affected code:
  - New: src-tauri/src/commands/case_assets.rs
  - New: src-tauri/src/db/case_assets.rs
  - New: src-tauri/migrations/007_case_assets.sql
  - New: src/components/case-wizard/FloorPlanAssetPanel.tsx
  - New: src/lib/pdf-blocks/floor-plan-page.tsx
  - New: src/lib/floor-plan-assets.ts
  - Modified: src-tauri/src/lib.rs
  - Modified: src/lib/pdf-engine/assemble-dossier-data.ts
  - Modified: src/lib/pdf-engine/document.tsx
  - Modified: src/components/case-wizard/CaseWizardStep4.tsx
- Dependencies 新增: none for import-first MVP; optional later OpenAI SDK integration only if AIRE chooses direct API generation inside the desktop app.
- 環境變數新增: none for import-first MVP; optional later OPENAI_API_KEY or OPCOS image-generation endpoint only if AI generation ships in-app.
