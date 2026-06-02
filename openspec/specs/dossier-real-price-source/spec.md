# dossier-real-price-source Specification

## Purpose

TBD - created by archiving change 'prefer-presurvey-real-price-source'. Update Purpose after archive.

## Requirements

### Requirement: PDF real price data SHALL come from saved pre-survey records

PDF dossier assembly SHALL use real-price records that were already saved in the case provenance during the free pre-survey flow.

#### Scenario: Saved real-price records are used for PDF

- **GIVEN** a case has `land_registry_data.entries.real_price_query` with saved transaction records
- **WHEN** the system assembles dossier data for PDF preview or export
- **THEN** the dossier SHALL include transaction history from the saved records
- **AND** the system SHALL NOT call a live real-price provider during PDF assembly

#### Scenario: Missing saved real-price records do not trigger live lookup

- **GIVEN** a case has no saved `real_price_query` records
- **WHEN** the system assembles dossier data for PDF preview or export
- **THEN** the dossier SHALL complete with empty transaction history
- **AND** the system SHALL NOT call Twinkle, open data, or any live real-price provider during PDF assembly


<!-- @trace
source: prefer-presurvey-real-price-source
updated: 2026-06-02
code:
  - src-tauri/src/db/registry_query_runs.rs
  - artifacts/smoke/desktop-local-address-to-cop-e2e-live-discovery-matrix.json
  - src/app/api/local/formal-pull-data/route.ts
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/mock-backend.ts
  - src/app/api/street-view/route.ts
  - src/components/ui/dialog.tsx
  - .superset/config.json
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/server/local-address-discovery-proxy.ts
  - AGENTS.md
  - src/lib/pdf-blocks/land-condition-survey.tsx
  - e2e/formal-pull-fixture.ts
  - scripts/install-from-github-release.sh
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - package.json
  - src/lib/server/twinkle-real-price.ts
  - src/lib/formal-cop-api-set.ts
  - src/lib/pdf-blocks/exterior-photo-page.tsx
  - src/lib/land-registry-api.ts
  - src/lib/pdf-blocks/transaction-history-page.tsx
  - scripts/one-click.mjs
  - src/lib/overpass-client.ts
  - src/lib/pdf-engine/html-blocks/property-data-sheet.tsx
  - scripts/install-from-github-release.ps1
  - src/lib/registry-discovery-contract.ts
  - src-tauri/src/commands/cases.rs
  - README.md
  - src/lib/pdf-engine/document.tsx
  - src/lib/tauri-bridge.ts
  - docs/real-property-fixtures.md
  - src/lib/map-api.ts
  - src/lib/pdf-engine/html-blocks/transaction-history.tsx
  - src/app/api/geocode/route.ts
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/PreChargeConfirmDialog.tsx
  - src/lib/product-ui-demo-alignment.ts
  - scripts/windows-one-click-lib.mjs
  - src/lib/local-api/cop-credential-store.ts
  - src/app/api/nearby-amenities/route.ts
  - scripts/one-click-lib.mjs
  - src/lib/real-price-query.ts
  - src-tauri/src/land_registry/pull.rs
  - src/app/(dashboard)/cases/new/page.tsx
  - next.config.ts
  - src/lib/pdf-blocks/property-data-sheet.tsx
  - src/lib/pdf-blocks/life-amenities.tsx
  - src/lib/registry-preview.ts
  - src/lib/server/local-formal-pull-proxy.ts
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src-tauri/src/land_registry/api_key_storage.rs
  - scripts/windows-one-click.mjs
tests:
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - e2e/real-nine-fixtures-pdf-download.spec.ts
  - src/lib/__tests__/formal-cop-api-set.test.ts
  - src/lib/server/__tests__/local-formal-pull-proxy.test.ts
  - src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - scripts/__tests__/one-click.test.mjs
  - src/components/__tests__/PreChargeConfirmDialog.test.tsx
  - scripts/__tests__/windows-one-click.test.mjs
  - e2e/full-product-flow-ia-ux-acceptance.spec.ts
  - e2e/real-property-fixtures-free-discovery.spec.ts
  - src/lib/__tests__/map-api.test.ts
  - e2e/local-web-registry-pending-billing.spec.ts
  - e2e/theme-selector.spec.ts
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - src/lib/server/__tests__/twinkle-real-price.test.ts
  - e2e/real-presurvey-pdf-download.spec.ts
  - src/lib/__tests__/overpass-client.test.ts
  - e2e/candidate-parcel-options-presurvey.spec.ts
  - src/lib/__tests__/mock-backend.test.ts
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - src/app/api/local/cop-credential/test/route.ts
  - src/lib/__tests__/land-registry-api.test.ts
  - src/lib/pdf-blocks/__tests__/land-condition-survey.test.tsx
  - e2e/complete-presurvey-property-sheet-flow.spec.ts
  - e2e/desktop-local-address-to-cop-e2e.spec.ts
  - src/lib/__tests__/registry-preview.test.ts
  - src/lib/pdf-blocks/__tests__/registry-image-pages.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/lib/pdf-blocks/__tests__/transaction-history-page.test.ts
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/__tests__/real-price-query.test.ts
  - e2e/product-navigation-ia.spec.ts
  - src/lib/pdf-blocks/__tests__/life-amenities.test.tsx
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - e2e/product-ui-demo-alignment.spec.ts
  - src/lib/server/__tests__/local-address-discovery-proxy.test.ts
  - e2e/aire-disclosure-registry-ux.spec.ts
  - src/lib/local-api/__tests__/cop-credential.test.ts
  - e2e/product-auth-functional-flow.spec.ts
-->

---
### Requirement: Creation-time pre-survey SHALL save obtained real-price records

When the free pre-survey creation flow obtains real-price records, those records SHALL be persisted into case provenance before PDF assembly can use them.

#### Scenario: Creation flow saves free real-price records

- **GIVEN** the user enters an address and the free pre-survey flow obtains real-price records
- **WHEN** the user creates the case
- **THEN** the system SHALL save those records under `land_registry_data.entries.real_price_query`
- **AND** the saved records SHALL be available to PDF assembly without another live query

<!-- @trace
source: prefer-presurvey-real-price-source
updated: 2026-06-02
code:
  - src-tauri/src/db/registry_query_runs.rs
  - artifacts/smoke/desktop-local-address-to-cop-e2e-live-discovery-matrix.json
  - src/app/api/local/formal-pull-data/route.ts
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/mock-backend.ts
  - src/app/api/street-view/route.ts
  - src/components/ui/dialog.tsx
  - .superset/config.json
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/server/local-address-discovery-proxy.ts
  - AGENTS.md
  - src/lib/pdf-blocks/land-condition-survey.tsx
  - e2e/formal-pull-fixture.ts
  - scripts/install-from-github-release.sh
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - package.json
  - src/lib/server/twinkle-real-price.ts
  - src/lib/formal-cop-api-set.ts
  - src/lib/pdf-blocks/exterior-photo-page.tsx
  - src/lib/land-registry-api.ts
  - src/lib/pdf-blocks/transaction-history-page.tsx
  - scripts/one-click.mjs
  - src/lib/overpass-client.ts
  - src/lib/pdf-engine/html-blocks/property-data-sheet.tsx
  - scripts/install-from-github-release.ps1
  - src/lib/registry-discovery-contract.ts
  - src-tauri/src/commands/cases.rs
  - README.md
  - src/lib/pdf-engine/document.tsx
  - src/lib/tauri-bridge.ts
  - docs/real-property-fixtures.md
  - src/lib/map-api.ts
  - src/lib/pdf-engine/html-blocks/transaction-history.tsx
  - src/app/api/geocode/route.ts
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/PreChargeConfirmDialog.tsx
  - src/lib/product-ui-demo-alignment.ts
  - scripts/windows-one-click-lib.mjs
  - src/lib/local-api/cop-credential-store.ts
  - src/app/api/nearby-amenities/route.ts
  - scripts/one-click-lib.mjs
  - src/lib/real-price-query.ts
  - src-tauri/src/land_registry/pull.rs
  - src/app/(dashboard)/cases/new/page.tsx
  - next.config.ts
  - src/lib/pdf-blocks/property-data-sheet.tsx
  - src/lib/pdf-blocks/life-amenities.tsx
  - src/lib/registry-preview.ts
  - src/lib/server/local-formal-pull-proxy.ts
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src-tauri/src/land_registry/api_key_storage.rs
  - scripts/windows-one-click.mjs
tests:
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - e2e/real-nine-fixtures-pdf-download.spec.ts
  - src/lib/__tests__/formal-cop-api-set.test.ts
  - src/lib/server/__tests__/local-formal-pull-proxy.test.ts
  - src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - scripts/__tests__/one-click.test.mjs
  - src/components/__tests__/PreChargeConfirmDialog.test.tsx
  - scripts/__tests__/windows-one-click.test.mjs
  - e2e/full-product-flow-ia-ux-acceptance.spec.ts
  - e2e/real-property-fixtures-free-discovery.spec.ts
  - src/lib/__tests__/map-api.test.ts
  - e2e/local-web-registry-pending-billing.spec.ts
  - e2e/theme-selector.spec.ts
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - src/lib/server/__tests__/twinkle-real-price.test.ts
  - e2e/real-presurvey-pdf-download.spec.ts
  - src/lib/__tests__/overpass-client.test.ts
  - e2e/candidate-parcel-options-presurvey.spec.ts
  - src/lib/__tests__/mock-backend.test.ts
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - src/app/api/local/cop-credential/test/route.ts
  - src/lib/__tests__/land-registry-api.test.ts
  - src/lib/pdf-blocks/__tests__/land-condition-survey.test.tsx
  - e2e/complete-presurvey-property-sheet-flow.spec.ts
  - e2e/desktop-local-address-to-cop-e2e.spec.ts
  - src/lib/__tests__/registry-preview.test.ts
  - src/lib/pdf-blocks/__tests__/registry-image-pages.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/lib/pdf-blocks/__tests__/transaction-history-page.test.ts
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/__tests__/real-price-query.test.ts
  - e2e/product-navigation-ia.spec.ts
  - src/lib/pdf-blocks/__tests__/life-amenities.test.tsx
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - e2e/product-ui-demo-alignment.spec.ts
  - src/lib/server/__tests__/local-address-discovery-proxy.test.ts
  - e2e/aire-disclosure-registry-ux.spec.ts
  - src/lib/local-api/__tests__/cop-credential.test.ts
  - e2e/product-auth-functional-flow.spec.ts
-->