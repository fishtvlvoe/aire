## Why

不動產說明書 PDF 生成後，多個欄位填入了 OCR 亂碼或低信心值，而非留空白讓業務手動確認。

**使用者回報的具體問題**（disclosure-202-完整版.pdf）：
1. 封面頁碼「第 0 頁 / 共 0 頁」
2. 章節 5（產權調查表）：總樓層、主建面積 — OCR 亂碼填入
3. 章節 6（土地標示）：地段欄位 — OCR 亂碼
4. 章節 7（他項權利）：登記原因日期後面有亂碼
5. 章節 8（建物現況）：頂加/外推、獨立水電、分租狀態欄 — 應留空白
6. 章節 10（稅費規費）：表頭亂碼，多欄位格式亂
7. 章節 12（土增稅）：表頭亂碼

**根本原因**：`flattenExtractedData()` 在 `build-input.ts:64-83` 把 OCR 的 confidence 分數丟棄了。低信心值（亂碼、模糊字元）和高信心值一視同仁地被填入文件。

## What Changes

### 修改 1：低信心 OCR 值改留空白

在 `flattenExtractedData()` 增加 confidence 門檻判斷（建議 ≥ 0.80）。低於門檻的值不帶入，讓 LLM prompt 自動走「待補」路徑。

**影響檔案**：`src/lib/document-generator/build-input.ts`

### 修改 2：getMergedValue() 修正 null 處理

`getMergedValue()` 目前只排除 `undefined` 和空字串 `''`，但 `null` 會被視為「有值」而不 fallback。加入 null 排除。

**影響檔案**：`src/lib/document-generator/build-input.ts`

### 修改 3：修正頁碼「第 0 頁 / 共 0 頁」

封面的頁碼變數未正確注入。

**影響檔案**：`src/lib/pdf-generator/dossier.ts`

### 修改 4：稅費/土增稅表頭亂碼清理

表頭文字直接在 LLM prompt 中硬編碼（非來自 OCR），如果是亂碼代表 prompt 本身有編碼問題或 Markdown → HTML 轉換出錯。需檢查 prompt 與 marked() 轉換。

**影響檔案**：`src/lib/document-generator/pdf/dossier-building.ts`、`src/lib/pdf-generator/dossier.ts`

## Scope

- 只修 disclosure（不動產說明書）生成邏輯
- 不改 OCR pipeline 本身
- 不改其他 4 份文件的生成邏輯
- confidence 門檻可由環境變數 `OCR_CONFIDENCE_THRESHOLD` 調整（預設 0.80）
- 更新 `.env.example` 加入新環境變數說明

## Risks

- confidence 門檻太高 → 正確值也被留空白（業務需手動填更多欄位）
- confidence 門檻太低 → 亂碼仍然滲入

**緩解**：門檻預設 0.80，可透過環境變數 `OCR_CONFIDENCE_THRESHOLD` 調整。初期偏保守（寧可空白不可亂填）。

## Implementation Strategy

單一 change 即可，不需拆分。4 個修改互相獨立，可並行處理。
