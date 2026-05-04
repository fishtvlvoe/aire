# developer-settings Specification

## Purpose

TBD - created by archiving change 'electron-desktop-app'. Update Purpose after archive.

## Requirements

### Requirement: Developer settings panel

The system SHALL provide a settings panel visible only in development mode for configuring LLM backend and debug options.

#### Scenario: Panel visibility in development mode

- **WHEN** application runs with NEXT_PUBLIC_APP_MODE=development
- **THEN** a "設定" menu item SHALL be visible in the navigation

#### Scenario: Panel hidden in production mode

- **WHEN** application runs with NEXT_PUBLIC_APP_MODE=production
- **THEN** no "設定" menu item SHALL be visible


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
### Requirement: LLM backend switching

The system SHALL allow developers to switch between Claude, Gemini, and Codex backends in development mode.

#### Scenario: Switch LLM backend

- **WHEN** developer selects a different LLM backend in the settings panel
- **THEN** subsequent AI operations SHALL use the selected backend

##### Example: Switch to Gemini

- **GIVEN** current backend is "Codex" and developer is on /settings
- **WHEN** developer selects "Gemini" from the LLM dropdown and clicks "儲存"
- **THEN** next AI call (e.g., generate disclosure document) SHALL route through the Gemini adapter


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
### Requirement: Debug mode toggle

The system SHALL provide a debug mode toggle that shows additional diagnostic information.

#### Scenario: Enable debug mode

- **WHEN** developer enables debug mode in settings
- **THEN** LLM request/response logs, token counts, and timing information SHALL be displayed in a debug panel

##### Example: Debug panel output

- **GIVEN** debug mode is enabled and developer triggers "生成不動產說明書"
- **WHEN** LLM call completes
- **THEN** debug panel SHALL show: "Backend: Codex | Tokens: 1,234 in / 567 out | Time: 3.2s | Status: 200"

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