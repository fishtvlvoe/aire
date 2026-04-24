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

每個欄位 SHALL 根據 `provenance` 顯示對應徽章。視覺規範遵循下表：

| provenance | 徽章文字 | 顏色 | 說明 |
|-----------|---------|-----|-----|
| manual（業務手填，無自動帶入） | （無徽章） | — | 機器無法產出此欄位，業務需手填 |
| parsing（OCR 進行中） | 「⏳ 解析中...」 | 黃 | extract 尚未完成，欄位暫留空 |
| ocr-pdf 信心度 ≥ 0.9 | 「📄 已從 {檔名} 帶入」 | 綠 | 自動帶入成功，業務未動過 |
| ocr-pdf 信心度 < 0.9 / ocr-image | 「📄 已帶入，請確認」 | 黃（底深色問號）| 信心度不足，建議業務檢查 |
| llm-vision | 「🤖 AI 推論，請確認」 | 紫 | Layer 3 LLM Vision 補強 |
| manual-edit（業務改過自動帶入值） | 「✏️ 已修改」 | 橘 | 業務改過，**以業務值為準** |

#### Scenario: 高信心度欄位顯示綠色徽章

- **WHEN** 欄位 land_area 由 PDF 文字層抽出，confidence = 0.97
- **THEN** 欄位旁 SHALL 顯示綠色徽章「📄 已從 謄本.pdf 帶入」

#### Scenario: 低信心度欄位顯示黃色徽章

- **WHEN** 欄位 owner_name 由權狀照片 OCR 抽出，confidence = 0.78
- **THEN** 欄位旁 SHALL 顯示黃色徽章「📄 已帶入，請確認」
- **AND** 業務 click 確認後徽章 SHALL 變為「✓ 已確認」

#### Scenario: 業務修改自動帶入值後徽章更新

- **WHEN** 自動帶入 land_area = 32.5，業務改為 33.0
- **THEN** 徽章 SHALL 從綠色「📄 已從...帶入」改為橘色「✏️ 已修改」
- **AND** `extracted_data.by_attachment.<id>.fields.land_area` SHALL 保留原 OCR 值 32.5 於資料層（作為 raw cache，v1 UI 不提供回溯）

#### Scenario: OCR 解析進行中時欄位顯示黃色解析中徽章

- **WHEN** 業務上傳謄本後立即切到「基本資料」章節，extract 仍在背景執行
- **THEN** 欄位 address 輸入框 SHALL 暫留空白
- **AND** 欄位旁 SHALL 顯示黃色徽章「⏳ 解析中...」
- **AND** extract 完成且欄位帶入後，徽章 SHALL 更新為綠色「📄 已從...帶入」

##### Example: 上傳 1.5MB 謄本 PDF，extract 耗時 4.2 秒

- **GIVEN** listing id = 42，`extracted_data` 為 NULL
- **WHEN** 業務於 T+0 秒上傳 `陳世曉-謄本.pdf`（1.5MB）
- **AND** 業務於 T+1 秒點擊「基本資料」tab
- **AND** extract pipeline 於 T+4.2 秒完成，寫入 `extracted_data.merged_fields.address = { value: "臺南市下營區十六甲段2195-0000地號", confidence: 0.97 }`
- **THEN** T+1 到 T+4.2 秒期間 address 欄位 SHALL 為空字串且顯示黃色「⏳ 解析中...」
- **AND** T+4.2 秒後 address 欄位 SHALL 顯示「臺南市下營區十六甲段2195-0000地號」且徽章轉為綠色「📄 已從 陳世曉-謄本.pdf 帶入」

### Requirement: User edit wins on conflict

當同一欄位同時有 OCR 自動帶入值與業務手動修改值時，系統 SHALL 以業務修改值為儲存的最終值。此規則適用於 `field_visit_data` 寫入與 PDF 產出。v1 範圍**不提供 UI 回溯到 OCR 原值**（原 OCR 值仍存於 `extracted_data.by_attachment` 作為 raw cache）。

#### Scenario: OCR 先帶入，業務後改

- **WHEN** OCR 成功帶入 total_price = 585，業務手動改為 600
- **THEN** `field_visit_data.total_price` SHALL 儲存 600
- **AND** 徽章 SHALL 顯示橘色「✏️ 已修改」
- **AND** PDF 產出 SHALL 使用 600

#### Scenario: 業務清空自動帶入值

- **WHEN** OCR 帶入 land_area = 32.5，業務清空該欄位（留白）
- **THEN** `field_visit_data.land_area` SHALL 儲存空值
- **AND** 徽章 SHALL 顯示橘色「✏️ 已修改」（表示業務主動清除）
- **AND** 下次進入章節 SHALL NOT 再次自動帶入 32.5（以業務為準）

#### Scenario: 業務修改後不可自動還原

- **WHEN** 業務已將 address 改為「台南市東區大學路2號」（橘色「✏️ 已修改」）
- **AND** 稍後業務上傳新版謄本，新 OCR 結果 address = 「台南市東區大學路1號」
- **THEN** `field_visit_data.address` SHALL 維持「台南市東區大學路2號」
- **AND** 徽章 SHALL 維持橘色「✏️ 已修改」
- **AND** UI SHALL NOT 跳出還原提示（v1 不做，v2 再考慮）

### Requirement: Switch merged field source endpoint

系統 SHALL 提供 `POST /api/listings/{id}/field-visit/switch-source` endpoint，供前端「另有 N 份文件值為 X」下拉切換時使用。Request body：`{ fieldKey: string, attachmentId: string }`；server SHALL 更新 `merged_fields.<fieldKey>.from` 與 `.value` 為指定 attachment 提供的值，回應完整 `merged_fields`。

#### Scenario: 業務在 conflict 下拉切換到較舊來源

- **WHEN** listing 36 有兩份謄本 att_a (address = "A 地址") 與 att_b (address = "B 地址")
- **AND** `merged_fields.address.from = att_b`（信心度較高）
- **AND** 業務點「切換」，前端 POST `/api/listings/36/field-visit/switch-source` body `{ fieldKey: "address", attachmentId: "att_a" }`
- **THEN** server SHALL 更新 `merged_fields.address.from = att_a`、`.value = "A 地址"`
- **AND** 回應 HTTP 200 含新的 `merged_fields`
- **AND** UI SHALL 重新渲染欄位為「A 地址」且徽章顯示綠色「📄 已從 {att_a filename} 帶入」

#### Scenario: 切換到不存在的 attachment

- **WHEN** 客戶端 POST switch-source body `{ fieldKey: "address", attachmentId: "att_missing" }`
- **THEN** server SHALL 回 HTTP 404 `{ error: "attachment not providing this field", code: "SOURCE_NOT_AVAILABLE" }`

### Requirement: Field-visit PATCH promotes provenance to manual-edit

`POST /api/listings/{id}/field-visit` endpoint 接收業務手填值寫入 `field_visit_data` 時，若該欄位原本存在 `merged_fields.<key>`（provenance = ocr-pdf / ocr-image / llm-vision），且新寫入值與 `merged_fields.<key>.value` 不同，server SHALL 將該欄位的 provenance 標記為 `manual-edit`。前端依此標記將徽章渲染為橘色「✏️ 已修改」。

#### Scenario: 業務改 OCR 帶入的地址

- **GIVEN** `merged_fields.address = { value: "臺南市下營區十六甲段2195-0000地號", from: "att_abc", confidence: 0.97, provenance: "ocr-pdf" }` 且 `field_visit_data.address` 為空
- **WHEN** 客戶端 POST `/api/listings/36/field-visit` body `{ fields: { address: "臺南市東區大學路1號" } }`
- **THEN** server SHALL 將 `field_visit_data.address = "臺南市東區大學路1號"`
- **AND** `merged_fields.address.provenance` SHALL 變為 `manual-edit`
- **AND** `merged_fields.address.value` 保留原 OCR 值 `臺南市下營區十六甲段2195-0000地號`（不覆蓋 raw cache，見 User edit wins on conflict）
- **AND** 下次 GET listing 回傳時前端渲染橘色徽章

#### Scenario: 業務寫入值與 OCR 相同

- **GIVEN** `merged_fields.address.value = "臺南市下營區十六甲段2195-0000地號"`、provenance = `ocr-pdf`
- **WHEN** 客戶端 POST field-visit 帶同值
- **THEN** `field_visit_data.address` 寫入該值
- **AND** provenance 維持 `ocr-pdf`（未修改）、徽章仍為綠色

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
