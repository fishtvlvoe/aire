## 1. 管理員 Seed 機制（管理員帳號 Seed 策略）

- [x] 1.1 實作 Admin account seed from environment variables：建立 `src/lib/seed-admin.ts`，從環境變數 `ADMIN_EMAIL` + `ADMIN_PASSWORD` upsert 管理員帳號到 SQLite users 表（role='admin'，bcryptjs cost 10）。缺少環境變數時 console.warn 提醒並跳過。驗證：單元測試確認 upsert 邏輯（新建 + 更新密碼 + 缺少變數三種情境）。[Tool: Copilot]
- [x] 1.2 實作 Seed function execution point：在 `src/instrumentation.ts` 呼叫 seed-admin 函式，確保每次 Next.js 啟動時執行一次（行為：啟動時自動建立/更新管理員帳號）。驗證：`npm run dev` 啟動後查詢 SQLite users 表確認管理員記錄存在。[Tool: Copilot]

## 2. 客戶登入頁重新設計（客戶登入時的 License Key 驗證方式）

- [x] [P] 2.1 實作 User login with credentials + Login page removes default credential hints + Admin login link on customer login page：修改 `src/app/login/page.tsx`，三欄位表單（帳號、密碼、授權序號），移除預設帳密提示和預填值，下方新增「總管理員登入」小字連結指向 `/admin/login`。序號欄位使用 password type 遮蔽。驗證（驗收標準）：瀏覽器截圖確認三欄位 + 連結 + 無預設值。[Tool: Copilot]
- [x] [P] 2.2 實作 License serial key validation + Login requires valid license as precondition：修改 `src/app/api/auth/login/route.ts`，接收 `{ email, password, licenseKey }`，先驗 license key（Ed25519 簽章 + 過期日期），通過後再驗帳密。回傳錯誤碼（失敗模式）：400（序號格式錯誤）、403（序號過期）、401（帳密錯誤）。驗證：curl 測試三種錯誤情境 + 成功情境。[Tool: Copilot]
- [x] 2.3 實作 Middleware license cache 移除：修改 `src/app/api/auth/[...nextauth]/route.ts` 的 `authorizeCredentials()`，接收並傳遞 licenseKey 參數，在驗證帳密前先驗 license key。驗證：NextAuth signIn 流程包含 license key 驗證。[Tool: Copilot]

## 3. 管理員登入頁（管理員登入路由設計）

- [x] [P] 3.1 實作 Admin login page at /admin/login：建立 `src/app/admin/login/page.tsx`，標題「總管理員登入」，兩欄位（帳號 + 密碼），無序號欄位，無預設帳密提示（行為：管理員從獨立入口登入，不需 license key）。驗證：瀏覽器截圖確認頁面。[Tool: Copilot]
- [x] [P] 3.2 實作 Admin login API endpoint：建立 `src/app/api/admin/login/route.ts`，接收 `{ email, password }`，驗證帳密 + 確認 role='admin'。非管理員回 403「無管理員權限」，帳密錯回 401（失敗模式）。驗證：curl 測試三種情境（成功、帳密錯、非管理員）。[Tool: Copilot]

## 4. Middleware 路由保護調整

- [x] 4.1 實作 Auth middleware order + Middleware 路由保護調整：修改 `src/middleware.ts`，移除 `getCachedLicense()` 相關邏輯和 Middleware license cache，白名單新增 `/admin/login` 和 `/api/admin/*`。移除 Middleware redirects to admin setup when users table is empty 邏輯。Middleware 只做 JWT token 驗證（Auth middleware order 範圍邊界：不驗 license，只驗 token）。驗證：curl 確認 `/admin/login` 可直接訪問、`/listings` 無 token 時 302 到 `/login`。[Tool: Copilot]

## 5. 移除自助管理員建立

- [x] [P] 5.1 實作 Setup wizard includes admin account creation step + First admin account creation API + First admin setup page UI 移除：刪除 `src/app/setup/admin/page.tsx` 和 `src/app/api/setup/create-first-admin/route.ts`。確認 `/setup/admin` 回 404。驗證：curl `/setup/admin` 確認 404。[Tool: Copilot]
- [x] [P] 5.2 更新 `.env.local` 新增 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 範例值。更新 `.env.example`（若存在）。驗證：確認檔案內容。[Tool: Copilot]

## 6. 整合驗證

- [ ] 6.1 端到端驗收（驗收標準全項確認）：啟動 dev server，確認行為：(1) 客戶登入頁三欄位 + 管理員連結 (2) 錯誤序號被擋（失敗模式驗證） (3) 正確序號 + 正確帳密可登入 (4) Admin login page at /admin/login 兩欄位 (5) 管理員帳密可登入 (6) `/setup/admin` 回 404（範圍邊界確認）。驗證：瀏覽器截圖 + curl 測試結果。[Tool: Sonnet]
