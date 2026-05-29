# browser-local-runtime Specification

## Purpose

TBD - created by archiving change 'browser-local-runtime-mvp'. Update Purpose after archive.

## Requirements

### Requirement: Windows local runtime delivery

The system SHALL provide a Windows installer that installs AIRE without requiring source code, package managers, or terminal commands on the customer's machine.

#### Scenario: Customer launches AIRE from desktop shortcut

- **GIVEN** AIRE is installed on Windows
- **WHEN** the customer double-clicks the AIRE shortcut
- **THEN** the launcher SHALL start the bundled local runtime
- **AND** the runtime SHALL bind only to `127.0.0.1`
- **AND** the launcher SHALL open the system default browser to the local AIRE URL.

#### Scenario: Customer machine does not have Node installed

- **GIVEN** the customer has no system Node.js installation
- **WHEN** AIRE starts
- **THEN** it SHALL use the Node runtime bundled by the installer.


<!-- @trace
source: browser-local-runtime-mvp
updated: 2026-05-29
code:
  - src/app/api/local/pdf/route.ts
  - src/components/PullParcelDataButton.tsx
  - next.config.ts
  - .aire-session-token
  - tsconfig.json
  - docs/workbench-redesign-prototype/05-pdf-check.html
  - playwright.config.ts
  - src-tauri/src/land_registry/easymap_r02.rs
  - docs/workbench-redesign-prototype/04-summary.html
  - src/app/api/local/cop-credential/route.ts
  - src/lib/server/twinkle-real-price.ts
  - src/lib/server/local-address-discovery-proxy.ts
  - src/middleware.ts
  - docs/workbench-redesign-prototype/02-supplements.html
  - src/lib/registry-provenance.ts
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - docs/workbench-redesign-prototype/03-formal-import.html
  - e2e/results/playwright-report/trace/index.BCnMPevh.js
  - .github/workflows/ci.yml
  - e2e/results/playwright-report/trace/assets/codeMirrorModule-Ds_H_9Yq.js
  - scripts/build-local-runtime.mjs
  - docs/workbench-redesign-prototype/index.html
  - src/components/RealPricePanel.tsx
  - src/lib/case-routes.ts
  - e2e/results/playwright-report/trace/uiMode.C2Efnu2P.js
  - scripts/launch-aire.mjs
  - src/app/(dashboard)/cases/new/page.tsx
  - src/app/api/config/route.ts
  - e2e/results/playwright-report/trace/index.CzXZzn5A.css
  - src/lib/local-api/cases-store.ts
  - docs/workbench-redesign-prototype/06-pricing-modal.html
  - src/components/PreChargeConfirmDialog.tsx
  - .github/workflows/windows-runtime-smoke.yml
  - e2e/results/playwright-report/trace/sw.bundle.js
  - src/lib/mock-backend.ts
  - src/lib/land-registry-api.ts
  - installer/aire-installer.nsi
  - scripts/launch-aire.cmd
  - e2e/results/playwright-report/trace/assets/urlMatch-BYQrIQwR.js
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/lib/local-api/pdf-write-service.ts
  - src/lib/local-api/session-token.ts
  - src/lib/local-api/contract.ts
  - src/lib/local-api/client.ts
  - src/app/api/health/route.ts
  - .npmrc
  - installer/launch-aire-win.vbs
  - artifacts/smoke/desktop-local-address-to-cop-e2e-live-discovery-matrix.json
  - e2e/results/playwright-report/index.html
  - e2e/results/playwright-report/trace/codeMirrorModule.DYBRYzYX.css
  - src/app/\(dashboard\)/layout.tsx
  - e2e/results/playwright-report/trace/snapshot.v8KI4P3m.js
  - .github/workflows/release.yml
  - src/lib/init-config.ts
  - e2e/results/playwright-report/trace/index.html
  - e2e/results/playwright-report/trace/playwright-logo.svg
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/server/local-formal-pull-proxy.ts
  - e2e/results/playwright-report/trace/uiMode.html
  - src/lib/local-api/cop-credential-store.ts
  - installer/node-runtime/.gitkeep
  - src/lib/export-pdf.ts
  - e2e/results/playwright-report/trace/assets/defaultSettingsView-D31xz8zv.js
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - e2e/results/playwright-report/trace/snapshot.html
  - src/app/login/page.tsx
  - src/lib/pdf-blocks/property-data-sheet.tsx
  - src/lib/pdf-engine/document.tsx
  - src/app/api/local/address-discovery/route.ts
  - src/lib/tauri-bridge.ts
  - src/app/api/local/cases/[id]/route.ts
  - e2e/results/playwright-report/trace/codicon.DCmgc-ay.ttf
  - e2e/results/results.json
  - e2e/results/playwright-report/trace/manifest.webmanifest
  - src/app/api/init/route.ts
  - e2e/results/playwright-report/trace/uiMode.Btcz36p_.css
  - cloudflare-worker/src/types.ts
  - src/app/api/local/formal-pull-data/route.ts
  - e2e/results/playwright-report/trace/xtermModule.DYP7pi_n.css
  - package.json
  - docs/workbench-redesign-prototype/01-field-review.html
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - e2e/results/playwright-report/trace/defaultSettingsView.BDKsFU3c.css
  - installer/PROVENANCE.md
  - installer/README.md
  - src/lib/local-api/data-dir.ts
  - src/app/api/local/cases/route.ts
  - src/app/layout.tsx
  - src-tauri/PARKED.md
  - src/lib/auth.ts
  - src/app/api/local/real-price/route.ts
  - src/lib/real-price-query.ts
  - docs/debug-easymap-getdoorlist.md
  - cloudflare-worker/tsconfig.json
tests:
  - src/components/__tests__/PreChargeConfirmDialog.test.tsx
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - src/lib/__tests__/tauri-bridge.test.ts
  - src/app/api/local/address-discovery/__tests__/route.test.ts
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/app/api/local/real-price/__tests__/route.test.ts
  - e2e/product-auth-functional-flow.spec.ts
  - src/lib/__tests__/real-price-query.test.ts
  - src/app/login/__tests__/page.test.tsx
  - src/lib/local-api/__tests__/data-dir.test.ts
  - src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - src/lib/local-api/__tests__/session-token-middleware.test.ts
  - src/lib/local-api/__tests__/middleware-integration.test.ts
  - src/lib/server/__tests__/local-formal-pull-proxy.test.ts
  - e2e/desktop-local-address-to-cop-e2e.spec.ts
  - src/app/(dashboard)/cases/[id]/__tests__/page.test.tsx
  - src/lib/local-api/__tests__/cop-credential.test.ts
  - src/app/api/local/cop-credential/test/route.ts
  - src/app/(dashboard)/cases/__tests__/page.test.tsx
  - src/components/__tests__/RealPricePanel.test.tsx
  - src/app/api/health/__tests__/route.test.ts
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/local-api/__tests__/cases-persistence.test.ts
  - src/lib/__tests__/registry-provenance.test.ts
  - src/lib/server/__tests__/twinkle-real-price.test.ts
  - src/lib/local-api/__tests__/pdf-two-phase.test.ts
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - src/lib/__tests__/auth.test.ts
  - src/lib/__tests__/land-registry-api.test.ts
  - e2e/desktop-auth-credential-fulfillment-smoke.spec.ts
  - e2e/local-web-registry-pending-billing.spec.ts
  - src/lib/__tests__/product-navigation-ia.test.ts
  - src/lib/server/__tests__/local-address-discovery-proxy.test.ts
-->

---
### Requirement: Local data retention

The system SHALL keep customer case data on the local machine by default.

#### Scenario: Case data persists after restart

- **GIVEN** the customer creates or updates a case
- **WHEN** the customer closes AIRE and launches it again
- **THEN** the case data SHALL still be available from the local data store.

#### Scenario: Uninstall preserves customer data

- **GIVEN** AIRE is uninstalled
- **WHEN** the uninstaller runs with default options
- **THEN** it SHALL NOT delete customer case data.

#### Scenario: COP credentials persist across restart

- **GIVEN** the customer has saved valid COP credentials
- **WHEN** the customer closes AIRE and launches it again
- **THEN** AIRE SHALL load the stored COP credentials from the local secure store without re-entry
- **AND** the credentials SHALL NOT be stored in plain text.


<!-- @trace
source: browser-local-runtime-mvp
updated: 2026-05-29
code:
  - src/app/api/local/pdf/route.ts
  - src/components/PullParcelDataButton.tsx
  - next.config.ts
  - .aire-session-token
  - tsconfig.json
  - docs/workbench-redesign-prototype/05-pdf-check.html
  - playwright.config.ts
  - src-tauri/src/land_registry/easymap_r02.rs
  - docs/workbench-redesign-prototype/04-summary.html
  - src/app/api/local/cop-credential/route.ts
  - src/lib/server/twinkle-real-price.ts
  - src/lib/server/local-address-discovery-proxy.ts
  - src/middleware.ts
  - docs/workbench-redesign-prototype/02-supplements.html
  - src/lib/registry-provenance.ts
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - docs/workbench-redesign-prototype/03-formal-import.html
  - e2e/results/playwright-report/trace/index.BCnMPevh.js
  - .github/workflows/ci.yml
  - e2e/results/playwright-report/trace/assets/codeMirrorModule-Ds_H_9Yq.js
  - scripts/build-local-runtime.mjs
  - docs/workbench-redesign-prototype/index.html
  - src/components/RealPricePanel.tsx
  - src/lib/case-routes.ts
  - e2e/results/playwright-report/trace/uiMode.C2Efnu2P.js
  - scripts/launch-aire.mjs
  - src/app/(dashboard)/cases/new/page.tsx
  - src/app/api/config/route.ts
  - e2e/results/playwright-report/trace/index.CzXZzn5A.css
  - src/lib/local-api/cases-store.ts
  - docs/workbench-redesign-prototype/06-pricing-modal.html
  - src/components/PreChargeConfirmDialog.tsx
  - .github/workflows/windows-runtime-smoke.yml
  - e2e/results/playwright-report/trace/sw.bundle.js
  - src/lib/mock-backend.ts
  - src/lib/land-registry-api.ts
  - installer/aire-installer.nsi
  - scripts/launch-aire.cmd
  - e2e/results/playwright-report/trace/assets/urlMatch-BYQrIQwR.js
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/lib/local-api/pdf-write-service.ts
  - src/lib/local-api/session-token.ts
  - src/lib/local-api/contract.ts
  - src/lib/local-api/client.ts
  - src/app/api/health/route.ts
  - .npmrc
  - installer/launch-aire-win.vbs
  - artifacts/smoke/desktop-local-address-to-cop-e2e-live-discovery-matrix.json
  - e2e/results/playwright-report/index.html
  - e2e/results/playwright-report/trace/codeMirrorModule.DYBRYzYX.css
  - src/app/\(dashboard\)/layout.tsx
  - e2e/results/playwright-report/trace/snapshot.v8KI4P3m.js
  - .github/workflows/release.yml
  - src/lib/init-config.ts
  - e2e/results/playwright-report/trace/index.html
  - e2e/results/playwright-report/trace/playwright-logo.svg
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/server/local-formal-pull-proxy.ts
  - e2e/results/playwright-report/trace/uiMode.html
  - src/lib/local-api/cop-credential-store.ts
  - installer/node-runtime/.gitkeep
  - src/lib/export-pdf.ts
  - e2e/results/playwright-report/trace/assets/defaultSettingsView-D31xz8zv.js
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - e2e/results/playwright-report/trace/snapshot.html
  - src/app/login/page.tsx
  - src/lib/pdf-blocks/property-data-sheet.tsx
  - src/lib/pdf-engine/document.tsx
  - src/app/api/local/address-discovery/route.ts
  - src/lib/tauri-bridge.ts
  - src/app/api/local/cases/[id]/route.ts
  - e2e/results/playwright-report/trace/codicon.DCmgc-ay.ttf
  - e2e/results/results.json
  - e2e/results/playwright-report/trace/manifest.webmanifest
  - src/app/api/init/route.ts
  - e2e/results/playwright-report/trace/uiMode.Btcz36p_.css
  - cloudflare-worker/src/types.ts
  - src/app/api/local/formal-pull-data/route.ts
  - e2e/results/playwright-report/trace/xtermModule.DYP7pi_n.css
  - package.json
  - docs/workbench-redesign-prototype/01-field-review.html
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - e2e/results/playwright-report/trace/defaultSettingsView.BDKsFU3c.css
  - installer/PROVENANCE.md
  - installer/README.md
  - src/lib/local-api/data-dir.ts
  - src/app/api/local/cases/route.ts
  - src/app/layout.tsx
  - src-tauri/PARKED.md
  - src/lib/auth.ts
  - src/app/api/local/real-price/route.ts
  - src/lib/real-price-query.ts
  - docs/debug-easymap-getdoorlist.md
  - cloudflare-worker/tsconfig.json
tests:
  - src/components/__tests__/PreChargeConfirmDialog.test.tsx
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - src/lib/__tests__/tauri-bridge.test.ts
  - src/app/api/local/address-discovery/__tests__/route.test.ts
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/app/api/local/real-price/__tests__/route.test.ts
  - e2e/product-auth-functional-flow.spec.ts
  - src/lib/__tests__/real-price-query.test.ts
  - src/app/login/__tests__/page.test.tsx
  - src/lib/local-api/__tests__/data-dir.test.ts
  - src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - src/lib/local-api/__tests__/session-token-middleware.test.ts
  - src/lib/local-api/__tests__/middleware-integration.test.ts
  - src/lib/server/__tests__/local-formal-pull-proxy.test.ts
  - e2e/desktop-local-address-to-cop-e2e.spec.ts
  - src/app/(dashboard)/cases/[id]/__tests__/page.test.tsx
  - src/lib/local-api/__tests__/cop-credential.test.ts
  - src/app/api/local/cop-credential/test/route.ts
  - src/app/(dashboard)/cases/__tests__/page.test.tsx
  - src/components/__tests__/RealPricePanel.test.tsx
  - src/app/api/health/__tests__/route.test.ts
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/local-api/__tests__/cases-persistence.test.ts
  - src/lib/__tests__/registry-provenance.test.ts
  - src/lib/server/__tests__/twinkle-real-price.test.ts
  - src/lib/local-api/__tests__/pdf-two-phase.test.ts
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - src/lib/__tests__/auth.test.ts
  - src/lib/__tests__/land-registry-api.test.ts
  - e2e/desktop-auth-credential-fulfillment-smoke.spec.ts
  - e2e/local-web-registry-pending-billing.spec.ts
  - src/lib/__tests__/product-navigation-ia.test.ts
  - src/lib/server/__tests__/local-address-discovery-proxy.test.ts
-->

---
### Requirement: MVP land-registry workflow

The local runtime SHALL support the MVP land-registry workflow without Tauri/Rust IPC.

#### Scenario: Address discovery returns local candidates

- **GIVEN** the runtime is running locally
- **WHEN** the customer enters a known supported address
- **THEN** AIRE SHALL return the matched section, land number, and building number from the local server workflow.

#### Scenario: Formal pull requires COP settings

- **GIVEN** COP credentials are not configured
- **WHEN** the customer attempts formal registry import
- **THEN** AIRE SHALL show a clear local settings error
- **AND** it SHALL NOT show raw object serialization errors such as `[object Object]`.


<!-- @trace
source: browser-local-runtime-mvp
updated: 2026-05-29
code:
  - src/app/api/local/pdf/route.ts
  - src/components/PullParcelDataButton.tsx
  - next.config.ts
  - .aire-session-token
  - tsconfig.json
  - docs/workbench-redesign-prototype/05-pdf-check.html
  - playwright.config.ts
  - src-tauri/src/land_registry/easymap_r02.rs
  - docs/workbench-redesign-prototype/04-summary.html
  - src/app/api/local/cop-credential/route.ts
  - src/lib/server/twinkle-real-price.ts
  - src/lib/server/local-address-discovery-proxy.ts
  - src/middleware.ts
  - docs/workbench-redesign-prototype/02-supplements.html
  - src/lib/registry-provenance.ts
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - docs/workbench-redesign-prototype/03-formal-import.html
  - e2e/results/playwright-report/trace/index.BCnMPevh.js
  - .github/workflows/ci.yml
  - e2e/results/playwright-report/trace/assets/codeMirrorModule-Ds_H_9Yq.js
  - scripts/build-local-runtime.mjs
  - docs/workbench-redesign-prototype/index.html
  - src/components/RealPricePanel.tsx
  - src/lib/case-routes.ts
  - e2e/results/playwright-report/trace/uiMode.C2Efnu2P.js
  - scripts/launch-aire.mjs
  - src/app/(dashboard)/cases/new/page.tsx
  - src/app/api/config/route.ts
  - e2e/results/playwright-report/trace/index.CzXZzn5A.css
  - src/lib/local-api/cases-store.ts
  - docs/workbench-redesign-prototype/06-pricing-modal.html
  - src/components/PreChargeConfirmDialog.tsx
  - .github/workflows/windows-runtime-smoke.yml
  - e2e/results/playwright-report/trace/sw.bundle.js
  - src/lib/mock-backend.ts
  - src/lib/land-registry-api.ts
  - installer/aire-installer.nsi
  - scripts/launch-aire.cmd
  - e2e/results/playwright-report/trace/assets/urlMatch-BYQrIQwR.js
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/lib/local-api/pdf-write-service.ts
  - src/lib/local-api/session-token.ts
  - src/lib/local-api/contract.ts
  - src/lib/local-api/client.ts
  - src/app/api/health/route.ts
  - .npmrc
  - installer/launch-aire-win.vbs
  - artifacts/smoke/desktop-local-address-to-cop-e2e-live-discovery-matrix.json
  - e2e/results/playwright-report/index.html
  - e2e/results/playwright-report/trace/codeMirrorModule.DYBRYzYX.css
  - src/app/\(dashboard\)/layout.tsx
  - e2e/results/playwright-report/trace/snapshot.v8KI4P3m.js
  - .github/workflows/release.yml
  - src/lib/init-config.ts
  - e2e/results/playwright-report/trace/index.html
  - e2e/results/playwright-report/trace/playwright-logo.svg
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/server/local-formal-pull-proxy.ts
  - e2e/results/playwright-report/trace/uiMode.html
  - src/lib/local-api/cop-credential-store.ts
  - installer/node-runtime/.gitkeep
  - src/lib/export-pdf.ts
  - e2e/results/playwright-report/trace/assets/defaultSettingsView-D31xz8zv.js
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - e2e/results/playwright-report/trace/snapshot.html
  - src/app/login/page.tsx
  - src/lib/pdf-blocks/property-data-sheet.tsx
  - src/lib/pdf-engine/document.tsx
  - src/app/api/local/address-discovery/route.ts
  - src/lib/tauri-bridge.ts
  - src/app/api/local/cases/[id]/route.ts
  - e2e/results/playwright-report/trace/codicon.DCmgc-ay.ttf
  - e2e/results/results.json
  - e2e/results/playwright-report/trace/manifest.webmanifest
  - src/app/api/init/route.ts
  - e2e/results/playwright-report/trace/uiMode.Btcz36p_.css
  - cloudflare-worker/src/types.ts
  - src/app/api/local/formal-pull-data/route.ts
  - e2e/results/playwright-report/trace/xtermModule.DYP7pi_n.css
  - package.json
  - docs/workbench-redesign-prototype/01-field-review.html
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - e2e/results/playwright-report/trace/defaultSettingsView.BDKsFU3c.css
  - installer/PROVENANCE.md
  - installer/README.md
  - src/lib/local-api/data-dir.ts
  - src/app/api/local/cases/route.ts
  - src/app/layout.tsx
  - src-tauri/PARKED.md
  - src/lib/auth.ts
  - src/app/api/local/real-price/route.ts
  - src/lib/real-price-query.ts
  - docs/debug-easymap-getdoorlist.md
  - cloudflare-worker/tsconfig.json
tests:
  - src/components/__tests__/PreChargeConfirmDialog.test.tsx
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - src/lib/__tests__/tauri-bridge.test.ts
  - src/app/api/local/address-discovery/__tests__/route.test.ts
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/app/api/local/real-price/__tests__/route.test.ts
  - e2e/product-auth-functional-flow.spec.ts
  - src/lib/__tests__/real-price-query.test.ts
  - src/app/login/__tests__/page.test.tsx
  - src/lib/local-api/__tests__/data-dir.test.ts
  - src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - src/lib/local-api/__tests__/session-token-middleware.test.ts
  - src/lib/local-api/__tests__/middleware-integration.test.ts
  - src/lib/server/__tests__/local-formal-pull-proxy.test.ts
  - e2e/desktop-local-address-to-cop-e2e.spec.ts
  - src/app/(dashboard)/cases/[id]/__tests__/page.test.tsx
  - src/lib/local-api/__tests__/cop-credential.test.ts
  - src/app/api/local/cop-credential/test/route.ts
  - src/app/(dashboard)/cases/__tests__/page.test.tsx
  - src/components/__tests__/RealPricePanel.test.tsx
  - src/app/api/health/__tests__/route.test.ts
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/local-api/__tests__/cases-persistence.test.ts
  - src/lib/__tests__/registry-provenance.test.ts
  - src/lib/server/__tests__/twinkle-real-price.test.ts
  - src/lib/local-api/__tests__/pdf-two-phase.test.ts
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - src/lib/__tests__/auth.test.ts
  - src/lib/__tests__/land-registry-api.test.ts
  - e2e/desktop-auth-credential-fulfillment-smoke.spec.ts
  - e2e/local-web-registry-pending-billing.spec.ts
  - src/lib/__tests__/product-navigation-ia.test.ts
  - src/lib/server/__tests__/local-address-discovery-proxy.test.ts
-->

---
### Requirement: Local PDF generation

The local runtime SHALL generate the property description document on the local machine. The draft and the official document are the SAME document produced at different points in time, not two separate templates.

#### Scenario: Draft generated from registry lookup

- **GIVEN** the customer has run a land-registry lookup via the local convenience-system API
- **WHEN** the customer generates the draft document
- **THEN** AIRE SHALL render the draft PDF from the looked-up data snapshot
- **AND** it SHALL write the PDF atomically to the local data directory.

#### Scenario: Official document continues from the draft

- **GIVEN** a draft exists and the customer has manually entered supplementary post-signing data
- **WHEN** the customer generates the official document
- **THEN** AIRE SHALL keep the earlier draft content unchanged
- **AND** it SHALL append the supplementary materials as embedded pages, not popups
- **AND** it SHALL append the customer signature page
- **AND** it SHALL write the official PDF atomically to the local data directory.

#### Scenario: PDF generation does not depend on Tauri/Rust

- **GIVEN** the Tauri build is parked
- **WHEN** any PDF is generated
- **THEN** both rendering and the atomic file write SHALL be performed by the Node runtime
- **AND** it SHALL NOT require the Rust `export_pdf` IPC command.


<!-- @trace
source: browser-local-runtime-mvp
updated: 2026-05-29
code:
  - src/app/api/local/pdf/route.ts
  - src/components/PullParcelDataButton.tsx
  - next.config.ts
  - .aire-session-token
  - tsconfig.json
  - docs/workbench-redesign-prototype/05-pdf-check.html
  - playwright.config.ts
  - src-tauri/src/land_registry/easymap_r02.rs
  - docs/workbench-redesign-prototype/04-summary.html
  - src/app/api/local/cop-credential/route.ts
  - src/lib/server/twinkle-real-price.ts
  - src/lib/server/local-address-discovery-proxy.ts
  - src/middleware.ts
  - docs/workbench-redesign-prototype/02-supplements.html
  - src/lib/registry-provenance.ts
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - docs/workbench-redesign-prototype/03-formal-import.html
  - e2e/results/playwright-report/trace/index.BCnMPevh.js
  - .github/workflows/ci.yml
  - e2e/results/playwright-report/trace/assets/codeMirrorModule-Ds_H_9Yq.js
  - scripts/build-local-runtime.mjs
  - docs/workbench-redesign-prototype/index.html
  - src/components/RealPricePanel.tsx
  - src/lib/case-routes.ts
  - e2e/results/playwright-report/trace/uiMode.C2Efnu2P.js
  - scripts/launch-aire.mjs
  - src/app/(dashboard)/cases/new/page.tsx
  - src/app/api/config/route.ts
  - e2e/results/playwright-report/trace/index.CzXZzn5A.css
  - src/lib/local-api/cases-store.ts
  - docs/workbench-redesign-prototype/06-pricing-modal.html
  - src/components/PreChargeConfirmDialog.tsx
  - .github/workflows/windows-runtime-smoke.yml
  - e2e/results/playwright-report/trace/sw.bundle.js
  - src/lib/mock-backend.ts
  - src/lib/land-registry-api.ts
  - installer/aire-installer.nsi
  - scripts/launch-aire.cmd
  - e2e/results/playwright-report/trace/assets/urlMatch-BYQrIQwR.js
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/lib/local-api/pdf-write-service.ts
  - src/lib/local-api/session-token.ts
  - src/lib/local-api/contract.ts
  - src/lib/local-api/client.ts
  - src/app/api/health/route.ts
  - .npmrc
  - installer/launch-aire-win.vbs
  - artifacts/smoke/desktop-local-address-to-cop-e2e-live-discovery-matrix.json
  - e2e/results/playwright-report/index.html
  - e2e/results/playwright-report/trace/codeMirrorModule.DYBRYzYX.css
  - src/app/\(dashboard\)/layout.tsx
  - e2e/results/playwright-report/trace/snapshot.v8KI4P3m.js
  - .github/workflows/release.yml
  - src/lib/init-config.ts
  - e2e/results/playwright-report/trace/index.html
  - e2e/results/playwright-report/trace/playwright-logo.svg
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/server/local-formal-pull-proxy.ts
  - e2e/results/playwright-report/trace/uiMode.html
  - src/lib/local-api/cop-credential-store.ts
  - installer/node-runtime/.gitkeep
  - src/lib/export-pdf.ts
  - e2e/results/playwright-report/trace/assets/defaultSettingsView-D31xz8zv.js
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - e2e/results/playwright-report/trace/snapshot.html
  - src/app/login/page.tsx
  - src/lib/pdf-blocks/property-data-sheet.tsx
  - src/lib/pdf-engine/document.tsx
  - src/app/api/local/address-discovery/route.ts
  - src/lib/tauri-bridge.ts
  - src/app/api/local/cases/[id]/route.ts
  - e2e/results/playwright-report/trace/codicon.DCmgc-ay.ttf
  - e2e/results/results.json
  - e2e/results/playwright-report/trace/manifest.webmanifest
  - src/app/api/init/route.ts
  - e2e/results/playwright-report/trace/uiMode.Btcz36p_.css
  - cloudflare-worker/src/types.ts
  - src/app/api/local/formal-pull-data/route.ts
  - e2e/results/playwright-report/trace/xtermModule.DYP7pi_n.css
  - package.json
  - docs/workbench-redesign-prototype/01-field-review.html
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - e2e/results/playwright-report/trace/defaultSettingsView.BDKsFU3c.css
  - installer/PROVENANCE.md
  - installer/README.md
  - src/lib/local-api/data-dir.ts
  - src/app/api/local/cases/route.ts
  - src/app/layout.tsx
  - src-tauri/PARKED.md
  - src/lib/auth.ts
  - src/app/api/local/real-price/route.ts
  - src/lib/real-price-query.ts
  - docs/debug-easymap-getdoorlist.md
  - cloudflare-worker/tsconfig.json
tests:
  - src/components/__tests__/PreChargeConfirmDialog.test.tsx
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - src/lib/__tests__/tauri-bridge.test.ts
  - src/app/api/local/address-discovery/__tests__/route.test.ts
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/app/api/local/real-price/__tests__/route.test.ts
  - e2e/product-auth-functional-flow.spec.ts
  - src/lib/__tests__/real-price-query.test.ts
  - src/app/login/__tests__/page.test.tsx
  - src/lib/local-api/__tests__/data-dir.test.ts
  - src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - src/lib/local-api/__tests__/session-token-middleware.test.ts
  - src/lib/local-api/__tests__/middleware-integration.test.ts
  - src/lib/server/__tests__/local-formal-pull-proxy.test.ts
  - e2e/desktop-local-address-to-cop-e2e.spec.ts
  - src/app/(dashboard)/cases/[id]/__tests__/page.test.tsx
  - src/lib/local-api/__tests__/cop-credential.test.ts
  - src/app/api/local/cop-credential/test/route.ts
  - src/app/(dashboard)/cases/__tests__/page.test.tsx
  - src/components/__tests__/RealPricePanel.test.tsx
  - src/app/api/health/__tests__/route.test.ts
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/local-api/__tests__/cases-persistence.test.ts
  - src/lib/__tests__/registry-provenance.test.ts
  - src/lib/server/__tests__/twinkle-real-price.test.ts
  - src/lib/local-api/__tests__/pdf-two-phase.test.ts
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - src/lib/__tests__/auth.test.ts
  - src/lib/__tests__/land-registry-api.test.ts
  - e2e/desktop-auth-credential-fulfillment-smoke.spec.ts
  - e2e/local-web-registry-pending-billing.spec.ts
  - src/lib/__tests__/product-navigation-ia.test.ts
  - src/lib/server/__tests__/local-address-discovery-proxy.test.ts
-->

---
### Requirement: Local API security boundary

The local runtime SHALL protect its `/api/local/*` endpoints so that other web pages running on the same machine cannot invoke AIRE APIs or exfiltrate stored COP credentials.

#### Scenario: Local API requires session token

- **GIVEN** the runtime is bound to `127.0.0.1`
- **WHEN** a request to a `/api/local/*` endpoint arrives without a valid local session token
- **THEN** the runtime SHALL reject the request with HTTP 401
- **AND** it SHALL NOT execute the requested local action.

#### Scenario: Legitimate browser session carries the token

- **GIVEN** the launcher started the runtime and opened the system browser
- **WHEN** the AIRE page issues a `/api/local/*` request
- **THEN** the request SHALL carry the per-launch session token issued by the launcher
- **AND** the runtime SHALL accept it.

<!-- @trace
source: browser-local-runtime-mvp
updated: 2026-05-29
code:
  - src/app/api/local/pdf/route.ts
  - src/components/PullParcelDataButton.tsx
  - next.config.ts
  - .aire-session-token
  - tsconfig.json
  - docs/workbench-redesign-prototype/05-pdf-check.html
  - playwright.config.ts
  - src-tauri/src/land_registry/easymap_r02.rs
  - docs/workbench-redesign-prototype/04-summary.html
  - src/app/api/local/cop-credential/route.ts
  - src/lib/server/twinkle-real-price.ts
  - src/lib/server/local-address-discovery-proxy.ts
  - src/middleware.ts
  - docs/workbench-redesign-prototype/02-supplements.html
  - src/lib/registry-provenance.ts
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - docs/workbench-redesign-prototype/03-formal-import.html
  - e2e/results/playwright-report/trace/index.BCnMPevh.js
  - .github/workflows/ci.yml
  - e2e/results/playwright-report/trace/assets/codeMirrorModule-Ds_H_9Yq.js
  - scripts/build-local-runtime.mjs
  - docs/workbench-redesign-prototype/index.html
  - src/components/RealPricePanel.tsx
  - src/lib/case-routes.ts
  - e2e/results/playwright-report/trace/uiMode.C2Efnu2P.js
  - scripts/launch-aire.mjs
  - src/app/(dashboard)/cases/new/page.tsx
  - src/app/api/config/route.ts
  - e2e/results/playwright-report/trace/index.CzXZzn5A.css
  - src/lib/local-api/cases-store.ts
  - docs/workbench-redesign-prototype/06-pricing-modal.html
  - src/components/PreChargeConfirmDialog.tsx
  - .github/workflows/windows-runtime-smoke.yml
  - e2e/results/playwright-report/trace/sw.bundle.js
  - src/lib/mock-backend.ts
  - src/lib/land-registry-api.ts
  - installer/aire-installer.nsi
  - scripts/launch-aire.cmd
  - e2e/results/playwright-report/trace/assets/urlMatch-BYQrIQwR.js
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/lib/local-api/pdf-write-service.ts
  - src/lib/local-api/session-token.ts
  - src/lib/local-api/contract.ts
  - src/lib/local-api/client.ts
  - src/app/api/health/route.ts
  - .npmrc
  - installer/launch-aire-win.vbs
  - artifacts/smoke/desktop-local-address-to-cop-e2e-live-discovery-matrix.json
  - e2e/results/playwright-report/index.html
  - e2e/results/playwright-report/trace/codeMirrorModule.DYBRYzYX.css
  - src/app/\(dashboard\)/layout.tsx
  - e2e/results/playwright-report/trace/snapshot.v8KI4P3m.js
  - .github/workflows/release.yml
  - src/lib/init-config.ts
  - e2e/results/playwright-report/trace/index.html
  - e2e/results/playwright-report/trace/playwright-logo.svg
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/server/local-formal-pull-proxy.ts
  - e2e/results/playwright-report/trace/uiMode.html
  - src/lib/local-api/cop-credential-store.ts
  - installer/node-runtime/.gitkeep
  - src/lib/export-pdf.ts
  - e2e/results/playwright-report/trace/assets/defaultSettingsView-D31xz8zv.js
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - e2e/results/playwright-report/trace/snapshot.html
  - src/app/login/page.tsx
  - src/lib/pdf-blocks/property-data-sheet.tsx
  - src/lib/pdf-engine/document.tsx
  - src/app/api/local/address-discovery/route.ts
  - src/lib/tauri-bridge.ts
  - src/app/api/local/cases/[id]/route.ts
  - e2e/results/playwright-report/trace/codicon.DCmgc-ay.ttf
  - e2e/results/results.json
  - e2e/results/playwright-report/trace/manifest.webmanifest
  - src/app/api/init/route.ts
  - e2e/results/playwright-report/trace/uiMode.Btcz36p_.css
  - cloudflare-worker/src/types.ts
  - src/app/api/local/formal-pull-data/route.ts
  - e2e/results/playwright-report/trace/xtermModule.DYP7pi_n.css
  - package.json
  - docs/workbench-redesign-prototype/01-field-review.html
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - e2e/results/playwright-report/trace/defaultSettingsView.BDKsFU3c.css
  - installer/PROVENANCE.md
  - installer/README.md
  - src/lib/local-api/data-dir.ts
  - src/app/api/local/cases/route.ts
  - src/app/layout.tsx
  - src-tauri/PARKED.md
  - src/lib/auth.ts
  - src/app/api/local/real-price/route.ts
  - src/lib/real-price-query.ts
  - docs/debug-easymap-getdoorlist.md
  - cloudflare-worker/tsconfig.json
tests:
  - src/components/__tests__/PreChargeConfirmDialog.test.tsx
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - src/lib/__tests__/tauri-bridge.test.ts
  - src/app/api/local/address-discovery/__tests__/route.test.ts
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/app/api/local/real-price/__tests__/route.test.ts
  - e2e/product-auth-functional-flow.spec.ts
  - src/lib/__tests__/real-price-query.test.ts
  - src/app/login/__tests__/page.test.tsx
  - src/lib/local-api/__tests__/data-dir.test.ts
  - src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - src/lib/local-api/__tests__/session-token-middleware.test.ts
  - src/lib/local-api/__tests__/middleware-integration.test.ts
  - src/lib/server/__tests__/local-formal-pull-proxy.test.ts
  - e2e/desktop-local-address-to-cop-e2e.spec.ts
  - src/app/(dashboard)/cases/[id]/__tests__/page.test.tsx
  - src/lib/local-api/__tests__/cop-credential.test.ts
  - src/app/api/local/cop-credential/test/route.ts
  - src/app/(dashboard)/cases/__tests__/page.test.tsx
  - src/components/__tests__/RealPricePanel.test.tsx
  - src/app/api/health/__tests__/route.test.ts
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/local-api/__tests__/cases-persistence.test.ts
  - src/lib/__tests__/registry-provenance.test.ts
  - src/lib/server/__tests__/twinkle-real-price.test.ts
  - src/lib/local-api/__tests__/pdf-two-phase.test.ts
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - src/lib/__tests__/auth.test.ts
  - src/lib/__tests__/land-registry-api.test.ts
  - e2e/desktop-auth-credential-fulfillment-smoke.spec.ts
  - e2e/local-web-registry-pending-billing.spec.ts
  - src/lib/__tests__/product-navigation-ia.test.ts
  - src/lib/server/__tests__/local-address-discovery-proxy.test.ts
-->