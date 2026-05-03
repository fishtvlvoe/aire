## 1. 套件與資料庫基礎設施

- [ ] 1.1 Package replacement：更新 `package.json`，移除 `puppeteer`，新增 `puppeteer-core@23.11.1`（pinned）、`@sparticuz/chromium@131.0.0`（pinned）、`next-auth@4.24.11`、`bcryptjs@2.4.3`、`@types/bcryptjs@2.4.6`、`@noble/ed25519@2.1.0` [Tool: kimi-cli]
- [ ] 1.2 授權序號與用戶登入資料模型：建立 `migrations/004_auth_license.sql`，依「授權序號：Ed25519 非對稱簽章」與「用戶登入：Auth.js Credentials Provider + 雙 Token」決策中的完整 DDL 建立 `licenses`、`users`、`refresh_tokens` 三張表（含 index） [Tool: kimi-cli]
- [ ] 1.3 App 啟動自動 migration：修改既有 `src/lib/db/index.ts` 的 `initDb()` 函式，在啟動時自動執行 `migrations/004_auth_license.sql`，不改變現有 `listings` 表初始化邏輯 [Tool: kimi-cli]
- [ ] 1.4 環境變數模板更新：更新 `.env.example`，新增 `COMPANY_NAME`、`CHROMIUM_MODE`、`NEXTAUTH_SECRET`、`NEXTAUTH_URL`、`LICENSE_PUBLIC_KEY` 五個變數與說明註解 [Tool: kimi-cli]
- [ ] 1.5 Postinstall script 清理：修改 `package.json` 的 `postinstall` script，改為僅在 `CHROMIUM_MODE=local` 且未設定 `PUPPETEER_SKIP_DOWNLOAD` 時才嘗試安裝系統 Chromium，避免 `puppeteer` 移除後腳本失效 [Tool: kimi-cli]

## 2. Serverless PDF — Chromium 啟動抽象層

- [ ] [P] 2.1 Dual-mode Chromium launcher：建立 `src/lib/pdf-generator/chromium-launcher.ts`，實作 `launchBrowser()` 函式，依 `CHROMIUM_MODE` env var（`local`|`serverless`）切換 puppeteer-core 啟動方式 [Tool: kimi-cli]
- [ ] [P] 2.2 PDF generator migration（dossier）：修改 `src/lib/pdf-generator/dossier.ts`，將 `puppeteer.launch()` 替換為 `launchBrowser()` import，保留 `try/finally browser.close()` 模式 [Tool: kimi-cli]
- [ ] [P] 2.3 PDF generator migration（survey-sales）：修改 `src/lib/pdf-generator/survey-sales.ts`，將 `puppeteer.launch()` 替換為 `launchBrowser()` import，保留 `try/finally browser.close()` 模式 [Tool: kimi-cli]
- [ ] 2.4 Container deployment CHROMIUM_MODE：修改 `Dockerfile`，在 runner stage ENV 區塊新增 `CHROMIUM_MODE=local`；deps/builder stage 維持 `PUPPETEER_SKIP_DOWNLOAD=true` [Tool: kimi-cli]
- [ ] 2.5 Vercel timeout config：在 PDF API route（`src/app/api/listings/[id]/pdf/route.ts`）新增 `export const maxDuration = 60` for Vercel Pro timeout [Tool: kimi-cli]

## 3. 授權序號系統

- [ ] [P] 3.1 License payload format：建立 `src/lib/license/types.ts`，定義 `LicensePayload` 型別（`company: string`, `expires: ISO8601 string`, `version: 1`） [Tool: kimi-cli]
- [ ] [P] 3.2 License serial key validation：建立 `src/lib/license/index.ts`，實作 `verifyLicense(serialKey)` 用 `@noble/ed25519` 驗簽，以及 `activateLicense(serialKey)` 驗簽後存入 SQLite [Tool: kimi-cli]
- [ ] [P] 3.3 License generation CLI：建立 `scripts/generate-license.ts`，接受 `--company` 和 `--expires` 參數，用 Ed25519 私鑰產生並輸出 base64url 序號 [Tool: kimi-cli]
- [ ] 3.4 License activation flow：建立 `src/app/api/setup/activate/route.ts`，POST endpoint 呼叫 `activateLicense()`，成功回 200，驗簽失敗回 400 `INVALID_SIGNATURE` [Tool: kimi-cli]
- [ ] 3.5 License activation flow（UI）：建立 `src/app/setup/license/page.tsx`，序號輸入表單頁，呼叫 activate API，成功後導向 `/login`；若已啟用則直接導向首頁 [Tool: kimi-cli]
- [ ] 3.6 License DB CRUD：建立 `src/lib/license/db.ts`，實作 `getLicense()`、`insertLicense()`、`hasValidLicense()` 等 SQLite `licenses` 表 CRUD（對應 `proposal.md` Affected code） [Tool: kimi-cli]

## 4. 用戶身份驗證

- [ ] [P] 4.1 User login with credentials + Dual token mechanism：建立 `src/lib/auth/db.ts`，實作 `getUserByUsername()`、`createUser()`（bcryptjs cost=12）、`createRefreshToken()`、`revokeRefreshToken()`、`getValidRefreshToken()` [Tool: kimi-cli]
- [ ] [P] 4.2 Admin account creation CLI：建立 `scripts/create-admin.ts`，接受 `--username` 和 `--password`，bcrypt hash 後呼叫 `createUser()`，若 username 已存在則 exit 1 [Tool: kimi-cli]
- [ ] 4.3 User login with credentials：建立 `src/app/api/auth/[...nextauth]/route.ts`，Auth.js Credentials Provider 設定，驗密碼後回傳 user object，session strategy 為 `jwt`，JWT 有效期 15 分鐘 [Tool: kimi-cli]
- [ ] 4.4 Dual token mechanism（refresh）：建立 `src/app/api/auth/refresh/route.ts`，POST endpoint 驗 Refresh Token（DB 白名單）→ 舊 token revoke → 新 token 產生並以 HttpOnly Secure SameSite=Strict cookie 回傳 [Tool: kimi-cli]
- [ ] 4.5 User login with credentials（UI）：建立 `src/app/login/page.tsx`，登入表單，呼叫 Auth.js `signIn()`，失敗顯示錯誤訊息，成功導向首頁 [Tool: kimi-cli]

## 5. Next.js Middleware 整合

- [ ] 5.1 License serial key validation + Auth middleware order + Route protection scope：建立 `src/middleware.ts`，依序執行（1）License 檢查（模組層級 60s 快取，無效/到期導向 `/setup/license`）；（2）Auth 檢查用 `getToken()`（未登入導向 `/login`）；豁免路徑：`/setup/*`、`/api/setup/*`、`/login`、`/api/auth/*`、`/_next/*` [Tool: kimi-cli]

## 6. 測試

- [ ] [P] 6.1 License serial key validation 單元測試：為 `src/lib/license/index.ts` 撰寫 Vitest 單元測試：測試有效序號驗簽通過、過期序號拒絕、竄改序號拒絕 [Tool: kimi-cli]
- [ ] [P] 6.2 Dual-mode Chromium launcher 單元測試：為 `src/lib/pdf-generator/chromium-launcher.ts` 撰寫 Vitest 單元測試：mock `CHROMIUM_MODE` env var，驗證 local/serverless 分支各自呼叫正確的 launch 參數 [Tool: kimi-cli]
