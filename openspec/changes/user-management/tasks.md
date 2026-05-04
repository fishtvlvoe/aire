## 1. Database Schema & Migration

- [ ] 1.1 [Tool: copilot-codex] 實現 D1：使用者資料表。在 `src/lib/db/schema.ts` 新增 `CREATE TABLE IF NOT EXISTS users`，含 id, email, password_hash, display_name, role, is_active, created_at, updated_at。初始化時插入一筆 admin 帳號。對應 Requirements: Admin creates agent accounts
- [ ] 1.2 [Tool: copilot-codex] 實現 D5：認證機制（sessions 表）。`CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id), expires_at TEXT NOT NULL)`。對應 Requirements: All listing API endpoints require authentication
- [ ] 1.3 [Tool: copilot-codex] 實現 D4：Audit Log（audit_logs 表）。`CREATE TABLE IF NOT EXISTS audit_logs`，含 id, user_id, action, target_type, target_id, detail, created_at。對應 Requirements: All state-changing operations are logged
- [ ] 1.4 [Tool: copilot-codex] 實現 D2：物件擁有者綁定（owner_id 欄位）。`ALTER TABLE listings ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id)`。對應 Requirements: Listing creation assigns owner, Listing bound to creator

## 2. Authentication（D5）

- [ ] 2.1 [Tool: copilot-codex] 實作 POST /api/auth/login。驗證 email + password（bcrypt compare），建立 session 記錄，回傳 httpOnly cookie。對應 Requirements: All listing API endpoints require authentication
- [ ] 2.2 [Tool: copilot-codex] 實作 DELETE /api/auth/logout。刪除 session 記錄，清除 cookie。對應 Requirements: All listing API endpoints require authentication
- [ ] 2.3 [Tool: copilot-codex] 實作 Next.js middleware。檢查 session cookie → 無效 redirect /login。排除 /api/auth/login 和靜態資源。對應 Requirements: All listing API endpoints require authentication
- [ ] 2.4 [Tool: copilot-codex] 建立 /login 頁面。email + password 表單，送 POST /api/auth/login，成功後 redirect /listings。對應 Requirements: All listing API endpoints require authentication

## 3. User Account Management（D1）

- [ ] 3.1 [Tool: copilot-codex] 實作 POST /api/admin/users。Admin 建立新 agent 帳號（email, display_name, password → bcrypt hash）。對應 Requirements: Admin creates agent accounts
- [ ] 3.2 [Tool: copilot-codex] 實作 PUT /api/admin/users/[id]/disable。設 is_active=0，刪除該 user 所有 session。對應 Requirements: Admin disables agent accounts
- [ ] 3.3 [Tool: copilot-codex] 實作 PUT /api/admin/users/[id]/reset-password。更新 password_hash，刪除所有 session。對應 Requirements: Admin resets agent password
- [ ] 3.4 [Tool: copilot-codex] 建立 /admin/users 頁面。列出所有 user，可建立、停用、重設密碼。Admin only（middleware role check）。對應 Requirements: Admin creates agent accounts, Admin disables agent accounts, Admin resets agent password

## 4. Listing Ownership（D2）

- [ ] 4.1 [Tool: copilot-codex] 修改 POST /api/listings。建立時自動帶入 owner_id = current session user_id。對應 Requirements: Listing creation assigns owner
- [ ] 4.2 [Tool: copilot-codex] 修改 GET /api/listings。agent 角色加 WHERE owner_id = ? 過濾；admin 不過濾。對應 Requirements: Listing list filters by role, Agent sees only own listings, Admin sees all listings
- [ ] 4.3 [Tool: copilot-codex] 修改 GET/PUT /api/listings/[id]。agent 只能操作自己的（owner_id check）；admin 可操作全部。對應 Requirements: Admin can edit any listing

## 5. Case Transfer（D3）

- [ ] 5.1 [Tool: copilot-codex] 實現 D3：案件轉移。實作 POST /api/admin/transfer-cases。接收 from_user_id, to_user_id，批次更新 listings.owner_id，寫 audit log。Admin only。對應 Requirements: Batch transfer cases on agent departure, Transfer includes all related documents
- [ ] 5.2 [Tool: copilot-codex] 建立 /admin/transfer 頁面。選擇來源 agent + 目標 agent，顯示影響筆數，確認後執行。對應 Requirements: Batch transfer cases on agent departure

## 6. Audit Log（D4）

- [ ] 6.1 [Tool: copilot-codex] 建立 audit log 寫入工具函式 `writeAuditLog(userId, action, targetType, targetId, detail)`。在所有 listing CRUD、document generation、帳號管理操作中呼叫。對應 Requirements: All state-changing operations are logged
- [ ] 6.2 [Tool: copilot-codex] 建立 /admin/audit-logs 頁面。分頁顯示、可按 user/action/日期篩選。Admin only。對應 Requirements: Admin can view audit logs
- [ ] 6.3 [Tool: copilot-codex] 確保 audit_logs 無 DELETE/PUT endpoint（405 回應）。對應 Requirements: Audit log is append-only

## 7. AI Disclaimer（D6）

- [ ] 7.1 [Tool: copilot-codex] 實現 D6：AI 輔助提示。修改所有 generator 函式（disclosure-generator, property-sheet 等），在 markdown 輸出末尾加入 AI 輔助提示文字。hardcode 不可移除。對應 Requirements: AI disclaimer on all generated documents, Disclaimer cannot be removed by users
- [ ] 7.2 [Tool: copilot-codex] 修改 PDF 生成模板，在頁尾加入灰色小字 disclaimer（hardcode）。對應 Requirements: AI disclaimer on all generated documents, Disclaimer cannot be removed by users

## 8. E2E Testing

- [ ] 8.1 [Tool: sonnet] 撰寫 E2E 測試：admin 登入 → 建立 agent 帳號 → agent 登入 → 建立物件 → 確認列表過濾 → admin 轉移案件 → 確認 audit log。對應 Requirements: 全部
