# windows-one-command-install-and-launch Specification

## Purpose

TBD - created by archiving change 'windows-one-command-install-and-launch'. Update Purpose after archive.

## Requirements

### Requirement: Windows one-command install-and-launch SHALL be available from terminal

系統 SHALL 提供一個 Windows 專用終端機命令，完成安裝、runtime build 與啟動。

#### Scenario: Windows user runs one command from project root

- **GIVEN** 使用者在 Windows，且位於 AIRE 專案根目錄
- **WHEN** 執行 `npm run windows:one-click`
- **THEN** 系統 SHALL 依序執行 install、native build 核准/重建、runtime build、launch
- **AND** 啟動後 SHALL 自動開啟本機 AIRE 頁面

##### Example: Step order

| Input | Expected Output | Notes |
| ----- | --------------- | ----- |
| `npm run windows:one-click -- --dry-run` | 依序列出 `install -> approve-builds -> rebuild -> build-local-runtime -> launch` | 不實際執行命令 |


<!-- @trace
source: windows-one-command-install-and-launch
updated: 2026-06-02
code:
  - src-tauri/src/land_registry/api_key_storage.rs
  - src-tauri/src/land_registry/pull.rs
  - src/lib/pdf-engine/html-blocks/property-data-sheet.tsx
  - src/components/PreChargeConfirmDialog.tsx
  - src/app/api/geocode/route.ts
  - src/lib/product-ui-demo-alignment.ts
  - src/app/api/nearby-amenities/route.ts
  - src/lib/registry-preview.ts
  - src/lib/tauri-bridge.ts
  - src-tauri/src/commands/cases.rs
  - src/lib/pdf-blocks/exterior-photo-page.tsx
  - src/lib/server/local-address-discovery-proxy.ts
  - scripts/windows-one-click-lib.mjs
  - src/lib/pdf-blocks/property-data-sheet.tsx
  - src/lib/pdf-engine/document.tsx
  - src/lib/pdf-blocks/land-condition-survey.tsx
  - src/lib/pdf-blocks/transaction-history-page.tsx
  - src/lib/mock-backend.ts
  - src/lib/map-api.ts
  - src/lib/real-price-query.ts
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - scripts/install-from-github-release.sh
  - src/app/api/local/formal-pull-data/route.ts
  - src/components/PullParcelDataButton.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/server/local-formal-pull-proxy.ts
  - .superset/config.json
  - e2e/formal-pull-fixture.ts
  - src/lib/registry-discovery-contract.ts
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/overpass-client.ts
  - src/lib/server/twinkle-real-price.ts
  - docs/real-property-fixtures.md
  - src/components/ui/dialog.tsx
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - scripts/windows-one-click.mjs
  - package.json
  - scripts/install-from-github-release.ps1
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - next.config.ts
  - AGENTS.md
  - src-tauri/src/db/registry_query_runs.rs
  - src/lib/local-api/cop-credential-store.ts
  - src/app/api/street-view/route.ts
  - src/lib/pdf-engine/html-blocks/transaction-history.tsx
  - README.md
  - artifacts/smoke/desktop-local-address-to-cop-e2e-live-discovery-matrix.json
  - scripts/one-click.mjs
  - src/lib/land-registry-api.ts
  - src/lib/formal-cop-api-set.ts
  - src/lib/pdf-blocks/life-amenities.tsx
  - scripts/one-click-lib.mjs
tests:
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - e2e/full-product-flow-ia-ux-acceptance.spec.ts
  - src/lib/local-api/__tests__/cop-credential.test.ts
  - e2e/local-web-registry-pending-billing.spec.ts
  - e2e/aire-disclosure-registry-ux.spec.ts
  - src/components/__tests__/PreChargeConfirmDialog.test.tsx
  - src/lib/server/__tests__/twinkle-real-price.test.ts
  - e2e/real-presurvey-pdf-download.spec.ts
  - src/lib/__tests__/formal-cop-api-set.test.ts
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - e2e/real-property-fixtures-free-discovery.spec.ts
  - e2e/candidate-parcel-options-presurvey.spec.ts
  - src/lib/server/__tests__/local-formal-pull-proxy.test.ts
  - src/lib/__tests__/land-registry-api.test.ts
  - e2e/product-ui-demo-alignment.spec.ts
  - src/lib/server/__tests__/local-address-discovery-proxy.test.ts
  - e2e/complete-presurvey-property-sheet-flow.spec.ts
  - src/lib/__tests__/overpass-client.test.ts
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - src/lib/__tests__/real-price-query.test.ts
  - src/lib/__tests__/mock-backend.test.ts
  - e2e/product-auth-functional-flow.spec.ts
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - e2e/desktop-local-address-to-cop-e2e.spec.ts
  - src/lib/pdf-blocks/__tests__/land-condition-survey.test.tsx
  - e2e/product-navigation-ia.spec.ts
  - src/app/api/local/cop-credential/test/route.ts
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - e2e/theme-selector.spec.ts
  - src/lib/__tests__/map-api.test.ts
  - scripts/__tests__/windows-one-click.test.mjs
  - src/lib/pdf-blocks/__tests__/transaction-history-page.test.ts
  - src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx
  - src/lib/pdf-blocks/__tests__/life-amenities.test.tsx
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/lib/pdf-blocks/__tests__/registry-image-pages.test.tsx
  - e2e/real-nine-fixtures-pdf-download.spec.ts
  - src/lib/__tests__/registry-preview.test.ts
  - scripts/__tests__/one-click.test.mjs
-->

---
### Requirement: Non-Windows execution SHALL fail fast with explicit message

#### Scenario: macOS or Linux runs the Windows command

- **GIVEN** 使用者在非 Windows 平台
- **WHEN** 執行 `npm run windows:one-click`
- **THEN** 系統 SHALL 立即失敗並提示「此命令僅支援 Windows」
- **AND** SHALL 不執行任何安裝或建置步驟


<!-- @trace
source: windows-one-command-install-and-launch
updated: 2026-06-02
code:
  - src-tauri/src/land_registry/api_key_storage.rs
  - src-tauri/src/land_registry/pull.rs
  - src/lib/pdf-engine/html-blocks/property-data-sheet.tsx
  - src/components/PreChargeConfirmDialog.tsx
  - src/app/api/geocode/route.ts
  - src/lib/product-ui-demo-alignment.ts
  - src/app/api/nearby-amenities/route.ts
  - src/lib/registry-preview.ts
  - src/lib/tauri-bridge.ts
  - src-tauri/src/commands/cases.rs
  - src/lib/pdf-blocks/exterior-photo-page.tsx
  - src/lib/server/local-address-discovery-proxy.ts
  - scripts/windows-one-click-lib.mjs
  - src/lib/pdf-blocks/property-data-sheet.tsx
  - src/lib/pdf-engine/document.tsx
  - src/lib/pdf-blocks/land-condition-survey.tsx
  - src/lib/pdf-blocks/transaction-history-page.tsx
  - src/lib/mock-backend.ts
  - src/lib/map-api.ts
  - src/lib/real-price-query.ts
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - scripts/install-from-github-release.sh
  - src/app/api/local/formal-pull-data/route.ts
  - src/components/PullParcelDataButton.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/server/local-formal-pull-proxy.ts
  - .superset/config.json
  - e2e/formal-pull-fixture.ts
  - src/lib/registry-discovery-contract.ts
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/overpass-client.ts
  - src/lib/server/twinkle-real-price.ts
  - docs/real-property-fixtures.md
  - src/components/ui/dialog.tsx
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - scripts/windows-one-click.mjs
  - package.json
  - scripts/install-from-github-release.ps1
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - next.config.ts
  - AGENTS.md
  - src-tauri/src/db/registry_query_runs.rs
  - src/lib/local-api/cop-credential-store.ts
  - src/app/api/street-view/route.ts
  - src/lib/pdf-engine/html-blocks/transaction-history.tsx
  - README.md
  - artifacts/smoke/desktop-local-address-to-cop-e2e-live-discovery-matrix.json
  - scripts/one-click.mjs
  - src/lib/land-registry-api.ts
  - src/lib/formal-cop-api-set.ts
  - src/lib/pdf-blocks/life-amenities.tsx
  - scripts/one-click-lib.mjs
tests:
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - e2e/full-product-flow-ia-ux-acceptance.spec.ts
  - src/lib/local-api/__tests__/cop-credential.test.ts
  - e2e/local-web-registry-pending-billing.spec.ts
  - e2e/aire-disclosure-registry-ux.spec.ts
  - src/components/__tests__/PreChargeConfirmDialog.test.tsx
  - src/lib/server/__tests__/twinkle-real-price.test.ts
  - e2e/real-presurvey-pdf-download.spec.ts
  - src/lib/__tests__/formal-cop-api-set.test.ts
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - e2e/real-property-fixtures-free-discovery.spec.ts
  - e2e/candidate-parcel-options-presurvey.spec.ts
  - src/lib/server/__tests__/local-formal-pull-proxy.test.ts
  - src/lib/__tests__/land-registry-api.test.ts
  - e2e/product-ui-demo-alignment.spec.ts
  - src/lib/server/__tests__/local-address-discovery-proxy.test.ts
  - e2e/complete-presurvey-property-sheet-flow.spec.ts
  - src/lib/__tests__/overpass-client.test.ts
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - src/lib/__tests__/real-price-query.test.ts
  - src/lib/__tests__/mock-backend.test.ts
  - e2e/product-auth-functional-flow.spec.ts
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - e2e/desktop-local-address-to-cop-e2e.spec.ts
  - src/lib/pdf-blocks/__tests__/land-condition-survey.test.tsx
  - e2e/product-navigation-ia.spec.ts
  - src/app/api/local/cop-credential/test/route.ts
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - e2e/theme-selector.spec.ts
  - src/lib/__tests__/map-api.test.ts
  - scripts/__tests__/windows-one-click.test.mjs
  - src/lib/pdf-blocks/__tests__/transaction-history-page.test.ts
  - src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx
  - src/lib/pdf-blocks/__tests__/life-amenities.test.tsx
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/lib/pdf-blocks/__tests__/registry-image-pages.test.tsx
  - e2e/real-nine-fixtures-pdf-download.spec.ts
  - src/lib/__tests__/registry-preview.test.ts
  - scripts/__tests__/one-click.test.mjs
-->

---
### Requirement: One-click flow SHALL stop on first failing step

#### Scenario: dependency install step fails

- **GIVEN** install 步驟回傳非 0
- **WHEN** 執行 one-click 命令
- **THEN** 系統 SHALL 立即停止
- **AND** SHALL 顯示失敗的步驟名稱與命令
- **AND** SHALL 不再執行後續步驟

<!-- @trace
source: windows-one-command-install-and-launch
updated: 2026-06-02
code:
  - src-tauri/src/land_registry/api_key_storage.rs
  - src-tauri/src/land_registry/pull.rs
  - src/lib/pdf-engine/html-blocks/property-data-sheet.tsx
  - src/components/PreChargeConfirmDialog.tsx
  - src/app/api/geocode/route.ts
  - src/lib/product-ui-demo-alignment.ts
  - src/app/api/nearby-amenities/route.ts
  - src/lib/registry-preview.ts
  - src/lib/tauri-bridge.ts
  - src-tauri/src/commands/cases.rs
  - src/lib/pdf-blocks/exterior-photo-page.tsx
  - src/lib/server/local-address-discovery-proxy.ts
  - scripts/windows-one-click-lib.mjs
  - src/lib/pdf-blocks/property-data-sheet.tsx
  - src/lib/pdf-engine/document.tsx
  - src/lib/pdf-blocks/land-condition-survey.tsx
  - src/lib/pdf-blocks/transaction-history-page.tsx
  - src/lib/mock-backend.ts
  - src/lib/map-api.ts
  - src/lib/real-price-query.ts
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - scripts/install-from-github-release.sh
  - src/app/api/local/formal-pull-data/route.ts
  - src/components/PullParcelDataButton.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/server/local-formal-pull-proxy.ts
  - .superset/config.json
  - e2e/formal-pull-fixture.ts
  - src/lib/registry-discovery-contract.ts
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/overpass-client.ts
  - src/lib/server/twinkle-real-price.ts
  - docs/real-property-fixtures.md
  - src/components/ui/dialog.tsx
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - scripts/windows-one-click.mjs
  - package.json
  - scripts/install-from-github-release.ps1
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - next.config.ts
  - AGENTS.md
  - src-tauri/src/db/registry_query_runs.rs
  - src/lib/local-api/cop-credential-store.ts
  - src/app/api/street-view/route.ts
  - src/lib/pdf-engine/html-blocks/transaction-history.tsx
  - README.md
  - artifacts/smoke/desktop-local-address-to-cop-e2e-live-discovery-matrix.json
  - scripts/one-click.mjs
  - src/lib/land-registry-api.ts
  - src/lib/formal-cop-api-set.ts
  - src/lib/pdf-blocks/life-amenities.tsx
  - scripts/one-click-lib.mjs
tests:
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - e2e/full-product-flow-ia-ux-acceptance.spec.ts
  - src/lib/local-api/__tests__/cop-credential.test.ts
  - e2e/local-web-registry-pending-billing.spec.ts
  - e2e/aire-disclosure-registry-ux.spec.ts
  - src/components/__tests__/PreChargeConfirmDialog.test.tsx
  - src/lib/server/__tests__/twinkle-real-price.test.ts
  - e2e/real-presurvey-pdf-download.spec.ts
  - src/lib/__tests__/formal-cop-api-set.test.ts
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - e2e/real-property-fixtures-free-discovery.spec.ts
  - e2e/candidate-parcel-options-presurvey.spec.ts
  - src/lib/server/__tests__/local-formal-pull-proxy.test.ts
  - src/lib/__tests__/land-registry-api.test.ts
  - e2e/product-ui-demo-alignment.spec.ts
  - src/lib/server/__tests__/local-address-discovery-proxy.test.ts
  - e2e/complete-presurvey-property-sheet-flow.spec.ts
  - src/lib/__tests__/overpass-client.test.ts
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - src/lib/__tests__/real-price-query.test.ts
  - src/lib/__tests__/mock-backend.test.ts
  - e2e/product-auth-functional-flow.spec.ts
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - e2e/desktop-local-address-to-cop-e2e.spec.ts
  - src/lib/pdf-blocks/__tests__/land-condition-survey.test.tsx
  - e2e/product-navigation-ia.spec.ts
  - src/app/api/local/cop-credential/test/route.ts
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - e2e/theme-selector.spec.ts
  - src/lib/__tests__/map-api.test.ts
  - scripts/__tests__/windows-one-click.test.mjs
  - src/lib/pdf-blocks/__tests__/transaction-history-page.test.ts
  - src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx
  - src/lib/pdf-blocks/__tests__/life-amenities.test.tsx
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/lib/pdf-blocks/__tests__/registry-image-pages.test.tsx
  - e2e/real-nine-fixtures-pdf-download.spec.ts
  - src/lib/__tests__/registry-preview.test.ts
  - scripts/__tests__/one-click.test.mjs
-->