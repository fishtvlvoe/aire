## 1. 修改 Chapter 5 Prompt（建物標示 OCR 欄位對應）

- [x] 1.1 實作 `chapter-5-building-data-from-extracted`：在 `src/lib/document-generator/pdf/dossier-building.ts` 的第 5 章 prompt 中，將「取自 supplementary_data，缺則待補」改為雙層優先對應表，明確列出每個欄位的 `supplementary_data` key 和 `extracted_data` key，格式如下：`優先取 supplementary_data.xxx；無值則取 extracted_data.<key>（OCR讀取，請確認）；兩者皆無則{{待補}}`。涵蓋欄位：建號（building_number）、法定用途（current_purpose，解析包含「住家用」之字串）、主要建材（structure，解析包含「鋼筋混凝土造」之字串）、總樓層（floor_count）、主建物坪數（building_area，㎡ 值直接帶入，備註坪數換算公式）、建築完成日（year_built）、門牌地址（address）。 [Tool: copilot]

## 2. 修改 Chapter 6 Prompt（土地標示 OCR 欄位對應）

- [x] 2.1 實作 `chapter-6-land-data-from-extracted`：在 `src/lib/document-generator/pdf/dossier-building.ts` 的第 6 章 prompt 中，將現有模糊的「改取 extracted_data」指令替換為完整的雙層對應表，明確列出每個欄位的 key 名稱。涵蓋欄位：地段/地號（land_number）、土地面積（land_area）、持分比例（rights_range）、公告地價（announced_land_value）。格式同 Task 1.1。 [Tool: copilot]

## 3. 新增單元測試

- [x] 3.1 新建 `src/lib/document-generator/pdf/__tests__/dossier-building.test.ts`，測試 `buildBuildingDossierPrompt`（或 prompt 建構相關 function）：
  - 測試案例一：`extracted_data` 含 `{ building_area: 84.13, floor_count: 13, year_built: "民國083年", land_area: 1223, rights_range: "91/10000" }`，`supplementary_data` 為 `{}`，驗證 prompt 字串包含這些值且不出現對應欄位的「待補」。
  - 測試案例二：`extracted_data.building_area` 為 null，驗證對應欄位指令含「待補」。
  - 若 `buildBuildingDossierPrompt` 不是直接 export 的函數，改測試整個 prompt 字串中是否含有正確的欄位名稱和 key 名稱。 [Tool: copilot]

## 4. 驗證測試通過

- [x] 4.1 執行 `npm run test -- --reporter verbose 2>&1 | head -60`，確認 dossier-building.test.ts 全部通過，無新增失敗。 [Tool: bash]
