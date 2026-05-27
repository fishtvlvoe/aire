## Problem

Google/LINE/opcos.me 購買用戶目前會以為網站登入或重設密碼後，就能直接用同一組資料登入 AIRE Desktop。完整 Desktop session bridge 尚在 `desktop-auth-credential-fulfillment-smoke`，但登入頁需要先避免誤導。

## Root Cause

登入頁只寫「使用 AIRE 桌面版帳號登入」與「用 Google 或 LINE 購買？」連結，沒有說明 Google/LINE 購買者必須先在 opcos.me 取得桌面登入碼；購買說明連結也應指到 opcos.me 的 AIRE 桌面登入入口。

## Proposed Solution

- 登入頁新增客戶可讀說明：Google 或 LINE 購買用戶請先在 opcos.me 產生桌面登入碼。
- 將 Google/LINE 購買說明連結改為 opcos.me AIRE desktop-login intent。
- 保留現有密碼顯示切換與 email/password 登入表單。

## Non-Goals

- 不在此 change 實作 opcos.me token exchange。
- 不在此 change 實作 Keychain/Credential Manager 常駐 session。
- 不讓 Desktop 儲存 Google/LINE OAuth token。

## Success Criteria

- 登入頁清楚顯示桌面登入碼說明。
- 忘記密碼與桌面登入說明連結均使用 `opcos.me` 且 live HEAD 不為 404。
- 登入頁單元測試通過。

## Impact

- Affected code:
  - Modified: src/app/login/page.tsx, src/app/login/__tests__/page.test.tsx
  - New: none
  - Removed: none
