# fix-disclosure-field-blanking — Tasks

## Wave 1：核心邏輯修正

### Task 1.1：flattenExtractedData() 加入 confidence 門檻 [Tool: copilot-codex]
- [x] 修改 `src/lib/document-generator/build-input.ts` 的 `flattenExtractedData()`
- 當 `field.confidence < OCR_CONFIDENCE_THRESHOLD`（預設 0.80）時，不將該欄位加入 flat 物件
- confidence 門檻從環境變數 `OCR_CONFIDENCE_THRESHOLD` 讀取，預設 0.80
- 保留原有的 `value` 提取邏輯，只加一層 confidence 過濾
- 被過濾的欄位 MUST 輸出 log：`[disclosure] field "${key}" filtered: confidence ${confidence} < threshold ${threshold}`
- 無 confidence 屬性的舊資料欄位（相容模式）MUST 正常帶入，不過濾
- [x] 更新 `.env.example`，加入 `OCR_CONFIDENCE_THRESHOLD=0.80` 並附註說明

**Concrete example**：
```
修改前：{ value: "3Ä5㎡", confidence: 0.35 } → flat["building_area"] = "3Ä5㎡" → 亂碼填入 PDF
修改後：{ value: "3Ä5㎡", confidence: 0.35 } → 低於 0.80 門檻 → 不加入 flat → LLM 走「待補」→ PDF 顯示 ______
```

### Task 1.2：getMergedValue() 修正 null 處理 [Tool: copilot-codex]
- [x] 修改 `src/lib/document-generator/build-input.ts` 的 `getMergedValue()`
- 將 null 加入排除條件：`!== undefined && !== '' && !== null`
- 確保 null 值會 fallback 到下一層資料來源

**Concrete example**：
```
修改前：supplementary_data.building_area = null → 視為「有值」回傳 null → parseFloat(null) → NaN
修改後：supplementary_data.building_area = null → 排除 → fallback 到 extracted_data.building_area
```

### Task 1.3：修正頁碼「第 0 頁 / 共 0 頁」 [Tool: copilot-codex]
- [x] 檢查 `src/lib/pdf-generator/dossier.ts` 的 `buildFullHtml()` 中頁碼變數
- 確認 `{{PAGE_NUMBER}}` 和 `{{TOTAL_PAGES}}` 的注入邏輯
- 若 Puppeteer 渲染時使用 CSS `counter` 或 `@page`，確認計數器正確

**預期結果**：封面顯示「第 1 頁 / 共 4 頁」（依實際頁數動態計算），不再是「第 0 頁 / 共 0 頁」

## Wave 2：表頭亂碼修正

### Task 2.1：檢查稅費/土增稅表頭 prompt [Tool: copilot-codex]
- [x] 檢查 `src/lib/document-generator/pdf/dossier-building.ts` 章節 10、12 的 prompt
- 確認表頭文字（「買方」「賣方」等）是否在 prompt 中正確編碼
- 若是 Markdown 表格語法問題，修正 `|` 對齊和 header 行

**Concrete example**：
```
修改前：| 項目 | 買方/lN | → 亂碼表頭
修改後：| 項目 | 買方 | 賣方 | → 正常中文表頭
```

## Wave 3：驗證

### Task 3.1：生成測試文件驗證修正 [Tool: sonnet]
- [x] 用現有的測試物件（listing ID 從 DB 取最新一筆）重新生成 disclosure PDF
- 確認：低信心值欄位顯示為空白（______）
- 確認：高信心值欄位（confidence ≥ 0.80）正常填入
- 確認：封面頁碼格式為「第 X 頁 / 共 Y 頁」且數字 > 0
- 確認：章節 10、12 表頭為正確中文（買方/賣方）
- 截圖驗證存到 /tmp/

**失敗條件**（任一觸發即 fail）：
- PDF 中出現非 UTF-8 可讀字元（亂碼）
- 頁碼仍為 0
- 低信心欄位仍有填值（非 ______ 或空白）
- `npm run build` 失敗
