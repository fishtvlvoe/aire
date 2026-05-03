# fix-disclosure-field-blanking — Design

## 架構決策

### AD-1：confidence 過濾放在 flattenExtractedData()

**決策**：在 `flattenExtractedData()` 加入 confidence 門檻過濾，而非在 `getMergedValue()` 或 LLM prompt 層。

**理由**：
- `flattenExtractedData()` 是 confidence 資訊存在的最後一個節點（之後就只剩 value）
- 在這裡過濾，下游所有消費者（getMergedValue、LLM prompt、稅費計算）自動受益
- 不需要修改 LLM prompt 模板
- 不需要改變 `getMergedValue()` 的 signature

**替代方案**（已排除）：
- 在 LLM prompt 中加入 confidence 判斷 → 增加 prompt 複雜度，LLM 可能不穩定遵循
- 在 getMergedValue() 帶入 confidence → 需改 signature，影響所有呼叫方

### AD-2：門檻值 0.80 且可環境變數調整

**決策**：預設 0.80，從 `process.env.OCR_CONFIDENCE_THRESHOLD` 讀取。

**理由**：
- OCR pipeline 中，PDF 文字層直接萃取 + normalize 成功 = 0.95，LLM Vision fallback = 0.70
- 0.80 門檻可濾掉所有 LLM Vision fallback 的低品質值，保留高品質值
- 環境變數可在不重新部署的情況下微調

### AD-3：null 排除加在條件判斷中

**決策**：在 `getMergedValue()` 的 if 條件中加入 `!== null`。

**理由**：最小改動，不改函式簽名，不影響其他呼叫方。

## 資料流（修改後）

```
OCR pipeline
    ↓
merged_fields: { [key]: { value, confidence, provenance } }
    ↓
flattenExtractedData()
    ├─ confidence ≥ 0.80 → flat[key] = value     ← 正常帶入
    ├─ confidence < 0.80 → skip                    ← 新增：過濾掉
    └─ 無 confidence 欄位 → flat[key] = value      ← 相容舊資料
    ↓
getMergedValue()
    ├─ value !== undefined && !== null && !== '' → 使用   ← 修改：加 null
    └─ 否則 → fallback 下一層
    ↓
DocumentGeneratorInput → LLM prompt
    ├─ 有值 → 「建號：0001」
    └─ 無值 → 「建號：{{待補}}」
    ↓
Markdown → HTML → replacePendingPlaceholders()
    └─ 「待補」→ <span class="pdf-blank">______</span>
    ↓
PDF 輸出
```

## 影響分析

### 修改的檔案

| 檔案 | 修改內容 | 對應 Spec |
|------|---------|-----------|
| `src/lib/document-generator/build-input.ts` | flattenExtractedData() 加 confidence 過濾 | FR-1 |
| `src/lib/document-generator/build-input.ts` | getMergedValue() 加 null 排除 | FR-2 |
| `src/lib/pdf-generator/dossier.ts` | 頁碼變數修正 | FR-3 |
| `src/lib/document-generator/pdf/dossier-building.ts` | 表頭 Markdown 語法修正 | FR-4 |
| `.env.example` | 新增 OCR_CONFIDENCE_THRESHOLD | FR-1 |

### 不修改的檔案

| 檔案 | 為什麼不動 |
|------|-----------|
| `src/lib/ocr/index.ts` | OCR pipeline 行為正確，問題在下游消費方 |
| `src/lib/ocr/field-mapping.ts` | confidence 競爭邏輯正確 |
| `src/lib/document-generator/pdf/dossier-land.ts` | 本次只修建物版，土地版另開 change |
| `src/lib/document-generator/pdf/acroform-overlay.ts` | 中文字型問題另開 change |

## Implementation Distribution Strategy

### 代理分配表

| Task | 代理 | 原因 |
|------|------|------|
| Task 1.1 + 1.2 | Copilot CLI | 同檔案（build-input.ts），合併一包，業務邏輯修改 |
| Task 1.3 | Copilot CLI | 單檔修改（dossier.ts），頁碼邏輯 |
| Task 2.1 | Copilot CLI | 單檔修改（dossier-building.ts），prompt 修正 |
| Task 3.1 | Sonnet 子代理 | 需跑完整生成流程 + 截圖驗證 |

### 並行策略

- Wave 1：Task 1.1+1.2（合併）與 Task 1.3 可並行（不同檔案）
- Wave 2：Task 2.1 串行（依賴 Wave 1 完成後的 build 確認）
- Wave 3：Task 3.1 串行（依賴全部修改完成）

### Token 成本估算

| 代理 | 預估 tokens | 費用 |
|------|------------|------|
| Copilot CLI × 3 | ~15K | $0（免費額度） |
| Sonnet 子代理 × 1 | ~20K | ~$0.12 |
| 主對話調度 | ~5K | ~$0.15 |
| **合計** | ~40K | **~$0.27** |
