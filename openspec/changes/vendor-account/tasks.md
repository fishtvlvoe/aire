# Tasks: vendor-account

## Wave 1: Schema 與基礎設施

- [ ] [P] 1.1 建立 migration 檔 `migrations/005_vendor_account.sql`，內容為 `ALTER TABLE users ADD COLUMN is_vendor INTEGER NOT NULL DEFAULT 0;`。在 `src/lib/db/schema.ts` 的 `initDb()` 中加入執行此 migration 的邏輯（參考既有 migration 執行模式）。[Tool: Copilot] [Spec: user-account-management/is-vendor-column] [Design: D1]
- [ ] [P] 1.2 建立 `src/lib/auth/vendor.ts`，匯出 `provisionVendorAccount(credentials: { username: string; passwordHash: string; displayName: string }): void`。邏輯：查詢 `SELECT id FROM users WHERE username = ? AND is_vendor = 1`；若存在則 `UPDATE users SET password_hash = ?, display_name = ? WHERE id = ?`；若不存在則 `INSERT INTO users (username, email, password_hash, display_name, role, is_vendor) VALUES (?, ?, ?, ?, 'admin', 1)`，email 格式為 `{username}@vendor.three-ai.app`。使用 `db` from `@/lib/db`，同步 API（better-sqlite3）。[Tool: Copilot] [Spec: vendor-account-provisioning/auto-provision-vendor-account, vendor-account-provisioning/update-existing-vendor-account] [Design: D3]

## Wave 2: License Init API 整合

- [ ] 2.1 修改 `src/app/api/license/init/route.ts`：在 License Server 回應成功後，檢查回應 body 是否包含 `vendorCredentials` 欄位（型別 `{ username: string; passwordHash: string; displayName: string }`）。若存在，import 並呼叫 `provisionVendorAccount(vendorCredentials)`。若不存在則跳過，不影響現有流程。[Tool: Copilot] [Spec: first-admin-setup/license-init-handles-vendor-credentials] [Design: D2]

## Wave 3: 用戶管理頁面過濾

- [ ] 3.1 修改用戶列表相關的 API 或頁面查詢（`src/app/admin/users/page.tsx` 或對應的 API route），在 SQL 查詢中加上 `WHERE is_vendor = 0`（或 `AND is_vendor = 0`），確保 vendor 帳號不出現在客戶的用戶管理介面。同時確認用戶數量統計（若有）也排除 vendor。[Tool: Copilot] [Spec: vendor-account-hiding/hide-vendor-from-user-list] [Design: D4]

## Wave 4: 測試

- [ ] [P] 4.1 在 `src/lib/auth/__tests__/` 下新增 `vendor.test.ts`，測試以下場景：(a) 首次呼叫 provisionVendorAccount 建立 vendor 帳號，驗證 is_vendor = 1、role = admin、email 格式正確；(b) 第二次呼叫同 username 更新 password_hash，不產生重複紀錄；(c) 不呼叫時不建立任何 vendor 帳號。[Tool: Copilot] [Spec: vendor-account-provisioning/auto-provision-vendor-account, vendor-account-provisioning/update-existing-vendor-account, vendor-account-provisioning/no-vendor-without-credentials]
- [ ] [P] 4.2 在用戶管理 API 或頁面的既有測試中，新增案例：users 表包含 vendor 帳號時，API 回應不包含 vendor 帳號。[Tool: Copilot] [Spec: vendor-account-hiding/hide-vendor-from-user-list]
- [ ] [P] 4.3 驗證 middleware.ts 的 `hasUsers()` 在只有 vendor 帳號時回傳 true（不重導到 first-admin-setup）。[Tool: Copilot] [Spec: vendor-account-hiding/vendor-count-excluded-from-setup-check]
- [ ] [P] 4.4 驗證 vendor 帳號可透過標準登入流程（NextAuth CredentialsProvider）正常登入，取得 admin 權限的 JWT token。在 vendor.test.ts 中新增：建立 vendor 帳號後，呼叫 `authorizeCredentials({ username: "vendor-fish", password: "test-pass" })` 驗證回傳非 null。[Tool: Copilot] [Spec: vendor-account-hiding/vendor-can-login-normally] [Design: D5]

## Wave 5: 驗收

- [ ] 5.1 執行 `npm run build` 確認零錯誤，執行 `npm run test` 確認全綠。[Tool: 主對話]
