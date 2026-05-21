## Why

不動產說明書目前缺少兩個重要圖頁：
- **建物版**：格局圖（房間配置平面圖），業務現場拍攝後需附於說明書
- **土地版**：土地規劃圖（地籍圖、使用分區圖），取自政府圖資或業務備存

現有 `fieldSketchFloorPlan` 功能需要 AI 轉換流程（上傳草稿 → 等待 AI → 審核），對於已有現成圖片（JPG/PNG）的情境過度複雜。業務只需上傳一張照片就能附在說明書中。

## What Changes

新增「直接上傳格局圖/規劃圖」功能：
1. Case wizard Step 3（揭露資料）新增圖片上傳區塊：建物版顯示「格局圖上傳」，土地版顯示「規劃圖上傳」
2. 上傳的圖片存入 case 資料（IPC `save_case_photo` / web mode 存至 case JSON 欄位）
3. 說明書 PDF 在「建物外觀」頁之後插入「格局圖」頁（建物版）或「土地規劃圖」頁（土地版）
4. `CaseDossierData` 新增 `floorPlanPhoto?: Uint8Array | null`，`assembleDossierData` 從 case 資料讀取

## Non-Goals

- 不取代 AI 格局圖轉換流程（`fieldSketchFloorPlan` 保持不動）
- 不支援多張圖（一個案件只需一張格局圖/規劃圖）
- 不做圖片編輯或旋轉功能

## Capabilities

### New Capabilities

- `floor-plan-photo-upload`: 業務在 Step 3 上傳建物格局圖（JPG/PNG），儲存至 case 資料，出現在 PDF「格局圖」頁
- `planning-map-photo-upload`: 業務在 Step 3 上傳土地規劃圖（JPG/PNG），儲存至 case 資料，出現在 PDF「土地規劃圖」頁

### Modified Capabilities

- `dossier-data-assembly`: `assembleDossierData` 讀取 `floorPlanPhoto` 欄位填入 `CaseDossierData`
- `disclosure-pdf-render`: PDF 在建物外觀後（建物版）或現況調查後（土地版）插入圖頁

## Impact

- Affected specs: floor-plan-photo-upload, planning-map-photo-upload, dossier-data-assembly, disclosure-pdf-render
- Affected code:
  - New: src/lib/pdf-blocks/floor-plan-photo-page.tsx
  - Modified: src/lib/pdf-engine/document.tsx
  - Modified: src/lib/pdf-engine/assemble-dossier-data.ts
  - Modified: src/lib/pdf-engine/document.tsx
  - Modified: src/components/case-wizard/CaseWizardStep3.tsx
  - Modified: src/lib/cases-api.ts
