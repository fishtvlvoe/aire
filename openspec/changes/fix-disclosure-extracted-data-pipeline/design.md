## Context

系統在使用者上傳謄本 PDF 時，會執行 OCR 解析並將結果存入 `listings.extracted_data`（JSON 欄位）。現行問題是這份 OCR 資料在兩個節點均未被使用：

1. **上傳後** — `field-mapping.ts` 只有部分欄位有 OCR → 表單 key 映射，`announced_land_value`（公告現值）、`rights_range`（持分比）、`land_section`（地段）等關鍵欄位無映射，無法自動帶入表單
2. **生成時** — `generate/route.ts` 組裝 `DocumentGeneratorInput` 時完全未讀取 `listing.extracted_data`，LLM 只看到空白的 `supplementary_data`，只能填「待補」

本次修復需同時補上這兩個斷點，建立完整的「謄本 → 表單 → 生成器」資料流。

## Goals / Non-Goals

**Goals:**

- 修復 OCR 欄位映射遺漏（`field-mapping.ts`），使公告現值、持分比、地段在上傳後正確寫入 `field_visit_data`
- 修復文件生成 API，將 `extracted_data` 作為第二資料來源傳入 LLM
- 新增 `system_computed` 計算（坪數換算：平方公尺 × 0.3025 = 坪；屋齡：當前年 - 建築完成民國年 + 1911）並傳入生成器
- 統一 `generate/route.ts` 與 `regenerate/route.ts` 的資料合併邏輯

**Non-Goals:**

- 不實作完整稅費試算（房屋稅、地價稅等需外部試算資料）
- 不修改前端表單 UI（`announced_land_value` 等只在後端合併，不顯示於表單）
- 不清除死程式碼 `disclosure-document.ts` / `five-documents.ts`

## Decisions

### 決策 1：extracted_data 的合併時機選在「生成時」而非「存入時」

**採用方案**：在 `generate/route.ts` 合併 `extracted_data` 到 `DocumentGeneratorInput`（生成時合併）

**否決方案 A**：在 OCR 完成時立即把所有欄位覆寫到 `field_visit_data`（存入時合併）
- 否決理由：`field_visit_data` 是使用者手動填寫的表單資料，覆寫會使使用者無法看到「哪些是 OCR 帶入、哪些是手動填的」，且若 OCR 辨識錯誤，使用者修改後下次重新 OCR 會再度覆蓋

**否決方案 B**：完全依賴 `field-mapping.ts` 修正（只修映射，不改生成器）
- 否決理由：`field-mapping.ts` 映射只能寫到前端表單有定義的欄位，`rights_range`、`announced_land_value` 等在前端表單 schema 中不存在，即使補映射，值也無法進入 `field_visit_data`；且未來 OCR 新增欄位時仍需同步改表單 schema，脆弱

**最終策略**：兩者並行
- `field-mapping.ts` 修正已有表單欄位的映射遺漏（如 `floor_total`）
- `generate/route.ts` 額外讀取 `extracted_data` 傳入 LLM，使表單沒有對應欄位的 OCR 資料也能被生成器使用

### 決策 2：extracted_data 在 Prompt 中的資料優先順序

**採用方案**：`supplementary_data` > `extracted_data` > `field_visit_data`
- `supplementary_data`：使用者明確補充的資訊，優先級最高
- `extracted_data`：OCR 自動解析，可信但可能有辨識誤差
- `field_visit_data`：使用者現勘填寫，通常較完整但未必包含法律數字

**否決方案**：`field_visit_data` 優先（因為使用者親自填的比 OCR 可信）
- 否決理由：`field_visit_data` 裡的法律數字（持分比、公告現值）通常是空的，因為使用者不知道這些數字；OCR 從謄本讀到的反而更準確

### 決策 3：system_computed 的計算範圍

**採用方案**：本次只計算兩個確定性高的值
- `area_ping`：`building_area × 0.3025`（法定換算公式）
- `building_age`：`(currentYear - (year_built + 1911))`（民國年轉西元再算屋齡）

**否決方案**：同時計算稅費（房屋稅、地價稅、土地增值稅）
- 否決理由：稅費計算需要外部資料（路段率、適用稅率），且有法律責任風險，本次不做

## Risks / Trade-offs

[Risk] OCR 辨識錯誤導致生成的說明書含有錯誤數字 → Mitigation：在 Prompt 中明確說明 `extracted_data` 為 OCR 解析結果、可能有辨識誤差，要求 LLM 以 `(OCR讀取，請確認)` 標注來自 `extracted_data` 的關鍵數字

[Risk] `generate/route.ts` 與 `regenerate/route.ts` 邏輯不同步 → Mitigation：抽取 `buildDocumentInput(listing)` 為共用函式，兩個 route 都呼叫同一函式

[Risk] `extracted_data` 結構未來若 OCR 模組更新而改變 → Mitigation：在 `generate/route.ts` 使用 optional chaining 取值（`extracted?.fields?.announced_land_value?.value`），取不到值時靜默略過，不拋錯

## Migration Plan

1. 部署新版本（`npm run build` 通過即可，無 schema 變更）
2. 既有物件（如 #199）需手動點「重新生成文件」觸發 `regenerate` 路由，說明書才會更新
3. 無資料庫 migration，`extracted_data` 欄位已存在

**回滾策略**：`git revert` 對應 commit，`npm run build` 後重新部署；資料庫無異動，回滾無資料風險

## Open Questions

- OCR 信心值（`confidence`）是否要在 Prompt 中傳給 LLM？若 confidence < 0.7 是否要用不同標注？（本次先不做，後續視客戶反饋決定）
