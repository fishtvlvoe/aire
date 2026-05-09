## Why

現有登入頁只有一個帳密表單，預設顯示 admin/admin123，沒有 license key 輸入欄位，也沒有區分客戶和管理員的入口。客戶需要在登入時輸入授權序號，管理員則需要獨立的安全入口且禁止自助註冊。

## What Changes

- 重新設計 `/login` 頁面，上方為客戶登入區（帳號 + 密碼 + 授權序號三欄位），下方新增「總管理員登入」小字連結
- 移除登入頁的預設帳密提示（admin / admin123）和帳號預填值
- 新增 `/admin/login` 管理員登入頁，只有帳號 + 密碼，不顯示序號欄位
- 修改客戶登入 API，在登入時同步驗證 license key 有效性（Ed25519 簽章 + 過期日期）
- **BREAKING** 移除 `/setup/admin` 自助建立管理員功能，改為系統啟動時透過環境變數（`ADMIN_EMAIL` / `ADMIN_PASSWORD`）seed 唯一管理員帳號
- 調整 middleware 路由保護：客戶登入需通過 license key + 帳密雙重驗證，管理員走獨立驗證路徑

## Non-Goals

- 不做客戶自助註冊功能（客戶帳號由管理員在後台建立）
- 不做多管理員支援（本次只支援單一總管理員）
- 不做 OAuth / SSO 第三方登入
- 不修改登入後的頁面邏輯（listings 頁面等維持現狀）
- 不改動 license server 端的序號核發邏輯

## Capabilities

### New Capabilities

- `admin-login-page`: 總管理員專屬登入頁面，獨立於客戶登入，只接受帳密驗證，禁止自助註冊

### Modified Capabilities

- `user-auth`: 客戶登入表單新增 license key 欄位，移除預設帳密提示，登入 API 同步驗證序號
- `first-admin-setup`: 移除自助建立功能，改為環境變數 seed 管理員帳號，系統啟動時自動建立或更新
- `license-management`: license key 驗證從 middleware 靜默檢查改為客戶登入時主動輸入並驗證

## Impact

- Affected specs: `user-auth`、`first-admin-setup`、`license-management`（修改）；`admin-login-page`（新增）
- Affected code:
  - New: `src/app/admin/login/page.tsx`、`src/app/api/admin/login/route.ts`、`src/lib/seed-admin.ts`
  - Modified: `src/app/login/page.tsx`、`src/app/api/auth/login/route.ts`、`src/app/api/auth/[...nextauth]/route.ts`、`src/middleware.ts`、`src/lib/admin-auth.ts`
  - Removed: `src/app/setup/admin/page.tsx`、`src/app/api/setup/create-first-admin/route.ts`
- Dependencies 新增：無
- 環境變數新增：`ADMIN_EMAIL`、`ADMIN_PASSWORD`（管理員帳密，首次啟動時 seed 到資料庫）
