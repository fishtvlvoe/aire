## Why

目前業務建立物件的流程順序是：
1. 基本資料（手填）→ 2. 建物資料（手填）→ 3. 現況（手填）→ 4. 法律資料（手填）→ 5. 照片/文件（上傳）→ 6. 補充資料（手填）

每個物件業務需要把**謄本上的資訊（地段地號、面積、產權人、建物完成日、坐落地址、權利範圍等）一格一格抄到表單裡**，平均 30–40 分鐘，而且容易抄錯。

謄本 PDF 內所有資料都是現成的結構化資訊，系統有能力（OCR + 規則解析 + LLM 輔助）讀出來自動填入欄位。但目前流程把上傳放在第 5 步，已經填完所有資料才上傳，**自動帶入的價值完全錯失**。

業務反映：「資料是不是可以自動帶入？我同樣的東西為什麼要填這麼多次？」

## What Changes

### 流程順序重排（核心改動）

把「照片/文件上傳」從第 5 步**移到第 1 步**，並建立「上傳優先 → 自動解析 → 自動帶入後續章節」的工作流程：

```
新流程：
1. 上傳謄本 / 權狀 / 合約 / 地籍圖 / 照片
   ↓ 系統 OCR + 解析
2. 基本資料  ← 自動帶入 + 顯示「已從 XX 文件帶入」標記，業務只需確認
3. 建物資料  ← 同上
4. 現況     ← 自動帶入（地址 / 面積 / 屋齡）
5. 法律資料  ← 自動帶入（他項權利 / 限制登記）
6. 補充資料  ← 自動帶入（管理費 / 銀行估價）
```

### 自動帶入欄位（依文件類型）

| 文件類型 | 自動帶入的欄位 |
|---------|--------------|
| 土地謄本 | 地段、地號、面積、權利範圍、所有權人、他項權利、登記原因 |
| 建物謄本 | 建號、坐落地址、建物面積、樓層、結構、建築完成日、用途 |
| 權狀（影像） | OCR 後同上欄位（精度較低，需業務確認） |
| 地籍圖 | 使用分區、公告地價、公告現值（若標註） |
| 合約 | 總價、簽約日、特殊約定（精度低，僅作參考） |
| 室內/外觀照片 | 用於 PDF 嵌入，不抽欄位 |

### 視覺指引

- 自動帶入的欄位 SHALL 顯示「📄 已從 XX 帶入」綠色徽章
- 業務手動修改後 SHALL 顯示「✏️ 已修改」灰色徽章（提醒不再以原文件為準）
- 信心度低（OCR 模糊 / LLM 不確定）的欄位 SHALL 標紅 + 「請確認」提示

### 後備路徑

- 業務沒上傳任何文件 → 流程 fallback 回現有「全人工填寫」模式（流程依然從第 1 步開始，但所有欄位空白）
- 上傳失敗 / OCR 失敗 → 該文件改為手動分類 + 不影響其他欄位

## Non-Goals

- **不**做表格自動偵測（如謄本內的房屋標示部表格 → 細節由 LLM 抽欄位即可，不額外做 table detection）
- **不**做手寫字辨識（謄本影本通常是電子檔 PDF，OCR 對印刷字準確度高；手寫件超出範圍）
- **不**支援其他國家謄本格式（僅台灣中華民國地政事務所謄本）
- **不**做 OCR 模型自訓（用既有開源 / API：Tesseract / PaddleOCR / Google Document AI / Anthropic Vision）
- **不**改變既有的 5 個生成文件 schema（property_survey / listing_591 / sales_dm / disclosure_document / social_posts）
- **不**處理已存在物件的反向填寫（既有未上傳檔案的物件維持現流程）

## Capabilities

### New Capabilities

- `upload-first-flow`: 物件建立時，「文件上傳」為第一步，業務先上傳所有可取得的資料，系統解析後再進入後續欄位填寫
- `document-ocr-extraction`: 對上傳的 PDF / 圖片執行 OCR + 結構化欄位抽取，產出 `{ category, fields, confidence }`
- `auto-fill-fields`: 從 OCR 結果自動填入 5 個章節（基本/建物/現況/法律/補充）對應欄位，標記來源與信心度

### Modified Capabilities

- `field-visit-form`: 各欄位 SHALL 接受來自 OCR 的初始值並顯示「已從文件帶入」徽章；業務手動修改後變成「已修改」狀態
- `pre-listing-data-collection`: 流程順序重排（upload → 5 章節）

## Impact

- 影響的 specs：
  - 新增：upload-first-flow、document-ocr-extraction、auto-fill-fields
  - 修改：field-visit-form、pre-listing-data-collection
- 影響的程式碼：
  - **後端**：
    - New: `src/lib/ocr/index.ts`（OCR 引擎抽象層）
    - New: `src/lib/ocr/transcript-parser.ts`（謄本欄位抽取）
    - New: `src/lib/ocr/title-deed-parser.ts`（權狀抽取）
    - New: `src/app/api/listings/[id]/extract/route.ts`（POST：觸發已上傳文件的解析）
    - Modified: `src/app/api/listings/[id]/attachments/route.ts`（上傳成功後自動觸發 extract）
    - Modified: `src/lib/db/index.ts`（Listing 增加 `extracted_data: string | null` 欄位）
  - **前端**：
    - Modified: `src/app/listings/new/page.tsx`（建立物件流程順序調整為 upload-first）
    - Modified: `src/app/listings/[id]/fill/page.tsx`（章節導航順序調整、欄位帶入 initialData 策略）
    - Modified: `src/components/forms/FieldVisitForm.tsx`（欄位 render 加「已從文件帶入」徽章）
    - Modified: `src/components/PhotoUploadClassifier.tsx`（接收上傳完成 callback → trigger extract）
  - **資料**：
    - Migration: `migrations/003_add_extracted_data.sql`（ALTER TABLE listings ADD COLUMN extracted_data TEXT）
- **影響範圍**：
  - 既有物件（已建好的 listing 36 等）：流程不受影響，繼續現有手填流程
  - 新建物件：強制走 upload-first 流程（但「跳過上傳直接手填」按鈕保留為 fallback）
- **客戶影響**：業務每物件節省 20–30 分鐘填寫時間（高 ROI）

## Alternatives Considered

1. **OCR 在客戶端瀏覽器跑（Tesseract.js）**：
   - 優點：零後端負擔、隱私好（檔案不離開瀏覽器）
   - 缺點：中文精度差（Tesseract 中文模型粗糙）、業務電腦慢
   - 結論：不採用，改後端 OCR

2. **完全交給 LLM Vision（Claude / GPT-4V）解析整個 PDF**：
   - 優點：實作簡單，一次呼叫完成
   - 缺點：成本高（每物件 $0.05–0.20）、文件多時延遲長、有幻覺風險（LLM 編造不存在的欄位）
   - 結論：作為**第二層 fallback**（OCR 抓不到時補強），不作為主路徑

3. **建立內部表單模板對照表，僅用規則匹配**：
   - 優點：零模型成本、可預測
   - 缺點：謄本格式變動就壞、新文件類型要寫新 parser
   - 結論：作為**第一層**主路徑（規則先行 + LLM 補強）

4. **要求業務手動勾選「已從謄本確認」checkbox**：
   - 優點：實作零成本
   - 缺點：沒解決抄寫成本，只是讓業務多一個動作
   - 結論：不採用

**最終策略（混合）**：
- Layer 1：PDF 文字層直接抽（pdfjs / pdf-parse）→ 規則 parser 抽欄位（成本 $0、速度 < 1 秒）
- Layer 2：影像 PDF / 權狀照片 → Tesseract / PaddleOCR 後端跑（成本 $0、速度 5–20 秒）
- Layer 3：Layer 1+2 沒抓到的欄位 → Claude Vision 補強（成本 $0.02–0.05、速度 5–15 秒）

## Open Questions

### 已對焦（2026-04-24 與 Fish 確認）

1. **OCR 失敗時是否阻擋流程**？→ **不阻擋**。上傳非必要，業務可點「跳過，全部手動輸入」直接手填；部分欄位失敗時已抽到的仍寫入、未抽到的留空由業務補足（見 `specs/document-ocr-extraction` 之「Partial extraction does not block flow」）。
2. **欄位 conflict（OCR 帶入與業務手填不同）的優先級**？→ **以業務修改為準**（User edit wins）。OCR 原值保留於 `extracted_data.by_attachment` 作為 raw cache，v1 範圍 UI **不提供回溯到 OCR 原值**。見 `specs/auto-fill-fields` 之「User edit wins on conflict」。
3. **多份同類文件**（如業務上傳 2 份謄本）→ `merged_fields` 取信心度較高者；信心度相同取較新上傳者，UI 顯示切換下拉。見 `specs/document-ocr-extraction` 之「多份同類文件 conflict 解決」。
4. **權狀為手機拍照角度歪斜**的 OCR 容錯：需要 image preprocess。已列入 Phase 2 Task 2.4（EXIF 旋轉校正 + contrast 拉伸）。

### 延後至 v2（第二版交付後再詢問客戶）

1. **業務上傳錯檔**的處理：刪除 / 重上傳 / 確認提示 UI？v1 只提供基本的 attachment 刪除，不處理「錯分類」「誤上傳」的特殊 UX。
2. **同物件更新舊謄本**的重跑邏輯：保留舊 extracted_data / 合併 / 覆蓋？新上傳會走現有 conflict 解決規則，但「明確重跑整個 listing」的按鈕 v1 不做。
