## Context

AIRE 主 App 為 Electron 桌面版（資料庫 `better-sqlite3`），admin UI（`src/app/admin/licenses/page.tsx`，840 行 React）僅能在 Fish 自己電腦執行。當 Fish 不在電腦前，無法即時核發、停用、轉讓序號。

license-server 是獨立 Vercel 專案（`https://AIRE-license-server.vercel.app`），目前為純 Vercel Functions（`@vercel/node` 風格 `api/*.ts`），用 Vercel KV 作後端儲存，已穩定運作。現有 API：`activate` / `create` / `list` / `revoke` / `transfer` / `update-info` / `verify` / `features` / `updates`。Admin auth 機制為 `LICENSE_ADMIN_TOKEN` 環境變數 + `Authorization: Bearer ...` header。

`vercel.json` 目前的 rewrite 為 `"/(.*)" → "/api/$1"`，把所有路徑都導向 API；要加入 Web UI 必須調整。

利害關係人：
- Fish（唯一管理員，需要手機/桌機隨時管理序號）
- Client App（AIRE Electron）— 仍需呼叫 license-server 既有 API 不受影響
- 未來可能新增 agent 角色，但本 change 不處理

## Goals / Non-Goals

**Goals:**

- license-server 部署後，網址 `/admin/licenses` 為可從任意瀏覽器（含手機）登入操作的 admin UI
- 現有 `/api/license/*` 端點（client app 用）行為完全不變
- admin session 採 HTTP-only secure cookie，避免 token 在前端可被 JS 讀取
- 升級為 Next.js 14 App Router，與 AIRE 主 App 框架一致，便於日後再搬程式碼
- middleware 強制保護 `/admin/*` 與 `/api/admin/*` 路徑

**Non-Goals:**

- 不重寫現有 `api/license/*.ts`（保留 `@vercel/node` 風格，繼續運作）
- 不刪除 AIRE 端的 `src/app/admin/licenses/page.tsx`
- 不做多管理員、角色分權、2FA、OAuth、SSO
- 不做手機原生 App
- 不做密碼自助修改／找回密碼（密碼變更直接改 Vercel env 後重啟）

## Decisions

### Decision 1：license-server 升級為 Next.js 14 App Router 專案

採取漸進整合，**保留**現有 `api/*.ts`（Vercel 原生 Functions）不動，**新增** Next.js 的 `app/` 目錄處理 UI 與 admin proxy 路由。Vercel 同時支援兩種風格混用：`api/*.ts` 走 Vercel Functions，`app/api/*` 走 Next.js Route Handlers，互不衝突。

部署目錄結構：
```
license-server/
  api/                ← 維持現狀（client app 端點）
    license/*.ts
    features/index.ts
    updates/check.ts
  app/                ← 新增（admin UI 與 admin proxy）
    layout.tsx
    globals.css
    admin/
      login/page.tsx
      licenses/page.tsx
    api/
      admin/
        session/route.ts
        licenses/route.ts
        licenses/revoke/route.ts
        licenses/transfer/route.ts
        licenses/unbind-machine/route.ts
        licenses/update-info/route.ts
  lib/                ← 維持現狀，新增 admin-session.ts
    admin-auth.ts
    admin-session.ts  ← 新增
    store.ts
    serial.ts
    machine-id.ts
  middleware.ts       ← 新增
  next.config.ts      ← 新增
  tsconfig.json       ← 新增
  package.json        ← 修改（加 next/react 依賴與 scripts）
  vercel.json         ← 修改（移除 catch-all rewrite）
```

**Alternatives Considered:**

- **A. 純靜態 SPA（HTML + esm.sh React，放 `public/admin/index.html`）**：優點是不引入 Next.js；缺點是無 SSR、難用 middleware 保護路徑，登入頁要靠 `<script>` 自己處理 redirect，且無 React 生態（要自己手寫 fetch / state，無法直接抄 AIRE 的 React 元件）。否決。
- **B. 改寫所有 `api/*.ts` 為 Next.js Route Handler**：要改的檔案多（7+ 端點），破壞 client app 風險高，須重跑全部端對端測試。否決。

### Decision 2：admin 認證採 HTTP-only Cookie + HMAC-signed session

登入流程：
1. `POST /api/admin/session` 帶 `{ password }` → 後端 `bcrypt.compare(password, env.LICENSE_ADMIN_PASSWORD)`
2. 驗證通過 → 後端產生 session payload `{ sub: "admin", iat, exp }`（exp = iat + 12h，台北時區無關，存 epoch 秒）
3. 用 `ADMIN_SESSION_SECRET` 做 HMAC-SHA256 簽署，組成 `<base64url(payload)>.<base64url(sig)>`
4. 回 `Set-Cookie: admin_session=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=43200`

middleware 驗證：
1. 攔截 `/admin/*` 與 `/api/admin/*`
2. 讀 `admin_session` cookie，驗 HMAC 與 `exp > now`
3. 失敗 → `/admin/*` 導向 `/admin/login`、`/api/admin/*` 回 401 JSON
4. session 內部 proxy 到 `lib/store.ts`（不再經過 `LICENSE_ADMIN_TOKEN` Bearer，因為 admin proxy 是 server-side 同源呼叫）

登出：`DELETE /api/admin/session` 清掉 cookie。

**Alternatives Considered:**

- **A. localStorage 存 admin token**：JS 可讀，XSS 風險高（雖然本專案輸入面少，但 cookie 安全模型嚴格）。否決。
- **B. NextAuth.js**：對單管理員密碼登入過於重量級，會多一份套件依賴與設定。否決。
- **C. 維持原 `LICENSE_ADMIN_TOKEN` Bearer 由前端帶**：手機操作要每次貼 token，UX 差且 token 容易外流。否決。

### Decision 3：admin proxy API 與既有 `lib/store.ts` 共用

新增的 `app/api/admin/licenses/*` 路由皆為「Next.js Route Handler」，內部直接 `import` 既有 `lib/store.ts` 的 `listLicenses` / `revokeLicense` / `saveLicense` 等函式。不再呼叫 `lib/admin-auth.ts` 的 Bearer 驗證（因 middleware 已驗 cookie session）。

把這層 proxy 設計成「薄包裝」：負責解析 query / body、呼叫 store function、回 JSON。所有業務邏輯都在 `lib/`，UI 與 API 都共享同一份。

**Alternatives Considered:**

- **A. admin UI 直接打 `/api/license/*`**：意義上是 admin 操作，責任邊界要清晰；client API（給 Electron 用）與 admin API 應分離，未來可獨立加 rate limit / audit log。否決。
- **B. 把 `api/license/list.ts` 等改成同時支援 Bearer 與 Cookie**：邏輯混雜不清晰，且既有 client app 沒理由動。否決。

### Decision 4：`vercel.json` 改寫策略

舊：
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/api/$1" }]
}
```

新：
```json
{
  "rewrites": [
    { "source": "/license/:path*", "destination": "/api/license/:path*" },
    { "source": "/features/:path*", "destination": "/api/features/:path*" },
    { "source": "/updates/:path*", "destination": "/api/updates/:path*" }
  ]
}
```

理由：保留既有 client app 呼叫 `/license/list` / `/features` / `/updates/check` 的 path（如有外部使用者依賴）；其他路徑由 Next.js App Router 自然處理（`/admin/*`、`/api/admin/*`、`/api/license/*` 直接打到對應的 file-system route）。`/api/license/*` 走 `api/license/*.ts`（仍是 Vercel Functions）。

**Alternatives Considered:**

- **A. 完全移除 rewrite**：擔心 client app 端是否有 hardcode `/license/list` 等舊 path。grep 確認後若無依賴再啟用。先保守保留。否決全清。
- **B. 全部改寫成 Next.js Route Handler**：見 Decision 1 已否決。

### Decision 5：admin UI 移植策略

AIRE 端 `src/app/admin/licenses/page.tsx` 維持原檔不動。新檔 `license-server/app/admin/licenses/page.tsx` 由原檔複製＋以下調整：
- 把所有 `fetch('/api/admin/licenses*', ...)` 改為 `fetch('/api/admin/licenses*', { credentials: 'same-origin' })`（同源，cookie 自動帶）
- 移除 `Authorization: Bearer` header（cookie 取代）
- 加入 `useEffect` 偵測 401 → `router.push('/admin/login')`
- 響應式 CSS：表格在手機（< 768px）改為卡片式排版

**Alternatives Considered:**

- **A. 寫個共用 `@AIRE/admin-ui` npm 套件兩邊引用**：對單一畫面而言過度工程化。否決。
- **B. iframe 嵌入 AIRE 的本機 admin UI**：手機沒法跑本機 AIRE。否決。

## Risks / Trade-offs

- [Next.js 14 與既有 Vercel Functions 混用相容性問題] → 部署前先 `vercel dev` 本機驗證；分兩次 commit（先升級框架且不動既有功能、再加新 admin UI），方便回滾
- [`vercel.json` rewrite 改動破壞 client app 呼叫] → 部署前 `grep -r "license-server" AIRE/src` 列出所有呼叫路徑，逐一驗證；保留 `/license/*` 等 rewrite 作為相容層
- [`bcryptjs` 在 Edge Runtime 跑不動] → middleware 強制 `runtime = 'nodejs'`；session 驗證用 Node `crypto.createHmac` 而非 bcrypt（bcrypt 只在 `/api/admin/session` POST 比密碼時用）
- [`ADMIN_SESSION_SECRET` 外洩或弱密碼] → README 註明用 `openssl rand -base64 48` 產 ≥48 byte 密鑰，存 Vercel env，禁止 commit；本次不寫業務測試 fixture 用真 secret
- [手機瀏覽器 cookie 被擋（safari ITP）] → cookie 設 `SameSite=Lax`，且 admin UI 與 API 同源（同 `*.vercel.app`）不會被視為 third-party
- [admin UI bug 影響 client app] → admin proxy 與 client API 路徑、檔案、處理函式完全分離（`app/api/admin/*` vs `api/license/*`），互不影響
- [部署過程不小心覆蓋 KV 資料] → KV 是線上 Vercel 資源，本 change 不動 schema、不跑 migration；只新增讀寫端點，且寫入路徑（`saveLicense`）已存在使用中

## Migration Plan

部署步驟（Vercel deploy 操作必須先取得 Fish 確認）：

1. 本機建分支 `feat/admin-ui-on-license-server`，按 tasks.md 執行所有 code 改動
2. `cd license-server && npm install && npm run build` 確認本機 build 成功
3. `vercel dev` 啟動本機代理，驗證以下情境：
   - `/api/license/list?page=1&pageSize=20` 帶 `Authorization: Bearer <LICENSE_ADMIN_TOKEN>` → 回 200（client API 不受影響）
   - 訪問 `/admin/licenses` → 302 redirect 到 `/admin/login`
   - `POST /api/admin/session` 帶錯誤密碼 → 401
   - `POST /api/admin/session` 帶正確密碼 → 200 + Set-Cookie
   - 帶 cookie 訪問 `/admin/licenses` → 200，列表正確顯示
   - `DELETE /api/admin/session` → 200，cookie 被清除，再訪問 `/admin/licenses` → redirect 到 login
4. Push 到 GitHub `feat/admin-ui-on-license-server` branch
5. **取得 Fish 同意後**：
   - 在 Vercel Dashboard 設定環境變數 `LICENSE_ADMIN_PASSWORD`（bcrypt hash） 與 `ADMIN_SESSION_SECRET`（48 byte base64）
   - `cd license-server && vercel deploy --prod` 部署
6. 部署後線上驗證：手機開瀏覽器訪問 `https://AIRE-license-server.vercel.app/admin/login`，登入流程完整測試一次
7. AIRE client app 端 smoke test：開啟 Electron App，驗證序號 verify 流程仍正常

**回滾策略：**

- Vercel 內建版本回滾：在 Dashboard `Deployments` 標籤點擊上一個正常版本的 `Promote to Production`，立即生效（< 1 分鐘）
- 程式面：保留分支 `main` 不動，所有改動在 `feat/admin-ui-on-license-server`；若部署失敗 `git revert <merge-commit>` 即可
- 環境變數：保留舊 `LICENSE_ADMIN_TOKEN`（client app 端 verify 路徑沒在用，但其他 admin API Bearer 仍在用）作為相容層，不刪
