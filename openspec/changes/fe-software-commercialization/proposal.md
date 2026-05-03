## Why

此平台目前以「建安不動產」單一客戶硬編碼為前提建構，缺乏授權機制、用戶身份驗證及雲端部署能力，無法對外銷售或轉交給其他公司使用。需要加入序號授權、帳號登入及 Serverless PDF 三個核心模組，使軟體具備商業化交付條件。

## What Changes

- 新增：授權序號驗證層（Ed25519 離線簽章），Next.js Middleware 攔截所有非 `/setup` 路由
- 新增：SQLite `licenses` 資料表，儲存啟用序號、公司名、到期日
- 新增：首次啟動序號輸入引導頁面（`/setup/license`）
- 新增：用戶登入系統（Auth.js Credentials Provider），bcrypt hash 存 SQLite `users` 資料表
- 新增：雙 Token 機制：短效 Access Token（JWT，15 分鐘）+ 長效 Refresh Token（HttpOnly Cookie，7 天，SQLite 白名單）
- 新增：`/login`、`/api/auth/[...nextauth]` 路由
- **BREAKING** 修改：`puppeteer` → `puppeteer-core`，新增 `@sparticuz/chromium`，移除 `puppeteer`（package.json）
- 修改：`src/lib/pdf-generator/dossier.ts` 及 `src/lib/pdf-generator/survey-sales.ts`，改用 `chromium-launcher.ts` 抽象層
- 新增：`src/lib/pdf-generator/chromium-launcher.ts`，依 `CHROMIUM_MODE` env 切換本機/Serverless 模式
- 修改：`Dockerfile`，移除 Puppeteer 全裝，改用系統 Chromium（`CHROMIUM_MODE=local`）
- 新增環境變數：`COMPANY_NAME`, `CHROMIUM_MODE`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `LICENSE_PUBLIC_KEY`

## Non-Goals

- 不實作多租戶（SaaS）架構：本次只支援單一公司部署，無子域名隔離
- 不實作 RBAC 角色權限：本次所有登入用戶具相同權限
- 不實作線上序號撤銷：離線驗簽架構下，序號到期後自動失效即可
- 不實作 OAuth 第三方登入（Google/LINE）：Credentials 方案足以滿足單一租戶需求
- 不實作序號產生 UI：序號由開發者用 CLI script 產出，交付客戶
- 不支援 AWS Lambda 非同步 PDF 佇列：本次用 Vercel Serverless Functions 同步生成即可

## Capabilities

### New Capabilities

- `license-management`: 授權序號系統 — Ed25519 離線簽章，Middleware 驗證，SQLite 儲存，首次啟動引導
- `user-auth`: 用戶身份驗證系統 — Auth.js Credentials Provider，bcrypt hash，雙 Token，Refresh Token 白名單
- `serverless-pdf`: 跨環境 Chromium 啟動器 — 本機/Serverless 雙模式，統一 PDF 生成介面

### Modified Capabilities

- `container-deployment`: Dockerfile 移除 puppeteer 全裝（改用系統 Chromium + `CHROMIUM_MODE=local`）

## Impact

- Affected specs: `license-management`（新增）、`user-auth`（新增）、`serverless-pdf`（新增）、`container-deployment`（修改）
- Affected code:
  - New:
    - `src/lib/license/index.ts`（Ed25519 驗簽邏輯）
    - `src/lib/license/db.ts`（SQLite licenses 資料表 CRUD）
    - `src/app/setup/license/page.tsx`（首次啟動序號輸入頁）
    - `src/app/api/setup/activate/route.ts`（序號啟用 API）
    - `src/lib/auth/db.ts`（SQLite users + refresh_tokens 資料表）
    - `src/app/login/page.tsx`（登入頁）
    - `src/app/api/auth/[...nextauth]/route.ts`（Auth.js handler）
    - `src/app/api/auth/refresh/route.ts`（Refresh Token 輪轉 API）
    - `src/lib/pdf-generator/chromium-launcher.ts`（Chromium 啟動抽象層）
    - `src/middleware.ts`（授權 + 登入雙重攔截）
    - `scripts/generate-license.ts`（序號產生 CLI script）
    - `src/lib/license/types.ts`（授權 payload 型別定義）
  - Modified:
    - `src/lib/pdf-generator/dossier.ts`（改用 chromium-launcher）
    - `src/lib/pdf-generator/survey-sales.ts`（改用 chromium-launcher）
    - `Dockerfile`（移除 puppeteer 全裝，新增 CHROMIUM_MODE env）
    - `package.json`（移除 puppeteer，新增 puppeteer-core + @sparticuz/chromium + next-auth + bcryptjs）
  - Removed:
    - `puppeteer` dependency（改用 `puppeteer-core`）
    - 原有 `postinstall` script 的自動 Chrome 下載邏輯（改為依 `CHROMIUM_MODE` 條件觸發）
- New dependencies: `puppeteer-core`, `@sparticuz/chromium`, `next-auth@4.x`, `bcryptjs`, `@types/bcryptjs`, `@noble/ed25519`
- New env vars: `COMPANY_NAME`, `CHROMIUM_MODE` (`local` | `serverless`), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `LICENSE_PUBLIC_KEY`
