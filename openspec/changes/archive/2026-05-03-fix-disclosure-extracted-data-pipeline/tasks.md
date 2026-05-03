## 1. 型別定義基礎（其他 group 的前置條件）

- [x] 1.1 [Tool: kimi-cli] 修改 `src/lib/document-generator/types.ts`：擴充 `DocumentGeneratorInput` interface，新增 `extracted_data?: Record<string, unknown>` 與 `system_computed?: Record<string, unknown>` 欄位（決策 1：extracted_data 的合併時機選在「生成時」而非「存入時」）

## 2. OCR 欄位映射修復

- [x] 2.1 [P] [Tool: kimi-cli] 修改 `src/lib/ocr/field-mapping.ts`：補上 `announced_land_value`、`rights_range`、`land_section` 的欄位定義，並將 `stories` → `floor_count` 的映射確認存在（OCR field mapping covers legal and financial fields）
- [x] 2.2 [P] [Tool: kimi-cli] 修改 `src/lib/ocr/field-mapping.ts`：加入映射表說明註解，區分「有對應表單欄位」與「只存 extracted_data」兩類欄位（OCR field mapping covers legal and financial fields）

## 3. 生成器 Prompt 更新

- [x] 3.1 [P] [Tool: kimi-cli] 修改 `src/lib/document-generator/pdf/dossier-building.ts`：prompt 新增 `extracted_data` 資料區塊，說明各來源優先順序（`supplementary_data` > `extracted_data` > `field_visit_data`），並要求 LLM 對 extracted_data 來源的欄位標注 `(OCR讀取，請確認)`（Disclosure document prompt accepts structured data inputs，決策 2：extracted_data 在 Prompt 中的資料優先順序）
- [x] 3.2 [P] [Tool: kimi-cli] 修改 `src/lib/document-generator/pdf/dossier-land.ts`：同 3.1，land 版 prompt 加入 `extracted_data` 區塊與來源優先順序說明（Disclosure document prompt accepts structured data inputs）

## 4. API 路由整合（依賴 Task 1.1 完成）

- [x] 4.1 [Tool: kimi-cli] 在 `src/app/api/listings/[id]/generate/route.ts` 新增 `buildDocumentInput(listing)` 共用函式，功能：解析 `listing.extracted_data`、計算 `system_computed`（area_ping = building_area × 0.3025；building_age 換算）、依優先順序合併資料來源，回傳完整 `DocumentGeneratorInput`（決策 1：extracted_data 的合併時機，決策 3：system_computed 的計算範圍）
- [x] 4.2 [Tool: kimi-cli] 修改 `src/app/api/listings/[id]/generate/route.ts`：呼叫 `buildDocumentInput(listing)` 取代原有的手動組裝邏輯（Disclosure document prompt accepts structured data inputs）
- [x] 4.3 [Tool: kimi-cli] 修改 `src/app/api/listings/[id]/regenerate/route.ts`：同樣呼叫 `buildDocumentInput(listing)` 確保兩條路徑資料一致（Disclosure document prompt accepts structured data inputs）

## 5. 測試

- [x] 5.1 [P] [Tool: kimi-cli] 新增或更新 `src/lib/document-generator/__tests__/` 測試：驗證 `buildDocumentInput` 正確合併 extracted_data 優先順序，包含邊界情境：extracted_data 為 null、field 值為 0、supplementary_data 同欄位值應優先（OCR field mapping covers legal and financial fields，Disclosure document prompt accepts structured data inputs）
- [x] 5.2 [P] [Tool: kimi-cli] 新增單元測試：驗證 `system_computed` 計算正確性（area_ping = building_area × 0.3025，building_age 民國年換算）（決策 3：system_computed 的計算範圍）

## 6. Code Review 與驗收

- [x] 6.1 [Tool: kimi] 對 Wave 1–5 所有改動執行 code review：重點審查優先順序合併邏輯、型別安全、optional chaining 防禦性取值、prompt 結構是否完整（disclosure-document-generation，pre-listing-data-collection）
- [x] 6.2 [Tool: kimi-cli] 執行 `npm run build` + `npm run test` 確認全部通過，無 TypeScript 錯誤
- [x] 6.3 主對話 git commit：`fix: 修復不動產說明書 extracted_data 資料管道斷線問題`，確認涵蓋所有改動檔案
