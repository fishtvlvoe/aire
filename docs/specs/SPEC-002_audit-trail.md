# SPEC-002: 操作日誌與審計追蹤

| 欄位 | 值 |
|------|-----|
| **版本** | v0.1 |
| **狀態** | Draft |
| **作用域** | CRUD 操作日誌、硬刪除防護、操作查詢介面 |
| **相關文件** | SPEC-001 (auth), SPEC-003 (api-security) |

## 概述

目前系統無操作日誌，硬刪除不可恢復，無法追蹤誰在何時修改了什麼。本 SPEC 定義完整的審計追蹤機制，確保每個 CRUD 操作都可追溯。

## 需求

### 需求 1: 操作日誌記錄

系統 **應自動記錄** 所有 INSERT、UPDATE、DELETE 操作，含操作者、時間戳、舊值、新值、變更欄位。

#### 場景 1.1: CREATE 操作被記錄

- **當**：業務人員建立新物件，提交表單
- **則**：系統執行 `INSERT INTO listings (...)`
- **且**：系統同時寫入 `audit_logs` 一筆記錄：
  - `action`: "CREATE"
  - `entity_type`: "listing"
  - `entity_id`: <新建物件 ID>
  - `user_id`: <操作者 ID>
  - `timestamp`: <操作時間>
  - `old_values`: null
  - `new_values`: { ...完整新物件資料 }
  - `changed_fields`: ["title", "address", "area", ...]

#### 場景 1.2: UPDATE 操作被記錄

- **當**：業務人員修改物件地址欄位，儲存
- **則**：系統執行 `UPDATE listings SET address = '...'`
- **且**：系統寫入 `audit_logs`：
  - `action`: "UPDATE"
  - `entity_type`: "listing"
  - `entity_id`: <該物件 ID>
  - `old_values`: { "address": "舊地址" }
  - `new_values`: { "address": "新地址" }
  - `changed_fields`: ["address"]

#### 場景 1.3: DELETE 操作被記錄（軟刪除）

- **當**：業務人員點擊「刪除」，系統執行軟刪除
- **則**：系統執行 `UPDATE listings SET deleted_at = NOW()`
- **且**：系統寫入 `audit_logs`：
  - `action`: "DELETE"
  - `entity_id`: <該物件 ID>
  - `old_values`: { ...刪除前完整資料 }
  - `new_values`: null
  - `timestamp`: <刪除時間>
  - `user_id`: <誰刪除的>

### 需求 2: 硬刪除防護

系統 **應防止** 硬刪除（`DELETE FROM listings`），所有刪除必須透過軟刪除（設 `deleted_at` 時間戳）。

#### 場景 2.1: 硬刪除嘗試被拒絕

- **當**：代碼或直接 SQL 試圖執行 `DELETE FROM listings WHERE id = '...'`
- **則**：系統攔截，返回錯誤或拋 exception：`"Hard delete not allowed. Use soft delete (deleted_at) instead."`

#### 場景 2.2: 恢復已刪除物件

- **當**：admin 進行恢復，點擊「還原」
- **則**：系統執行 `UPDATE listings SET deleted_at = NULL WHERE id = '...'`
- **且**：系統寫入 `audit_logs`：`action: "RESTORE"`

### 需求 3: 審計查詢 API

系統 **應提供** 查詢端點，允許 admin 按日期、操作者、實體類型篩選審計記錄。

#### 場景 3.1: 查詢特定物件的完整修改歷史

- **當**：admin 訪問 `GET /api/listings/{id}/audit-trail`
- **則**：系統返回該物件的所有 CREATE/UPDATE/DELETE/RESTORE 記錄，按時間倒序
- **且**：每筆記錄含完整 old_values 及 new_values，便於對比

#### 場景 3.2: 查詢按操作者篩選

- **當**：admin 訪問 `GET /api/audit-logs?user_id=john&action=DELETE&from=2026-04-01&to=2026-04-30`
- **則**：系統返回該操作者在該期間執行的所有刪除操作

## DTO 定義

| DTO 名稱 | 用途 | 關鍵欄位 | 型別 | 備註 |
|---------|------|--------|------|------|
| `AuditLog` | 審計日誌項 | `id`, `action`, `entity_type`, `entity_id`, `user_id`, `timestamp`, `old_values`, `new_values`, `changed_fields` | uuid, enum, string, uuid, uuid, timestamp, JSON, JSON, string[] | action: CREATE/UPDATE/DELETE/RESTORE |
| `AuditQueryParams` | 查詢條件 | `user_id`, `entity_type`, `action`, `from_date`, `to_date`, `limit`, `offset` | uuid?, string?, string?, timestamp?, timestamp?, int, int | 支援分頁 |
| `AuditQueryResponse` | 查詢結果 | `total`, `logs` | int, AuditLog[] | 含總筆數 |

### 範例

```typescript
// AuditLog (UPDATE action)
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "action": "UPDATE",
  "entity_type": "listing",
  "entity_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "770e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-04-26T14:30:00Z",
  "old_values": {
    "address": "台北市信義區松壽路 1 號",
    "area": "150"
  },
  "new_values": {
    "address": "台北市信義區松壽路 2 號",
    "area": "155"
  },
  "changed_fields": ["address", "area"]
}
```

## 業務規則

1. **日誌保留期限**：至少 7 年（稅務法規）；過期可存檔
2. **更新頻率**：每次 CRUD 都即時寫入（同步）
3. **日誌查詢權限**：僅 admin 可查詢完整日誌；其他角色可查詢自己的操作歷史
4. **大量操作**：若單次請求修改 > 100 筆記錄，應分批寫入日誌，避免表鎖定
5. **敏感欄位遮蔽**：密碼、API key 等敏感欄位不記錄值，僅記錄「已更新」

## Changelog

| 版本 | 日期 | 變更 |
|------|------|------|
| v0.1 | 2026-04-27 | 初版草稿 |

---

> retrofit 產生於 2026-04-27，來源：openspec/changes/ archived changes 反向萃取
