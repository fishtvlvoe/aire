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
