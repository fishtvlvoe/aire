# customer-delivery-e2e Specification

## Purpose

TBD - created by archiving change 'stabilize-customer-delivery-e2e'. Update Purpose after archive.

## Requirements

### Requirement: Customer Delivery E2E Gate

The system SHALL provide a customer-delivery E2E gate whose assertions match the current product contract.

#### Scenario: Canonical Case Route

- **GIVEN** an existing case id
- **WHEN** the user opens the case from the case list
- **THEN** the browser lands on `/cases/<caseId>`
- **AND** the test does not require the retired `/cases/_?caseId=<caseId>` route.

#### Scenario: Current Workbench Tabs

- **GIVEN** the user is on a case workbench
- **WHEN** the E2E navigates between workbench areas
- **THEN** it uses current tab labels such as `補件與現場` and `物件資料總覽`
- **AND** it does not require retired labels such as `補件/現場` or a case-level `資料來源` tab.


<!-- @trace
source: stabilize-customer-delivery-e2e
updated: 2026-06-02
code:
  - src/lib/pdf-engine/html-blocks/property-data-sheet.tsx
  - scripts/one-click-lib.mjs
  - src/lib/overpass-client.ts
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - src/lib/product-ui-demo-alignment.ts
  - src/lib/map-api.ts
  - src/app/(dashboard)/cases/new/page.tsx
  - src/lib/land-registry-api.ts
  - scripts/install-from-github-release.ps1
  - .superset/config.json
  - src/lib/mock-backend.ts
  - src/lib/real-price-query.ts
  - src/lib/server/twinkle-real-price.ts
  - AGENTS.md
  - src/app/api/street-view/route.ts
  - src/app/api/geocode/route.ts
  - src/lib/pdf-blocks/land-condition-survey.tsx
  - src/lib/tauri-bridge.ts
  - src-tauri/src/land_registry/pull.rs
  - src/lib/registry-preview.ts
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src-tauri/src/db/registry_query_runs.rs
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/pdf-blocks/life-amenities.tsx
  - README.md
  - src/components/PullParcelDataButton.tsx
  - src/lib/local-api/cop-credential-store.ts
  - docs/real-property-fixtures.md
  - src/app/api/local/formal-pull-data/route.ts
  - scripts/install-from-github-release.sh
  - src/lib/pdf-engine/document.tsx
  - next.config.ts
  - e2e/formal-pull-fixture.ts
  - src/lib/pdf-blocks/exterior-photo-page.tsx
  - src-tauri/src/commands/cases.rs
  - artifacts/smoke/desktop-local-address-to-cop-e2e-live-discovery-matrix.json
  - src/lib/pdf-engine/html-blocks/transaction-history.tsx
  - src/components/PreChargeConfirmDialog.tsx
  - src/lib/server/local-address-discovery-proxy.ts
  - scripts/windows-one-click-lib.mjs
  - package.json
  - src/app/api/nearby-amenities/route.ts
  - src/lib/registry-discovery-contract.ts
  - scripts/one-click.mjs
  - src/lib/pdf-blocks/transaction-history-page.tsx
  - src/components/ui/dialog.tsx
  - src-tauri/src/land_registry/api_key_storage.rs
  - src/lib/server/local-formal-pull-proxy.ts
  - scripts/windows-one-click.mjs
  - src/lib/formal-cop-api-set.ts
  - src/lib/pdf-blocks/property-data-sheet.tsx
tests:
  - src/lib/__tests__/map-api.test.ts
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/__tests__/registry-preview.test.ts
  - src/lib/server/__tests__/local-formal-pull-proxy.test.ts
  - src/lib/local-api/__tests__/cop-credential.test.ts
  - src/lib/__tests__/formal-cop-api-set.test.ts
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/lib/server/__tests__/twinkle-real-price.test.ts
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/lib/__tests__/real-price-query.test.ts
  - e2e/real-property-fixtures-free-discovery.spec.ts
  - e2e/product-navigation-ia.spec.ts
  - e2e/product-auth-functional-flow.spec.ts
  - src/lib/__tests__/overpass-client.test.ts
  - e2e/candidate-parcel-options-presurvey.spec.ts
  - scripts/__tests__/one-click.test.mjs
  - src/lib/pdf-blocks/__tests__/transaction-history-page.test.ts
  - src/lib/__tests__/mock-backend.test.ts
  - src/lib/pdf-blocks/__tests__/registry-image-pages.test.tsx
  - e2e/real-presurvey-pdf-download.spec.ts
  - src/lib/server/__tests__/local-address-discovery-proxy.test.ts
  - e2e/full-product-flow-ia-ux-acceptance.spec.ts
  - src/app/api/local/cop-credential/test/route.ts
  - e2e/product-ui-demo-alignment.spec.ts
  - e2e/local-web-registry-pending-billing.spec.ts
  - e2e/real-nine-fixtures-pdf-download.spec.ts
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx
  - src/lib/pdf-blocks/__tests__/life-amenities.test.tsx
  - src/components/__tests__/PreChargeConfirmDialog.test.tsx
  - src/lib/pdf-blocks/__tests__/land-condition-survey.test.tsx
  - e2e/desktop-local-address-to-cop-e2e.spec.ts
  - e2e/aire-disclosure-registry-ux.spec.ts
  - e2e/theme-selector.spec.ts
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - src/lib/__tests__/land-registry-api.test.ts
  - e2e/complete-presurvey-property-sheet-flow.spec.ts
  - scripts/__tests__/windows-one-click.test.mjs
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
-->

---
### Requirement: Free Pre-Survey E2E

The free pre-survey E2E SHALL verify that the user can complete discovery and create a case from visible result data.

#### Scenario: Discovery Result

- **GIVEN** a supported real address fixture
- **WHEN** the user runs free pre-survey discovery
- **THEN** the page shows the property data completion area and land/building result information
- **AND** the case can be created and opened.


<!-- @trace
source: stabilize-customer-delivery-e2e
updated: 2026-06-02
code:
  - src/lib/pdf-engine/html-blocks/property-data-sheet.tsx
  - scripts/one-click-lib.mjs
  - src/lib/overpass-client.ts
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - src/lib/product-ui-demo-alignment.ts
  - src/lib/map-api.ts
  - src/app/(dashboard)/cases/new/page.tsx
  - src/lib/land-registry-api.ts
  - scripts/install-from-github-release.ps1
  - .superset/config.json
  - src/lib/mock-backend.ts
  - src/lib/real-price-query.ts
  - src/lib/server/twinkle-real-price.ts
  - AGENTS.md
  - src/app/api/street-view/route.ts
  - src/app/api/geocode/route.ts
  - src/lib/pdf-blocks/land-condition-survey.tsx
  - src/lib/tauri-bridge.ts
  - src-tauri/src/land_registry/pull.rs
  - src/lib/registry-preview.ts
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src-tauri/src/db/registry_query_runs.rs
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/pdf-blocks/life-amenities.tsx
  - README.md
  - src/components/PullParcelDataButton.tsx
  - src/lib/local-api/cop-credential-store.ts
  - docs/real-property-fixtures.md
  - src/app/api/local/formal-pull-data/route.ts
  - scripts/install-from-github-release.sh
  - src/lib/pdf-engine/document.tsx
  - next.config.ts
  - e2e/formal-pull-fixture.ts
  - src/lib/pdf-blocks/exterior-photo-page.tsx
  - src-tauri/src/commands/cases.rs
  - artifacts/smoke/desktop-local-address-to-cop-e2e-live-discovery-matrix.json
  - src/lib/pdf-engine/html-blocks/transaction-history.tsx
  - src/components/PreChargeConfirmDialog.tsx
  - src/lib/server/local-address-discovery-proxy.ts
  - scripts/windows-one-click-lib.mjs
  - package.json
  - src/app/api/nearby-amenities/route.ts
  - src/lib/registry-discovery-contract.ts
  - scripts/one-click.mjs
  - src/lib/pdf-blocks/transaction-history-page.tsx
  - src/components/ui/dialog.tsx
  - src-tauri/src/land_registry/api_key_storage.rs
  - src/lib/server/local-formal-pull-proxy.ts
  - scripts/windows-one-click.mjs
  - src/lib/formal-cop-api-set.ts
  - src/lib/pdf-blocks/property-data-sheet.tsx
tests:
  - src/lib/__tests__/map-api.test.ts
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/__tests__/registry-preview.test.ts
  - src/lib/server/__tests__/local-formal-pull-proxy.test.ts
  - src/lib/local-api/__tests__/cop-credential.test.ts
  - src/lib/__tests__/formal-cop-api-set.test.ts
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/lib/server/__tests__/twinkle-real-price.test.ts
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/lib/__tests__/real-price-query.test.ts
  - e2e/real-property-fixtures-free-discovery.spec.ts
  - e2e/product-navigation-ia.spec.ts
  - e2e/product-auth-functional-flow.spec.ts
  - src/lib/__tests__/overpass-client.test.ts
  - e2e/candidate-parcel-options-presurvey.spec.ts
  - scripts/__tests__/one-click.test.mjs
  - src/lib/pdf-blocks/__tests__/transaction-history-page.test.ts
  - src/lib/__tests__/mock-backend.test.ts
  - src/lib/pdf-blocks/__tests__/registry-image-pages.test.tsx
  - e2e/real-presurvey-pdf-download.spec.ts
  - src/lib/server/__tests__/local-address-discovery-proxy.test.ts
  - e2e/full-product-flow-ia-ux-acceptance.spec.ts
  - src/app/api/local/cop-credential/test/route.ts
  - e2e/product-ui-demo-alignment.spec.ts
  - e2e/local-web-registry-pending-billing.spec.ts
  - e2e/real-nine-fixtures-pdf-download.spec.ts
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx
  - src/lib/pdf-blocks/__tests__/life-amenities.test.tsx
  - src/components/__tests__/PreChargeConfirmDialog.test.tsx
  - src/lib/pdf-blocks/__tests__/land-condition-survey.test.tsx
  - e2e/desktop-local-address-to-cop-e2e.spec.ts
  - e2e/aire-disclosure-registry-ux.spec.ts
  - e2e/theme-selector.spec.ts
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - src/lib/__tests__/land-registry-api.test.ts
  - e2e/complete-presurvey-property-sheet-flow.spec.ts
  - scripts/__tests__/windows-one-click.test.mjs
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
-->

---
### Requirement: Paid Formal Pull E2E

The paid formal pull E2E SHALL verify visible consent, successful import, and visible actual charge.

#### Scenario: Actual Charge

- **GIVEN** the user confirms a paid formal pull
- **WHEN** the import succeeds
- **THEN** the UI shows an `實際扣款` amount
- **AND** the test accepts the current pricing amount from the UI rather than a retired hard-coded amount.

<!-- @trace
source: stabilize-customer-delivery-e2e
updated: 2026-06-02
code:
  - src/lib/pdf-engine/html-blocks/property-data-sheet.tsx
  - scripts/one-click-lib.mjs
  - src/lib/overpass-client.ts
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - src/lib/product-ui-demo-alignment.ts
  - src/lib/map-api.ts
  - src/app/(dashboard)/cases/new/page.tsx
  - src/lib/land-registry-api.ts
  - scripts/install-from-github-release.ps1
  - .superset/config.json
  - src/lib/mock-backend.ts
  - src/lib/real-price-query.ts
  - src/lib/server/twinkle-real-price.ts
  - AGENTS.md
  - src/app/api/street-view/route.ts
  - src/app/api/geocode/route.ts
  - src/lib/pdf-blocks/land-condition-survey.tsx
  - src/lib/tauri-bridge.ts
  - src-tauri/src/land_registry/pull.rs
  - src/lib/registry-preview.ts
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src-tauri/src/db/registry_query_runs.rs
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/pdf-blocks/life-amenities.tsx
  - README.md
  - src/components/PullParcelDataButton.tsx
  - src/lib/local-api/cop-credential-store.ts
  - docs/real-property-fixtures.md
  - src/app/api/local/formal-pull-data/route.ts
  - scripts/install-from-github-release.sh
  - src/lib/pdf-engine/document.tsx
  - next.config.ts
  - e2e/formal-pull-fixture.ts
  - src/lib/pdf-blocks/exterior-photo-page.tsx
  - src-tauri/src/commands/cases.rs
  - artifacts/smoke/desktop-local-address-to-cop-e2e-live-discovery-matrix.json
  - src/lib/pdf-engine/html-blocks/transaction-history.tsx
  - src/components/PreChargeConfirmDialog.tsx
  - src/lib/server/local-address-discovery-proxy.ts
  - scripts/windows-one-click-lib.mjs
  - package.json
  - src/app/api/nearby-amenities/route.ts
  - src/lib/registry-discovery-contract.ts
  - scripts/one-click.mjs
  - src/lib/pdf-blocks/transaction-history-page.tsx
  - src/components/ui/dialog.tsx
  - src-tauri/src/land_registry/api_key_storage.rs
  - src/lib/server/local-formal-pull-proxy.ts
  - scripts/windows-one-click.mjs
  - src/lib/formal-cop-api-set.ts
  - src/lib/pdf-blocks/property-data-sheet.tsx
tests:
  - src/lib/__tests__/map-api.test.ts
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/__tests__/registry-preview.test.ts
  - src/lib/server/__tests__/local-formal-pull-proxy.test.ts
  - src/lib/local-api/__tests__/cop-credential.test.ts
  - src/lib/__tests__/formal-cop-api-set.test.ts
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/lib/server/__tests__/twinkle-real-price.test.ts
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/lib/__tests__/real-price-query.test.ts
  - e2e/real-property-fixtures-free-discovery.spec.ts
  - e2e/product-navigation-ia.spec.ts
  - e2e/product-auth-functional-flow.spec.ts
  - src/lib/__tests__/overpass-client.test.ts
  - e2e/candidate-parcel-options-presurvey.spec.ts
  - scripts/__tests__/one-click.test.mjs
  - src/lib/pdf-blocks/__tests__/transaction-history-page.test.ts
  - src/lib/__tests__/mock-backend.test.ts
  - src/lib/pdf-blocks/__tests__/registry-image-pages.test.tsx
  - e2e/real-presurvey-pdf-download.spec.ts
  - src/lib/server/__tests__/local-address-discovery-proxy.test.ts
  - e2e/full-product-flow-ia-ux-acceptance.spec.ts
  - src/app/api/local/cop-credential/test/route.ts
  - e2e/product-ui-demo-alignment.spec.ts
  - e2e/local-web-registry-pending-billing.spec.ts
  - e2e/real-nine-fixtures-pdf-download.spec.ts
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx
  - src/lib/pdf-blocks/__tests__/life-amenities.test.tsx
  - src/components/__tests__/PreChargeConfirmDialog.test.tsx
  - src/lib/pdf-blocks/__tests__/land-condition-survey.test.tsx
  - e2e/desktop-local-address-to-cop-e2e.spec.ts
  - e2e/aire-disclosure-registry-ux.spec.ts
  - e2e/theme-selector.spec.ts
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - src/lib/__tests__/land-registry-api.test.ts
  - e2e/complete-presurvey-property-sheet-flow.spec.ts
  - scripts/__tests__/windows-one-click.test.mjs
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
-->