## Why

本 SR 整併兩個已提出但尚未形成單一執行紀錄的交付：

| SR | 類型 | 內容 |
| --- | --- | --- |
| pdf-browser-image-fix | Bug 驗證 | 確認位置圖、空拍圖、建物外觀三頁在瀏覽器匯出的 PDF 中顯示實際圖片，而不是佔位文字。 |
| floor-plan-and-planning-map | Feature | 在 Wizard Step 3 支援建物格局圖與土地規劃圖上傳、持久化、PDF 嵌入。 |

目前 `pdf-browser-image-fix` 已有部分程式碼修正，但缺少明確測試與 PDF 驗證紀錄。`floor-plan-and-planning-map` 的 parked artifact 指向不存在的 `src/components/case-wizard/CaseWizardStep3.tsx`，實際程式碼已改為 `src/components/case-wizard/CaseWizardStep3Disclosure.tsx`，需要以目前程式碼為準重新落地任務。

## What Changes

- 新增本 SR 的單一追蹤 change：`sr-pdf-browser-images-floor-plan-upload`
- 將 PDF 圖片修正驗證與 Step 3 圖片上傳功能放在同一份 proposal/design/spec/tasks 中
- 明確採用現有 `CaseWizardStep3Disclosure.tsx` 作為 Step 3 修改點
- 明確採用 `CaseRow.land_registry_data.floor_plan_photo` 作為 web/mock 持久化格式
- 新增 `CaseDossierData.floorPlanPhoto` 與 `FloorPlanPhotoPage`
- PDF 匯出時，建物顯示「格局圖」，土地顯示「土地規劃圖」

## Capabilities

### New Capabilities

- `sr-browser-pdf-image-rendering`: 瀏覽器 PDF 匯出中的位置圖、空拍圖、建物外觀圖片使用 browser-safe data URL，並以測試與 PDF 下載驗證防止回歸。
- `sr-step3-floor-plan-photo-upload`: Wizard Step 3 提供建物格局圖或土地規劃圖上傳、10MB 大小驗證、縮圖預覽與 web/mock 持久化。
- `sr-floor-plan-photo-pdf-page`: 說明書 PDF 額外渲染格局圖/土地規劃圖頁，未上傳時仍顯示佔位文字且不阻斷 PDF 產生。

## Impact

- Affected specs:
  - `sr-pdf-image-assets`
- Affected code:
  - Modified: `src/lib/pdf-blocks/location-map.tsx`
  - Modified: `src/lib/pdf-blocks/aerial-photo-page.tsx`
  - Modified: `src/lib/pdf-blocks/exterior-photo-page.tsx`
  - New: `src/lib/pdf-blocks/image-data-url.ts`
  - New: `src/lib/pdf-blocks/__tests__/uint8-to-data-url.test.ts`
  - New: `src/lib/pdf-blocks/floor-plan-photo-page.tsx`
  - New: `src/lib/pdf-blocks/__tests__/floor-plan-photo-page.test.tsx`
  - Modified: `src/lib/pdf-engine/document.tsx`
  - Modified: `src/lib/pdf-engine/assemble-dossier-data.ts`
  - Modified: `src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts`
  - Modified: `src/components/case-wizard/CaseWizardStep3Disclosure.tsx`
  - New: `src/components/case-wizard/__tests__/step3-photo-upload.test.tsx`

## Supersedes / Coordinates With

- Supersedes the implementation intent of active `pdf-browser-image-fix`.
- Replaces the stale parked `floor-plan-and-planning-map` artifact path assumptions with code-verified paths.
- Does not implement `floor-plan-assets-and-ai-schematic`; that is a larger asset-management and AI schematic workflow and remains out of scope for this SR.
