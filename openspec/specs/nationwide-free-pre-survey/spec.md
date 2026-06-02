# nationwide-free-pre-survey Specification

## Purpose

TBD - created by archiving change 'desktop-local-address-to-cop-e2e'. Update Purpose after archive.

## Requirements

### Requirement: Nationwide free pre-survey SHALL remain available before any paid formal query

系統 SHALL 在全台地址輸入流程中，先提供免費前查能力，包括地址候選、附近實價登錄與免費可得的補齊欄位，且在使用者未明確選擇付費正式查詢前不得產生成本。

#### Scenario: Free pre-survey runs before paid formal query

- **GIVEN** 使用者在 `/cases/new` 輸入任一台灣地址
- **WHEN** 系統執行地址前查
- **THEN** 系統 SHALL 先顯示免費可得的候選資料與附近實價登錄
- **AND** SHALL NOT 自動觸發付費正式查詢

#### Scenario: User saves case using only free pre-survey data

- **GIVEN** 使用者已確認候選物件，但不打算執行付費正式查詢
- **WHEN** 使用者保存案件或進入預覽
- **THEN** 系統 SHALL 允許以免費前查資料繼續流程
- **AND** SHALL 將資料標示為 reference / pre-survey，而非 trusted COP

#### Scenario: Same land returns multiple building candidates

- **GIVEN** 便民系統以門牌定位到同一筆地號，且該地號底下有多個建號
- **WHEN** 系統建立地址前查候選
- **THEN** 系統 SHALL 將每個建號保留為獨立候選
- **AND** SHALL NOT 自動取第一個建號當作案件的正式查詢目標
- **AND** 使用者 SHALL 能在案件工作台重新查詢候選並重新確認正確地號 / 建號

#### Scenario: Floor-unit address narrows Z10Web building candidates

- **GIVEN** Z10Web 以門牌定位到同一土地且回傳多個建號
- **AND** 使用者輸入的地址包含樓層與戶別，例如 `8樓之一` 或 `8樓之1`
- **WHEN** 系統執行免費前查
- **THEN** 系統 SHALL 先保留 Z10Web 候選為 primary source
- **AND** 系統 SHALL 將國字樓層 / 戶別正規化為阿拉伯數字格式後，用 R02 做戶別交叉解析
- **AND** 若 R02 回傳的建號存在於 Z10Web 候選中，系統 SHALL 將候選縮小到該建號
- **AND** 系統 SHALL NOT 以候選排序位置推測目標建號

#### Scenario: Address whitespace does not change discovery result

- **GIVEN** 使用者輸入的地址在路段、巷、號、樓之間包含半形空白
- **WHEN** 系統執行免費前查
- **THEN** 系統 SHALL 將任意空白正規化後查詢
- **AND** 空白版與無空白版地址 SHALL 指向相同候選或相同人工確認狀態

#### Scenario: Chinese and Arabic address numbers resolve to the same candidate

- **GIVEN** 使用者輸入的同一門牌包含中文數字、阿拉伯數字或全形數字，例如 `中華東路三段24巷8號5樓`、`中華東路3段24巷8號5樓`、`中華東路３段二十四巷八號五樓之一`
- **WHEN** 系統執行免費前查
- **THEN** 系統 SHALL 將這些輸入正規化成可查詢的同義地址模型
- **AND** 系統 SHALL 依 Z10Web / R02 所需格式產生查詢變體
- **AND** 若便民系統可查得資料，這些輸入 SHALL 回到同一地段、地號與建號候選


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
### Requirement: Pre-signing output SHALL be free and marked as reference data

The system SHALL treat the pre-signing property output as a free pre-survey stage. This stage SHALL use only free address discovery, R02 / Z10Web reference fields, free real-price data, map data, amenity data, and user-entered case content, and SHALL NOT perform COP ownership, COP other-right, or electronic transcript queries.

#### Scenario: Pre-signing PDF is generated without COP cost

- **GIVEN** a case is not yet signed
- **AND** the user has confirmed the address-first property candidate
- **WHEN** the user previews or exports the pre-survey PDF
- **THEN** the system SHALL generate the PDF from free reference data and saved case content
- **AND** the system SHALL record zero COP cost for that pre-signing output
- **AND** the PDF SHALL mark formal ownership and other-right fields as post-signing supplement items when trusted formal data is absent

#### Scenario: Ownership and mortgage data are not queried before signing

- **GIVEN** a user is reviewing a pre-signing case
- **WHEN** the case has no signed-stage supplement confirmation
- **THEN** the system SHALL NOT call paid ownership, other-right, mortgage, or electronic transcript services
- **AND** the UI SHALL NOT present their absence as a failed free pre-survey lookup
- **AND** the UI SHALL explain that those fields belong to the post-signing formal supplement stage

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