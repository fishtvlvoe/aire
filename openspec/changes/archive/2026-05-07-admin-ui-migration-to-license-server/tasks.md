## 1. license-server 升級為 Next.js 14 App Router 專案

- [x] 1.1 [Tool: copilot] 修改 `license-server/package.json` 加入依賴 `next@^14`、`react@^18`、`react-dom@^18`、`@types/react`、`@types/react-dom`、`bcryptjs`、`@types/bcryptjs`，並新增 scripts `dev`/`build`/`start` 對應 Decision 1：license-server 升級為 Next.js 14 App Router 專案
- [x] 1.2 [Tool: copilot] 新增 `license-server/next.config.ts` 與 `license-server/tsconfig.json`，照 three-ai 慣例設定 strict mode、paths alias，落實 Decision 1：license-server 升級為 Next.js 14 App Router 專案
- [x] 1.3 [P] [Tool: copilot] 新增 `license-server/app/layout.tsx` 與 `license-server/app/globals.css`（最小骨架，含 mobile viewport meta），符合 Decision 1：license-server 升級為 Next.js 14 App Router 專案

## 2. admin session 模組（TDD）

- [x] 2.1 [Tool: sonnet] 在 `license-server/lib/__tests__/admin-session.test.ts` 寫紅燈測試覆蓋 Password verification with bcrypt、Session token format、Logout clears the session cookie、Boundary handling 四個 Requirement（含 examples 表格的所有 case）對應 Decision 2：admin 認證採 HTTP-only Cookie + HMAC-signed session
- [x] 2.2 [Tool: copilot] 新增 `license-server/lib/admin-session.ts` 實作 HMAC-SHA256 sign/verify、`createSessionToken(secret)`、`verifySessionToken(token, secret)`、cookie name 常數，讓 2.1 紅燈測試轉綠（Password verification with bcrypt + Session token format + Boundary handling）
- [x] 2.3 [Tool: copilot] 在 `license-server/middleware.ts` 實作 Session validation on every protected request：攔截 `/admin/*`（排除 `/admin/login`）與 `/api/admin/*`（排除 `POST /api/admin/session`），未通過驗證時依路徑回 307 redirect 或 401 JSON

## 3. admin session API endpoints（TDD）

- [x] 3.1 [Tool: sonnet] 在 `license-server/app/api/admin/session/__tests__/route.test.ts` 寫紅燈測試：Password verification with bcrypt 三個 scenario（correct/incorrect/missing env）+ Logout clears the session cookie 一個 scenario
- [x] 3.2 [Tool: copilot] 新增 `license-server/app/api/admin/session/route.ts`，POST 比對 bcrypt hash 並 Set-Cookie，DELETE 清 cookie，讓 3.1 紅燈測試轉綠（Password verification with bcrypt + Logout clears the session cookie）

## 4. admin proxy API endpoints（TDD）

- [x] 4.1 [Tool: sonnet] 在 `license-server/app/api/admin/licenses/__tests__/` 寫紅燈整合測試覆蓋 Admin proxy list endpoint、Admin proxy create endpoint、Admin proxy revoke endpoint、Admin proxy transfer endpoint、Admin proxy update-info endpoint、Admin proxy unbind-machine endpoint 全部 scenario，落實 Decision 3：admin proxy API 與既有 `lib/store.ts` 共用
- [x] 4.2 [P] [Tool: copilot] 實作 `license-server/app/api/admin/licenses/route.ts`（GET list / POST create）薄包裝呼叫 `lib/store.ts`（Admin proxy list endpoint + Admin proxy create endpoint）
- [x] 4.3 [P] [Tool: copilot] 實作 `license-server/app/api/admin/licenses/revoke/route.ts`（POST）+ `license-server/app/api/admin/licenses/transfer/route.ts`（POST），呼叫 `lib/store.ts` 的 revokeLicense 與新增的 transferLicense 函式（Admin proxy revoke endpoint + Admin proxy transfer endpoint）
- [x] 4.4 [P] [Tool: copilot] 實作 `license-server/app/api/admin/licenses/update-info/route.ts`（PATCH）+ `license-server/app/api/admin/licenses/unbind-machine/route.ts`（POST）（Admin proxy update-info endpoint + Admin proxy unbind-machine endpoint）

## 5. admin UI 頁面

- [x] 5.1 [Tool: copilot] 新增 `license-server/app/admin/login/page.tsx` 實作密碼輸入表單，submit 後 POST `/api/admin/session`，成功後 navigate `/admin/licenses`（Admin login page）對應 Decision 5：admin UI 移植策略
- [x] 5.2 [Tool: sonnet] 新增 `license-server/app/admin/licenses/page.tsx`：複製 three-ai `src/app/admin/licenses/page.tsx` 並依 Decision 5：admin UI 移植策略 調整：所有 fetch 加 `credentials: 'same-origin'`、移除 `Authorization: Bearer` header、加入 401 偵測 redirect 邏輯（Admin licenses page lists licenses + Admin UI calls admin proxy endpoints + Admin UI handles 401 by redirecting to login + Admin UI provides license actions）
- [x] 5.3 [Tool: copilot] 在 `license-server/app/admin/licenses/page.tsx` 與 `globals.css` 補上響應式樣式，符合 Admin UI is responsive on mobile（< 768px 時表格切換為卡片排版）

## 6. vercel.json 改寫與 client API 相容

- [x] 6.1 [Tool: copilot] 修改 `license-server/vercel.json`：移除 catch-all `"/(.*)" → "/api/$1"`，新增 `/license/:path*`、`/features/:path*`、`/updates/:path*` 三條 rewrite 對應 Decision 4：`vercel.json` 改寫策略（Vercel rewrite changes preserve legacy paths）
- [x] 6.2 [Tool: main] grep three-ai 與 license-server 程式碼確認沒有 hardcode 舊 catch-all 路徑（如 `/license/list` 直接呼叫且無 `Authorization` header），列出所有呼叫點供 review，驗證 Existing client API endpoints remain unchanged

## 7. 整合驗證與 Code Review

- [x] 7.1 [Tool: copilot] 在 `license-server/` 跑 `npm install && npm run build`，確認 Next.js build 0 錯誤
- [x] 7.2 [Tool: sonnet] 用 `vercel dev` 跑本機伺服器執行 design.md Migration Plan 步驟 3 的所有手動驗證情境（client API Bearer 仍正常、admin login flow、cookie 過期 redirect、logout 清 cookie），把每一步的 curl 與預期回應寫成 `license-server/scripts/smoke-admin.sh`
- [x] 7.3 [Tool: kimi] 跑 multi-file code review：審 `license-server/lib/admin-session.ts`、`middleware.ts`、`app/api/admin/**/*.ts`、`app/admin/**/*.tsx`，重點檢查 HMAC timing-safe compare、cookie 屬性正確性、bcrypt cost factor、是否漏掉 401 處理、Edge runtime 相容性

## 8. 部署（須 Fish 確認後執行）

- [x] 8.1 [Tool: main] 整理 deploy checklist 給 Fish 確認：Vercel env 設定 `LICENSE_ADMIN_PASSWORD`（bcrypt hash 用 cost=12 產生）與 `ADMIN_SESSION_SECRET`（`openssl rand -base64 48`）的具體指令；確認後 Fish 親自貼到 Vercel Dashboard
- [x] 8.2 [Tool: main] 取得 Fish 同意後執行 `cd license-server && vercel deploy --prod` 部署
- [x] 8.3 [Tool: main] 部署後線上 smoke test：用手機瀏覽器訪問 `https://three-ai-license-server.vercel.app/admin/login` 走完登入→列表→建立→停用→登出，回報結果給 Fish
