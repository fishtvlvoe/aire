## ADDED Requirements

### Requirement: Field auto-fill from extracted data

當業務進入「基本資料」「建物資料」「現況」「法律資料」「補充資料」任一章節時，系統 SHALL 從 `listings.extracted_data.merged_fields` 帶入對應欄位的初始值。

業務尚未填寫過的欄位（field_visit_data 中對應 key 為空）SHALL 套用 OCR 抽出值；業務已手填過的欄位 SHALL 不被覆蓋。

#### Scenario: 業務首次進入基本資料章節，欄位自動帶入

- **WHEN** 業務上傳謄本後切到「基本資料」章節，extract 已完成
- **AND** `merged_fields.address.value === "台南市東區大學路1號"`
- **AND** `field_visit_data.address` 為空
- **THEN** address 欄位輸入框 SHALL 預填「台南市東區大學路1號」
- **AND** 欄位旁 SHALL 顯示「📄 已從 陳世曉-謄本.pdf 帶入」綠色徽章

#### Scenario: 業務手填過的欄位不被自動覆蓋

- **WHEN** 業務先手填 total_price = 600，extract 後 OCR 抽出 total_price = 585
- **THEN** total_price 欄位 SHALL 維持 600
- **AND** UI SHALL 顯示「⚠ 文件中為 585，目前手填為 600」提示
- **AND** 業務可選擇「使用文件值」或「保留手填值」

### Requirement: Field provenance display

每個欄位 SHALL 根據 `provenance` 顯示對應徽章：

| provenance | 徽章 | 顏色 |
|-----------|------|-----|
| manual（業務手填，無自動帶入） | （無徽章） | — |
| ocr-pdf 信心度 ≥ 0.9 | 「📄 已從 {檔名} 帶入」 | 綠 |
| ocr-pdf 信心度 < 0.9 / ocr-image | 「📄 已帶入，請確認」 | 黃 |
| llm-vision | 「🤖 AI 推論，請確認」 | 紫 |
| manual-edit（業務改過自動帶入值） | 「✏️ 已手動修改」 | 灰 |

#### Scenario: 高信心度欄位顯示綠色徽章

- **WHEN** 欄位 land_area 由 PDF 文字層抽出，confidence = 0.97
- **THEN** 欄位旁 SHALL 顯示綠色徽章「📄 已從 謄本.pdf 帶入」

#### Scenario: 低信心度欄位顯示黃色徽章

- **WHEN** 欄位 owner_name 由權狀照片 OCR 抽出，confidence = 0.78
- **THEN** 欄位旁 SHALL 顯示黃色徽章「📄 已帶入，請確認」
- **AND** 業務 click 確認後徽章 SHALL 變為「✓ 已確認」

#### Scenario: 業務修改自動帶入值後徽章更新

- **WHEN** 自動帶入 land_area = 32.5，業務改為 33.0
- **THEN** 徽章 SHALL 從綠色「📄 已從...帶入」改為灰色「✏️ 已手動修改」
- **AND** 原始值 32.5 SHALL 保留在 `extracted_data` 供回溯

### Requirement: Cross-file conflict resolution

同一欄位若有多份文件提供不同值，系統 SHALL 套用以下優先級：

1. 業務手填或手動覆蓋 > 任何自動值
2. 信心度高的文件 > 信心度低的
3. 信心度相同時，較新上傳的 > 較舊的

業務 SHALL 可在 UI 看到「另有 N 份文件提供不同值」並切換。

#### Scenario: 兩份謄本提供不同地號

- **WHEN** 業務上傳兩份謄本，分別抽出 parcel_number = "1234-5"（confidence 0.95）與 "1234-6"（confidence 0.97）
- **THEN** 欄位 SHALL 帶入 "1234-6"
- **AND** UI SHALL 顯示「另有 1 份來源的值為 1234-5（confidence 0.95），是否切換」下拉

### Requirement: Extracted-data persistence and migration

`listings.extracted_data` 欄位 SHALL 為 TEXT NULL，預設 NULL；現有物件不影響。

#### Scenario: 既有物件無 extracted_data

- **WHEN** 業務開啟 listing 36（建立於本 change 上線前）
- **THEN** `extracted_data` SHALL 為 NULL
- **AND** 所有欄位 SHALL 維持現有值，不顯示自動帶入徽章
- **AND** 業務後續上傳檔案時，extract 仍會執行（補回 extracted_data）

#### Scenario: 業務在 upload-first 章節上傳檔案

- **WHEN** 業務在新建物件流程上傳第一個謄本
- **THEN** `extracted_data.by_attachment.<id>` SHALL 寫入新 entry
- **AND** `merged_fields` SHALL 重新計算
- **AND** 後續章節載入時 SHALL 套用 merged_fields
