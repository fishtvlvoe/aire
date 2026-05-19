## Why

現場業務最自然的行為是用紙筆畫手稿，不是操作專業平面圖軟體；AIRE 需要把「拍手稿」轉成「可放入說明書的乾淨格局圖」。因為格局圖會出現在不動產說明書，系統必須保存原始手稿、限制 AI 不得自由編造，並要求人工確認後才能輸出。

## What Changes

- 新增手稿拍照/上傳入口，接在成屋表單「附件 > 附建物平面圖」欄位旁。
- 新增手稿轉換流程：原始手稿保存、影像校正、AI 讀圖整理、人工確認、系統重畫、PDF 輸出。
- 新增法律風險控管：原始手稿不可覆蓋、轉換紀錄不可刪改、AI 草稿不得直接進 PDF、輸出必須有來源與聲明。
- 新增格局確認檢核：房間數、門窗位置、陽台/廚房/衛浴位置、尺寸文字、無法辨識項目必須逐項確認。
- 新增 clean floor plan renderer，由結構化資料重畫乾淨圖，不使用 AI 直接生成的圖片作為正式最終圖。

## Non-Goals

- 不要求現場業務操作 Magicplan、Homestyler 或任何專業繪圖工具。
- 不把手稿轉換圖宣稱為地政測量圖、建築師圖、權利範圍圖或坪數認定依據。
- 不在第一版自動保證尺寸精準；尺寸只使用手稿或人工確認資料。
- 不讓 AI 生成圖在未經人工確認前進入 PDF。
- 不以 Codex CLI 作為產品功能的一部分；Codex CLI 僅是開發工具。

## Capabilities

### New Capabilities

- `field-sketch-floor-plan-conversion`: 現場手稿拍照/上傳後，轉換為可審核、可追溯、可輸出到不動產說明書的乾淨格局圖。

### Modified Capabilities

(none)

## Impact

- Affected specs: field-sketch-floor-plan-conversion
- Affected code:
  - New: src/components/case-wizard/FieldSketchFloorPlanPanel.tsx
  - New: src/lib/floor-plan/sketch-brief.ts
  - New: src/lib/floor-plan/sketch-validation.ts
  - New: src/lib/floor-plan/render-clean-plan.ts
  - New: src/lib/floor-plan/legal-disclaimer.ts
  - New: src-tauri/src/commands/floor_plan_sketch.rs
  - New: src-tauri/src/db/floor_plan_sketches.rs
  - New: src-tauri/migrations/008_floor_plan_sketches.sql
  - Modified: src/components/disclosure-form-residential.tsx
  - Modified: src/lib/pdf-engine/assemble-dossier-data.ts
  - Modified: src/lib/pdf-engine/document.tsx
  - Modified: src/lib/pdf-blocks/property-data-sheet.tsx
- Dependencies 新增: image processing crate/library for crop/perspective normalization if needed; OpenAI API client or existing HTTP client for vision extraction if direct API mode is selected.
- 環境變數新增: none for local upload and manual conversion; OPENAI_API_KEY only when AI extraction is enabled with customer-owned key.
