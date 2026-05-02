## 1. 套件與資料庫基礎設施

- [ ] 1.1 更新 `package.json`：移除 `puppeteer`，新增 `puppeteer-core@23.x`（pinned）、`@sparticuz/chromium@131`（pinned）、`next-auth@4.x`、`bcryptjs`、`@types/bcryptjs`、`@noble/ed25519` [Tool: kimi-cli]
- [ ] 1.2 建立 `src/lib/db/migrations/001_auth_license.ts`：CREATE TABLE IF NOT EXISTS `licenses`、`users`、`refresh_tokens`，含設計文件中的完整 DDL（含 index） [Tool: kimi-cli]
- [ ] 1.3 建立 `src/lib/db/index.ts`：初始化 better-sqlite3 連線並在 app 啟動時自動執行 migration [Tool: kimi-cli]

## 2. Serverless PDF — Chromium 啟動抽象層

- [ ] [P] 2.1 建立 `src/lib/pdf-generator/chromium-launcher.ts`：`launchBrowser()` 函式，依 `CHROMIUM_MODE` env var（`local`|`serverless`）切換 puppeteer-core 啟動方式 [Tool: kimi-cli]
- [ ] [P] 2.2 修改 `src/lib/pdf-generator/dossier.ts`：將 `puppeteer.launch()` 替換為 `launchBrowser()` import，保留 `try/finally browser.close()` 模式 [Tool: kimi-cli]
- [ ] [P] 2.3 修改 `src/lib/pdf-generator/survey-sales.ts`：將 `puppeteer.launch()` 替換為 `launchBrowser()` import，保留 `try/finally browser.close()` 模式 [Tool: kimi-cli]
- [ ] 2.4 修改 `Dockerfile`：在 runner stage ENV 新增 `CHROMIUM_MODE=local`；deps/builder stage 維持 `PUPPETEER_SKIP_DOWNLOAD=true` [Tool: kimi-cli]
- [ ] 2.5 在 PDF API route（`src/app/api/listings/[id]/pdf/route.ts`）新增 `export const maxDuration = 60` for Vercel Pro timeout [Tool: kimi-cli]

## 3. 授權序號系統

- [ ] [P] 3.1 建立 `src/lib/license/types.ts`：LicensePayload 型別定義（company, expires, version） [Tool: kimi-cli]
- [ ] [P] 3.2 建立 `src/lib/license/index.ts`：`verifyLicense(serialKey)` 用 `@noble/ed25519` 驗簽，`activateLicense(serialKey)` 驗簽後存入 SQLite [Tool: kimi-cli]
- [ ] [P] 3.3 建立 `scripts/generate-license.ts`：CLI script，接受 `--company` 和 `--expires` 參數，用私鑰產生並輸出序號 [Tool: kimi-cli]
- [ ] 3.4 建立 `src/app/api/setup/activate/route.ts`：POST endpoint，呼叫 `activateLicense()`，成功回 200，驗簽失敗回 400 INVALID_SIGNATURE [Tool: kimi-cli]
- [ ] 3.5 建立 `src/app/setup/license/page.tsx`：序號輸入表單頁，呼叫 activate API，成功後導向 `/login`；若已啟用則直接導向首頁 [Tool: kimi-cli]

## 4. 用戶身份驗證

- [ ] [P] 4.1 建立 `src/lib/auth/db.ts`：`getUserByUsername()`、`createUser()`、`createRefreshToken()`、`revokeRefreshToken()`、`getValidRefreshToken()` [Tool: kimi-cli]
- [ ] [P] 4.2 建立 `scripts/create-admin.ts`：CLI script，接受 `--username` 和 `--password`，bcrypt hash 後呼叫 `createUser()`，若 username 已存在則 exit 1 [Tool: kimi-cli]
- [ ] 4.3 建立 `src/app/api/auth/[...nextauth]/route.ts`：Auth.js Credentials Provider 設定，驗密碼後回傳 user object，session strategy 為 `jwt`，JWT 有效期 15 分鐘 [Tool: kimi-cli]
- [ ] 4.4 建立 `src/app/api/auth/refresh/route.ts`：POST endpoint，驗 Refresh Token（DB 白名單）→ 舊 token revoke → 新 token 產生並以 HttpOnly cookie 回傳 [Tool: kimi-cli]
- [ ] 4.5 建立 `src/app/login/page.tsx`：登入表單，呼叫 Auth.js `signIn()`，失敗顯示錯誤訊息，成功導向首頁 [Tool: kimi-cli]

## 5. Next.js Middleware 整合

- [ ] 5.1 建立 `src/middleware.ts`：依序執行（1）License 檢查（模組層級 60s 快取）→ 無效/到期導向 `/setup/license`；（2）Auth 檢查用 `getToken()`→ 未登入導向 `/login`；豁免路徑：`/setup/*`、`/api/setup/*`、`/login`、`/api/auth/*`、`/_next/*` [Tool: kimi-cli]

## 6. 測試

- [ ] [P] 6.1 為 `src/lib/license/index.ts` 撰寫 Vitest 單元測試：測試有效序號驗簽通過、過期序號拒絕、竄改序號拒絕 [Tool: kimi-cli]
- [ ] [P] 6.2 為 `src/lib/pdf-generator/chromium-launcher.ts` 撰寫 Vitest 單元測試：mock `CHROMIUM_MODE` env var，驗證 local/serverless 分支各自呼叫正確的 launch 參數 [Tool: kimi-cli]
