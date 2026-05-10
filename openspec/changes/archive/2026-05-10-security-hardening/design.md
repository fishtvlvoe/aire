## Context

Code Review 揭露了多項安全隱患：LLM 適配器直接拼接 Shell 命令存在注入風險、資料庫操作缺乏自動稽核軌跡，以及 API 接口對 Body 內容缺乏型別驗證。本設計旨在透過防禦性編程與統一驗證框架，系統性地強化應用程式安全性。

## Goals / Non-Goals

**Goals:**
- 消除 LLM CLI 呼叫的 Shell Injection 漏洞。
- 實現資料庫異動的「自動化稽核」。
- 廢棄不安全的硬刪除操作。
- 引入 Zod 進行 API 請求驗證。

**Non-Goals:**
- 不涉及身分驗證（Auth）邏輯的重構。
- 不重寫既有的資料庫查詢邏輯，僅針對寫入（Mutation）邏輯增加稽核。

## Decisions

### 使用 spawn 與 Stdin Pipe 取代 exec
- **理由**：exec 會啟動 shell 並解析命令字串，容易受注入攻擊。spawn 直接呼叫執行檔，參數作為陣列傳遞，不經過 shell 解析。Prompt 透過 stdin 傳入可確保其被視為純資料。
- **Alternatives Considered**:
    - **更強大的字串過濾（Sanitization）**：理由是被否決，黑名單過濾難以窮舉所有 shell 特殊字元，風險過高。
    - **使用暫存檔傳遞 Prompt**：理由是被否決，stdin 更簡潔且減少磁碟 I/O，安全性一致。

### 在 DB Helper 層內建 Audit Log
- **理由**：在底層 src/lib/db/index.ts 實作稽核可確保無論 API 層如何變動，資料異動一定會被記錄。
- **Alternatives Considered**:
    - **在 API Route 層記錄**：理由是被否決，多個路由可能呼叫同一個 helper，容易遺漏記錄。
    - **使用資料庫 Trigger**：理由是被否決，SQLite trigger 維護成本較高，且難以獲取應用程式層的使用者 ID。

### 廢棄物理刪除，API 統一導向軟刪除
- **理由**：遵照「不可硬刪除」原則。將 DELETE /api/listings/[id] 的後端實作改為呼叫 archiveListing。
- **Alternatives Considered**:
    - **保留硬刪除但限制 Admin 權限**：理由是被否決，目前業務流程中無硬刪除需求，保留物理刪除會增加誤刪風險。

## Implementation Contract

- **Behavior**: 使用者輸入惡意 shell 字串（如 ; rm -rf /）作為 Prompt 時，系統應能正常處理而不執行惡意命令。刪除物件後，資料庫中的 row 應依然存在，僅 archived_at 被賦值。
- **Interface**:
    - src/lib/codex-client/adapters/codex.ts: execute 函式內部改用 spawn。
    - src/lib/db/index.ts: createListing, updateListing 函式簽名增加 userId 參數。
    - src/app/api/listings/route.ts: POST handler 使用 listingSchema.parse()。
- **Acceptance Criteria**:
    - 撰寫測試案例，傳入含 shell meta-characters 的 prompt 並驗證系統不崩潰、不執行非法指令。
    - 驗證 audit_logs 表在每次物件新增、修改、封存後都有對應紀錄。
    - 發送 DELETE /api/listings/[id] 後，查詢資料庫驗證 row 依然存在且 archived_at 不為空。

## Risks / Trade-offs

- **[Risk]** 內部 helper 增加 userId 參數可能導致舊有呼叫端編譯錯誤 → **Mitigation**: 將 userId 設為可選（Optional），若未傳入則記錄為 "system"。
- **[Risk]** Zod 驗證過於嚴格導致現有前端壞掉 → **Mitigation**: 先從 listings.db 的 schema 萃取最寬鬆的規則，再逐步收緊。
