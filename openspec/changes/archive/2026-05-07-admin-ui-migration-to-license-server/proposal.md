## Why

AIRE 主 App 是 Electron 桌面版（用 better-sqlite3 本機資料庫），admin UI（src/app/admin/licenses/page.tsx，840 行 React）只能在 Fish 自己電腦上跑；當 Fish 不在電腦前需要核發、停用或重發序號（例如客戶突然在外打電話來），無法處理。把 admin UI 搬到已上線的 license-server（Vercel + KV），就能從手機或任何瀏覽器即時管理序號。

## What Changes

- 新增 license-server 改造為 Next.js 14 App Router 專案（保留現有 Vercel Functions 風格 API 不變更，採取漸進整合）
- 新增 `app/admin/licenses/page.tsx` — 從 AIRE 移植過來的 admin UI（840 行 React，調整 API endpoint 與 auth 機制）
- 新增 `app/admin/login/page.tsx` — admin 登入頁（密碼驗證後寫入 HTTP-only cookie session）
- 新增 `app/api/admin/session/route.ts` — POST 建立 session、DELETE 登出
- 新增 `middleware.ts` — 攔截 `/admin/*` 路徑，未登入導向 `/admin/login`
- 新增 `lib/admin-session.ts` — session token 簽署/驗證（HMAC-SHA256，存 cookie）
- 新增 admin proxy API 端點（`app/api/admin/licenses/route.ts` 等）— 把原 AIRE 的 `/api/admin/licenses*` proxy 路由搬到 license-server，內部呼叫現有 `lib/store.ts`
- 修改 `vercel.json` 移除 catch-all rewrite（`/(.*)` → `/api/$1`）—Next.js App Router 自帶路由，舊 rewrite 會打架
- 修改 `package.json` 加入 `next` / `react` / `react-dom` / `@types/react` 依賴；scripts 加 `dev`/`build`/`start`
- 新增 `next.config.ts` 與 `tsconfig.json`（沿用 AIRE 慣例）
- 新增環境變數 `LICENSE_ADMIN_PASSWORD`（管理員登入密碼，bcrypt hash）與 `ADMIN_SESSION_SECRET`（HMAC 簽署密鑰）

## Non-Goals (optional)

- 不做多管理員帳號管理（目前僅 Fish 一人，單密碼即可，未來再擴）
- 不做 OAuth／SSO（維持單純密碼登入）
- 不刪除 AIRE 端的 admin UI（`src/app/admin/licenses/page.tsx` 保留給本機用）
- 不改動現有 license-server API（`api/license/*.ts` 維持 @vercel/node 風格，避免破壞 client app 的呼叫）
- 不做兩段式驗證（2FA）— 第一版僅密碼，待第二期加
- 不做 Linux 平臺特定設定（license-server 僅跑 Vercel）
- 不做手機原生 App（直接用瀏覽器響應式 UI 即可）

## Capabilities

### New Capabilities

- `license-server-admin-ui`: license-server 端的 admin Web UI（含登入頁、序號管理表格、Inline Edit、停用 Dialog、轉讓 Dialog、解綁機器 ID、新增序號表單）
- `admin-session-auth`: admin session 驗證機制（密碼登入、HMAC 簽署 cookie、middleware 路徑保護、登出）

### Modified Capabilities

- `license-server`: 從純 Vercel Functions 升級成 Next.js App Router 專案；新增 `/api/admin/licenses/*` proxy 端點；保留所有現有 `/api/license/*` 端點不變

## Impact

- Affected specs: license-server-admin-ui（新）、admin-session-auth（新）、license-server（改）
- Affected code:
  - New: license-server/app/admin/licenses/page.tsx、license-server/app/admin/login/page.tsx、license-server/app/api/admin/session/route.ts、license-server/app/api/admin/licenses/route.ts、license-server/app/api/admin/licenses/revoke/route.ts、license-server/app/api/admin/licenses/transfer/route.ts、license-server/app/api/admin/licenses/unbind-machine/route.ts、license-server/app/api/admin/licenses/update-info/route.ts、license-server/middleware.ts、license-server/lib/admin-session.ts、license-server/next.config.ts、license-server/tsconfig.json、license-server/app/layout.tsx、license-server/app/globals.css
  - Modified: license-server/vercel.json、license-server/package.json
  - Removed: 無
- Dependencies 新增（license-server）: next ^14、react ^18、react-dom ^18、@types/react、bcryptjs、@types/bcryptjs
- 環境變數新增: LICENSE_ADMIN_PASSWORD（bcrypt hash）、ADMIN_SESSION_SECRET（HMAC 密鑰）
