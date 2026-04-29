## Context

謄本 OCR 流程：`building-parser.ts` 解析 PDF 文字層 → `mapOcrFieldsToFormKeys` 映射欄位名稱
→ 存入 `listings.extracted_data.merged_fields` → `FieldVisitForm` 讀取並預填表單。

問題集中在「映射層」與「正規化層」的兩個錯誤假設：
1. `floor_count` 被當作單一欄位 key 處理，但它在表單中是複合欄位容器
2. `normalizeDate` 輸出西元日期字串，但目標欄位是 `type="number"` 的民國年整數

## Goals / Non-Goals

**Goals**
- 修正 OCR 映射：`stories` → `floor_total`（實際子 key）
- 提供民國年份專用正規化：`normalizeRocYear()`
- badge 顯示與值填入保持一致（有值才顯示 badge）

**Non-Goals**
- 不改動 `normalizeDate()`（其他欄位如 `registration_date` 仍需西元格式）
- 不加入 `floor_current` 的 OCR 填入（謄本無此資訊）

## Decisions

### `stories` 映射目標改為 `floor_total` 而非保留 `floor_count`

**決策**：將 `OCR_TO_FORM_KEY['stories']` 從 `floor_count` 改為 `floor_total`。

**理由**：`floor_count` 是 FieldVisitForm 的「虛擬複合 key」，僅用於識別要渲染哪個複合元件。
實際 form state 讀的是子 key `floor_current` 和 `floor_total`，OCR 預填邏輯
（`setForm(prev => { next[key] = String(field.value) })`）設定 `floor_count` 完全無效。
`stories` 語意上等於「總樓層數」，正確映射目標是 `floor_total`。

**替代方案**：在預填邏輯中特判 `floor_count` 並拆解 → 複雜且耦合，排除。

### 新增 `normalizeRocYear` 而非修改 `normalizeDate`

**決策**：新增獨立函式 `normalizeRocYear(raw: string): number | null`。

**理由**：`normalizeDate` 目前回傳 ISO 字串（"YYYY-MM-DD"），被其他欄位使用
（如 `registration_date`）且有完整測試覆蓋。修改會造成廣泛迴歸。
`year_built` 欄位語意只需要民國「年份」整數，不需要完整日期，
新增專用函式符合單一職責並零風險。

### `floor_count` badge 改查子 key `floor_total`

**決策**：`fieldProvenance` 對 `floor_count` 特判，查 `mergedFields?.floor_total ?? mergedFields?.floor_current`。

**理由**：OCR 映射改為 `floor_total` 後，`mergedFields['floor_count']` 不再存在，
不特判會導致 badge 消失。此修改讓 badge 狀態與「有無實際填入值」同步。

## Risks / Trade-offs

[Risk] `floor_current`（所在樓層）永遠不會被 OCR 填入 → Mitigation：此資訊不在謄本中，屬於預期行為，現勘時由業務手動填寫，不影響完整性驗證。

[Risk] 謄本日期缺少「日」欄位時 `normalizeRocYear` fallback 到 rawValue（如「民國90年6月」）→ Mitigation：已在 `makeField` 中處理：normalizedValue 有值優先；若 rawValue 含「年」字就能正確萃取年份，若完全無法解析才回傳 null，符合現有邏輯。

## Migration Plan

變更為純前端 + OCR 層修改，不涉及資料庫 schema 變動。
已有 `extracted_data` 記錄（舊 `floor_count` 映射）不會自動修正，
但使用者重新上傳謄本即可觸發新邏輯。
