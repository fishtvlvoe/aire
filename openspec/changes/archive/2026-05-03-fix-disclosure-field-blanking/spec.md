# fix-disclosure-field-blanking — Spec

## 問題定義

不動產說明書（disclosure）PDF 生成後，多個欄位填入 OCR 亂碼或低信心值，而非留空白供業務手動確認。

### 受影響的使用者流程

```
業務上傳謄本 PDF → OCR 解析 → 自動帶入欄位 → 生成不動產說明書 PDF
                                                    ↑
                                              問題發生在這裡
```

### 症狀（disclosure-202-完整版.pdf）

| # | 章節 | 症狀 | 嚴重度 |
|---|------|------|--------|
| S1 | 封面 | 頁碼「第 0 頁 / 共 0 頁」 | High |
| S2 | 章節 5 產權調查表 | 總樓層、主建面積填入 OCR 亂碼 | Critical |
| S3 | 章節 6 土地標示 | 地段欄位填入 OCR 亂碼 | Critical |
| S4 | 章節 7 他項權利 | 登記原因日期後有亂碼字元 | High |
| S5 | 章節 8 建物現況 | 頂加/外推、獨立水電、分租欄位狀態不明確 | Medium |
| S6 | 章節 10 稅費規費 | 表頭亂碼，欄位格式亂 | High |
| S7 | 章節 12 土增稅 | 表頭亂碼 | High |

### 根因分析

```
OCR pipeline 回傳 { value, confidence, provenance }
    ↓
flattenExtractedData() 只取 value，丟棄 confidence
    ↓
getMergedValue() 無法判斷值的可靠度
    ↓
低信心值（亂碼）被當作正常值傳給 LLM prompt
    ↓
LLM 原樣帶入 → PDF 顯示亂碼
```

根因在 `src/lib/document-generator/build-input.ts` 的兩個函式：
1. `flattenExtractedData()` — 丟棄 confidence（L64-83）
2. `getMergedValue()` — null 不被視為空值，不 fallback（L51-62）

次要問題：
3. 頁碼變數注入邏輯錯誤（`src/lib/pdf-generator/dossier.ts`）
4. LLM prompt 中 Markdown 表格語法導致表頭亂碼（`dossier-building.ts`）

## 功能需求

### FR-1：OCR 低信心值過濾

- 系統 MUST 在將 OCR 值帶入文件生成前，檢查 confidence 分數
- confidence 低於門檻值的欄位 MUST 不帶入，改走「待補」路徑
- 門檻預設 0.80，可透過環境變數 `OCR_CONFIDENCE_THRESHOLD` 調整
- 高信心值（≥ 0.80）MUST 正常帶入，行為不變

### FR-2：null 值 fallback

- `getMergedValue()` 遇到 null 值時 MUST fallback 到下一層資料來源
- fallback 優先順序不變：supplementary_data → extracted_data → field_visit_data

### FR-3：頁碼正確顯示

- 封面頁碼 MUST 反映實際頁數（「第 1 頁 / 共 N 頁」）
- N MUST 為正整數，禁止顯示 0

### FR-4：表頭正確編碼

- 章節 10（稅費規費）和章節 12（土增稅）的表頭 MUST 為可讀中文
- Markdown 表格語法 MUST 正確（header 行、分隔行、對齊）

## 非功能需求

### NFR-1：向後相容

- 已生成的歷史 PDF 不受影響（不重新生成）
- 其他 4 份文件（買賣契約、委託書等）的生成邏輯不受影響

### NFR-2：可觀測性

- 當欄位因低信心被過濾時，SHOULD 在 server log 記錄 `[disclosure] field "${key}" filtered: confidence ${confidence} < threshold ${threshold}`

## 驗收標準

| # | 條件 | 驗證方式 |
|---|------|---------|
| AC-1 | confidence < 0.80 的欄位在 PDF 中顯示為空白（______） | 用測試物件生成 PDF，目視確認 |
| AC-2 | confidence ≥ 0.80 的欄位正常填入 | 同上 |
| AC-3 | supplementary_data 值為 null 時，fallback 到 extracted_data | 單元測試 |
| AC-4 | 封面頁碼為正整數 | 目視確認 |
| AC-5 | 章節 10、12 表頭為正確中文 | 目視確認 |
| AC-6 | `npm run build` 零錯誤 | CI |
| AC-7 | 既有測試不 break | `npm run test` |

## 邊界與排除

- 不修改 OCR pipeline（`src/lib/ocr/`）
- 不修改其他 4 份文件的生成邏輯
- 不新增 UI（門檻值不在前端可調）
- 不處理 AcroForm 中文字型問題（已知 issue，另開 change）
