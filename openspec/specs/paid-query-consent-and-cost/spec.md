# paid-query-consent-and-cost Specification

## Purpose

TBD - created by archiving change 'desktop-local-address-to-cop-e2e'. Update Purpose after archive.

## Requirements

### Requirement: Paid query consent and cost SHALL be explicit before formal COP runs

系統 SHALL 在使用者執行付費正式查詢前，明確揭露查詢用途、費用與計費風險，且未經確認不得發動 formal COP。

#### Scenario: User sees cost before paid formal query

- **GIVEN** 案件已具備 confirmed registry key
- **WHEN** 使用者點擊正式查詢
- **THEN** 系統 SHALL 顯示本次查詢要取得的資料、預估費用與是否可能失敗仍計費
- **AND** 僅在使用者確認後才可執行付費正式查詢

#### Scenario: User skips paid formal query

- **GIVEN** 使用者不確認付費
- **WHEN** 正式查詢對話框關閉
- **THEN** 系統 SHALL 不執行 formal COP
- **AND** 案件仍可保留免費前查資料繼續後續流程


<!-- @trace
source: desktop-local-address-to-cop-e2e
updated: 2026-06-02
code:
  - e2e/results/test-artifacts/.last-run.json
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/overpass-client.ts
  - src/lib/server/twinkle-real-price.ts
  - src/lib/local-api/client.ts
  - playwright.config.ts
  - src/lib/local-api/contract.ts
  - src/app/login/page.tsx
  - e2e/formal-pull-fixture.ts
  - docs/real-property-fixtures.md
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - src/lib/registry-discovery-contract.ts
  - src/lib/tauri-bridge.ts
  - src/lib/case-routes.ts
  - scripts/install-from-github-release.ps1
  - src/app/api/local/real-price/route.ts
  - src-tauri/src/land_registry/easymap_r02.rs
  - src/app/api/nearby-amenities/route.ts
  - src/components/PreChargeConfirmDialog.tsx
  - docs/workbench-redesign-prototype/05-pdf-check.html
  - src/lib/registry-provenance.ts
  - src/lib/pdf-blocks/land-condition-survey.tsx
  - src/lib/server/local-address-discovery-proxy.ts
  - README.md
  - src-tauri/src/commands/cases.rs
  - docs/workbench-redesign-prototype/02-supplements.html
  - scripts/windows-one-click-lib.mjs
  - e2e/results/navigation-ia/cases-overview-1440.png
  - src/app/api/geocode/route.ts
  - e2e/results/navigation-ia/cases-overview-768.png
  - e2e/results/legal-sync.json
  - e2e/results/license-verification.json
  - src/lib/map-api.ts
  - next.config.ts
  - src/lib/auth.ts
  - scripts/one-click.mjs
  - src/app/(dashboard)/cases/new/page.tsx
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src/lib/pdf-engine/html-blocks/property-data-sheet.tsx
  - src/lib/registry-preview.ts
  - src/middleware.ts
  - artifacts/smoke/desktop-local-address-to-cop-e2e-live-discovery-matrix.json
  - docs/workbench-redesign-prototype/04-summary.html
  - src/app/api/street-view/route.ts
  - docs/workbench-redesign-prototype/03-formal-import.html
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/app/api/init/route.ts
  - src/lib/product-ui-demo-alignment.ts
  - package.json
  - src/lib/pdf-blocks/life-amenities.tsx
  - docs/workbench-redesign-prototype/index.html
  - src/lib/pdf-blocks/transaction-history-page.tsx
  - src-tauri/src/land_registry/pull.rs
  - src/components/ui/dialog.tsx
  - src/components/PullParcelDataButton.tsx
  - src/lib/pdf-blocks/property-data-sheet.tsx
  - e2e/results/playwright-report/index.html
  - src/lib/land-registry-api.ts
  - src/lib/pdf-engine/document.tsx
  - tsconfig.json
  - .superset/config.json
  - src-tauri/src/db/registry_query_runs.rs
  - scripts/windows-one-click.mjs
  - src/lib/formal-cop-api-set.ts
  - docs/workbench-redesign-prototype/06-pricing-modal.html
  - src/components/RealPricePanel.tsx
  - src/lib/server/local-formal-pull-proxy.ts
  - docs/workbench-redesign-prototype/01-field-review.html
  - src/lib/local-api/cop-credential-store.ts
  - scripts/install-from-github-release.sh
  - src/app/api/config/route.ts
  - src/lib/mock-backend.ts
  - src/lib/real-price-query.ts
  - scripts/one-click-lib.mjs
  - src/app/api/local/formal-pull-data/route.ts
  - scripts/launch-aire.mjs
  - AGENTS.md
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - e2e/results/results.json
  - src/lib/pdf-engine/html-blocks/transaction-history.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/lib/pdf-blocks/exterior-photo-page.tsx
  - src-tauri/src/land_registry/api_key_storage.rs
tests:
  - e2e/real-property-fixtures-free-discovery.spec.ts
  - src/lib/server/__tests__/twinkle-real-price.test.ts
  - src/lib/__tests__/mock-backend.test.ts
  - scripts/__tests__/one-click.test.mjs
  - e2e/full-product-flow-ia-ux-acceptance.spec.ts
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - e2e/product-auth-functional-flow.spec.ts
  - src/lib/pdf-blocks/__tests__/land-condition-survey.test.tsx
  - e2e/product-ui-demo-alignment.spec.ts
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/app/api/local/cop-credential/test/route.ts
  - e2e/local-web-registry-pending-billing.spec.ts
  - src/lib/pdf-blocks/__tests__/life-amenities.test.tsx
  - src/lib/server/__tests__/local-address-discovery-proxy.test.ts
  - src/lib/__tests__/overpass-client.test.ts
  - src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - src/app/(dashboard)/cases/__tests__/page.test.tsx
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - e2e/complete-presurvey-property-sheet-flow.spec.ts
  - src/lib/__tests__/product-navigation-ia.test.ts
  - src/lib/__tests__/formal-cop-api-set.test.ts
  - e2e/desktop-local-address-to-cop-e2e.spec.ts
  - src/lib/pdf-blocks/__tests__/registry-image-pages.test.tsx
  - e2e/aire-disclosure-registry-ux.spec.ts
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/__tests__/real-price-query.test.ts
  - src/app/api/local/real-price/__tests__/route.test.ts
  - e2e/desktop-auth-credential-fulfillment-smoke.spec.ts
  - src/app/login/__tests__/page.test.tsx
  - src/lib/server/__tests__/local-formal-pull-proxy.test.ts
  - src/lib/__tests__/product-ui-demo-alignment.test.ts
  - e2e/product-navigation-ia.spec.ts
  - src/lib/__tests__/registry-provenance.test.ts
  - src/app/(dashboard)/cases/[id]/__tests__/page.test.tsx
  - src/app/api/health/__tests__/route.test.ts
  - src/components/__tests__/RealPricePanel.test.tsx
  - e2e/real-presurvey-pdf-download.spec.ts
  - src/components/__tests__/PreChargeConfirmDialog.test.tsx
  - e2e/theme-selector.spec.ts
  - src/lib/__tests__/land-registry-api.test.ts
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - src/lib/pdf-blocks/__tests__/transaction-history-page.test.ts
  - src/lib/__tests__/auth.test.ts
  - e2e/candidate-parcel-options-presurvey.spec.ts
  - scripts/__tests__/windows-one-click.test.mjs
  - src/lib/local-api/__tests__/cop-credential.test.ts
  - e2e/real-nine-fixtures-pdf-download.spec.ts
  - src/lib/__tests__/map-api.test.ts
  - src/lib/__tests__/registry-preview.test.ts
-->

---
### Requirement: Post-signing formal supplement SHALL use catalog-driven pricing

The system SHALL calculate formal supplement costs from the COP service catalog, not from a fixed successful-item multiplier. Each paid line item SHALL include the API code, service name, unit price, billable quantity, estimated cost, actual cost when available, and whether a failed request can remain billable.

#### Scenario: Pre-signing stage has no paid formal line items

- **GIVEN** a case is still in the pre-signing pre-survey stage
- **WHEN** the user reviews the workbench, preview, or PDF export
- **THEN** the system SHALL show COP cost as zero
- **AND** SHALL NOT show ownership, other-right, mortgage, or electronic transcript fees as already required

#### Scenario: Post-signing formal supplement estimates ownership and other-right costs

- **GIVEN** a case has entered the signed formal supplement stage
- **AND** the user chooses to query ownership and other-right records
- **WHEN** the system opens the paid confirmation dialog
- **THEN** the system SHALL build the cost estimate from `moi-service-catalog`
- **AND** SHALL show each selected API as a separate priced line item
- **AND** SHALL NOT calculate the total as `successful item count * 10`

#### Scenario: Catalog pricing is missing

- **GIVEN** a selected formal supplement API has no catalog price
- **WHEN** the user attempts to confirm the paid query
- **THEN** the system SHALL block the paid query
- **AND** SHALL show a pricing configuration error instead of falling back to a fixed NT$10 estimate

<!-- @trace
source: desktop-local-address-to-cop-e2e
updated: 2026-06-02
code:
  - e2e/results/test-artifacts/.last-run.json
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/overpass-client.ts
  - src/lib/server/twinkle-real-price.ts
  - src/lib/local-api/client.ts
  - playwright.config.ts
  - src/lib/local-api/contract.ts
  - src/app/login/page.tsx
  - e2e/formal-pull-fixture.ts
  - docs/real-property-fixtures.md
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - src/lib/registry-discovery-contract.ts
  - src/lib/tauri-bridge.ts
  - src/lib/case-routes.ts
  - scripts/install-from-github-release.ps1
  - src/app/api/local/real-price/route.ts
  - src-tauri/src/land_registry/easymap_r02.rs
  - src/app/api/nearby-amenities/route.ts
  - src/components/PreChargeConfirmDialog.tsx
  - docs/workbench-redesign-prototype/05-pdf-check.html
  - src/lib/registry-provenance.ts
  - src/lib/pdf-blocks/land-condition-survey.tsx
  - src/lib/server/local-address-discovery-proxy.ts
  - README.md
  - src-tauri/src/commands/cases.rs
  - docs/workbench-redesign-prototype/02-supplements.html
  - scripts/windows-one-click-lib.mjs
  - e2e/results/navigation-ia/cases-overview-1440.png
  - src/app/api/geocode/route.ts
  - e2e/results/navigation-ia/cases-overview-768.png
  - e2e/results/legal-sync.json
  - e2e/results/license-verification.json
  - src/lib/map-api.ts
  - next.config.ts
  - src/lib/auth.ts
  - scripts/one-click.mjs
  - src/app/(dashboard)/cases/new/page.tsx
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src/lib/pdf-engine/html-blocks/property-data-sheet.tsx
  - src/lib/registry-preview.ts
  - src/middleware.ts
  - artifacts/smoke/desktop-local-address-to-cop-e2e-live-discovery-matrix.json
  - docs/workbench-redesign-prototype/04-summary.html
  - src/app/api/street-view/route.ts
  - docs/workbench-redesign-prototype/03-formal-import.html
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/app/api/init/route.ts
  - src/lib/product-ui-demo-alignment.ts
  - package.json
  - src/lib/pdf-blocks/life-amenities.tsx
  - docs/workbench-redesign-prototype/index.html
  - src/lib/pdf-blocks/transaction-history-page.tsx
  - src-tauri/src/land_registry/pull.rs
  - src/components/ui/dialog.tsx
  - src/components/PullParcelDataButton.tsx
  - src/lib/pdf-blocks/property-data-sheet.tsx
  - e2e/results/playwright-report/index.html
  - src/lib/land-registry-api.ts
  - src/lib/pdf-engine/document.tsx
  - tsconfig.json
  - .superset/config.json
  - src-tauri/src/db/registry_query_runs.rs
  - scripts/windows-one-click.mjs
  - src/lib/formal-cop-api-set.ts
  - docs/workbench-redesign-prototype/06-pricing-modal.html
  - src/components/RealPricePanel.tsx
  - src/lib/server/local-formal-pull-proxy.ts
  - docs/workbench-redesign-prototype/01-field-review.html
  - src/lib/local-api/cop-credential-store.ts
  - scripts/install-from-github-release.sh
  - src/app/api/config/route.ts
  - src/lib/mock-backend.ts
  - src/lib/real-price-query.ts
  - scripts/one-click-lib.mjs
  - src/app/api/local/formal-pull-data/route.ts
  - scripts/launch-aire.mjs
  - AGENTS.md
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - e2e/results/results.json
  - src/lib/pdf-engine/html-blocks/transaction-history.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/lib/pdf-blocks/exterior-photo-page.tsx
  - src-tauri/src/land_registry/api_key_storage.rs
tests:
  - e2e/real-property-fixtures-free-discovery.spec.ts
  - src/lib/server/__tests__/twinkle-real-price.test.ts
  - src/lib/__tests__/mock-backend.test.ts
  - scripts/__tests__/one-click.test.mjs
  - e2e/full-product-flow-ia-ux-acceptance.spec.ts
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - e2e/product-auth-functional-flow.spec.ts
  - src/lib/pdf-blocks/__tests__/land-condition-survey.test.tsx
  - e2e/product-ui-demo-alignment.spec.ts
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/app/api/local/cop-credential/test/route.ts
  - e2e/local-web-registry-pending-billing.spec.ts
  - src/lib/pdf-blocks/__tests__/life-amenities.test.tsx
  - src/lib/server/__tests__/local-address-discovery-proxy.test.ts
  - src/lib/__tests__/overpass-client.test.ts
  - src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - src/app/(dashboard)/cases/__tests__/page.test.tsx
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - e2e/complete-presurvey-property-sheet-flow.spec.ts
  - src/lib/__tests__/product-navigation-ia.test.ts
  - src/lib/__tests__/formal-cop-api-set.test.ts
  - e2e/desktop-local-address-to-cop-e2e.spec.ts
  - src/lib/pdf-blocks/__tests__/registry-image-pages.test.tsx
  - e2e/aire-disclosure-registry-ux.spec.ts
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/__tests__/real-price-query.test.ts
  - src/app/api/local/real-price/__tests__/route.test.ts
  - e2e/desktop-auth-credential-fulfillment-smoke.spec.ts
  - src/app/login/__tests__/page.test.tsx
  - src/lib/server/__tests__/local-formal-pull-proxy.test.ts
  - src/lib/__tests__/product-ui-demo-alignment.test.ts
  - e2e/product-navigation-ia.spec.ts
  - src/lib/__tests__/registry-provenance.test.ts
  - src/app/(dashboard)/cases/[id]/__tests__/page.test.tsx
  - src/app/api/health/__tests__/route.test.ts
  - src/components/__tests__/RealPricePanel.test.tsx
  - e2e/real-presurvey-pdf-download.spec.ts
  - src/components/__tests__/PreChargeConfirmDialog.test.tsx
  - e2e/theme-selector.spec.ts
  - src/lib/__tests__/land-registry-api.test.ts
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - src/lib/pdf-blocks/__tests__/transaction-history-page.test.ts
  - src/lib/__tests__/auth.test.ts
  - e2e/candidate-parcel-options-presurvey.spec.ts
  - scripts/__tests__/windows-one-click.test.mjs
  - src/lib/local-api/__tests__/cop-credential.test.ts
  - e2e/real-nine-fixtures-pdf-download.spec.ts
  - src/lib/__tests__/map-api.test.ts
  - src/lib/__tests__/registry-preview.test.ts
-->