# twinkle-hub-mcp-client Specification

## Purpose

TBD - created by archiving change 'twinkle-hub-mcp-integration'. Update Purpose after archive.

## Requirements

### Requirement: mcp-http-json-rpc-call

The Rust module `src-tauri/src/mcp_client.rs` SHALL send HTTP POST requests to `https://api.twinkleai.tw/mcp/` with JSON-RPC 2.0 payload and Authorization header `Bearer <TWINKLE_HUB_API_KEY>`.

The request payload SHALL use method `tools/call` with tool name `opendata-query_rows`.

#### Scenario: Successful tool call returns rows

WHEN the MCP client calls `opendata-query_rows` with dataset_id="lvr-trades", where="鄉鎮市區 = '東區'", limit=20
THEN the HTTP response SHALL be 200
AND the response body SHALL contain a `result` field with an array of trade records in the `content[0].text` field as a JSON string

##### Example:
- Request body: `{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"opendata-query_rows","arguments":{"dataset_id":"lvr-trades","where":"鄉鎮市區 = '東區'","limit":20}}}`
- Response 200: `{"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"[{\"鄉鎮市區\":\"東區\",\"總價元\":8500000}]"}]}}`

#### Scenario: Missing API key returns configuration error

WHEN environment variable `TWINKLE_HUB_API_KEY` is not set at Rust runtime
THEN the Rust command SHALL return `Err("TWINKLE_HUB_API_KEY not configured")` without panicking
AND no HTTP request SHALL be made

##### Example:
- Environment: TWINKLE_HUB_API_KEY unset
- Output: Err("TWINKLE_HUB_API_KEY not configured")


<!-- @trace
source: twinkle-hub-mcp-integration
updated: 2026-05-16
code:
  - src/app/(dashboard)/cases/page.tsx
  - src/components/CaseSupplementDialog.tsx
  - src/lib/land-registry-api.ts
  - src/lib/mock-backend.ts
  - src/lib/address-parser.ts
  - src/components/case-wizard/CaseWizardStep2.tsx
  - vitest.config.ts
  - src-tauri/src/lib.rs
  - src/components/CaseListActions.tsx
  - src/app/(dashboard)/layout.tsx
  - src/components/ComingSoonCard.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src/lib/pdf-themes/theme-e-warm/index.tsx
  - src/app/login/page.tsx
  - src/lib/pdf-engine/document.tsx
  - src/components/LogoUploader.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/components/PullParcelDataButton.tsx
  - src/lib/safe-invoke.ts
  - vitest.setup.ts
  - src/components/DeleteConfirmDialog.tsx
  - src-tauri/src/commands/real_price.rs
  - next.config.ts
  - src/app/(dashboard)/cases/new/page.tsx
  - src/components/SettingsTabs.tsx
  - src/resources/fonts/NotoSansTC-Regular.otf
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src-tauri/src/mcp_client.rs
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/pdf-engine/react-pdf-init.ts
  - src/lib/pdf-themes/theme-d-fresh/index.tsx
  - src/components/settings/PremiumUnlockSection.tsx
  - src/components/AppSidebar.tsx
  - src/lib/pdf-engine/index.ts
  - src/lib/pdf-themes/registry.ts
  - src-tauri/src/land_registry/batch/mod.rs
  - src/app/(dashboard)/settings/page.tsx
  - src/lib/pdf-engine/engine.ts
  - src/components/ThemeSelector.tsx
  - src/lib/pdf-engine/react-pdf-components.tsx
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/components/OwnerAuthorizationDialog.tsx
  - src/app/(dashboard)/dev/page.tsx
  - src-tauri/src/commands/mod.rs
  - src/lib/pdf-themes/index.ts
  - src/components/RealPricePanel.tsx
  - src/app/(dashboard)/settings/branding/page.tsx
  - src/components/settings/LandApiSection.tsx
  - src/components/PdfPreviewer.tsx
  - src/lib/cases-api.ts
  - src/components/case-wizard/CaseWizard.tsx
tests:
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/lib/pdf-engine/__tests__/engine.test.ts
  - src/lib/__tests__/address-parser.test.ts
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - src/app/(dashboard)/settings/branding/__tests__/page.test.tsx
  - src/components/__tests__/AppSidebar.test.tsx
  - src/components/__tests__/ThemeSelector.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/lib/pdf-engine/__tests__/react-pdf-components.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/components/settings/__tests__/PremiumUnlockSection.test.tsx
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/components/__tests__/ComingSoonCard.test.tsx
  - src/lib/pdf-engine/__tests__/document.test.tsx
  - src/app/(dashboard)/settings/logs/__tests__/page.test.tsx
  - src/components/__tests__/RealPricePanel.test.tsx
  - src/lib/pdf-engine/__tests__/render-with-legal.test.tsx
-->

---
### Requirement: api-key-rust-only

The Twinkle Hub API key (`TWINKLE_HUB_API_KEY`) SHALL only be accessed in the Rust process via `std::env::var`. It SHALL NOT appear in any Next.js `NEXT_PUBLIC_*` variable, browser network response body, or JS bundle.

#### Scenario: API key absent from frontend bundle

WHEN the Next.js app is built (`pnpm build`)
THEN the string `sk-66l1A3` SHALL NOT appear in any file under `.next/`

##### Example:
- Check: `grep -r "sk-66l1A3" .next/` returns 0 matches


<!-- @trace
source: twinkle-hub-mcp-integration
updated: 2026-05-16
code:
  - src/app/(dashboard)/cases/page.tsx
  - src/components/CaseSupplementDialog.tsx
  - src/lib/land-registry-api.ts
  - src/lib/mock-backend.ts
  - src/lib/address-parser.ts
  - src/components/case-wizard/CaseWizardStep2.tsx
  - vitest.config.ts
  - src-tauri/src/lib.rs
  - src/components/CaseListActions.tsx
  - src/app/(dashboard)/layout.tsx
  - src/components/ComingSoonCard.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src/lib/pdf-themes/theme-e-warm/index.tsx
  - src/app/login/page.tsx
  - src/lib/pdf-engine/document.tsx
  - src/components/LogoUploader.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/components/PullParcelDataButton.tsx
  - src/lib/safe-invoke.ts
  - vitest.setup.ts
  - src/components/DeleteConfirmDialog.tsx
  - src-tauri/src/commands/real_price.rs
  - next.config.ts
  - src/app/(dashboard)/cases/new/page.tsx
  - src/components/SettingsTabs.tsx
  - src/resources/fonts/NotoSansTC-Regular.otf
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src-tauri/src/mcp_client.rs
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/pdf-engine/react-pdf-init.ts
  - src/lib/pdf-themes/theme-d-fresh/index.tsx
  - src/components/settings/PremiumUnlockSection.tsx
  - src/components/AppSidebar.tsx
  - src/lib/pdf-engine/index.ts
  - src/lib/pdf-themes/registry.ts
  - src-tauri/src/land_registry/batch/mod.rs
  - src/app/(dashboard)/settings/page.tsx
  - src/lib/pdf-engine/engine.ts
  - src/components/ThemeSelector.tsx
  - src/lib/pdf-engine/react-pdf-components.tsx
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/components/OwnerAuthorizationDialog.tsx
  - src/app/(dashboard)/dev/page.tsx
  - src-tauri/src/commands/mod.rs
  - src/lib/pdf-themes/index.ts
  - src/components/RealPricePanel.tsx
  - src/app/(dashboard)/settings/branding/page.tsx
  - src/components/settings/LandApiSection.tsx
  - src/components/PdfPreviewer.tsx
  - src/lib/cases-api.ts
  - src/components/case-wizard/CaseWizard.tsx
tests:
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/lib/pdf-engine/__tests__/engine.test.ts
  - src/lib/__tests__/address-parser.test.ts
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - src/app/(dashboard)/settings/branding/__tests__/page.test.tsx
  - src/components/__tests__/AppSidebar.test.tsx
  - src/components/__tests__/ThemeSelector.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/lib/pdf-engine/__tests__/react-pdf-components.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/components/settings/__tests__/PremiumUnlockSection.test.tsx
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/components/__tests__/ComingSoonCard.test.tsx
  - src/lib/pdf-engine/__tests__/document.test.tsx
  - src/app/(dashboard)/settings/logs/__tests__/page.test.tsx
  - src/components/__tests__/RealPricePanel.test.tsx
  - src/lib/pdf-engine/__tests__/render-with-legal.test.tsx
-->

---
### Requirement: where-clause-parameterized

The Rust function building the `where` clause SHALL accept only structured parameters (`district: &str`, `keyword: &str`) and construct the SQL string internally. Raw SQL strings SHALL NOT be accepted from the frontend IPC call.

#### Scenario: Where clause constructed from district and keyword

WHEN the Rust command receives `district="東區"` and `keyword="裕農路"`
THEN the internal where string SHALL equal `鄉鎮市區 = '東區' AND 土地區段位置建物門牌 LIKE '%裕農路%'`

##### Example:
- Input: district="東區", keyword="裕農路"
- Constructed where: `鄉鎮市區 = '東區' AND 土地區段位置建物門牌 LIKE '%裕農路%'`

<!-- @trace
source: twinkle-hub-mcp-integration
updated: 2026-05-16
code:
  - src/app/(dashboard)/cases/page.tsx
  - src/components/CaseSupplementDialog.tsx
  - src/lib/land-registry-api.ts
  - src/lib/mock-backend.ts
  - src/lib/address-parser.ts
  - src/components/case-wizard/CaseWizardStep2.tsx
  - vitest.config.ts
  - src-tauri/src/lib.rs
  - src/components/CaseListActions.tsx
  - src/app/(dashboard)/layout.tsx
  - src/components/ComingSoonCard.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src/lib/pdf-themes/theme-e-warm/index.tsx
  - src/app/login/page.tsx
  - src/lib/pdf-engine/document.tsx
  - src/components/LogoUploader.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/components/PullParcelDataButton.tsx
  - src/lib/safe-invoke.ts
  - vitest.setup.ts
  - src/components/DeleteConfirmDialog.tsx
  - src-tauri/src/commands/real_price.rs
  - next.config.ts
  - src/app/(dashboard)/cases/new/page.tsx
  - src/components/SettingsTabs.tsx
  - src/resources/fonts/NotoSansTC-Regular.otf
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src-tauri/src/mcp_client.rs
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/pdf-engine/react-pdf-init.ts
  - src/lib/pdf-themes/theme-d-fresh/index.tsx
  - src/components/settings/PremiumUnlockSection.tsx
  - src/components/AppSidebar.tsx
  - src/lib/pdf-engine/index.ts
  - src/lib/pdf-themes/registry.ts
  - src-tauri/src/land_registry/batch/mod.rs
  - src/app/(dashboard)/settings/page.tsx
  - src/lib/pdf-engine/engine.ts
  - src/components/ThemeSelector.tsx
  - src/lib/pdf-engine/react-pdf-components.tsx
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/components/OwnerAuthorizationDialog.tsx
  - src/app/(dashboard)/dev/page.tsx
  - src-tauri/src/commands/mod.rs
  - src/lib/pdf-themes/index.ts
  - src/components/RealPricePanel.tsx
  - src/app/(dashboard)/settings/branding/page.tsx
  - src/components/settings/LandApiSection.tsx
  - src/components/PdfPreviewer.tsx
  - src/lib/cases-api.ts
  - src/components/case-wizard/CaseWizard.tsx
tests:
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/lib/pdf-engine/__tests__/engine.test.ts
  - src/lib/__tests__/address-parser.test.ts
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - src/app/(dashboard)/settings/branding/__tests__/page.test.tsx
  - src/components/__tests__/AppSidebar.test.tsx
  - src/components/__tests__/ThemeSelector.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/lib/pdf-engine/__tests__/react-pdf-components.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/components/settings/__tests__/PremiumUnlockSection.test.tsx
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/components/__tests__/ComingSoonCard.test.tsx
  - src/lib/pdf-engine/__tests__/document.test.tsx
  - src/app/(dashboard)/settings/logs/__tests__/page.test.tsx
  - src/components/__tests__/RealPricePanel.test.tsx
  - src/lib/pdf-engine/__tests__/render-with-legal.test.tsx
-->