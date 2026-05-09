## Context

目前系統只有一種 admin 角色。系統商（核流有限公司）部署 App 到客戶端後，若要登入客戶系統維護，必須借用客戶管理員帳號或額外建帳號，兩者都會讓客戶感到困惑。需要一個隱形的系統商帳號機制。

相關模組：License init API（src/app/api/license/init/route.ts）、auth DB（src/lib/auth/db.ts）、users schema（src/lib/db/schema.ts）、用戶管理 UI（src/app/admin/users/page.tsx）、middleware.ts 的 hasUsers() 判斷。

## Goals / Non-Goals

**Goals:**

- License 驗證成功時自動靜默建立 vendor 帳號
- vendor 帳號在客戶端用戶管理介面完全不可見
- vendor 可用固定帳密登入任何客戶的系統
- 重複驗證 license 時更新 vendor 密碼，不重複建立

**Non-Goals:**

- License Server 端回傳 vendorCredentials 的實作（本 change 只處理客戶端接收）
- vendor 專屬的管理面板或額外功能
- vendor 操作的額外 audit 區分（現有 audit log 已記錄所有操作）

## Decisions

### D1: users 表新增 is_vendor 欄位

migration 檔 `migrations/005_vendor_account.sql` 新增 `is_vendor INTEGER NOT NULL DEFAULT 0`。vendor 帳號 is_vendor = 1，role = admin。正常用戶 is_vendor = 0。

### D2: License Init API 回應擴展

`src/app/api/license/init/route.ts` 收到 License Server 回應後，檢查是否包含 `vendorCredentials` 欄位（username、passwordHash、displayName）。若存在，呼叫 `provisionVendorAccount()` 建立或更新 vendor 帳號。

### D3: Vendor 帳號建立邏輯

新檔案 `src/lib/auth/vendor.ts` 匯出 `provisionVendorAccount(credentials)`。流程：查詢 users 表是否已有同 username 且 is_vendor = 1 的紀錄。存在則 UPDATE password_hash 和 display_name；不存在則 INSERT 新紀錄，role 固定為 admin，is_vendor = 1。email 使用 `{username}@vendor.AIRE.app` 格式（內部用，不寄信）。密碼 hash 由 License Server 預先計算（bcrypt），客戶端直接存入 DB。

### D4: 用戶管理頁面過濾

用戶列表 API 和 admin 頁面的查詢加上 `WHERE is_vendor = 0`，vendor 帳號不出現在客戶的用戶管理介面。middleware.ts 的 `hasUsers()` 不受影響——vendor 帳號在 License init 之後才建立，`hasUsers()` 在 License 驗證之前就已判斷。

### D5: 登入流程不變

vendor 帳號使用與一般用戶相同的 NextAuth CredentialsProvider 登入流程。`getUserByUsername()` 不區分 is_vendor，vendor 可正常登入，JWT token role = admin。

## Risks / Trade-offs

- **風險**：若 License Server 回傳的 vendorCredentials 被中間人竊取，攻擊者可取得 vendor 帳密。緩解：License init 走 HTTPS，passwordHash 是 bcrypt 而非明文。
- **取捨**：vendor 帳號使用固定 username + password，而非一次性 token。優點是系統商操作簡便，缺點是安全性略低。在本產品的場景（本機安裝的桌面 App，非雲端 SaaS）風險可接受。
- **取捨**：vendor 帳號的 email 是虛擬格式（@vendor.AIRE.app），不支援密碼重設。系統商若忘記密碼需重新驗證 license。
