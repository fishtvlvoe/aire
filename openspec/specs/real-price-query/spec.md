# real-price-query Specification

## Purpose

TBD - created by archiving change 'twinkle-hub-mcp-integration'. Update Purpose after archive.

## Requirements

### Requirement: query-trigger-on-demand

The case detail page SHALL display a "查實價登錄" button in the 實價登錄 section. The button SHALL trigger the `query_real_price` Tauri IPC command only when clicked; it SHALL NOT auto-execute on page mount.

#### Scenario: User triggers real price query

WHEN a user clicks "查實價登錄" on the case detail page
THEN `safeInvoke("query_real_price", { district, keyword, limit: 20 })` SHALL be called
AND the button SHALL show a loading state while waiting for the response

##### Example:
- Case address: "台南市東區裕農路288巷17號8樓之1"
- Extracted: district="東區", keyword="裕農路"
- IPC call: query_real_price({ district: "東區", keyword: "裕農路", limit: 20 })


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
### Requirement: address-auto-parse

The frontend SHALL extract `district` and `keyword` from the case's stored address field. The extraction rule SHALL be: district = 第3個行政區劃單位（區/鎮/市）, keyword = 路名（路/街/大道/巷，取第一個）.

#### Scenario: Taipei address parsed correctly

WHEN case address is "台北市信義區松仁路100號"
THEN district SHALL be "信義區" and keyword SHALL be "松仁路"

##### Example:
- Input address: "台北市信義區松仁路100號"
- district: "信義區"
- keyword: "松仁路"

#### Scenario: Tainan address parsed correctly

WHEN case address is "台南市東區裕農路288巷17號8樓之1"
THEN district SHALL be "東區" and keyword SHALL be "裕農路"

##### Example:
- Input address: "台南市東區裕農路288巷17號8樓之1"
- district: "東區"
- keyword: "裕農路"


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
### Requirement: result-display-card

The `RealPricePanel` component SHALL display each returned trade record as a card showing: 地址（土地區段位置建物門牌）, 成交總價（總價元，格式：NT$X,XXX,XXX）, 坪數（建物移轉總面積平方公尺 × 0.3025，取小數點後1位）, 交易日期（iso_trade_date）, 單價/坪（單價元/平方公尺 ÷ 0.3025，格式：NT$X,XXX/坪）.

#### Scenario: Trade record displayed correctly

WHEN API returns a record with 總價元=8500000, 建物移轉總面積平方公尺=33.2, 單價元/平方公尺=256024, iso_trade_date="2024-03-15"
THEN the card SHALL show: 成交總價 NT$8,500,000, 坪數 10.0 坪, 單價 NT$77,527/坪, 交易日期 2024-03-15

##### Example:
- Input: 總價元=8500000, 面積=33.2㎡, 單價=256024元/㎡
- Output: NT$8,500,000 / 10.0 坪 / NT$77,527/坪


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
### Requirement: empty-and-error-states

The `RealPricePanel` SHALL handle three states: loading（顯示 spinner）, empty（顯示「查無符合條件的實價登錄資料」）, error（顯示「查詢失敗，請稍後再試」+ 錯誤訊息）.

#### Scenario: No results returned

WHEN Twinkle Hub returns an empty array
THEN RealPricePanel SHALL display "查無符合條件的實價登錄資料"

##### Example:
- API result: []
- UI: shows empty state message

#### Scenario: API error

WHEN safeInvoke returns an error string
THEN RealPricePanel SHALL display "查詢失敗：" followed by the error message

##### Example:
- Error: "TWINKLE_HUB_API_KEY not configured"
- UI: "查詢失敗：TWINKLE_HUB_API_KEY not configured"

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
### Requirement: mcp_client SHALL read TWINKLE_AI_API_KEY from environment
`src-tauri/src/mcp_client.rs` SHALL read `std::env::var("TWINKLE_AI_API_KEY")`. If the variable is absent or empty, the function SHALL return `Err` with a descriptive message. The previous key name `TWINKLE_HUB_API_KEY` SHALL be removed.

##### Example:

GIVEN env var `TWINKLE_AI_API_KEY` is set to "sk-test"
WHEN mcp_client builds the Authorization header
THEN header SHALL be "Bearer sk-test"

GIVEN env var `TWINKLE_AI_API_KEY` is not set
WHEN call_opendata_query is invoked
THEN result SHALL be Err containing "TWINKLE_AI_API_KEY"

---
### Requirement: TwinkleAI requests SHALL include Accept header for event stream
Every HTTP request to `https://api.twinkleai.tw/mcp/` SHALL include the header `Accept: application/json, text/event-stream`. Without this header the API returns HTTP 406.

##### Example:

GIVEN a TwinkleAI API call is made
WHEN the HTTP request headers are inspected
THEN the Accept header SHALL equal "application/json, text/event-stream"

---
### Requirement: TwinkleAI request body SHALL use dataset_id not dataset
The JSON-RPC request body arguments object SHALL use `"dataset_id"` as the key for the dataset identifier. Using `"dataset"` causes a 422 Input validation error.

##### Example:

GIVEN call_opendata_query is called for 台南市
WHEN the request body is serialized
THEN the arguments object SHALL contain key `"dataset_id"` with value "128852"
AND the key `"dataset"` SHALL NOT appear in the arguments object

---
### Requirement: dataset_id_for_city() SHALL route to city-specific datasets
The auxiliary function `dataset_id_for_city(city: &str) -> &'static str` SHALL return a city-specific dataset ID for cities with dedicated datasets, and SHALL fall back to `"lvr-trades"` for all other cities. Required mappings: 台南市→`"128852"`.

##### Example:

GIVEN city "台南市"
WHEN dataset_id_for_city is called
THEN result SHALL be "128852"

GIVEN city "新北市"
WHEN dataset_id_for_city is called
THEN result SHALL be "lvr-trades"

---
### Requirement: TwinkleAI queries SHALL use the correct Chinese column names
Where clauses in TwinkleAI SQL queries SHALL use `"鄉鎮市區"` for district filtering and `"土地區段位置或建物區門牌"` for address/road filtering. The column names `district` and `road` do not exist in TwinkleAI datasets.

##### Example:

GIVEN district "永康區" and road keyword "勝利街"
WHEN the where clause is constructed
THEN it SHALL contain `"鄉鎮市區" = '永康區'`
AND it SHALL contain `"土地區段位置或建物區門牌" LIKE '%勝利街%'`

---
### Requirement: mcp_client SHALL parse SSE response format
TwinkleAI returns responses in Server-Sent Events format. The client SHALL split the response body by newline, find the first line starting with `data:`, strip the prefix, JSON-parse the outer object, extract `result.content[0].text`, then JSON-parse that string to obtain the records array. If no `data:` line is found, the client SHALL return `Err(McpError::ParseError)`.

##### Example:

GIVEN SSE response body:
```
event: message
data: {"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"[{\"鄉鎮市區\":\"永康區\",\"單價每平方公尺\":\"47002\"}]"}]}}
```
WHEN mcp_client parses the response
THEN records SHALL contain 1 entry
AND records[0]["單價每平方公尺"] SHALL be "47002"

GIVEN response body with no `data:` line
WHEN mcp_client parses the response
THEN result SHALL be Err(McpError::ParseError)

---
### Requirement: unit_price SHALL be extracted from 單價每平方公尺
When computing recent sale price statistics, each record's unit price SHALL be read from the field `"單價每平方公尺"` in the TwinkleAI dataset. Records missing this field SHALL be ignored.

##### Example:

GIVEN records `[{"單價每平方公尺":"47002"},{"建物型態":"透天厝"},{"單價每平方公尺":"55000"}]`
WHEN unit_price values are collected
THEN valid prices SHALL be [47002, 55000]
AND the record missing "單價每平方公尺" SHALL be ignored

---
### Requirement: Real price query SHALL provide dossier-eligible nearby sale data from free sources

系統 SHALL 以免費資料來源提供與地址相關的附近實價登錄行情，供 UI 顯示、案件保存與 dossier / PDF 使用。

#### Scenario: Nearby real price records are shown from free query

- **GIVEN** 使用者輸入台灣地址
- **WHEN** 系統執行 `query_real_price`
- **THEN** 系統 SHALL 回傳與該地址行政區與路名相關的成交資料
- **AND** SHALL 將結果用於 `/cases/new` 與 dossier snapshot

#### Scenario: Real price query returns no records

- **GIVEN** 免費實價登錄查詢沒有命中資料
- **WHEN** 系統完成查詢
- **THEN** 系統 SHALL 顯示空結果語意
- **AND** SHALL NOT 以固定 mock fixture 冒充成交行情

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