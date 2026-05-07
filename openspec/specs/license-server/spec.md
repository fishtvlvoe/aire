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

---
### Requirement: License generation CLI
The system SHALL provide scripts/generate-license.ts that accepts --company and --expires arguments. The script SHALL call the License Server API to create a new license record and output the generated serial key to stdout. The script SHALL validate that --expires is a valid ISO 8601 date in the future.

#### Scenario: Generate license successfully
- **WHEN** running tsx scripts/generate-license.ts --company "建安不動產" --expires "2027-12-31"
- **THEN** the script SHALL create a license record via the License Server API
- **THEN** the script SHALL print the generated serial key to stdout and exit with code 0

#### Scenario: Invalid expiry date
- **WHEN** running the script with --expires set to a past date
- **THEN** the script SHALL print an error message and exit with code 1

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
### Requirement: Activation requires pre-issued serial

The system SHALL allow `POST /api/license/activate` only for serial keys that were pre-created by admin and are currently in `issued` status.

#### Scenario: Activate a pre-issued serial key

- **WHEN** client calls `POST /api/license/activate` with `email` and an `issued` serial key
- **THEN** server SHALL return HTTP 200 and set record status to `activated`
- **THEN** server SHALL persist `activatedAt` and normalized lowercase email

#### Scenario: Reject activation for non-preissued key

- **WHEN** client calls `POST /api/license/activate` with a key that does not exist in serial inventory
- **THEN** server SHALL return HTTP 404 with `{ "valid": false, "reason": "license_not_found" }`

#### Scenario: Reject activation for revoked key

- **WHEN** client calls `POST /api/license/activate` with a key whose status is `revoked`
- **THEN** server SHALL return HTTP 403 with `{ "valid": false, "reason": "license_inactive" }`


<!-- @trace
source: license-serial-generator-flow
updated: 2026-05-07
code:
  - electron/launcher.ts
  - electron/preload.ts
  - license-server/lib/store.ts
  - .vercelignore
  - src/app/setup/admin/page.tsx
  - scripts/fix-standalone-symlinks.js
  - scripts/materialize-standalone-symlinks.js
  - src/app/api/admin/licenses/revoke/route.ts
  - electron/main.ts
  - scripts/generate-license.ts
  - src/lib/admin-auth.ts
  - license-server/api/license/list.ts
  - license-server/vercel.json
  - src/lib/codex-client/key-store.ts
  - src/app/admin/licenses/page.tsx
  - src/app/api/setup/verify-openai/route.ts
  - license-server/lib/machine-id.ts
  - license-server/api/license/revoke.ts
  - src/app/api/admin/licenses/route.ts
  - license-server/api/license/create.ts
  - electron/codex-guide.html
  - license-server/api/license/transfer.ts
  - src/app/api/setup/create-first-admin/route.ts
  - electron/updater.ts
  - .github/workflows/release.yml
  - license-server/lib/admin-auth.ts
  - license-server/lib/serial.ts
  - src/app/setup/codex/page.tsx
  - src/app/api/admin/licenses/update-info/route.ts
  - src/app/api/admin/licenses/transfer/route.ts
  - scripts/generate-icons.ts
  - license-server/api/license/activate.ts
  - src/lib/db/schema.ts
  - license-server/api/license/update-info.ts
  - license-server/api/features/index.ts
  - electron-builder.json
  - license-server/api/license/verify.ts
  - license-server/api/updates/check.ts
  - src/app/api/admin/licenses/unbind-machine/route.ts
  - src/app/setup/page.tsx
  - src/middleware.ts
  - package.json
  - vercel.json
tests:
  - license-server/api/license/__tests__/update-info.test.ts
  - license-server/api/license/__tests__/transfer.test.ts
  - license-server/lib/__tests__/serial.test.ts
  - src/app/api/setup/verify-openai/route.test.ts
  - license-server/api/license/__tests__/end-to-end-flow.test.ts
  - license-server/api/license/__tests__/create.test.ts
  - e2e/admin-licenses.spec.ts
  - license-server/api/license/__tests__/revoke.test.ts
  - scripts/generate-icons.test.ts
  - license-server/api/license/__tests__/list.test.ts
  - license-server/api/license/__tests__/activate-verify.test.ts
  - src/lib/codex-client/__tests__/key-store.test.ts
-->

---
### Requirement: Verification enforces lifecycle status

The system SHALL enforce lifecycle status on `POST /api/license/verify` so only `activated` and non-expired records can pass verification.

#### Scenario: Verify activated and non-expired key

- **WHEN** client calls `POST /api/license/verify` with matching email and an `activated` key before `expiresAt`
- **THEN** server SHALL return HTTP 200 with `{ "valid": true }`

#### Scenario: Verify issued but not activated key

- **WHEN** client calls `POST /api/license/verify` for an `issued` key
- **THEN** server SHALL return HTTP 403 with `{ "valid": false, "reason": "license_not_activated" }`

#### Scenario: Verify revoked key

- **WHEN** client calls `POST /api/license/verify` for a `revoked` key
- **THEN** server SHALL return HTTP 403 with `{ "valid": false, "reason": "license_inactive" }`

<!-- @trace
source: license-serial-generator-flow
updated: 2026-05-07
code:
  - electron/launcher.ts
  - electron/preload.ts
  - license-server/lib/store.ts
  - .vercelignore
  - src/app/setup/admin/page.tsx
  - scripts/fix-standalone-symlinks.js
  - scripts/materialize-standalone-symlinks.js
  - src/app/api/admin/licenses/revoke/route.ts
  - electron/main.ts
  - scripts/generate-license.ts
  - src/lib/admin-auth.ts
  - license-server/api/license/list.ts
  - license-server/vercel.json
  - src/lib/codex-client/key-store.ts
  - src/app/admin/licenses/page.tsx
  - src/app/api/setup/verify-openai/route.ts
  - license-server/lib/machine-id.ts
  - license-server/api/license/revoke.ts
  - src/app/api/admin/licenses/route.ts
  - license-server/api/license/create.ts
  - electron/codex-guide.html
  - license-server/api/license/transfer.ts
  - src/app/api/setup/create-first-admin/route.ts
  - electron/updater.ts
  - .github/workflows/release.yml
  - license-server/lib/admin-auth.ts
  - license-server/lib/serial.ts
  - src/app/setup/codex/page.tsx
  - src/app/api/admin/licenses/update-info/route.ts
  - src/app/api/admin/licenses/transfer/route.ts
  - scripts/generate-icons.ts
  - license-server/api/license/activate.ts
  - src/lib/db/schema.ts
  - license-server/api/license/update-info.ts
  - license-server/api/features/index.ts
  - electron-builder.json
  - license-server/api/license/verify.ts
  - license-server/api/updates/check.ts
  - src/app/api/admin/licenses/unbind-machine/route.ts
  - src/app/setup/page.tsx
  - src/middleware.ts
  - package.json
  - vercel.json
tests:
  - license-server/api/license/__tests__/update-info.test.ts
  - license-server/api/license/__tests__/transfer.test.ts
  - license-server/lib/__tests__/serial.test.ts
  - src/app/api/setup/verify-openai/route.test.ts
  - license-server/api/license/__tests__/end-to-end-flow.test.ts
  - license-server/api/license/__tests__/create.test.ts
  - e2e/admin-licenses.spec.ts
  - license-server/api/license/__tests__/revoke.test.ts
  - scripts/generate-icons.test.ts
  - license-server/api/license/__tests__/list.test.ts
  - license-server/api/license/__tests__/activate-verify.test.ts
  - src/lib/codex-client/__tests__/key-store.test.ts
-->

---
### Requirement: Update license contact info API

The system SHALL provide PATCH /api/license/update-info that updates contactName, company, and/or email for a given license key. When email is changed, the system SHALL update the email-index in Vercel KV (remove old index entry, create new one). The endpoint SHALL require LICENSE_ADMIN_TOKEN authorization.

#### Scenario: Update contact name only
- **WHEN** admin sends PATCH /api/license/update-info with { key: "ABCD-1234", contactName: "李小華" }
- **THEN** the system returns 200 with updated license object where contactName is "李小華"

#### Scenario: Update email with index sync
- **WHEN** admin sends PATCH /api/license/update-info with { key: "ABCD-1234", email: "new@test.com" } and old email was "old@test.com"
- **THEN** email-index:old@test.com no longer contains "ABCD-1234"
- **THEN** email-index:new@test.com contains "ABCD-1234"

#### Scenario: Key not found
- **WHEN** key does not exist in Vercel KV
- **THEN** the system returns 404 { error: "序號不存在" }

#### Scenario: Unauthorized request
- **WHEN** request lacks valid LICENSE_ADMIN_TOKEN
- **THEN** the system returns 401 { error: "未授權" }

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