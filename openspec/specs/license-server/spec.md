# license-server Specification

## Purpose

TBD - created by archiving change 'electron-desktop-app'. Update Purpose after archive.

## Requirements

### Requirement: Server-side license activation

The system SHALL activate a license key by binding it to an email address and recording the client IP on first use.

#### Scenario: Successful activation

- **WHEN** client sends POST /api/license/activate with valid license_key and email
- **THEN** server SHALL bind the license to that email and record the allowed IP CIDR
- **THEN** server SHALL return HTTP 200 with activation confirmation

#### Scenario: Already activated license

- **WHEN** client sends activation request for an already-activated license
- **THEN** server SHALL return HTTP 409 with error "LICENSE_ALREADY_ACTIVATED"


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
### Requirement: Server-side license verification

The system SHALL verify license validity on every application startup by checking email, license key, IP, and expiration.

#### Scenario: Valid license and IP

- **WHEN** client sends POST /api/license/verify with valid license_key, matching email, and IP within allowed CIDR
- **THEN** server SHALL return HTTP 200 with status "valid"

#### Scenario: IP outside allowed range

- **WHEN** client IP is outside the license's allowed CIDR
- **THEN** server SHALL return HTTP 403 with error "IP_NOT_ALLOWED"

#### Scenario: Expired license

- **WHEN** license expiration date has passed
- **THEN** server SHALL return HTTP 403 with error "LICENSE_EXPIRED"


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
### Requirement: Offline lockout

The system SHALL lock the application when it cannot reach the license server.

#### Scenario: Network unavailable

- **WHEN** application cannot connect to the license server on startup
- **THEN** application SHALL display "請連接網路以驗證授權" and block all functionality

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
### Requirement: 激活 API

License Server SHALL 提供 `POST /api/license/activate` 端點，接收序號 + Email + machineId，綁定授權。

#### Scenario: 首次激活成功

- **WHEN** 收到有效序號 + Email + machineId，且該序號尚未被激活
- **THEN** 在 D1 資料庫寫入激活紀錄（序號、Email、machineId、IP、激活時間）→ 回傳 HTTP 200 + activation token

#### Scenario: 重複激活

- **WHEN** 收到已被另一台機器激活的序號
- **THEN** 回傳 HTTP 409 + `{ error: "LICENSE_ALREADY_ACTIVATED" }`

#### Scenario: 無效序號格式

- **WHEN** 收到格式不符 `RE-AI-` 前綴或簽名驗證失敗的序號
- **THEN** 回傳 HTTP 400 + `{ error: "INVALID_LICENSE_KEY" }`


<!-- @trace
source: license-and-auto-update
updated: 2026-05-06
code:
  - src/app/api/auth/[...nextauth]/route.ts
  - Dockerfile
  - migrations/004_auth_license.sql
  - src/app/api/auth/refresh/route.ts
  - src/types/electron.d.ts
  - src/app/listings/page.tsx
  - scripts/generate-license.ts
  - src/lib/auth/db.ts
  - src/lib/scrapers/bank-estimator.ts
  - electron/updater.ts
  - src/lib/scrapers/tax-calculator.ts
  - package.json
  - src/lib/pdf-generator/dossier.ts
  - src/app/login/page.tsx
  - src/components/UpdateChecker.tsx
  - src/proxy.ts
  - src/lib/pdf-generator/chromium-launcher.ts
  - src/middleware.ts
  - src/lib/db/index.ts
  - AGENTS.md
  - .env.example
  - electron/main.ts
  - electron/preload.ts
  - src/lib/pdf-generator/survey-sales.ts
  - scripts/create-admin.ts
tests:
  - src/lib/db/__tests__/auth-license-migration.test.ts
  - src/lib/pdf-generator/__tests__/chromium-launcher.test.ts
  - src/app/login/page.test.ts
  - src/lib/auth/__tests__/db.test.ts
  - src/lib/__tests__/scrapers/bank-estimator.test.ts
  - src/middleware.test.ts
  - src/lib/__tests__/scrapers/tax-calculator.test.ts
  - scripts/create-admin.test.ts
  - src/app/api/auth/[...nextauth]/route.test.ts
  - e2e/desktop-first-install.spec.ts
  - scripts/generate-license.test.ts
  - src/app/api/auth/refresh/route.test.ts
-->

---
### Requirement: 驗證 API

License Server SHALL 提供 `POST /api/license/verify` 端點，檢查授權狀態。

#### Scenario: 授權有效

- **WHEN** 序號未過期且 machineId 匹配
- **THEN** 回傳 HTTP 200 + `{ status: "valid", expires: "2027-12-31T23:59:59+08:00" }`

#### Scenario: 授權過期

- **WHEN** 序號的 expires 日期已過
- **THEN** 回傳 HTTP 403 + `{ error: "LICENSE_EXPIRED" }`

#### Scenario: machineId 不匹配

- **WHEN** 請求的 machineId 與激活時綁定的不同
- **THEN** 回傳 HTTP 403 + `{ error: "MACHINE_MISMATCH" }`


<!-- @trace
source: license-and-auto-update
updated: 2026-05-06
code:
  - src/app/api/auth/[...nextauth]/route.ts
  - Dockerfile
  - migrations/004_auth_license.sql
  - src/app/api/auth/refresh/route.ts
  - src/types/electron.d.ts
  - src/app/listings/page.tsx
  - scripts/generate-license.ts
  - src/lib/auth/db.ts
  - src/lib/scrapers/bank-estimator.ts
  - electron/updater.ts
  - src/lib/scrapers/tax-calculator.ts
  - package.json
  - src/lib/pdf-generator/dossier.ts
  - src/app/login/page.tsx
  - src/components/UpdateChecker.tsx
  - src/proxy.ts
  - src/lib/pdf-generator/chromium-launcher.ts
  - src/middleware.ts
  - src/lib/db/index.ts
  - AGENTS.md
  - .env.example
  - electron/main.ts
  - electron/preload.ts
  - src/lib/pdf-generator/survey-sales.ts
  - scripts/create-admin.ts
tests:
  - src/lib/db/__tests__/auth-license-migration.test.ts
  - src/lib/pdf-generator/__tests__/chromium-launcher.test.ts
  - src/app/login/page.test.ts
  - src/lib/auth/__tests__/db.test.ts
  - src/lib/__tests__/scrapers/bank-estimator.test.ts
  - src/middleware.test.ts
  - src/lib/__tests__/scrapers/tax-calculator.test.ts
  - scripts/create-admin.test.ts
  - src/app/api/auth/[...nextauth]/route.test.ts
  - e2e/desktop-first-install.spec.ts
  - scripts/generate-license.test.ts
  - src/app/api/auth/refresh/route.test.ts
-->

---
### Requirement: 更新檢查 API

License Server SHALL 提供 `POST /api/license/check-update` 端點，授權有效時回傳更新資訊。

#### Scenario: 有新版本且授權有效

- **WHEN** 授權有效且伺服器有比客戶端更新的版本
- **THEN** 回傳 HTTP 200 + `{ available: true, version: "1.2.0", downloadUrl: "<R2 signed URL>", sha256: "<hash>" }`

#### Scenario: 已是最新版

- **WHEN** 客戶端版本等於或大於伺服器最新版
- **THEN** 回傳 HTTP 200 + `{ available: false }`

#### Scenario: 授權無效時檢查更新

- **WHEN** 序號無效或已過期
- **THEN** 回傳 HTTP 403 + `{ error: "LICENSE_INVALID" }`


<!-- @trace
source: license-and-auto-update
updated: 2026-05-06
code:
  - src/app/api/auth/[...nextauth]/route.ts
  - Dockerfile
  - migrations/004_auth_license.sql
  - src/app/api/auth/refresh/route.ts
  - src/types/electron.d.ts
  - src/app/listings/page.tsx
  - scripts/generate-license.ts
  - src/lib/auth/db.ts
  - src/lib/scrapers/bank-estimator.ts
  - electron/updater.ts
  - src/lib/scrapers/tax-calculator.ts
  - package.json
  - src/lib/pdf-generator/dossier.ts
  - src/app/login/page.tsx
  - src/components/UpdateChecker.tsx
  - src/proxy.ts
  - src/lib/pdf-generator/chromium-launcher.ts
  - src/middleware.ts
  - src/lib/db/index.ts
  - AGENTS.md
  - .env.example
  - electron/main.ts
  - electron/preload.ts
  - src/lib/pdf-generator/survey-sales.ts
  - scripts/create-admin.ts
tests:
  - src/lib/db/__tests__/auth-license-migration.test.ts
  - src/lib/pdf-generator/__tests__/chromium-launcher.test.ts
  - src/app/login/page.test.ts
  - src/lib/auth/__tests__/db.test.ts
  - src/lib/__tests__/scrapers/bank-estimator.test.ts
  - src/middleware.test.ts
  - src/lib/__tests__/scrapers/tax-calculator.test.ts
  - scripts/create-admin.test.ts
  - src/app/api/auth/[...nextauth]/route.test.ts
  - e2e/desktop-first-install.spec.ts
  - scripts/generate-license.test.ts
  - src/app/api/auth/refresh/route.test.ts
-->

---
### Requirement: Cloudflare Workers + D1 部署

License Server SHALL 部署在 Cloudflare Workers，資料存放在 D1 SQLite。

#### Scenario: D1 Schema

- **WHEN** License Server 部署
- **THEN** D1 包含 `licenses` 表：`id, license_key, company, email, machine_id, ip, activated_at, expires, revoked`

<!-- @trace
source: license-and-auto-update
updated: 2026-05-06
code:
  - src/app/api/auth/[...nextauth]/route.ts
  - Dockerfile
  - migrations/004_auth_license.sql
  - src/app/api/auth/refresh/route.ts
  - src/types/electron.d.ts
  - src/app/listings/page.tsx
  - scripts/generate-license.ts
  - src/lib/auth/db.ts
  - src/lib/scrapers/bank-estimator.ts
  - electron/updater.ts
  - src/lib/scrapers/tax-calculator.ts
  - package.json
  - src/lib/pdf-generator/dossier.ts
  - src/app/login/page.tsx
  - src/components/UpdateChecker.tsx
  - src/proxy.ts
  - src/lib/pdf-generator/chromium-launcher.ts
  - src/middleware.ts
  - src/lib/db/index.ts
  - AGENTS.md
  - .env.example
  - electron/main.ts
  - electron/preload.ts
  - src/lib/pdf-generator/survey-sales.ts
  - scripts/create-admin.ts
tests:
  - src/lib/db/__tests__/auth-license-migration.test.ts
  - src/lib/pdf-generator/__tests__/chromium-launcher.test.ts
  - src/app/login/page.test.ts
  - src/lib/auth/__tests__/db.test.ts
  - src/lib/__tests__/scrapers/bank-estimator.test.ts
  - src/middleware.test.ts
  - src/lib/__tests__/scrapers/tax-calculator.test.ts
  - scripts/create-admin.test.ts
  - src/app/api/auth/[...nextauth]/route.test.ts
  - e2e/desktop-first-install.spec.ts
  - scripts/generate-license.test.ts
  - src/app/api/auth/refresh/route.test.ts
-->