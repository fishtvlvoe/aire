# SPEC-005: 資料可移植性與批次操作

| 欄位 | 值 |
|------|-----|
| **版本** | v0.1 |
| **狀態** | Draft |
| **作用域** | CSV 匯出、批次匯入、資料遷移、驗證規則 |
| **相關文件** | SPEC-001 (auth), SPEC-002 (audit-trail), SPEC-003 (api-security) |

## 概述

目前無法匯出列表為 CSV；無法批次匯入；無遷移機制。本 SPEC 定義完整的資料可移植性功能，允許業務人員一鍵匯出全部物件、從 CSV 批次建立、驗證資料完整性。

## 需求

### 需求 1: CSV 匯出

系統 **應提供** 匯出端點，允許業務人員按篩選條件匯出列表為 CSV，包含所有欄位及完整歷史。

#### 場景 1.1: 匯出全部物件

- **當**：業務人員在列表頁點擊「匯出為 CSV」
- **則**：系統生成 CSV 檔案，含所有物件及其完整欄位
- **且**：CSV 編碼為 UTF-8（支援中文）
- **且**：系統提供下載，檔案名格式 `listings_export_2026-04-27_10-30.csv`
- **且**：系統同時記錄匯出操作到審計日誌

#### 場景 1.2: 按條件篩選匯出

- **當**：業務人員設定篩選器（例 「狀態=已完成」、「建築年份 > 2010」）後點擊匯出
- **則**：系統只匯出符合條件的物件
- **且**：CSV 檔名含篩選條件摘要（例 `listings_status-completed_2026-04-27.csv`）

#### 場景 1.3: CSV 欄位內容

- **當**：匯出完成，開啟 CSV 檔案
- **則**：表頭列出所有欄位（id, title, address, area, property_type, status, created_at, ...）
- **且**：每列物件，NULL 欄位顯示空值而非 "null" 字串
- **且**：日期格式統一為 ISO 8601（YYYY-MM-DDTHH:MM:SSZ）

### 需求 2: CSV 批次匯入

系統 **應接受** CSV 檔案上傳，解析並驗證，然後建立對應物件或更新既有物件。

#### 場景 2.1: 上傳並驗證 CSV

- **當**：業務人員點擊「批次匯入」，選擇 CSV 檔案
- **則**：系統解析 CSV 檔案
- **且**：系統驗證欄位名稱（必須與系統欄位對應）
- **且**：系統驗證資料型別（例 area 必須是數字）
- **且**：系統生成驗證報告，列出發現的問題（例 「第 5 列：缺少 title」、「第 12 列：property_type 無效」）
- **且**：系統顯示預覽，確認前 5 列的解析結果

#### 場景 2.2: 條件匯入 - 新建物件

- **當**：CSV 中的 id 欄位為空（表示新物件），使用者確認匯入
- **則**：系統為每列建立新物件，分配新 ID
- **且**：系統逐列驗證必填欄位（title, address, area, property_type）
- **且**：驗證失敗的列記錄在匯入報告中，但不阻止其他列匯入
- **且**：完成後顯示「成功建立 47 個物件，失敗 2 個（見附加報告）」

#### 場景 2.3: 條件匯入 - 更新既有物件

- **當**：CSV 中某列含有既有物件的 id（例 `id=550e8400...`）
- **則**：系統更新該物件的相應欄位
- **且**：系統寫入審計日誌，記錄更新前後的值
- **且**：若某欄位為空，系統保留原值（空值不覆蓋）

#### 場景 2.4: 匯入失敗處理

- **當**：匯入中止（例 資料庫連線異常）
- **則**：系統回滾已匯入的部分（transaction 未完成）
- **且**：系統返回錯誤信息，允許使用者修正後重新嘗試

### 需求 3: 資料遷移報告

系統 **應提供** 遷移驗證工具，確保匯出入的資料完整性及一致性。

#### 場景 3.1: 遷移完整性檢查

- **當**：admin 在「系統工具」頁點擊「驗證資料遷移」
- **則**：系統比對匯出的 CSV 記錄數與目前資料庫記錄數
- **且**：系統檢驗 checksum（例 所有 area 欄位的總和）
- **且**：系統輸出報告：「匯出時 150 筆物件，目前資料庫 150 筆。Checksum 一致。✓ 遷移完整」

#### 場景 3.2: 欄位對應驗證

- **當**：使用者上傳 CSV 時系統發現欄位名稱變化（例 舊版 `name` 改新版 `title`）
- **則**：系統提供欄位映射指引，協助使用者對應
- **且**：系統允許使用者自訂映射規則（例 「舊 name → 新 title」）

## DTO 定義

| DTO 名稱 | 用途 | 關鍵欄位 | 型別 | 備註 |
|---------|------|--------|------|------|
| `ExportRequest` | 匯出要求 | `filters`, `format`, `include_history` | FilterParams, string, boolean | format: csv/json |
| `ExportResponse` | 匯出回應 | `file_url`, `record_count`, `checksum` | string, int, string | checksum 用於驗證 |
| `ImportRequest` | 匯入要求 | `file_content`, `mode`, `field_mapping` | string (CSV), string, Map | mode: create/update/upsert |
| `ImportValidationResult` | 驗證結果 | `total_rows`, `valid_rows`, `errors`, `preview` | int, int, ImportError[], ImportRow[] | errors 按列號分組 |
| `ImportError` | 匯入錯誤 | `row_number`, `field`, `error_message`, `value` | int, string, string, any | 詳細錯誤資訊 |
| `MigrationReport` | 遷移報告 | `export_count`, `current_count`, `checksum_match`, `missing_fields`, `status` | int, int, boolean, string[], enum | status: ok/warning/error |

### 範例

```typescript
// GET /api/listings/export?filters={"status":"completed"}&format=csv
Response: 200 with CSV file
file: listings_export_2026-04-27.csv
content:
id,title,address,area,property_type,status,created_at
550e8400-e29b-41d4-a716-446655440000,台北101大樓,台北市信義區松壽路1號,150,building,completed,2026-04-20T10:00:00Z
...

// POST /api/listings/import
Request: {
  "file_content": "id,title,address,...",
  "mode": "upsert",
  "field_mapping": {
    "name": "title"  // 舊欄位 → 新欄位
  }
}

Response: 202 {
  "import_id": "imp_1234567890",
  "validation": {
    "total_rows": 50,
    "valid_rows": 48,
    "errors": [
      {
        "row_number": 5,
        "field": "property_type",
        "error_message": "Invalid value: 'villa' is not supported",
        "value": "villa"
      }
    ],
    "preview": [
      { "id": "", "title": "新物件1", "address": "台北市...", "status": "✓" },
      { "id": "550e...", "title": "修改物件1", "address": "台北市...", "status": "✓" }
    ]
  }
}

// GET /api/migrate/verify
Response: 200 {
  "export_count": 150,
  "current_count": 150,
  "checksum_match": true,
  "missing_fields": [],
  "status": "ok"
}
```

## 業務規則

1. **匯出時效**：大於 1000 筆物件時，系統非同步生成 CSV，並發送下載連結 email
2. **匯入大小限制**：單次匯入不超過 10MB；超過需分批
3. **欄位驗證**：必填欄位缺失的列無法匯入；選填欄位可空
4. **資料型別**：
   - 文字長度最多 500 字元
   - 數字不超過 999,999.99
   - 日期格式 ISO 8601
5. **匯入交易**：所有列同時成功或全部回滾（原子性）
6. **遷移稽核**：每次匯出入都寫入審計日誌，含檔案 hash 值便於追蹤

## Changelog

| 版本 | 日期 | 變更 |
|------|------|------|
| v0.1 | 2026-04-27 | 初版草稿 |

---

> retrofit 產生於 2026-04-27，來源：openspec/changes/ archived changes 反向萃取
