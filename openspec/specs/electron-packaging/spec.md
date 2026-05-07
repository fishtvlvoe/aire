# electron-packaging Specification

## Purpose

TBD - created by archiving change 'electron-desktop-app'. Update Purpose after archive.

## Requirements

### Requirement: Build standalone desktop application
The system SHALL produce installable desktop applications via electron-builder: a DMG installer for macOS containing a .app bundle, and an NSIS installer for Windows producing a .exe. The electron-builder configuration in package.json SHALL include publish settings for the generic update provider. The build process SHALL include the electron-updater package in the output.

#### Scenario: macOS build produces DMG
- **WHEN** running electron-builder for macOS target
- **THEN** the build SHALL produce a DMG file containing the .app bundle
- **THEN** the .app SHALL launch successfully and start the Next.js server

##### Example: macOS DMG build
- **GIVEN** electron-builder configured with mac target in package.json
- **WHEN** running `npm run dist:mac`
- **THEN** dist/AI 不動產說明書系統-1.0.0.dmg is created
- **THEN** opening the DMG and launching the .app shows the splash screen then the main UI

#### Scenario: Windows build produces NSIS installer
- **WHEN** running electron-builder for Windows target
- **THEN** the build SHALL produce an NSIS .exe installer
- **THEN** the installer SHALL create a desktop shortcut upon installation

##### Example: Windows NSIS build
- **GIVEN** electron-builder configured with win target in package.json
- **WHEN** running `npm run dist:win`
- **THEN** dist/AI 不動產說明書系統 Setup 1.0.0.exe is created
- **THEN** running the installer creates a desktop shortcut that launches the app


<!-- @trace
source: desktop-commercial-complete
updated: 2026-05-07
code:
  - src/app/setup/page.tsx
  - src/lib/scrapers/tax-calculator.ts
  - license-server/api/updates/check.ts
  - license-server/lib/serial.ts
  - src/types/electron.d.ts
  - src/middleware.ts
  - src/lib/codex-client/key-store.ts
  - src/app/api/admin/licenses/transfer/route.ts
  - src/lib/db/index.ts
  - src/app/api/setup/create-first-admin/route.ts
  - src/app/api/setup/verify-openai/route.ts
  - AGENTS.md
  - src/lib/pdf-generator/survey-sales.ts
  - src/lib/pdf-generator/dossier.ts
  - src/lib/auth/db.ts
  - license-server/api/license/transfer.ts
  - Dockerfile
  - license-server/vercel.json
  - scripts/materialize-standalone-symlinks.js
  - license-server/lib/machine-id.ts
  - src/app/api/admin/licenses/route.ts
  - electron/updater.ts
  - electron-builder.json
  - scripts/create-admin.ts
  - src/app/api/admin/licenses/revoke/route.ts
  - .vercelignore
  - src/lib/scrapers/bank-estimator.ts
  - migrations/004_auth_license.sql
  - scripts/generate-icons.ts
  - src/app/api/auth/refresh/route.ts
  - license-server/api/license/revoke.ts
  - package.json
  - src/proxy.ts
  - electron/preload.ts
  - src/lib/db/schema.ts
  - license-server/api/features/index.ts
  - license-server/api/license/create.ts
  - .env.example
  - license-server/api/license/list.ts
  - .github/workflows/release.yml
  - src/app/login/page.tsx
  - src/components/UpdateChecker.tsx
  - src/lib/pdf-generator/chromium-launcher.ts
  - license-server/api/license/activate.ts
  - scripts/fix-standalone-symlinks.js
  - vercel.json
  - src/app/api/admin/licenses/unbind-machine/route.ts
  - electron/launcher.ts
  - scripts/generate-license.ts
  - src/app/setup/codex/page.tsx
  - electron/main.ts
  - license-server/api/license/verify.ts
  - src/app/admin/licenses/page.tsx
  - license-server/lib/store.ts
  - src/app/setup/admin/page.tsx
  - src/lib/admin-auth.ts
  - electron/codex-guide.html
  - src/app/api/auth/[...nextauth]/route.ts
  - license-server/api/license/update-info.ts
  - license-server/lib/admin-auth.ts
  - src/app/api/admin/licenses/update-info/route.ts
  - src/app/listings/page.tsx
tests:
  - src/app/api/auth/[...nextauth]/route.test.ts
  - src/lib/db/__tests__/auth-license-migration.test.ts
  - src/middleware.test.ts
  - license-server/lib/__tests__/serial.test.ts
  - license-server/api/license/__tests__/update-info.test.ts
  - src/app/api/setup/verify-openai/route.test.ts
  - e2e/desktop-first-install.spec.ts
  - scripts/generate-icons.test.ts
  - license-server/api/license/__tests__/activate-verify.test.ts
  - src/lib/pdf-generator/__tests__/chromium-launcher.test.ts
  - src/lib/auth/__tests__/db.test.ts
  - e2e/admin-licenses.spec.ts
  - license-server/api/license/__tests__/revoke.test.ts
  - license-server/api/license/__tests__/create.test.ts
  - src/app/login/page.test.ts
  - src/app/api/auth/refresh/route.test.ts
  - src/lib/__tests__/scrapers/tax-calculator.test.ts
  - src/lib/codex-client/__tests__/key-store.test.ts
  - license-server/api/license/__tests__/end-to-end-flow.test.ts
  - scripts/create-admin.test.ts
  - license-server/api/license/__tests__/list.test.ts
  - license-server/api/license/__tests__/transfer.test.ts
  - src/lib/__tests__/scrapers/bank-estimator.test.ts
  - scripts/generate-license.test.ts
-->

---
### Requirement: Next.js standalone integration

The system SHALL use Next.js output: standalone mode to minimize the bundled application size.

#### Scenario: Standalone build size

- **WHEN** the application is built in standalone mode
- **THEN** the total application size SHALL be under 350MB (excluding Chromium)


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
### Requirement: Desktop shortcut creation

The system SHALL create a desktop shortcut during installation.

#### Scenario: Post-installation shortcut

- **WHEN** installation completes
- **THEN** a desktop shortcut named "AI 不動產說明書系統" with the application icon SHALL be present

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
### Requirement: Next.js Standalone Packaging

Electron 主程序 SHALL 在生產模式下使用 Next.js standalone output 啟動內嵌 HTTP server，不依賴外部 node_modules。

#### Scenario: 生產模式啟動

- **WHEN** 用戶雙擊「不動產 AI 系統」app icon
- **THEN** Electron 主程序啟動 `.next/standalone/server.js`，等待 HTTP server ready 後建立 BrowserWindow 載入頁面

#### Scenario: Port 衝突自動遞增

- **WHEN** 預設 port 3000 已被佔用
- **THEN** 系統自動嘗試 3001-3010，使用第一個可用 port

##### Example: Port 3000 被佔用

- **GIVEN** 系統上已有程序佔用 port 3000
- **WHEN** Electron 主程序嘗試啟動 Next.js server
- **THEN** server 啟動在 port 3001，BrowserWindow 載入 `http://localhost:3001`


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
### Requirement: macOS 打包

electron-builder SHALL 產出 macOS `.dmg` 安裝檔，支援 Apple Silicon (arm64) 和 Intel (x64) 架構。

#### Scenario: macOS DMG 產出

- **WHEN** 執行 `npm run build:mac`
- **THEN** 在 `dist-electron/` 產出 `不動產 AI 系統-{version}-arm64.dmg` 和 `不動產 AI 系統-{version}-x64.dmg`


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
### Requirement: Windows 打包

electron-builder SHALL 產出 Windows NSIS `.exe` 安裝程式，支援繁體中文安裝介面。

#### Scenario: Windows NSIS 產出

- **WHEN** 執行 `npm run build:win`
- **THEN** 在 `dist-electron/` 產出 `不動產 AI 系統 Setup {version}.exe`


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
### Requirement: App 品牌設定

安裝檔和應用程式 SHALL 使用以下品牌資訊：

- productName: `不動產 AI 系統`
- appId: `com.nucleusflow.real-estate-ai`
- App icon: 1024x1024 PNG 轉換為 `.icns`（macOS）和 `.ico`（Windows），存放於 `build/` 目錄

electron-builder 設定 SHALL 在 `package.json` 的 `build` 欄位包含：
- `icon`: `build/icon.png`（electron-builder 自動依平台選用 .icns 或 .ico）
- `directories.buildResources`: `build`

#### Scenario: App icon 顯示

- **WHEN** 用戶在 macOS Dock 或 Windows 工作列查看
- **THEN** 顯示「不動產 AI 系統」專屬 icon（建築輪廓 + AI 元素，深藍色調）

#### Scenario: electron-builder icon resolution

- **WHEN** electron-builder runs for macOS target
- **THEN** it SHALL use `build/icon.icns` for the .app bundle
- **WHEN** electron-builder runs for Windows target
- **THEN** it SHALL use `build/icon.ico` for the .exe installer

##### Example: macOS Dock icon

- **GIVEN** `build/icon.icns` exists with valid 1024x1024 source
- **WHEN** app is installed and running on macOS
- **THEN** Dock displays the custom icon with product name「不動產 AI 系統」


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
### Requirement: 無框視窗外觀

BrowserWindow SHALL 不顯示網址列、書籤列、瀏覽器工具列，僅保留系統級視窗控制（最小化/最大化/關閉）。

#### Scenario: macOS 視窗外觀

- **WHEN** app 在 macOS 上啟動
- **THEN** 視窗使用 `hiddenInset` title bar style，交通燈按鈕內嵌在視窗左上角

#### Scenario: Windows 視窗外觀

- **WHEN** app 在 Windows 上啟動
- **THEN** 視窗保留標準框架（最小化/最大化/關閉按鈕在右上角），不顯示網址列

##### Example: Windows 視窗尺寸

- **GIVEN** app 在 Windows 11 上首次啟動
- **WHEN** BrowserWindow 建立完成
- **THEN** 視窗初始大小 1280x800，最小可縮至 1024x600，無網址列和書籤列

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
### Requirement: Electron build produces valid Mac and Windows installers

The electron:pack:mac command SHALL produce a DMG installer for macOS (arm64 + x64). The electron:pack:win command SHALL produce an NSIS installer for Windows (x64). Both installers SHALL include the Next.js standalone build, Codex CLI detection logic, and updated setup wizard (3-step flow).

#### Scenario: Mac DMG build succeeds
- **WHEN** developer runs "npm run electron:pack:mac"
- **THEN** a DMG file is produced in the dist/ directory without errors

#### Scenario: Windows NSIS build succeeds
- **WHEN** developer runs "npm run electron:pack:win"
- **THEN** an NSIS installer (.exe) is produced in the dist/ directory without errors

#### Scenario: Built app launches and shows setup wizard
- **WHEN** user opens the built app for the first time (no license cache)
- **THEN** the app displays the license activation page (/setup) after splash screen

##### Example: First launch flow
- **GIVEN** freshly installed app on macOS with no ~/.three-ai/license-cache.json
- **WHEN** user double-clicks the .app
- **THEN** splash screen appears for 3-5 seconds, then browser window loads /setup with license key input form

#### Scenario: Built app includes Codex CLI detection
- **WHEN** user opens the built app and Codex CLI is not installed
- **THEN** the app displays the Codex CLI installation guide instead of the main application

##### Example: Missing Codex on fresh Windows install
- **GIVEN** freshly installed app on Windows where "where codex" returns exit code 1
- **WHEN** user opens the .exe
- **THEN** instead of splash screen transitioning to /setup, the app shows the Codex CLI installation guide HTML with "npm install -g @openai/codex" command

<!-- @trace
source: license-admin-ui-redesign
updated: 2026-05-07
code:
  - license-server/api/license/transfer.ts
  - scripts/fix-standalone-symlinks.js
  - license-server/api/license/verify.ts
  - scripts/generate-icons.ts
  - src/lib/codex-client/key-store.ts
  - electron/updater.ts
  - .github/workflows/release.yml
  - license-server/api/updates/check.ts
  - vercel.json
  - src/app/api/admin/licenses/route.ts
  - scripts/materialize-standalone-symlinks.js
  - src/app/api/admin/licenses/transfer/route.ts
  - src/app/api/admin/licenses/unbind-machine/route.ts
  - license-server/lib/store.ts
  - src/app/api/setup/create-first-admin/route.ts
  - src/app/setup/admin/page.tsx
  - src/app/setup/page.tsx
  - src/app/api/admin/licenses/revoke/route.ts
  - electron-builder.json
  - electron/preload.ts
  - src/app/api/setup/verify-openai/route.ts
  - license-server/vercel.json
  - license-server/lib/machine-id.ts
  - license-server/api/license/update-info.ts
  - electron/main.ts
  - license-server/api/features/index.ts
  - scripts/generate-license.ts
  - license-server/api/license/activate.ts
  - .vercelignore
  - src/app/admin/licenses/page.tsx
  - license-server/lib/serial.ts
  - src/middleware.ts
  - license-server/api/license/create.ts
  - src/lib/admin-auth.ts
  - electron/codex-guide.html
  - src/lib/db/schema.ts
  - src/app/api/admin/licenses/update-info/route.ts
  - license-server/lib/admin-auth.ts
  - electron/launcher.ts
  - license-server/api/license/revoke.ts
  - src/app/setup/codex/page.tsx
  - package.json
  - license-server/api/license/list.ts
tests:
  - license-server/api/license/__tests__/update-info.test.ts
  - license-server/api/license/__tests__/revoke.test.ts
  - license-server/api/license/__tests__/list.test.ts
  - scripts/generate-icons.test.ts
  - license-server/lib/__tests__/serial.test.ts
  - license-server/api/license/__tests__/end-to-end-flow.test.ts
  - license-server/api/license/__tests__/transfer.test.ts
  - src/app/api/setup/verify-openai/route.test.ts
  - license-server/api/license/__tests__/create.test.ts
  - license-server/api/license/__tests__/activate-verify.test.ts
  - src/lib/codex-client/__tests__/key-store.test.ts
  - e2e/admin-licenses.spec.ts
-->