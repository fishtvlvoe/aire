# app-icon Specification

## Purpose

TBD - created by archiving change 'app-icon-and-codex-setup'. Update Purpose after archive.

## Requirements

### Requirement: App icon asset generation

The system SHALL include a build-time script (`scripts/generate-icons.ts`) that converts a single 1024x1024 PNG source icon into `.icns` (macOS) and `.ico` (Windows) formats using the `png2icons` npm package.

#### Scenario: Generate icons from source PNG

- **WHEN** developer runs `npx tsx scripts/generate-icons.ts`
- **THEN** the script SHALL read `build/icon.png` (1024x1024 PNG) and produce `build/icon.icns` and `build/icon.ico` in the same directory

#### Scenario: Source PNG missing

- **WHEN** `build/icon.png` does not exist
- **THEN** the script SHALL exit with code 1 and print "Error: build/icon.png not found"

#### Scenario: Source PNG wrong dimensions

- **WHEN** `build/icon.png` exists but is not 1024x1024
- **THEN** the script SHALL exit with code 1 and print "Error: icon must be 1024x1024 pixels"


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
### Requirement: App icon design specification

The source icon (`build/icon.png`) SHALL use the following visual identity:
- Deep navy blue (#1a365d) background
- White foreground element depicting a stylized building silhouette with AI circuit pattern
- 1024x1024 pixels, PNG format with transparency

#### Scenario: Icon visual identity

- **WHEN** icon is displayed in macOS Dock, Windows taskbar, or installer splash
- **THEN** the icon SHALL be visually distinguishable at 16x16, 32x32, 128x128, 256x256, 512x512, and 1024x1024 sizes

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