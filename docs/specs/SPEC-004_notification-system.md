# SPEC-004: 非同步任務與通知系統

| 欄位 | 值 |
|------|-----|
| **版本** | v0.1 |
| **狀態** | Draft |
| **作用域** | 任務隊列、長期操作追蹤、失敗通知、狀態 polling |
| **相關文件** | SPEC-001 (auth), SPEC-002 (audit-trail) |

## 概述

目前文件生成是同步操作，若生成大文件會長期阻塞；使用者無法查詢任務狀態；失敗無通知。本 SPEC 定義非同步任務隊列、狀態 polling API、email/toast 失敗通知。

## 需求

### 需求 1: 非同步文件生成

系統 **應在** 業務人員點擊「生成文件」時即刻返回，而將實際生成放入後端隊列，並 **應返回** 任務 ID 供使用者查詢進度。

#### 場景 1.1: 提交文件生成任務

- **當**：業務人員在物件頁點擊「生成 5 份文件」
- **則**：系統驗證物件資料完整
- **且**：系統建立任務記錄，狀態 `pending`，產生唯一任務 ID（例 `task_26a1b2c3`）
- **且**：系統立即返回 202 Accepted `{ task_id: "task_26a1b2c3", status: "pending" }`
- **且**：使用者頁面顯示「正在生成文件... (0%)」加載動畫

#### 場景 1.2: 後端開始處理

- **當**：後端工作程序輪詢任務隊列，發現新任務
- **則**：系統更新任務狀態為 `processing`
- **且**：系統開始 LLM 呼叫、PDF 構建等重操作
- **且**：系統定期更新進度（每處理完 1 份文件就更新進度 20%）

#### 場景 1.3: 成功完成

- **當**：後端完成全部 5 份文件生成
- **則**：系統更新任務狀態為 `completed`
- **且**：系統記錄生成結果（5 個文件的 URI）
- **且**：系統發送 email 通知「您的 5 份文件已生成，可在此下載：[連結]」

### 需求 2: 任務狀態查詢 API

系統 **應提供** polling 端點，允許前端週期性查詢任務進度，返回實時狀態及進度百分比。

#### 場景 2.1: 查詢任務狀態

- **當**：前端每 2 秒發送 `GET /api/tasks/{task_id}`
- **則**：系統返回 200 `{ status: "processing", progress: 40, message: "正在生成地籍異動一覽表..." }`
- **且**：前端更新進度條至 40%，並顯示子訊息
- **且**：若 status 改為 `completed`，系統返回 `{ status: "completed", result: { files: [...] }, message: "已完成" }`

#### 場景 2.2: 查詢已完成任務

- **當**：使用者稍後查詢舊任務（已完成 1 小時）
- **則**：系統返回 200 `{ status: "completed", result: {...}, message: "已完成", completed_at: "2026-04-27T10:30:00Z" }`
- **且**：結果可保留 24 小時，超過則刪除

### 需求 3: 失敗通知

系統 **應在** 任務失敗時立刻通知使用者，含失敗原因，並 **應允許** 使用者重試。

#### 場景 3.1: 任務失敗 - LLM 超時

- **當**：LLM 呼叫超過 60 秒無回應
- **則**：系統捕捉 timeout 錯誤
- **且**：系統更新任務狀態為 `failed`，記錄錯誤信息
- **且**：系統發送 email：「生成失敗：LLM 服務逾時。請在 1 小時後重試，或聯繫支援。」
- **且**：前端頁面顯示紅色 toast「生成失敗」，提供「重試」按鈕

#### 場景 3.2: 任務失敗 - 資料不完整

- **當**：系統檢驗發現某必填欄位缺失
- **則**：系統返回 400，提示「缺少必填欄位：建築完成日」
- **且**：使用者回填該欄位後可重新提交新任務

#### 場景 3.3: 重試機制

- **當**：任務失敗，使用者點擊「重試」
- **則**：系統建立新任務，複製舊任務的輸入資料
- **且**：系統立即開始處理，無需使用者重新填表

### 需求 4: 通知渠道

系統 **應支援** email 及頁面內 toast 兩種通知方式。

#### 場景 4.1: Email 通知

- **當**：任務完成或失敗
- **則**：系統發送 email 至 `user.email`
- **且**：Email 模板含任務 ID、狀態、結果連結或失敗原因

#### 場景 4.2: 頁面內通知

- **當**：使用者正在監看任務進度頁面，任務完成
- **則**：系統同時更新 polling 回應及觸發頁面 toast
- **且**：Toast 顯示「✅ 文件已生成！點擊下載」

## DTO 定義

| DTO 名稱 | 用途 | 關鍵欄位 | 型別 | 備註 |
|---------|------|--------|------|------|
| `Task` | 任務物件 | `id`, `type`, `status`, `user_id`, `created_at`, `started_at`, `completed_at`, `progress`, `message`, `error` | uuid, enum, enum, uuid, timestamp, timestamp?, timestamp?, int (0-100), string, string? | status: pending/processing/completed/failed |
| `TaskSubmitRequest` | 提交任務請求 | `type`, `listing_id`, `params` | string, uuid, JSON | type: document_generation 等 |
| `TaskStatusResponse` | 狀態查詢回應 | `task_id`, `status`, `progress`, `message`, `result`, `error` | uuid, enum, int, string, JSON?, string? | 實時回傳進度 |
| `TaskResult` | 任務結果 | `files`, `metadata` | JSON[], JSON | 依任務類型而定 |
| `Notification` | 通知物件 | `id`, `user_id`, `type`, `task_id`, `message`, `delivered_at` | uuid, uuid, enum (email/toast), uuid, string, timestamp? | type: email/toast |

### 範例

```typescript
// POST /api/tasks (submit document generation)
Request: {
  "type": "document_generation",
  "listing_id": "550e8400-e29b-41d4-a716-446655440000"
}

Response: 202 Accepted {
  "task_id": "task_26a1b2c3d4e5f6g7",
  "status": "pending",
  "message": "任務已提交，準備處理中..."
}

// GET /api/tasks/task_26a1b2c3d4e5f6g7 (polling)
Response: 200 {
  "task_id": "task_26a1b2c3d4e5f6g7",
  "status": "processing",
  "progress": 40,
  "message": "正在生成地籍異動一覽表...",
  "result": null,
  "error": null
}

// GET /api/tasks/task_26a1b2c3d4e5f6g7 (completed)
Response: 200 {
  "task_id": "task_26a1b2c3d4e5f6g7",
  "status": "completed",
  "progress": 100,
  "message": "已完成",
  "result": {
    "files": [
      {
        "name": "不動產說明書.pdf",
        "uri": "/documents/task_26a1b2c3d4e5f6g7/disclosure.pdf",
        "size_bytes": 245000
      },
      { "name": "地籍異動一覽表.pdf", ... }
    ]
  },
  "error": null
}

// GET /api/tasks/task_26a1b2c3d4e5f6g7 (failed)
Response: 200 {
  "task_id": "task_26a1b2c3d4e5f6g7",
  "status": "failed",
  "progress": 60,
  "message": "失敗",
  "result": null,
  "error": "LLM API timeout after 60 seconds"
}
```

## 業務規則

1. **任務過期**：completed/failed 任務在 24 小時後自動刪除及其結果檔案
2. **並行限制**：同一使用者最多同時 3 個 processing 任務；超過排隊
3. **重試上限**：同一任務最多重試 3 次；超過需聯繫客服
4. **Polling 頻率**：前端建議 2 秒查詢一次，若 30 秒無更新自動停止
5. **Email 發送**：使用 SendGrid 或類似服務，帶有 unsubscribe 選項

## Changelog

| 版本 | 日期 | 變更 |
|------|------|------|
| v0.1 | 2026-04-27 | 初版草稿 |

---

> retrofit 產生於 2026-04-27，來源：openspec/changes/ archived changes 反向萃取
