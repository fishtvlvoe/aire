## 1. LLM 適配器安全強化 (LLM Adapter Hardening)

- [x] 1.1 [P] 在 src/lib/codex-client/adapters/codex.ts 與 claude-code.ts 中，將 exec 替換為 spawn。實作「使用 spawn 與 Stdin Pipe 取代 exec」的設計決策。驗證：執行單元測試，傳入含分號與反勾號的 prompt，驗證其被正確視為字串。
- [x] 1.2 [P] 新增 Shell Injection 迴歸測試案例，模擬惡意 prompt 攻擊。驗證：測試應通過，且無非預期的 shell 命令執行。實作「Safe LLM process invocation」需求。

## 2. 資料庫稽核自動化 (Automated DB Audit)

- [x] 2.1 [P] 實作「在 DB Helper 層內建 Audit Log」：修改 src/lib/db/index.ts 中的 createListing 與 updateListing，在函式內部呼叫 writeAuditLog。實作「All state-changing operations are logged」需求。驗證：手動新增/修改物件後，檢查 audit_logs 表是否有對應紀錄。
- [x] 2.2 [P] 實作「廢棄物理刪除，API 統一導向軟刪除」：修改 src/app/api/listings/[id]/route.ts 的 DELETE handler，呼叫 archiveListing 取代 deleteListing。驗證：發送 DELETE 請求後，驗證物件 archived_at 已更新且 row 未被刪除。達成 Archive listing 規格修正。

## 3. API 請求驗證 (API Request Validation)

- [x] 3.1 [P] 建立 src/lib/schemas/listing.ts，定義 listingCreateSchema 與 listingUpdateSchema。實作 listing-validation 能力。驗證：撰寫 schema 單元測試，涵蓋邊界條件與無效型別。
- [x] 3.2 [P] 在 src/app/api/listings/route.ts 與 src/app/api/listings/[id]/field-visit/route.ts 中引入 Zod 驗證。實作 API request body validation 需求。驗證：發送不完整的 POST 請求，預期收到 400 錯誤。

## 4. 安全性驗證與掃描 (Final Validation)

- [x] 4.1 執行完整的 npm run test。驗證：所有安全修復未破壞現有功能。
- [x] 4.2 執行 npm run lint 與建置檢查。驗證：程式碼品質符合規範。
