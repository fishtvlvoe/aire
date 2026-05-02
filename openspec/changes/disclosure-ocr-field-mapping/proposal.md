## Problem

`dossier-building.ts` 的第 5 章（建物標示）prompt 只告訴 LLM「取自 supplementary_data，缺則待補」，完全沒有參照 `extracted_data`。第 6 章（土地標示）雖有提到 `extracted_data` 作 fallback，但沒有列出任何欄位的具體 key 名稱。導致 LLM 面對內容豐富的 OCR extracted_data 時，因無從對應而全部標「待補」。

## Root Cause

1. **第 5 章**：prompt 指令只寫 "取自 supplementary_data，缺則待補"，LLM 不知道 `extracted_data` 存在。
2. **第 6 章**：prompt 說「supplementary_data 無值，改取 extracted_data」，但沒給 key 名稱，LLM 無法確定性地帶入值。
3. `buildDocumentInput()` 已正確把 `extracted_data.merged_fields` 攤平傳入（如 `building_area: 84.13`），但 prompt 沒有告訴 LLM 這些 key 對應哪個說明書欄位。

## Proposed Solution

在 `dossier-building.ts` 的第 5、6 章 prompt 中，新增顯式「OCR 欄位對應表」，格式為：

```
- 欄位名稱：優先取 supplementary_data.xxx；無值時取 extracted_data.<key>（標注 OCR 讀取）；兩者皆無則{{待補}}
```

第 5 章對應表：
- 建號 → `extracted_data.building_number`
- 法定用途 → `extracted_data.current_purpose`（解析「住家用」片段）
- 主要建材 → `extracted_data.structure`（解析「鋼筋混凝土造」片段）
- 總樓層 → `extracted_data.floor_count`
- 主建物坪數 → `extracted_data.building_area`（單位換算：坪 = ㎡ × 0.3025）
- 建築完成日 → `extracted_data.year_built`
- 地址/門牌 → `extracted_data.address`

第 6 章對應表：
- 地段/地號 → `extracted_data.land_number`
- 土地面積 → `extracted_data.land_area`
- 持分比例 → `extracted_data.rights_range`
- 公告地價 → `extracted_data.announced_land_value`

同時新增欄位對應表的 unit test（Vitest），驗證 extracted_data 中已知欄位確實被帶入產出字串，不出現「待補」。

## Non-Goals

- 不修改 OCR 解析邏輯（`extract` API）
- 不修改 `buildDocumentInput()` 或 `flattenExtractedData()`
- 不增加新的資料庫欄位
- 不調整第 5/6 章以外的其他章節

## Success Criteria

1. 給定 `extracted_data` 含 `building_area: 84.13`、`land_area: 1223`、`floor_count: 13`，生成的說明書第 5/6 章不出現「待補」於上述已知欄位。
2. 若 `extracted_data` 某欄位為 null/undefined，該欄位正確顯示「待補」。
3. 單元測試在 `npm run test` 下全部通過。

## Impact

- Affected code:
  - Modified: `src/lib/document-generator/pdf/dossier-building.ts`
  - New: `src/lib/document-generator/pdf/__tests__/dossier-building.test.ts`
