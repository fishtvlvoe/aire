# codex-integration Specification

## Purpose

TBD - created by archiving change 'electron-desktop-app'. Update Purpose after archive.

## Requirements

### Requirement: Codex CLI bundled in application

The system SHALL include Codex CLI (@openai/codex) within the Electron application package so clients do not need separate installation.

#### Scenario: Codex available without separate install

- **WHEN** application is installed on a clean machine
- **THEN** Codex CLI functionality SHALL be available without requiring additional npm install or terminal commands

##### Example: Clean machine test

- **GIVEN** a Windows PC with no Node.js or npm installed
- **WHEN** user installs via AI-不動產說明書系統-Setup-1.0.0.exe and completes setup wizard
- **THEN** clicking "生成不動產說明書" SHALL successfully invoke Codex without any "command not found" error


<!-- @trace
source: electron-desktop-app
updated: 2026-05-04
code:
  - license-server/lib/store.ts
  - src/app/admin/users/page.tsx
  - src/app/api/admin/users/[id]/reset-password/route.ts
  - src/app/api/listings/[id]/folder/route.ts
  - electron-builder.json
  - tsconfig.electron.json
  - license-server/package.json
  - src/app/admin/audit-logs/page.tsx
  - src/app/admin/transfer/page.tsx
  - electron/launcher.ts
  - src/app/setup/page.tsx
  - src/app/login/page.tsx
  - tsconfig.json
  - src/lib/codex-client/index.ts
  - src/app/api/auth/login/route.ts
  - src/app/admin/features/page.tsx
  - src/lib/db/schema.ts
  - src/app/api/admin/users/route.ts
  - license-server/api/updates/check.ts
  - src/app/api/listings/[id]/archive/route.ts
  - src/app/api/admin/audit-logs/route.ts
  - electron/splash.html
  - src/app/listings/[id]/supplementary/page.tsx
  - src/components/UpdateChecker.tsx
  - electron/preload.ts
  - src/app/listings/[id]/fill/page.tsx
  - license-server/api/license/activate.ts
  - src/app/api/auth/logout/route.ts
  - src/app/api/listings/[id]/route.ts
  - src/app/listings/page.tsx
  - src/components/Sidebar.tsx
  - src/app/api/admin/features/route.ts
  - src/app/listings/[id]/documents/page.tsx
  - src/lib/auth.ts
  - src/app/api/listings/route.ts
  - license-server/api/license/verify.ts
  - src/components/listings/SupplementStatusIcon.tsx
  - license-server/api/features/index.ts
  - src/lib/db/list-recent-helper.ts
  - src/app/api/listings/folders/[id]/route.ts
  - src/lib/generators/disclosure-document.ts
  - src/types/electron.d.ts
  - scripts/obfuscate-build.js
  - src/app/api/admin/users/[id]/disable/route.ts
  - src/components/FolderSidebar.tsx
  - src/app/listings/[id]/generating/page.tsx
  - src/app/api/license/features/route.ts
  - src/components/Stepper.tsx
  - src/lib/pdf-generator/dossier.ts
  - src/proxy.ts
  - src/lib/audit.ts
  - src/app/api/license/init/route.ts
  - electron/updater.ts
  - src/lib/features/client.ts
  - electron/main.ts
  - .github/workflows/release.yml
  - src/app/api/listings/folders/route.ts
  - license-server/vercel.json
  - src/app/api/listings/[id]/restore/route.ts
  - src/lib/generators/property-sheet.ts
  - src/lib/db/index.ts
  - src/app/api/admin/transfer-cases/route.ts
  - config/branding.json
  - src/lib/generators/disclaimer.ts
  - src/components/SearchBar.tsx
  - package.json
  - src/lib/pdf-generator/survey-sales.ts
  - src/app/listings/[id]/supplement/page.tsx
  - src/app/settings/page.tsx
  - src/lib/listings/supplementary-status.ts
  - src/lib/license/server-verify.ts
  - scripts/upload-release-to-r2.js
tests:
  - e2e/listing-ux.spec.ts
  - e2e/user-management.spec.ts
  - src/components/__tests__/Stepper.test.tsx
-->

---
### Requirement: First-time OpenAI authorization setup

The system SHALL provide a guided setup flow for OpenAI authentication on first launch. The flow SHALL use manual API Key entry with server-side verification (calling OpenAI `GET /v1/models`), NOT OAuth browser redirect.

#### Scenario: Manual API key entry

- **WHEN** user reaches Step 2 of the setup wizard on `/setup/codex`
- **THEN** system SHALL display an API Key input field and "驗證" button
- **WHEN** user enters a valid API Key and clicks "驗證"
- **THEN** system SHALL call `POST /api/setup/verify-openai` to validate the key
- **THEN** on success, the key SHALL be encrypted (AES-256-GCM) and stored in SQLite `settings` table
- **THEN** system SHALL redirect to homepage `/`

#### Scenario: Invalid API key

- **WHEN** user enters an invalid API key and clicks "驗證"
- **THEN** system SHALL display "API Key 無效，請確認後重試" and NOT proceed

##### Example: Valid manual key

- **GIVEN** user is on `/setup/codex` page
- **WHEN** user enters "sk-proj-abc123..." and clicks "驗證"
- **THEN** system calls `POST /api/setup/verify-openai` with `{ "apiKey": "sk-proj-abc123..." }` → receives `{ "valid": true }` → stores encrypted key → redirects to `/`


<!-- @trace
source: app-icon-and-codex-setup
updated: 2026-05-07
code:
  - scripts/generate-icons.ts
  - src/app/api/admin/licenses/update-info/route.ts
  - license-server/api/updates/check.ts
  - src/app/api/setup/verify-openai/route.ts
  - license-server/lib/store.ts
  - src/app/admin/licenses/page.tsx
  - src/app/api/admin/licenses/unbind-machine/route.ts
  - scripts/fix-standalone-symlinks.js
  - src/app/setup/page.tsx
  - license-server/api/license/update-info.ts
  - electron/codex-guide.html
  - electron-builder.json
  - electron/preload.ts
  - license-server/vercel.json
  - electron/launcher.ts
  - license-server/api/license/transfer.ts
  - src/lib/admin-auth.ts
  - license-server/api/license/verify.ts
  - src/app/api/admin/licenses/route.ts
  - license-server/lib/admin-auth.ts
  - src/lib/db/schema.ts
  - src/middleware.ts
  - scripts/materialize-standalone-symlinks.js
  - src/app/api/admin/licenses/transfer/route.ts
  - license-server/api/license/activate.ts
  - license-server/api/license/list.ts
  - .vercelignore
  - src/app/setup/admin/page.tsx
  - license-server/lib/serial.ts
  - src/app/api/setup/create-first-admin/route.ts
  - vercel.json
  - src/app/api/admin/licenses/revoke/route.ts
  - electron/updater.ts
  - package.json
  - electron/main.ts
  - license-server/api/features/index.ts
  - src/app/setup/codex/page.tsx
  - license-server/api/license/create.ts
  - license-server/api/license/revoke.ts
  - license-server/lib/machine-id.ts
  - src/lib/codex-client/key-store.ts
  - .github/workflows/release.yml
  - scripts/generate-license.ts
tests:
  - license-server/api/license/__tests__/update-info.test.ts
  - license-server/api/license/__tests__/revoke.test.ts
  - license-server/api/license/__tests__/create.test.ts
  - e2e/admin-licenses.spec.ts
  - license-server/api/license/__tests__/activate-verify.test.ts
  - license-server/api/license/__tests__/transfer.test.ts
  - license-server/lib/__tests__/serial.test.ts
  - src/lib/codex-client/__tests__/key-store.test.ts
  - license-server/api/license/__tests__/list.test.ts
  - license-server/api/license/__tests__/end-to-end-flow.test.ts
  - src/app/api/setup/verify-openai/route.test.ts
  - scripts/generate-icons.test.ts
-->

---
### Requirement: Client version locked to Codex

The system SHALL restrict the LLM backend to Codex only in production mode.

#### Scenario: Production mode LLM selection

- **WHEN** application runs with NEXT_PUBLIC_APP_MODE=production
- **THEN** only Codex adapter SHALL be available and no LLM switching UI SHALL be shown

##### Example: Production client UI

- **GIVEN** client machine has NEXT_PUBLIC_APP_MODE=production
- **WHEN** client navigates to any page
- **THEN** no "設定" menu item SHALL exist and all AI calls SHALL route exclusively through Codex


<!-- @trace
source: electron-desktop-app
updated: 2026-05-04
code:
  - license-server/lib/store.ts
  - src/app/admin/users/page.tsx
  - src/app/api/admin/users/[id]/reset-password/route.ts
  - src/app/api/listings/[id]/folder/route.ts
  - electron-builder.json
  - tsconfig.electron.json
  - license-server/package.json
  - src/app/admin/audit-logs/page.tsx
  - src/app/admin/transfer/page.tsx
  - electron/launcher.ts
  - src/app/setup/page.tsx
  - src/app/login/page.tsx
  - tsconfig.json
  - src/lib/codex-client/index.ts
  - src/app/api/auth/login/route.ts
  - src/app/admin/features/page.tsx
  - src/lib/db/schema.ts
  - src/app/api/admin/users/route.ts
  - license-server/api/updates/check.ts
  - src/app/api/listings/[id]/archive/route.ts
  - src/app/api/admin/audit-logs/route.ts
  - electron/splash.html
  - src/app/listings/[id]/supplementary/page.tsx
  - src/components/UpdateChecker.tsx
  - electron/preload.ts
  - src/app/listings/[id]/fill/page.tsx
  - license-server/api/license/activate.ts
  - src/app/api/auth/logout/route.ts
  - src/app/api/listings/[id]/route.ts
  - src/app/listings/page.tsx
  - src/components/Sidebar.tsx
  - src/app/api/admin/features/route.ts
  - src/app/listings/[id]/documents/page.tsx
  - src/lib/auth.ts
  - src/app/api/listings/route.ts
  - license-server/api/license/verify.ts
  - src/components/listings/SupplementStatusIcon.tsx
  - license-server/api/features/index.ts
  - src/lib/db/list-recent-helper.ts
  - src/app/api/listings/folders/[id]/route.ts
  - src/lib/generators/disclosure-document.ts
  - src/types/electron.d.ts
  - scripts/obfuscate-build.js
  - src/app/api/admin/users/[id]/disable/route.ts
  - src/components/FolderSidebar.tsx
  - src/app/listings/[id]/generating/page.tsx
  - src/app/api/license/features/route.ts
  - src/components/Stepper.tsx
  - src/lib/pdf-generator/dossier.ts
  - src/proxy.ts
  - src/lib/audit.ts
  - src/app/api/license/init/route.ts
  - electron/updater.ts
  - src/lib/features/client.ts
  - electron/main.ts
  - .github/workflows/release.yml
  - src/app/api/listings/folders/route.ts
  - license-server/vercel.json
  - src/app/api/listings/[id]/restore/route.ts
  - src/lib/generators/property-sheet.ts
  - src/lib/db/index.ts
  - src/app/api/admin/transfer-cases/route.ts
  - config/branding.json
  - src/lib/generators/disclaimer.ts
  - src/components/SearchBar.tsx
  - package.json
  - src/lib/pdf-generator/survey-sales.ts
  - src/app/listings/[id]/supplement/page.tsx
  - src/app/settings/page.tsx
  - src/lib/listings/supplementary-status.ts
  - src/lib/license/server-verify.ts
  - scripts/upload-release-to-r2.js
tests:
  - e2e/listing-ux.spec.ts
  - e2e/user-management.spec.ts
  - src/components/__tests__/Stepper.test.tsx
-->

---
### Requirement: Client must have ChatGPT Plus subscription

The system SHALL validate that the OpenAI token has sufficient access for Codex CLI operations.

#### Scenario: Insufficient subscription

- **WHEN** user's OpenAI account does not have Plus or higher subscription
- **THEN** system SHALL display guidance: "需要 ChatGPT Plus 方案（$20/月）才能使用 AI 功能"

<!-- @trace
source: electron-desktop-app
updated: 2026-05-04
code:
  - license-server/lib/store.ts
  - src/app/admin/users/page.tsx
  - src/app/api/admin/users/[id]/reset-password/route.ts
  - src/app/api/listings/[id]/folder/route.ts
  - electron-builder.json
  - tsconfig.electron.json
  - license-server/package.json
  - src/app/admin/audit-logs/page.tsx
  - src/app/admin/transfer/page.tsx
  - electron/launcher.ts
  - src/app/setup/page.tsx
  - src/app/login/page.tsx
  - tsconfig.json
  - src/lib/codex-client/index.ts
  - src/app/api/auth/login/route.ts
  - src/app/admin/features/page.tsx
  - src/lib/db/schema.ts
  - src/app/api/admin/users/route.ts
  - license-server/api/updates/check.ts
  - src/app/api/listings/[id]/archive/route.ts
  - src/app/api/admin/audit-logs/route.ts
  - electron/splash.html
  - src/app/listings/[id]/supplementary/page.tsx
  - src/components/UpdateChecker.tsx
  - electron/preload.ts
  - src/app/listings/[id]/fill/page.tsx
  - license-server/api/license/activate.ts
  - src/app/api/auth/logout/route.ts
  - src/app/api/listings/[id]/route.ts
  - src/app/listings/page.tsx
  - src/components/Sidebar.tsx
  - src/app/api/admin/features/route.ts
  - src/app/listings/[id]/documents/page.tsx
  - src/lib/auth.ts
  - src/app/api/listings/route.ts
  - license-server/api/license/verify.ts
  - src/components/listings/SupplementStatusIcon.tsx
  - license-server/api/features/index.ts
  - src/lib/db/list-recent-helper.ts
  - src/app/api/listings/folders/[id]/route.ts
  - src/lib/generators/disclosure-document.ts
  - src/types/electron.d.ts
  - scripts/obfuscate-build.js
  - src/app/api/admin/users/[id]/disable/route.ts
  - src/components/FolderSidebar.tsx
  - src/app/listings/[id]/generating/page.tsx
  - src/app/api/license/features/route.ts
  - src/components/Stepper.tsx
  - src/lib/pdf-generator/dossier.ts
  - src/proxy.ts
  - src/lib/audit.ts
  - src/app/api/license/init/route.ts
  - electron/updater.ts
  - src/lib/features/client.ts
  - electron/main.ts
  - .github/workflows/release.yml
  - src/app/api/listings/folders/route.ts
  - license-server/vercel.json
  - src/app/api/listings/[id]/restore/route.ts
  - src/lib/generators/property-sheet.ts
  - src/lib/db/index.ts
  - src/app/api/admin/transfer-cases/route.ts
  - config/branding.json
  - src/lib/generators/disclaimer.ts
  - src/components/SearchBar.tsx
  - package.json
  - src/lib/pdf-generator/survey-sales.ts
  - src/app/listings/[id]/supplement/page.tsx
  - src/app/settings/page.tsx
  - src/lib/listings/supplementary-status.ts
  - src/lib/license/server-verify.ts
  - scripts/upload-release-to-r2.js
tests:
  - e2e/listing-ux.spec.ts
  - e2e/user-management.spec.ts
  - src/components/__tests__/Stepper.test.tsx
-->

---
### Requirement: Codex CLI 內包

Electron 安裝檔 SHALL 內包 Codex CLI binary，客戶無須額外安裝 Node.js 或 npm。

#### Scenario: Codex 隨 app 安裝

- **WHEN** 客戶安裝「不動產 AI 系統」
- **THEN** Codex CLI binary 自動安裝至 app 的 resources/codex/ 目錄，可直接呼叫

##### Example: macOS Apple Silicon 安裝

- **GIVEN** 客戶使用 macOS Apple Silicon（M1/M2/M3）
- **WHEN** 從 .dmg 安裝 app
- **THEN** app bundle 內含 resources/codex/codex-darwin-arm64，Electron 主程序設定 PATH 包含該路徑


<!-- @trace
source: electron-desktop-shell
updated: 2026-05-06
code:
  - src/lib/pdf-generator/survey-sales.ts
  - electron/updater.ts
  - src/app/login/page.tsx
  - src/lib/auth/db.ts
  - src/lib/pdf-generator/dossier.ts
  - scripts/create-admin.ts
  - src/lib/scrapers/tax-calculator.ts
  - src/proxy.ts
  - src/middleware.ts
  - src/lib/pdf-generator/chromium-launcher.ts
  - AGENTS.md
  - src/lib/db/index.ts
  - electron/preload.ts
  - src/app/api/auth/refresh/route.ts
  - src/types/electron.d.ts
  - src/app/listings/page.tsx
  - Dockerfile
  - scripts/generate-license.ts
  - src/app/api/auth/[...nextauth]/route.ts
  - migrations/004_auth_license.sql
  - electron/main.ts
  - package.json
  - src/components/UpdateChecker.tsx
  - src/lib/scrapers/bank-estimator.ts
  - .env.example
tests:
  - scripts/generate-license.test.ts
  - src/lib/__tests__/scrapers/bank-estimator.test.ts
  - src/middleware.test.ts
  - src/app/login/page.test.ts
  - src/app/api/auth/[...nextauth]/route.test.ts
  - src/lib/pdf-generator/__tests__/chromium-launcher.test.ts
  - src/lib/auth/__tests__/db.test.ts
  - src/lib/db/__tests__/auth-license-migration.test.ts
  - scripts/create-admin.test.ts
  - e2e/desktop-first-install.spec.ts
  - src/app/api/auth/refresh/route.test.ts
  - src/lib/__tests__/scrapers/tax-calculator.test.ts
-->

---
### Requirement: ChatGPT 授權流程

系統 SHALL 在首次啟動且 Codex 未授權時，引導客戶完成 ChatGPT 授權。

#### Scenario: OAuth 授權成功

- **WHEN** 客戶在 /setup/codex 頁面點擊「使用 ChatGPT 帳號授權」
- **THEN** 開啟系統瀏覽器到 ChatGPT OAuth 頁面 → 客戶授權 → callback 回 app → 驗證 token → 儲存至 OS Keychain

##### Example: OAuth 完整流程

- **GIVEN** 客戶有 ChatGPT Plus 帳號，首次啟動 app
- **WHEN** 點擊「使用 ChatGPT 帳號授權」
- **THEN** 系統瀏覽器開啟 https://auth.openai.com/authorize → 客戶登入並授權 → redirect 回 app 的 localhost callback → app 收到 token → 呼叫 GET /v1/models 驗證 → 成功 → 儲存 token 到 macOS Keychain → 重導至主畫面

#### Scenario: 手動貼 API Key

- **WHEN** 客戶選擇「手動輸入 API Key」並貼入有效 key
- **THEN** 呼叫 OpenAI API 驗證 key 有效性 → 儲存至 OS Keychain → 重導至主畫面

##### Example: 手動輸入有效 Key

- **GIVEN** 客戶從 platform.openai.com/api-keys 複製了有效的 API Key `sk-proj-abc123...`
- **WHEN** 在 /setup/codex 頁面的輸入框貼入該 key 並點擊「驗證」
- **THEN** 系統呼叫 GET /v1/models 帶 Authorization: Bearer sk-proj-abc123... → 回 200 → 儲存 key 到 macOS Keychain → 重導至主畫面

#### Scenario: 無效 API Key

- **WHEN** 客戶輸入無效或過期的 API Key
- **THEN** 顯示錯誤「API Key 無效，請確認後重新輸入」，不允許進入主畫面

##### Example: 過期 Key 被拒

- **GIVEN** 客戶貼入已撤銷的 API Key `sk-proj-expired...`
- **WHEN** 系統呼叫 GET /v1/models 帶該 key
- **THEN** OpenAI 回 HTTP 401 → 頁面顯示「API Key 無效，請確認後重新輸入」→ 輸入框清空，焦點回到輸入框


<!-- @trace
source: electron-desktop-shell
updated: 2026-05-06
code:
  - src/lib/pdf-generator/survey-sales.ts
  - electron/updater.ts
  - src/app/login/page.tsx
  - src/lib/auth/db.ts
  - src/lib/pdf-generator/dossier.ts
  - scripts/create-admin.ts
  - src/lib/scrapers/tax-calculator.ts
  - src/proxy.ts
  - src/middleware.ts
  - src/lib/pdf-generator/chromium-launcher.ts
  - AGENTS.md
  - src/lib/db/index.ts
  - electron/preload.ts
  - src/app/api/auth/refresh/route.ts
  - src/types/electron.d.ts
  - src/app/listings/page.tsx
  - Dockerfile
  - scripts/generate-license.ts
  - src/app/api/auth/[...nextauth]/route.ts
  - migrations/004_auth_license.sql
  - electron/main.ts
  - package.json
  - src/components/UpdateChecker.tsx
  - src/lib/scrapers/bank-estimator.ts
  - .env.example
tests:
  - scripts/generate-license.test.ts
  - src/lib/__tests__/scrapers/bank-estimator.test.ts
  - src/middleware.test.ts
  - src/app/login/page.test.ts
  - src/app/api/auth/[...nextauth]/route.test.ts
  - src/lib/pdf-generator/__tests__/chromium-launcher.test.ts
  - src/lib/auth/__tests__/db.test.ts
  - src/lib/db/__tests__/auth-license-migration.test.ts
  - scripts/create-admin.test.ts
  - e2e/desktop-first-install.spec.ts
  - src/app/api/auth/refresh/route.test.ts
  - src/lib/__tests__/scrapers/tax-calculator.test.ts
-->

---
### Requirement: 訂閱驗證

系統 SHALL 驗證客戶的 ChatGPT 帳號具有 Plus 訂閱（$20/月）才允許使用 AI 功能。

#### Scenario: 有 Plus 訂閱

- **WHEN** 授權完成且帳號有 ChatGPT Plus
- **THEN** AI 功能正常可用

##### Example: Plus 帳號正常使用

- **GIVEN** 客戶用 ChatGPT Plus 帳號完成 OAuth 授權
- **WHEN** 系統呼叫 OpenAI API 檢查帳號方案
- **THEN** 偵測到 Plus 方案 → AI 功能按鈕全部啟用（文件生成、OCR 解析、行銷文案等）→ 正常進入主畫面

#### Scenario: 無 Plus 訂閱

- **WHEN** 授權完成但帳號無 ChatGPT Plus
- **THEN** 顯示「需要 ChatGPT Plus 訂閱才能使用 AI 功能，請升級後重試」

##### Example: 免費帳號嘗試使用

- **GIVEN** 客戶用免費 ChatGPT 帳號完成 OAuth 授權
- **WHEN** 系統檢查訂閱狀態
- **THEN** 偵測到非 Plus 方案 → 顯示提示訊息 → AI 相關按鈕灰色停用 → 其他非 AI 功能正常可用


<!-- @trace
source: electron-desktop-shell
updated: 2026-05-06
code:
  - src/lib/pdf-generator/survey-sales.ts
  - electron/updater.ts
  - src/app/login/page.tsx
  - src/lib/auth/db.ts
  - src/lib/pdf-generator/dossier.ts
  - scripts/create-admin.ts
  - src/lib/scrapers/tax-calculator.ts
  - src/proxy.ts
  - src/middleware.ts
  - src/lib/pdf-generator/chromium-launcher.ts
  - AGENTS.md
  - src/lib/db/index.ts
  - electron/preload.ts
  - src/app/api/auth/refresh/route.ts
  - src/types/electron.d.ts
  - src/app/listings/page.tsx
  - Dockerfile
  - scripts/generate-license.ts
  - src/app/api/auth/[...nextauth]/route.ts
  - migrations/004_auth_license.sql
  - electron/main.ts
  - package.json
  - src/components/UpdateChecker.tsx
  - src/lib/scrapers/bank-estimator.ts
  - .env.example
tests:
  - scripts/generate-license.test.ts
  - src/lib/__tests__/scrapers/bank-estimator.test.ts
  - src/middleware.test.ts
  - src/app/login/page.test.ts
  - src/app/api/auth/[...nextauth]/route.test.ts
  - src/lib/pdf-generator/__tests__/chromium-launcher.test.ts
  - src/lib/auth/__tests__/db.test.ts
  - src/lib/db/__tests__/auth-license-migration.test.ts
  - scripts/create-admin.test.ts
  - e2e/desktop-first-install.spec.ts
  - src/app/api/auth/refresh/route.test.ts
  - src/lib/__tests__/scrapers/tax-calculator.test.ts
-->

---
### Requirement: 生產模式鎖定

當 `NEXT_PUBLIC_APP_MODE=production` 時，系統 SHALL 只使用 Codex 後端，隱藏開發者設定 UI。codex-client 初始化時 SHALL 強制使用 Codex adapter，忽略其他 adapter 設定。

#### Scenario: 生產模式隱藏設定

- **WHEN** app 以 production mode 啟動（`NEXT_PUBLIC_APP_MODE=production`）
- **THEN** 設定頁面 SHALL NOT 顯示 Gemini/Claude/Ollama 選項
- **THEN** LLM 後端切換 UI SHALL 隱藏

#### Scenario: 生產模式強制 Codex adapter

- **WHEN** `NEXT_PUBLIC_APP_MODE=production` 且 codex-client 初始化
- **THEN** system SHALL 使用 Codex adapter，即使 .env 設定其他 adapter

##### Example: 生產模式 UI

- **GIVEN** 環境變數 `NEXT_PUBLIC_APP_MODE=production`
- **WHEN** 客戶瀏覽 `/setup/codex` 頁面
- **THEN** 只顯示 API Key 輸入區塊和授權狀態（已授權 / 未授權），不顯示其他 LLM provider 選項

<!-- @trace
source: app-icon-and-codex-setup
updated: 2026-05-07
code:
  - scripts/generate-icons.ts
  - src/app/api/admin/licenses/update-info/route.ts
  - license-server/api/updates/check.ts
  - src/app/api/setup/verify-openai/route.ts
  - license-server/lib/store.ts
  - src/app/admin/licenses/page.tsx
  - src/app/api/admin/licenses/unbind-machine/route.ts
  - scripts/fix-standalone-symlinks.js
  - src/app/setup/page.tsx
  - license-server/api/license/update-info.ts
  - electron/codex-guide.html
  - electron-builder.json
  - electron/preload.ts
  - license-server/vercel.json
  - electron/launcher.ts
  - license-server/api/license/transfer.ts
  - src/lib/admin-auth.ts
  - license-server/api/license/verify.ts
  - src/app/api/admin/licenses/route.ts
  - license-server/lib/admin-auth.ts
  - src/lib/db/schema.ts
  - src/middleware.ts
  - scripts/materialize-standalone-symlinks.js
  - src/app/api/admin/licenses/transfer/route.ts
  - license-server/api/license/activate.ts
  - license-server/api/license/list.ts
  - .vercelignore
  - src/app/setup/admin/page.tsx
  - license-server/lib/serial.ts
  - src/app/api/setup/create-first-admin/route.ts
  - vercel.json
  - src/app/api/admin/licenses/revoke/route.ts
  - electron/updater.ts
  - package.json
  - electron/main.ts
  - license-server/api/features/index.ts
  - src/app/setup/codex/page.tsx
  - license-server/api/license/create.ts
  - license-server/api/license/revoke.ts
  - license-server/lib/machine-id.ts
  - src/lib/codex-client/key-store.ts
  - .github/workflows/release.yml
  - scripts/generate-license.ts
tests:
  - license-server/api/license/__tests__/update-info.test.ts
  - license-server/api/license/__tests__/revoke.test.ts
  - license-server/api/license/__tests__/create.test.ts
  - e2e/admin-licenses.spec.ts
  - license-server/api/license/__tests__/activate-verify.test.ts
  - license-server/api/license/__tests__/transfer.test.ts
  - license-server/lib/__tests__/serial.test.ts
  - src/lib/codex-client/__tests__/key-store.test.ts
  - license-server/api/license/__tests__/list.test.ts
  - license-server/api/license/__tests__/end-to-end-flow.test.ts
  - src/app/api/setup/verify-openai/route.test.ts
  - scripts/generate-icons.test.ts
-->