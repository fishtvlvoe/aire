# desktop-launcher Specification

## Purpose

TBD - created by archiving change 'electron-desktop-app'. Update Purpose after archive.

## Requirements

### Requirement: One-click application launch

The system SHALL start the Next.js server and open the application window when the user double-clicks the desktop icon.

#### Scenario: Normal startup

- **WHEN** user double-clicks the application icon
- **THEN** the system SHALL display a splash screen, start the Next.js server, and open the main window pointing to localhost once the server is ready

##### Example: Startup sequence

- **GIVEN** application is installed at C:\Program Files\AI-不動產說明書系統\
- **WHEN** user double-clicks desktop shortcut
- **THEN** t=0s: splash screen appears → t=2s: Next.js server starts on port 3000 → t=3s: server reports ready → splash closes → BrowserWindow opens http://localhost:3000

#### Scenario: Startup time

- **WHEN** the application launches on a standard machine
- **THEN** the main window SHALL be visible within 5 seconds


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
### Requirement: Splash screen during startup

The system SHALL display a branded splash screen while the server is initializing.

#### Scenario: Splash screen content

- **WHEN** application is starting
- **THEN** a splash screen showing "AI 不動產說明書系統" and a loading indicator SHALL be displayed until the server is ready

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
### Requirement: 一鍵啟動流程

Electron 主程序 SHALL 管理完整的應用啟動生命週期：啟動 Next.js server → 等待就緒 → 開啟視窗 → 關閉視窗時清理 server。

#### Scenario: 正常啟動

- **WHEN** 用戶雙擊 app icon
- **THEN** 顯示啟動畫面（splash）→ 背景啟動 Next.js server → server ready 後顯示主視窗 → 隱藏 splash

##### Example: 首次啟動完整流程

- **GIVEN** 用戶剛安裝完「不動產 AI 系統.app」，首次雙擊開啟
- **WHEN** Electron 主程序啟動
- **THEN** 顯示 splash 畫面（品牌 logo + 載入指示器）→ 背景 spawn server.js on port 3000 → HTTP GET localhost:3000 回 200 → 建立 BrowserWindow 載入頁面 → 隱藏 splash（總耗時約 3-8 秒）

#### Scenario: 啟動失敗

- **WHEN** Next.js server 無法在 30 秒內啟動
- **THEN** 顯示錯誤對話框「系統啟動失敗，請聯繫技術支援」並提供「重試」和「退出」按鈕

#### Scenario: 應用關閉

- **WHEN** 用戶關閉最後一個視窗（macOS 按 ⌘Q，Windows 按右上角 X）
- **THEN** Electron 主程序終止 Next.js server 子程序 → 退出 app

##### Example: macOS 關閉流程

- **GIVEN** app 正在執行，Next.js server 跑在 port 3000
- **WHEN** 用戶按 ⌘Q
- **THEN** Electron 送 SIGTERM 給 server.js 子程序 → 等待最多 5 秒 → 子程序結束 → app.quit() → port 3000 釋放


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
### Requirement: 開發模式快速啟動

開發時 SHALL 支援 `npm run dev:electron` 同時啟動 Next.js dev server 和 Electron 視窗，支援 Hot Reload。

#### Scenario: 開發模式

- **WHEN** 開發者執行 `npm run dev:electron`
- **THEN** 啟動 `next dev` + Electron 連接 `localhost:3000`，代碼修改後頁面自動刷新

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