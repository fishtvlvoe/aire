# desktop-real-price-source-parity Specification

## Purpose

TBD - created by archiving change 'desktop-local-address-to-cop-e2e'. Update Purpose after archive.

## Requirements

### Requirement: Desktop real price source parity SHALL hold across web, local runtime, and desktop app

系統 SHALL 在 web、local runtime 與 desktop app 上，對同一地址使用一致的地址解析、dataset mapping、排序規則與來源邊界，不得讓不同 runtime 顯示互相矛盾的固定資料。

#### Scenario: Same address uses the same real-price source rules across runtimes

- **GIVEN** 同一地址在 web、local runtime 與 desktop app 被查詢
- **WHEN** 系統執行實價登錄附近行情查詢
- **THEN** 各 runtime SHALL 使用同一套 city / district / keyword 解析與 dataset mapping 規則
- **AND** SHALL 不再退回舊的 mock fixture

#### Scenario: City-specific dataset mapping remains extensible

- **GIVEN** 某城市需要專用 dataset 才能取得較新的成交資料
- **WHEN** 實作 real-price source parity
- **THEN** 系統 SHALL 保留 city-specific dataset mapping 擴充點
- **AND** fallback dataset 仍必須是免費真資料來源

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