# SPEC-003: API 安全性與訪問控制

| 欄位 | 值 |
|------|-----|
| **版本** | v0.1 |
| **狀態** | Draft |
| **作用域** | API 認證、速率限制、輸入驗證、Cloud API 保護 |
| **相關文件** | SPEC-001 (auth), SPEC-002 (audit-trail), ADR-001 (data-split) |

## 概述

目前外部 Cloud API（real-price、earthquake、transcript）無認證且無速率限制，容易遭濫用；內部 API 亦缺乏輸入驗證。本 SPEC 定義完整的 API 安全層，含認證、速率限制、schema 驗證。

## 需求

### 需求 1: API 金鑰管理與認證

系統 **應提供** API 金鑰管理機制，允許 admin 為第三方應用或內部服務發放 token，並 **應驗證** 所有 API 要求均附帶有效 token。

#### 場景 1.1: 發放 API 金鑰

- **當**：admin 在設定頁點擊「新增 API 金鑰」
- **則**：系統產生唯一的 32 位英數 token（例 `sk_live_abc123...`）
- **且**：系統顯示一次性完整 token，之後遮蔽
- **且**：admin 可設定 token 權限範圍（只讀 / 讀寫）、過期日期、使用速率上限

#### 場景 1.2: 驗證 API 要求

- **當**：第三方工具發送 `POST /api/v1/listings` 並在 header 附帶 `Authorization: Bearer sk_live_abc123...`
- **則**：系統查詢 token 表，驗證 token 有效性
- **且**：若 token 無效或過期，系統返回 401 `{ error: "Invalid or expired API key" }`
- **且**：若 token 有效但權限不符（只讀 token 試圖 POST），系統返回 403 `{ error: "Insufficient permissions" }`

#### 場景 1.3: 撤銷 API 金鑰

- **當**：admin 點擊「撤銷」
- **則**：系統將 token 標記為 revoked
- **且**：後續該 token 的所有請求返回 401

### 需求 2: 速率限制

系統 **應限制** 每個 API 金鑰或使用者的要求頻率，防止濫用；Cloud API 呼叫額外受限。

#### 場景 2.1: 超過通用速率限制

- **當**：某 token 在 60 秒內發送 > 100 個要求（預設上限）
- **則**：系統返回 429 Too Many Requests
- **且**：Response header 含 `Retry-After: 30`（建議 30 秒後重試）
- **且**：系統記錄此次超限事件

#### 場景 2.2: Cloud API 特殊速率限制

- **當**：業務人員試圖在 1 分鐘內查詢同一地址的 real-price API > 5 次
- **則**：系統返回 429，顯示「該地址查詢過於頻繁，請 1 分鐘後重試」
- **且**：系統內部快取該地址 1 分鐘，避免重複呼叫

### 需求 3: 輸入驗證與 Schema 檢查

系統 **應驗證** 所有 request body 須符合定義的 schema，超出範圍返回 400。

#### 場景 3.1: 缺少必填欄位

- **當**：客戶端提交 `POST /api/listings` 但缺少 `title` 欄位
- **則**：系統驗證 request body
- **且**：系統返回 400 `{ error: "Validation failed", details: { title: "This field is required" } }`

#### 場景 3.2: 欄位型別錯誤

- **當**：提交 `{ "area": "abc" }`（應為數字）
- **則**：系統返回 400 `{ error: "Invalid input", details: { area: "Must be a number" } }`

#### 場景 3.3: 超長字串被拒絕

- **當**：提交 title 超過 500 字元
- **則**：系統返回 400，提示「title 最多 500 字元」

### 需求 4: Cloud API 保護

系統 **應驗證** 外部 PDF/資料來源，**應限制** 直接將不信任的內容送給 LLM。

#### 場景 4.1: PDF 驗證

- **當**：使用者上傳 PDF 檔案進行 OCR
- **則**：系統檢驗檔案簽名（Magic Number），確認為有效 PDF
- **且**：系統限制檔案大小不超過 50MB
- **且**：系統掃描 PDF 是否含有惡意 JavaScript，若有拒絕處理

#### 場景 4.2: LLM 輸入淨化

- **當**：OCR 結果將被送給 LLM 推論
- **則**：系統移除可能的提示注入字串（如 `ignore all previous instructions`）
- **且**：系統限制 context 長度不超過 LLM token 上限

## DTO 定義

| DTO 名稱 | 用途 | 關鍵欄位 | 型別 | 備註 |
|---------|------|--------|------|------|
| `ApiKey` | API 金鑰物件 | `id`, `token`, `name`, `permissions`, `rate_limit`, `created_at`, `expires_at`, `revoked_at` | uuid, string, string, string[], int, timestamp, timestamp?, timestamp? | token 建立時顯示一次，之後遮蔽 |
| `RateLimitInfo` | 速率限制資訊 | `limit`, `remaining`, `reset_at` | int, int, timestamp | 回傳在 response header |
| `ValidationError` | 驗證錯誤 | `error`, `details` | string, Map<string, string> | 400 response 格式 |
| `SecurityContext` | 安全上下文 | `api_key`, `user_id`, `permissions`, `ip_address` | string, uuid, string[], string | 每個請求帶有 |

### 範例

```typescript
// POST /api/v1/api-keys (admin only)
Request: {
  "name": "Third-party integration",
  "permissions": ["listing:read", "listing:create"],
  "rate_limit": 1000,  // per minute
  "expires_at": "2026-12-31T23:59:59Z"
}

Response: {
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "token": "sk_live_abcdef123456789",  // shown once
  "name": "Third-party integration",
  "created_at": "2026-04-27T10:00:00Z"
}

// GET /api/v1/listings with valid API key
Request Headers: {
  "Authorization": "Bearer sk_live_abcdef123456789"
}

Response Headers: {
  "X-RateLimit-Limit": "1000",
  "X-RateLimit-Remaining": "997",
  "X-RateLimit-Reset": "2026-04-27T10:01:00Z"
}

// POST /api/v1/listings with invalid body
Request: {
  "address": "台北市信義區松壽路 1 號"
  // missing: title, area
}

Response: 400 {
  "error": "Validation failed",
  "details": {
    "title": "This field is required",
    "area": "This field is required"
  }
}
```

## 業務規則

1. **API 金鑰有效期**：預設 1 年；可設定更短期限
2. **速率限制預設**：通用 100 req/min；可按 token 調整
3. **Cloud API 限制**：real-price 5 req/min、earthquake 10 req/min、transcript 20 req/min
4. **密碼重設**：若 admin 帳號遭破壞，所有 API 金鑰須強制重簽
5. **稽核**：所有 API 呼叫（成功 / 失敗 / 超限）都應記錄，含時間、token、IP

## Changelog

| 版本 | 日期 | 變更 |
|------|------|------|
| v0.1 | 2026-04-27 | 初版草稿 |

---

> retrofit 產生於 2026-04-27，來源：openspec/changes/ archived changes 反向萃取
