## Why

客戶忘記密碼時，目前只能聯繫管理員手動重設，流程不合理且增加管理負擔。需要提供自助式密碼重設機制，讓客戶透過 email 驗證後自行設定新密碼。

## What Changes

- 新增「忘記密碼」連結於客戶登入頁（src/app/login/page.tsx）
- 新增忘記密碼頁面，讓客戶輸入 email 請求重設
- 新增重設密碼 API，驗證 email 是否存在後透過 toSend API 發送重設連結
- 新增密碼重設頁面，接收 token 參數並讓客戶輸入新密碼
- 新增密碼重設確認 API，驗證 token 有效性後以 bcryptjs 雜湊新密碼寫入 SQLite

## Non-Goals

- 不做管理員忘記密碼（管理員只有 Fish 一人，可直接改 .env）
- 不做 SMS 簡訊驗證，僅用 email
- 不做密碼強度檢查（未來可加）
- 不做帳號鎖定機制（多次失敗嘗試）

## Capabilities

### New Capabilities

- `password-reset`: 客戶自助式密碼重設流程，包含 email 發送、token 驗證、密碼更新

### Modified Capabilities

- `user-auth`: 登入頁新增「忘記密碼」連結，導向密碼重設流程

## Impact

- Affected specs: 新增 `password-reset`，修改 `user-auth`
- Affected code:
  - New: src/app/forgot-password/page.tsx, src/app/reset-password/page.tsx, src/app/api/auth/forgot-password/route.ts, src/app/api/auth/reset-password/route.ts, src/lib/email.ts
  - Modified: src/app/login/page.tsx
  - Removed: 無
- Dependencies 新增: 無（toSend 為 HTTP API，不需額外套件）
- 環境變數新增: TOSEND_FROM_EMAIL（發信地址，使用 fish@aiver.me）
