## Why

不動產說明書文件生成後所有欄位顯示「待補」，原因是 OCR 解析結果（`extracted_data`）在兩個環節均發生斷線：上傳後未完整寫入表單欄位（`field-mapping.ts` 遺漏 `announced_land_value`、`rights_range` 等關鍵欄位），且文件生成 API（`generate/route.ts`）完全未讀取 `extracted_data`，導致 LLM 只看到空白資料。全部已上傳謄本的物件（目前 20 筆中 18 筆有 OCR 資料）均受影響。

## What Changes

- **修改** `src/lib/ocr/field-mapping.ts`：補上 `announced_land_value`（公告現值）、`rights_range`（持分比）、`land_section`（地段）等遺漏的 OCR → 表單 key 映射
- **修改** `src/app/api/listings/[id]/generate/route.ts`：解析 `listing.extracted_data`，將 OCR 解析欄位合併進生成器輸入，並計算 `system_computed`（坪數換算、屋齡）後一併傳入
- **修改** `src/app/api/listings/[id]/regenerate/route.ts`：同上，確保重新生成路徑與生成路徑一致
- **修改** `src/lib/document-generator/types.ts`：`DocumentGeneratorInput` 新增 `extracted_data?: Record<string, unknown>` 與 `system_computed?: Record<string, unknown>` 欄位
- **修改** `src/lib/document-generator/pdf/dossier-building.ts`：Prompt 新增 `extracted_data` 資料區塊，並更新欄位來源優先順序（`supplementary_data` > `extracted_data` > `field_visit_data`）
- **修改** `src/lib/document-generator/pdf/dossier-land.ts`：同上

## Non-Goals

- 不重寫 OCR 解析邏輯（`src/lib/ocr/`）
- 不修改 `disclosure-document.ts` / `five-documents.ts`（已確認為死程式碼，本次不清除，留待後續）
- 不新增表單 UI 欄位（`announced_land_value` 等僅在後端合併，不改前端表單 schema）
- 不實作完整稅費試算（`system_computed` 本次只做坪數換算與屋齡，不含房屋稅/地價稅計算）
- 不處理歷史已生成文件（既有 `documents-ready` 物件需手動重新生成）

## Capabilities

### New Capabilities

（無新 capability，本次為 bug fix）

### Modified Capabilities

- `disclosure-document-generation`：需求新增「生成器 SHALL 讀取 `extracted_data` 中的 OCR 解析欄位作為備援資料來源」
- `pre-listing-data-collection`：需求新增「OCR 欄位映射 SHALL 涵蓋 `announced_land_value`、`rights_range`、`land_section`」

## Impact

- **Affected specs**: `disclosure-document-generation`、`pre-listing-data-collection`
- **Affected code**:
  - `src/lib/ocr/field-mapping.ts`
  - `src/app/api/listings/[id]/generate/route.ts`
  - `src/app/api/listings/[id]/regenerate/route.ts`
  - `src/lib/document-generator/types.ts`
  - `src/lib/document-generator/pdf/dossier-building.ts`
  - `src/lib/document-generator/pdf/dossier-land.ts`
- **Dependencies 新增**：無
- **環境變數新增**：無
