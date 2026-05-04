# listing-ui-flow Specification

## Purpose

TBD - created by archiving change 'three-stage-listing-workflow-v2'. Update Purpose after archive.

## Requirements

### Requirement: Five-page UI flow covers the complete listing lifecycle

The system SHALL implement five pages in the Next.js application:
1. `/listings` — 物件列表頁
2. `/listings/new` — 新增物件（選類型）頁
3. `/listings/[id]/fill` — 資料填寫頁
4. `/listings/[id]/generating` — AI 產生中頁
5. `/listings/[id]/documents` — 文件輸出頁

#### Scenario: Navigate full flow for a new listing

- **WHEN** user clicks 新增物件 on the listing page
- **THEN** they SHALL be taken to `/listings/new`
- **WHEN** they select a type and click 下一步
- **THEN** they SHALL be taken to `/listings/[id]/fill`
- **WHEN** all data is filled and they click 產生文件
- **THEN** they SHALL be taken to `/listings/[id]/generating`
- **WHEN** generation completes
- **THEN** they SHALL be automatically redirected to `/listings/[id]/documents`


<!-- @trace
source: three-stage-listing-workflow-v2
updated: 2026-04-17
code:
  - docs/0417-old/其他土地_秘書後補清單.docx
  - docs/0417-old/商業地_現場必問清單.docx
  - docs/0417-old/建地_住宅地_秘書後補清單.docx
  - docs/0417-old/不動產說明書11.pdf
  - src/lib/property-types/schemas/commercial-land.ts
  - src/lib/property-types/schemas/highrise.ts
  - docs/0417-old/不動產說明書9.pdf
  - docs/0417-old/公寓_秘書後補清單.docx
  - src/lib/document-generator/types.ts
  - docs/0417-old/廠房_現場必問清單.docx
  - docs/0417-old/鄉村區建地_現場必問清單.docx
  - src/app/listings/[id]/documents/page.tsx
  - docs/0417-old/套房_秘書後補清單.docx
  - src/lib/property-types/schemas/rural-land.ts
  - docs/0417-old/農地_秘書後補清單.docx
  - stitch_ai/_2/screen.png
  - package.json
  - docs/0417-old/不動產說明書6.pdf
  - stitch_ai/ai/screen.png
  - docs/0417-old/不動產說明書5.pdf
  - docs/0417-old/不動產說明書2.pdf
  - docs/0417-old/農舍_現場必問清單.docx
  - docs/0417-old/店面_現場必問清單.docx
  - docs/0417-old/商業地_秘書後補清單.docx
  - docs/0417-old/周遭.pdf
  - docs/0417-old/不動產說明書8.pdf
  - src/app/api/listings/route.ts
  - src/lib/property-types/schemas/farmhouse.ts
  - docs/0417-old/不動產說明書12.pdf
  - stitch_ai/_2/code.html
  - docs/0417-old/不動產說明說15.pdf
  - docs/0417-old/工業地_秘書後補清單.docx
  - src/app/listings/new/page.tsx
  - src/lib/property-types/schemas/shop.ts
  - docs/0417-old/建地_住宅地_現場必問清單.docx
  - src/lib/property-types/schemas/industrial-land.ts
  - stitch_ai/_1/screen.png
  - docs/0417-old/不動產說明書14.pdf
  - src/lib/property-types/schemas/factory.ts
  - src/lib/property-types/index.ts
  - docs/0417-old/大樓華廈_秘書後補清單.docx
  - docs/0417-old/不動產說明書4.pdf
  - src/app/listings/[id]/fill/page.tsx
  - src/components/Sidebar.tsx
  - src/lib/db/schema.ts
  - docs/0417-old/店面_秘書後補清單.docx
  - docs/0417-old/大樓華廈_現場必問清單.docx
  - src/app/listings/[id]/generating/page.tsx
  - docs/0417-old/農地_現場必問清單.docx
  - docs/0417-old/農舍_秘書後補清單.docx
  - docs/0417-old/不動產說明書1.pdf
  - src/lib/property-types/schemas/suite.ts
  - src/lib/db/index.ts
  - docs/0417-new/建安不動產欄位總表.md
  - stitch_ai/_1/code.html
  - docs/0417-new/建安不動產欄位總表_土地版.docx
  - docs/0417-old/不動產書說明書10.pdf
  - docs/0417-old/不動產說明書3.pdf
  - src/lib/property-types/schemas/farmland.ts
  - src/lib/property-types/schemas/apartment.ts
  - src/lib/property-types/schemas/residential-land.ts
  - docs/0417-old/廠房_秘書後補清單.docx
  - docs/0417-old/透天別墅_現場必問清單.docx
  - docs/0417-old/不動產說明說16.pdf
  - docs/0417-old/透明房價一覽表成交行情.pdf
  - docs/0417-old/不動產書說明說7.pdf
  - stitch_ai/estate_elite/DESIGN.md
  - src/lib/form-renderer/index.ts
  - docs/0417-old/公寓_現場必問清單.docx
  - src/lib/property-types/schemas/index.ts
  - src/lib/property-types/schemas/townhouse.ts
  - docs/0417-new/建安不動產欄位總表_建物版.docx
  - src/lib/property-types/schemas/other-land.ts
  - docs/0417-old/透天別墅_秘書後補清單.docx
  - docs/0417-old/工業地_現場必問清單.docx
  - docs/0417-old/不動產說明書13.pdf
  - stitch_ai/estate_logic/DESIGN.md
  - docs/0417-old/土地物調表-母版.docx
  - src/lib/pdf-generator/dossier.ts
  - docs/0417-old/其他土地_現場必問清單.docx
  - docs/0417-old/鄉村區建地_秘書後補清單.docx
  - .spectra.yaml
  - docs/0417-old/套房_現場必問清單.docx
  - src/app/listings/page.tsx
  - stitch_ai/ai/code.html
  - docs/0417-old/建物物調表-母版.dot
tests:
  - src/lib/property-types/__tests__/index.test.ts
  - src/lib/db/__tests__/listing-workflow.test.ts
  - src/lib/form-renderer/__tests__/field-visit-form.test.ts
  - src/lib/db/__tests__/regenerate.test.ts
  - src/lib/db/__tests__/e2e-residential.test.ts
  - src/lib/db/__tests__/index.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/app/api/__tests__/listings.test.ts
  - src/lib/form-renderer/__tests__/supplementary-form.test.ts
-->

---
### Requirement: Listing page displays table with filter controls

The listing page SHALL display all listings in a table with the following columns:
- 物件地址
- 物件類型（顯示繁體中文名稱）
- 狀態（draft/field-visit-complete/ready-for-generation/documents-ready）
- 業務員
- 委託日期
- 操作（查看/繼續填寫/產生文件）

The page SHALL include filter controls:
- 物件類型篩選（下拉，含「全部」選項）
- 狀態篩選（下拉，含「全部」選項）

#### Scenario: Filter listings by type

- **WHEN** user selects 農地 from the type filter
- **THEN** only farmland listings SHALL be shown in the table

#### Scenario: Filter listings by status

- **WHEN** user selects 文件已產出 from the status filter
- **THEN** only listings with status `documents-ready` SHALL be shown


<!-- @trace
source: three-stage-listing-workflow-v2
updated: 2026-04-17
code:
  - docs/0417-old/其他土地_秘書後補清單.docx
  - docs/0417-old/商業地_現場必問清單.docx
  - docs/0417-old/建地_住宅地_秘書後補清單.docx
  - docs/0417-old/不動產說明書11.pdf
  - src/lib/property-types/schemas/commercial-land.ts
  - src/lib/property-types/schemas/highrise.ts
  - docs/0417-old/不動產說明書9.pdf
  - docs/0417-old/公寓_秘書後補清單.docx
  - src/lib/document-generator/types.ts
  - docs/0417-old/廠房_現場必問清單.docx
  - docs/0417-old/鄉村區建地_現場必問清單.docx
  - src/app/listings/[id]/documents/page.tsx
  - docs/0417-old/套房_秘書後補清單.docx
  - src/lib/property-types/schemas/rural-land.ts
  - docs/0417-old/農地_秘書後補清單.docx
  - stitch_ai/_2/screen.png
  - package.json
  - docs/0417-old/不動產說明書6.pdf
  - stitch_ai/ai/screen.png
  - docs/0417-old/不動產說明書5.pdf
  - docs/0417-old/不動產說明書2.pdf
  - docs/0417-old/農舍_現場必問清單.docx
  - docs/0417-old/店面_現場必問清單.docx
  - docs/0417-old/商業地_秘書後補清單.docx
  - docs/0417-old/周遭.pdf
  - docs/0417-old/不動產說明書8.pdf
  - src/app/api/listings/route.ts
  - src/lib/property-types/schemas/farmhouse.ts
  - docs/0417-old/不動產說明書12.pdf
  - stitch_ai/_2/code.html
  - docs/0417-old/不動產說明說15.pdf
  - docs/0417-old/工業地_秘書後補清單.docx
  - src/app/listings/new/page.tsx
  - src/lib/property-types/schemas/shop.ts
  - docs/0417-old/建地_住宅地_現場必問清單.docx
  - src/lib/property-types/schemas/industrial-land.ts
  - stitch_ai/_1/screen.png
  - docs/0417-old/不動產說明書14.pdf
  - src/lib/property-types/schemas/factory.ts
  - src/lib/property-types/index.ts
  - docs/0417-old/大樓華廈_秘書後補清單.docx
  - docs/0417-old/不動產說明書4.pdf
  - src/app/listings/[id]/fill/page.tsx
  - src/components/Sidebar.tsx
  - src/lib/db/schema.ts
  - docs/0417-old/店面_秘書後補清單.docx
  - docs/0417-old/大樓華廈_現場必問清單.docx
  - src/app/listings/[id]/generating/page.tsx
  - docs/0417-old/農地_現場必問清單.docx
  - docs/0417-old/農舍_秘書後補清單.docx
  - docs/0417-old/不動產說明書1.pdf
  - src/lib/property-types/schemas/suite.ts
  - src/lib/db/index.ts
  - docs/0417-new/建安不動產欄位總表.md
  - stitch_ai/_1/code.html
  - docs/0417-new/建安不動產欄位總表_土地版.docx
  - docs/0417-old/不動產書說明書10.pdf
  - docs/0417-old/不動產說明書3.pdf
  - src/lib/property-types/schemas/farmland.ts
  - src/lib/property-types/schemas/apartment.ts
  - src/lib/property-types/schemas/residential-land.ts
  - docs/0417-old/廠房_秘書後補清單.docx
  - docs/0417-old/透天別墅_現場必問清單.docx
  - docs/0417-old/不動產說明說16.pdf
  - docs/0417-old/透明房價一覽表成交行情.pdf
  - docs/0417-old/不動產書說明說7.pdf
  - stitch_ai/estate_elite/DESIGN.md
  - src/lib/form-renderer/index.ts
  - docs/0417-old/公寓_現場必問清單.docx
  - src/lib/property-types/schemas/index.ts
  - src/lib/property-types/schemas/townhouse.ts
  - docs/0417-new/建安不動產欄位總表_建物版.docx
  - src/lib/property-types/schemas/other-land.ts
  - docs/0417-old/透天別墅_秘書後補清單.docx
  - docs/0417-old/工業地_現場必問清單.docx
  - docs/0417-old/不動產說明書13.pdf
  - stitch_ai/estate_logic/DESIGN.md
  - docs/0417-old/土地物調表-母版.docx
  - src/lib/pdf-generator/dossier.ts
  - docs/0417-old/其他土地_現場必問清單.docx
  - docs/0417-old/鄉村區建地_秘書後補清單.docx
  - .spectra.yaml
  - docs/0417-old/套房_現場必問清單.docx
  - src/app/listings/page.tsx
  - stitch_ai/ai/code.html
  - docs/0417-old/建物物調表-母版.dot
tests:
  - src/lib/property-types/__tests__/index.test.ts
  - src/lib/db/__tests__/listing-workflow.test.ts
  - src/lib/form-renderer/__tests__/field-visit-form.test.ts
  - src/lib/db/__tests__/regenerate.test.ts
  - src/lib/db/__tests__/e2e-residential.test.ts
  - src/lib/db/__tests__/index.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/app/api/__tests__/listings.test.ts
  - src/lib/form-renderer/__tests__/supplementary-form.test.ts
-->

---
### Requirement: New listing page shows 13 types with availability state

The new listing page SHALL show all 13 property types as selectable cards in a grid layout. Types with `available: false` SHALL be displayed with a 「即將推出」badge and SHALL NOT be selectable.

#### Scenario: Select an available type

- **WHEN** user clicks the 農地 card
- **THEN** the card SHALL show a selected state (deep blue border + light blue background + checkmark)
- **THEN** the 下一步 button SHALL become active

#### Scenario: Attempt to select unavailable type

- **WHEN** user clicks a card marked 即將推出
- **THEN** nothing SHALL happen (card is not selectable)


<!-- @trace
source: three-stage-listing-workflow-v2
updated: 2026-04-17
code:
  - docs/0417-old/其他土地_秘書後補清單.docx
  - docs/0417-old/商業地_現場必問清單.docx
  - docs/0417-old/建地_住宅地_秘書後補清單.docx
  - docs/0417-old/不動產說明書11.pdf
  - src/lib/property-types/schemas/commercial-land.ts
  - src/lib/property-types/schemas/highrise.ts
  - docs/0417-old/不動產說明書9.pdf
  - docs/0417-old/公寓_秘書後補清單.docx
  - src/lib/document-generator/types.ts
  - docs/0417-old/廠房_現場必問清單.docx
  - docs/0417-old/鄉村區建地_現場必問清單.docx
  - src/app/listings/[id]/documents/page.tsx
  - docs/0417-old/套房_秘書後補清單.docx
  - src/lib/property-types/schemas/rural-land.ts
  - docs/0417-old/農地_秘書後補清單.docx
  - stitch_ai/_2/screen.png
  - package.json
  - docs/0417-old/不動產說明書6.pdf
  - stitch_ai/ai/screen.png
  - docs/0417-old/不動產說明書5.pdf
  - docs/0417-old/不動產說明書2.pdf
  - docs/0417-old/農舍_現場必問清單.docx
  - docs/0417-old/店面_現場必問清單.docx
  - docs/0417-old/商業地_秘書後補清單.docx
  - docs/0417-old/周遭.pdf
  - docs/0417-old/不動產說明書8.pdf
  - src/app/api/listings/route.ts
  - src/lib/property-types/schemas/farmhouse.ts
  - docs/0417-old/不動產說明書12.pdf
  - stitch_ai/_2/code.html
  - docs/0417-old/不動產說明說15.pdf
  - docs/0417-old/工業地_秘書後補清單.docx
  - src/app/listings/new/page.tsx
  - src/lib/property-types/schemas/shop.ts
  - docs/0417-old/建地_住宅地_現場必問清單.docx
  - src/lib/property-types/schemas/industrial-land.ts
  - stitch_ai/_1/screen.png
  - docs/0417-old/不動產說明書14.pdf
  - src/lib/property-types/schemas/factory.ts
  - src/lib/property-types/index.ts
  - docs/0417-old/大樓華廈_秘書後補清單.docx
  - docs/0417-old/不動產說明書4.pdf
  - src/app/listings/[id]/fill/page.tsx
  - src/components/Sidebar.tsx
  - src/lib/db/schema.ts
  - docs/0417-old/店面_秘書後補清單.docx
  - docs/0417-old/大樓華廈_現場必問清單.docx
  - src/app/listings/[id]/generating/page.tsx
  - docs/0417-old/農地_現場必問清單.docx
  - docs/0417-old/農舍_秘書後補清單.docx
  - docs/0417-old/不動產說明書1.pdf
  - src/lib/property-types/schemas/suite.ts
  - src/lib/db/index.ts
  - docs/0417-new/建安不動產欄位總表.md
  - stitch_ai/_1/code.html
  - docs/0417-new/建安不動產欄位總表_土地版.docx
  - docs/0417-old/不動產書說明書10.pdf
  - docs/0417-old/不動產說明書3.pdf
  - src/lib/property-types/schemas/farmland.ts
  - src/lib/property-types/schemas/apartment.ts
  - src/lib/property-types/schemas/residential-land.ts
  - docs/0417-old/廠房_秘書後補清單.docx
  - docs/0417-old/透天別墅_現場必問清單.docx
  - docs/0417-old/不動產說明說16.pdf
  - docs/0417-old/透明房價一覽表成交行情.pdf
  - docs/0417-old/不動產書說明說7.pdf
  - stitch_ai/estate_elite/DESIGN.md
  - src/lib/form-renderer/index.ts
  - docs/0417-old/公寓_現場必問清單.docx
  - src/lib/property-types/schemas/index.ts
  - src/lib/property-types/schemas/townhouse.ts
  - docs/0417-new/建安不動產欄位總表_建物版.docx
  - src/lib/property-types/schemas/other-land.ts
  - docs/0417-old/透天別墅_秘書後補清單.docx
  - docs/0417-old/工業地_現場必問清單.docx
  - docs/0417-old/不動產說明書13.pdf
  - stitch_ai/estate_logic/DESIGN.md
  - docs/0417-old/土地物調表-母版.docx
  - src/lib/pdf-generator/dossier.ts
  - docs/0417-old/其他土地_現場必問清單.docx
  - docs/0417-old/鄉村區建地_秘書後補清單.docx
  - .spectra.yaml
  - docs/0417-old/套房_現場必問清單.docx
  - src/app/listings/page.tsx
  - stitch_ai/ai/code.html
  - docs/0417-old/建物物調表-母版.dot
tests:
  - src/lib/property-types/__tests__/index.test.ts
  - src/lib/db/__tests__/listing-workflow.test.ts
  - src/lib/form-renderer/__tests__/field-visit-form.test.ts
  - src/lib/db/__tests__/regenerate.test.ts
  - src/lib/db/__tests__/e2e-residential.test.ts
  - src/lib/db/__tests__/index.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/app/api/__tests__/listings.test.ts
  - src/lib/form-renderer/__tests__/supplementary-form.test.ts
-->

---
### Requirement: Fill form page uses three-tab layout

The fill form page SHALL render a three-tab layout:
- Tab 1: 共通欄位 — always visible, same for all types
- Tab 2: 類型專屬欄位 — varies by property type, label shows type name
- Tab 3: 秘書後補 — secretary fields, visually distinct (lighter background)

Each tab SHALL show a completion indicator (filled / partially filled / empty).

#### Scenario: Tab completion indicator

- **WHEN** all required fields in Tab 1 are filled
- **THEN** Tab 1 SHALL show a green checkmark indicator


<!-- @trace
source: three-stage-listing-workflow-v2
updated: 2026-04-17
code:
  - docs/0417-old/其他土地_秘書後補清單.docx
  - docs/0417-old/商業地_現場必問清單.docx
  - docs/0417-old/建地_住宅地_秘書後補清單.docx
  - docs/0417-old/不動產說明書11.pdf
  - src/lib/property-types/schemas/commercial-land.ts
  - src/lib/property-types/schemas/highrise.ts
  - docs/0417-old/不動產說明書9.pdf
  - docs/0417-old/公寓_秘書後補清單.docx
  - src/lib/document-generator/types.ts
  - docs/0417-old/廠房_現場必問清單.docx
  - docs/0417-old/鄉村區建地_現場必問清單.docx
  - src/app/listings/[id]/documents/page.tsx
  - docs/0417-old/套房_秘書後補清單.docx
  - src/lib/property-types/schemas/rural-land.ts
  - docs/0417-old/農地_秘書後補清單.docx
  - stitch_ai/_2/screen.png
  - package.json
  - docs/0417-old/不動產說明書6.pdf
  - stitch_ai/ai/screen.png
  - docs/0417-old/不動產說明書5.pdf
  - docs/0417-old/不動產說明書2.pdf
  - docs/0417-old/農舍_現場必問清單.docx
  - docs/0417-old/店面_現場必問清單.docx
  - docs/0417-old/商業地_秘書後補清單.docx
  - docs/0417-old/周遭.pdf
  - docs/0417-old/不動產說明書8.pdf
  - src/app/api/listings/route.ts
  - src/lib/property-types/schemas/farmhouse.ts
  - docs/0417-old/不動產說明書12.pdf
  - stitch_ai/_2/code.html
  - docs/0417-old/不動產說明說15.pdf
  - docs/0417-old/工業地_秘書後補清單.docx
  - src/app/listings/new/page.tsx
  - src/lib/property-types/schemas/shop.ts
  - docs/0417-old/建地_住宅地_現場必問清單.docx
  - src/lib/property-types/schemas/industrial-land.ts
  - stitch_ai/_1/screen.png
  - docs/0417-old/不動產說明書14.pdf
  - src/lib/property-types/schemas/factory.ts
  - src/lib/property-types/index.ts
  - docs/0417-old/大樓華廈_秘書後補清單.docx
  - docs/0417-old/不動產說明書4.pdf
  - src/app/listings/[id]/fill/page.tsx
  - src/components/Sidebar.tsx
  - src/lib/db/schema.ts
  - docs/0417-old/店面_秘書後補清單.docx
  - docs/0417-old/大樓華廈_現場必問清單.docx
  - src/app/listings/[id]/generating/page.tsx
  - docs/0417-old/農地_現場必問清單.docx
  - docs/0417-old/農舍_秘書後補清單.docx
  - docs/0417-old/不動產說明書1.pdf
  - src/lib/property-types/schemas/suite.ts
  - src/lib/db/index.ts
  - docs/0417-new/建安不動產欄位總表.md
  - stitch_ai/_1/code.html
  - docs/0417-new/建安不動產欄位總表_土地版.docx
  - docs/0417-old/不動產書說明書10.pdf
  - docs/0417-old/不動產說明書3.pdf
  - src/lib/property-types/schemas/farmland.ts
  - src/lib/property-types/schemas/apartment.ts
  - src/lib/property-types/schemas/residential-land.ts
  - docs/0417-old/廠房_秘書後補清單.docx
  - docs/0417-old/透天別墅_現場必問清單.docx
  - docs/0417-old/不動產說明說16.pdf
  - docs/0417-old/透明房價一覽表成交行情.pdf
  - docs/0417-old/不動產書說明說7.pdf
  - stitch_ai/estate_elite/DESIGN.md
  - src/lib/form-renderer/index.ts
  - docs/0417-old/公寓_現場必問清單.docx
  - src/lib/property-types/schemas/index.ts
  - src/lib/property-types/schemas/townhouse.ts
  - docs/0417-new/建安不動產欄位總表_建物版.docx
  - src/lib/property-types/schemas/other-land.ts
  - docs/0417-old/透天別墅_秘書後補清單.docx
  - docs/0417-old/工業地_現場必問清單.docx
  - docs/0417-old/不動產說明書13.pdf
  - stitch_ai/estate_logic/DESIGN.md
  - docs/0417-old/土地物調表-母版.docx
  - src/lib/pdf-generator/dossier.ts
  - docs/0417-old/其他土地_現場必問清單.docx
  - docs/0417-old/鄉村區建地_秘書後補清單.docx
  - .spectra.yaml
  - docs/0417-old/套房_現場必問清單.docx
  - src/app/listings/page.tsx
  - stitch_ai/ai/code.html
  - docs/0417-old/建物物調表-母版.dot
tests:
  - src/lib/property-types/__tests__/index.test.ts
  - src/lib/db/__tests__/listing-workflow.test.ts
  - src/lib/form-renderer/__tests__/field-visit-form.test.ts
  - src/lib/db/__tests__/regenerate.test.ts
  - src/lib/db/__tests__/e2e-residential.test.ts
  - src/lib/db/__tests__/index.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/app/api/__tests__/listings.test.ts
  - src/lib/form-renderer/__tests__/supplementary-form.test.ts
-->

---
### Requirement: Generating page shows per-document progress

The generating page SHALL display a list of all 7 document types with their generation status:
- ✅ 已完成（green check）
- 🔄 產生中（orange spinner with text 產生中...）
- ⏳ 等待中（grey clock）

The page SHALL show an overall progress bar with count (e.g., 已完成 2/7) and estimated time remaining.

Upon completion, the page SHALL automatically redirect to the documents page.

#### Scenario: Auto-redirect on completion

- **WHEN** all 7 documents reach 已完成 status
- **THEN** the page SHALL automatically navigate to `/listings/[id]/documents` within 2 seconds


<!-- @trace
source: three-stage-listing-workflow-v2
updated: 2026-04-17
code:
  - docs/0417-old/其他土地_秘書後補清單.docx
  - docs/0417-old/商業地_現場必問清單.docx
  - docs/0417-old/建地_住宅地_秘書後補清單.docx
  - docs/0417-old/不動產說明書11.pdf
  - src/lib/property-types/schemas/commercial-land.ts
  - src/lib/property-types/schemas/highrise.ts
  - docs/0417-old/不動產說明書9.pdf
  - docs/0417-old/公寓_秘書後補清單.docx
  - src/lib/document-generator/types.ts
  - docs/0417-old/廠房_現場必問清單.docx
  - docs/0417-old/鄉村區建地_現場必問清單.docx
  - src/app/listings/[id]/documents/page.tsx
  - docs/0417-old/套房_秘書後補清單.docx
  - src/lib/property-types/schemas/rural-land.ts
  - docs/0417-old/農地_秘書後補清單.docx
  - stitch_ai/_2/screen.png
  - package.json
  - docs/0417-old/不動產說明書6.pdf
  - stitch_ai/ai/screen.png
  - docs/0417-old/不動產說明書5.pdf
  - docs/0417-old/不動產說明書2.pdf
  - docs/0417-old/農舍_現場必問清單.docx
  - docs/0417-old/店面_現場必問清單.docx
  - docs/0417-old/商業地_秘書後補清單.docx
  - docs/0417-old/周遭.pdf
  - docs/0417-old/不動產說明書8.pdf
  - src/app/api/listings/route.ts
  - src/lib/property-types/schemas/farmhouse.ts
  - docs/0417-old/不動產說明書12.pdf
  - stitch_ai/_2/code.html
  - docs/0417-old/不動產說明說15.pdf
  - docs/0417-old/工業地_秘書後補清單.docx
  - src/app/listings/new/page.tsx
  - src/lib/property-types/schemas/shop.ts
  - docs/0417-old/建地_住宅地_現場必問清單.docx
  - src/lib/property-types/schemas/industrial-land.ts
  - stitch_ai/_1/screen.png
  - docs/0417-old/不動產說明書14.pdf
  - src/lib/property-types/schemas/factory.ts
  - src/lib/property-types/index.ts
  - docs/0417-old/大樓華廈_秘書後補清單.docx
  - docs/0417-old/不動產說明書4.pdf
  - src/app/listings/[id]/fill/page.tsx
  - src/components/Sidebar.tsx
  - src/lib/db/schema.ts
  - docs/0417-old/店面_秘書後補清單.docx
  - docs/0417-old/大樓華廈_現場必問清單.docx
  - src/app/listings/[id]/generating/page.tsx
  - docs/0417-old/農地_現場必問清單.docx
  - docs/0417-old/農舍_秘書後補清單.docx
  - docs/0417-old/不動產說明書1.pdf
  - src/lib/property-types/schemas/suite.ts
  - src/lib/db/index.ts
  - docs/0417-new/建安不動產欄位總表.md
  - stitch_ai/_1/code.html
  - docs/0417-new/建安不動產欄位總表_土地版.docx
  - docs/0417-old/不動產書說明書10.pdf
  - docs/0417-old/不動產說明書3.pdf
  - src/lib/property-types/schemas/farmland.ts
  - src/lib/property-types/schemas/apartment.ts
  - src/lib/property-types/schemas/residential-land.ts
  - docs/0417-old/廠房_秘書後補清單.docx
  - docs/0417-old/透天別墅_現場必問清單.docx
  - docs/0417-old/不動產說明說16.pdf
  - docs/0417-old/透明房價一覽表成交行情.pdf
  - docs/0417-old/不動產書說明說7.pdf
  - stitch_ai/estate_elite/DESIGN.md
  - src/lib/form-renderer/index.ts
  - docs/0417-old/公寓_現場必問清單.docx
  - src/lib/property-types/schemas/index.ts
  - src/lib/property-types/schemas/townhouse.ts
  - docs/0417-new/建安不動產欄位總表_建物版.docx
  - src/lib/property-types/schemas/other-land.ts
  - docs/0417-old/透天別墅_秘書後補清單.docx
  - docs/0417-old/工業地_現場必問清單.docx
  - docs/0417-old/不動產說明書13.pdf
  - stitch_ai/estate_logic/DESIGN.md
  - docs/0417-old/土地物調表-母版.docx
  - src/lib/pdf-generator/dossier.ts
  - docs/0417-old/其他土地_現場必問清單.docx
  - docs/0417-old/鄉村區建地_秘書後補清單.docx
  - .spectra.yaml
  - docs/0417-old/套房_現場必問清單.docx
  - src/app/listings/page.tsx
  - stitch_ai/ai/code.html
  - docs/0417-old/建物物調表-母版.dot
tests:
  - src/lib/property-types/__tests__/index.test.ts
  - src/lib/db/__tests__/listing-workflow.test.ts
  - src/lib/form-renderer/__tests__/field-visit-form.test.ts
  - src/lib/db/__tests__/regenerate.test.ts
  - src/lib/db/__tests__/e2e-residential.test.ts
  - src/lib/db/__tests__/index.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/app/api/__tests__/listings.test.ts
  - src/lib/form-renderer/__tests__/supplementary-form.test.ts
-->

---
### Requirement: Document output page shows all 7 documents with download

The document output page SHALL display all 7 generated documents in a card grid:
- 物件調查表（property_dossier）
- 591 刊登文案（listing_591）
- 銷售 DM（sales_dm）
- 社群貼文 — Facebook / Instagram / Threads / TikTok / YouTube（social_posts）
- 短影音腳本（short_video_script）

Each card SHALL have a preview area and a 下載 button. The 物件調查表 card SHALL also show a 下載 PDF button.

A 重新產生 button SHALL be available per document.

#### Scenario: Download document

- **WHEN** user clicks 下載 on the 591 刊登文案 card
- **THEN** the system SHALL download a .txt file with the document content

#### Scenario: Download dossier PDF

- **WHEN** user clicks 下載 PDF on the 物件調查表 card
- **THEN** the system SHALL trigger PDF generation and download `dossier.pdf`


<!-- @trace
source: three-stage-listing-workflow-v2
updated: 2026-04-17
code:
  - docs/0417-old/其他土地_秘書後補清單.docx
  - docs/0417-old/商業地_現場必問清單.docx
  - docs/0417-old/建地_住宅地_秘書後補清單.docx
  - docs/0417-old/不動產說明書11.pdf
  - src/lib/property-types/schemas/commercial-land.ts
  - src/lib/property-types/schemas/highrise.ts
  - docs/0417-old/不動產說明書9.pdf
  - docs/0417-old/公寓_秘書後補清單.docx
  - src/lib/document-generator/types.ts
  - docs/0417-old/廠房_現場必問清單.docx
  - docs/0417-old/鄉村區建地_現場必問清單.docx
  - src/app/listings/[id]/documents/page.tsx
  - docs/0417-old/套房_秘書後補清單.docx
  - src/lib/property-types/schemas/rural-land.ts
  - docs/0417-old/農地_秘書後補清單.docx
  - stitch_ai/_2/screen.png
  - package.json
  - docs/0417-old/不動產說明書6.pdf
  - stitch_ai/ai/screen.png
  - docs/0417-old/不動產說明書5.pdf
  - docs/0417-old/不動產說明書2.pdf
  - docs/0417-old/農舍_現場必問清單.docx
  - docs/0417-old/店面_現場必問清單.docx
  - docs/0417-old/商業地_秘書後補清單.docx
  - docs/0417-old/周遭.pdf
  - docs/0417-old/不動產說明書8.pdf
  - src/app/api/listings/route.ts
  - src/lib/property-types/schemas/farmhouse.ts
  - docs/0417-old/不動產說明書12.pdf
  - stitch_ai/_2/code.html
  - docs/0417-old/不動產說明說15.pdf
  - docs/0417-old/工業地_秘書後補清單.docx
  - src/app/listings/new/page.tsx
  - src/lib/property-types/schemas/shop.ts
  - docs/0417-old/建地_住宅地_現場必問清單.docx
  - src/lib/property-types/schemas/industrial-land.ts
  - stitch_ai/_1/screen.png
  - docs/0417-old/不動產說明書14.pdf
  - src/lib/property-types/schemas/factory.ts
  - src/lib/property-types/index.ts
  - docs/0417-old/大樓華廈_秘書後補清單.docx
  - docs/0417-old/不動產說明書4.pdf
  - src/app/listings/[id]/fill/page.tsx
  - src/components/Sidebar.tsx
  - src/lib/db/schema.ts
  - docs/0417-old/店面_秘書後補清單.docx
  - docs/0417-old/大樓華廈_現場必問清單.docx
  - src/app/listings/[id]/generating/page.tsx
  - docs/0417-old/農地_現場必問清單.docx
  - docs/0417-old/農舍_秘書後補清單.docx
  - docs/0417-old/不動產說明書1.pdf
  - src/lib/property-types/schemas/suite.ts
  - src/lib/db/index.ts
  - docs/0417-new/建安不動產欄位總表.md
  - stitch_ai/_1/code.html
  - docs/0417-new/建安不動產欄位總表_土地版.docx
  - docs/0417-old/不動產書說明書10.pdf
  - docs/0417-old/不動產說明書3.pdf
  - src/lib/property-types/schemas/farmland.ts
  - src/lib/property-types/schemas/apartment.ts
  - src/lib/property-types/schemas/residential-land.ts
  - docs/0417-old/廠房_秘書後補清單.docx
  - docs/0417-old/透天別墅_現場必問清單.docx
  - docs/0417-old/不動產說明說16.pdf
  - docs/0417-old/透明房價一覽表成交行情.pdf
  - docs/0417-old/不動產書說明說7.pdf
  - stitch_ai/estate_elite/DESIGN.md
  - src/lib/form-renderer/index.ts
  - docs/0417-old/公寓_現場必問清單.docx
  - src/lib/property-types/schemas/index.ts
  - src/lib/property-types/schemas/townhouse.ts
  - docs/0417-new/建安不動產欄位總表_建物版.docx
  - src/lib/property-types/schemas/other-land.ts
  - docs/0417-old/透天別墅_秘書後補清單.docx
  - docs/0417-old/工業地_現場必問清單.docx
  - docs/0417-old/不動產說明書13.pdf
  - stitch_ai/estate_logic/DESIGN.md
  - docs/0417-old/土地物調表-母版.docx
  - src/lib/pdf-generator/dossier.ts
  - docs/0417-old/其他土地_現場必問清單.docx
  - docs/0417-old/鄉村區建地_秘書後補清單.docx
  - .spectra.yaml
  - docs/0417-old/套房_現場必問清單.docx
  - src/app/listings/page.tsx
  - stitch_ai/ai/code.html
  - docs/0417-old/建物物調表-母版.dot
tests:
  - src/lib/property-types/__tests__/index.test.ts
  - src/lib/db/__tests__/listing-workflow.test.ts
  - src/lib/form-renderer/__tests__/field-visit-form.test.ts
  - src/lib/db/__tests__/regenerate.test.ts
  - src/lib/db/__tests__/e2e-residential.test.ts
  - src/lib/db/__tests__/index.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/app/api/__tests__/listings.test.ts
  - src/lib/form-renderer/__tests__/supplementary-form.test.ts
-->

---
### Requirement: UI design follows established design system

All pages SHALL follow the established design system:
- Background: #F5F6FA (light grey)
- Primary color: #1B3A6B (deep blue)
- Accent color: #F5882B (orange)
- Text: #2D3142 (dark grey)
- Font: Manrope
- Card style: white background, rounded corners (8px), ambient shadow

#### Scenario: Consistent sidebar across all pages

- **WHEN** user navigates to any of the 5 pages
- **THEN** the left sidebar SHALL always be visible with 建安不動產 AI 系統 logo and navigation items

<!-- @trace
source: three-stage-listing-workflow-v2
updated: 2026-04-17
code:
  - docs/0417-old/其他土地_秘書後補清單.docx
  - docs/0417-old/商業地_現場必問清單.docx
  - docs/0417-old/建地_住宅地_秘書後補清單.docx
  - docs/0417-old/不動產說明書11.pdf
  - src/lib/property-types/schemas/commercial-land.ts
  - src/lib/property-types/schemas/highrise.ts
  - docs/0417-old/不動產說明書9.pdf
  - docs/0417-old/公寓_秘書後補清單.docx
  - src/lib/document-generator/types.ts
  - docs/0417-old/廠房_現場必問清單.docx
  - docs/0417-old/鄉村區建地_現場必問清單.docx
  - src/app/listings/[id]/documents/page.tsx
  - docs/0417-old/套房_秘書後補清單.docx
  - src/lib/property-types/schemas/rural-land.ts
  - docs/0417-old/農地_秘書後補清單.docx
  - stitch_ai/_2/screen.png
  - package.json
  - docs/0417-old/不動產說明書6.pdf
  - stitch_ai/ai/screen.png
  - docs/0417-old/不動產說明書5.pdf
  - docs/0417-old/不動產說明書2.pdf
  - docs/0417-old/農舍_現場必問清單.docx
  - docs/0417-old/店面_現場必問清單.docx
  - docs/0417-old/商業地_秘書後補清單.docx
  - docs/0417-old/周遭.pdf
  - docs/0417-old/不動產說明書8.pdf
  - src/app/api/listings/route.ts
  - src/lib/property-types/schemas/farmhouse.ts
  - docs/0417-old/不動產說明書12.pdf
  - stitch_ai/_2/code.html
  - docs/0417-old/不動產說明說15.pdf
  - docs/0417-old/工業地_秘書後補清單.docx
  - src/app/listings/new/page.tsx
  - src/lib/property-types/schemas/shop.ts
  - docs/0417-old/建地_住宅地_現場必問清單.docx
  - src/lib/property-types/schemas/industrial-land.ts
  - stitch_ai/_1/screen.png
  - docs/0417-old/不動產說明書14.pdf
  - src/lib/property-types/schemas/factory.ts
  - src/lib/property-types/index.ts
  - docs/0417-old/大樓華廈_秘書後補清單.docx
  - docs/0417-old/不動產說明書4.pdf
  - src/app/listings/[id]/fill/page.tsx
  - src/components/Sidebar.tsx
  - src/lib/db/schema.ts
  - docs/0417-old/店面_秘書後補清單.docx
  - docs/0417-old/大樓華廈_現場必問清單.docx
  - src/app/listings/[id]/generating/page.tsx
  - docs/0417-old/農地_現場必問清單.docx
  - docs/0417-old/農舍_秘書後補清單.docx
  - docs/0417-old/不動產說明書1.pdf
  - src/lib/property-types/schemas/suite.ts
  - src/lib/db/index.ts
  - docs/0417-new/建安不動產欄位總表.md
  - stitch_ai/_1/code.html
  - docs/0417-new/建安不動產欄位總表_土地版.docx
  - docs/0417-old/不動產書說明書10.pdf
  - docs/0417-old/不動產說明書3.pdf
  - src/lib/property-types/schemas/farmland.ts
  - src/lib/property-types/schemas/apartment.ts
  - src/lib/property-types/schemas/residential-land.ts
  - docs/0417-old/廠房_秘書後補清單.docx
  - docs/0417-old/透天別墅_現場必問清單.docx
  - docs/0417-old/不動產說明說16.pdf
  - docs/0417-old/透明房價一覽表成交行情.pdf
  - docs/0417-old/不動產書說明說7.pdf
  - stitch_ai/estate_elite/DESIGN.md
  - src/lib/form-renderer/index.ts
  - docs/0417-old/公寓_現場必問清單.docx
  - src/lib/property-types/schemas/index.ts
  - src/lib/property-types/schemas/townhouse.ts
  - docs/0417-new/建安不動產欄位總表_建物版.docx
  - src/lib/property-types/schemas/other-land.ts
  - docs/0417-old/透天別墅_秘書後補清單.docx
  - docs/0417-old/工業地_現場必問清單.docx
  - docs/0417-old/不動產說明書13.pdf
  - stitch_ai/estate_logic/DESIGN.md
  - docs/0417-old/土地物調表-母版.docx
  - src/lib/pdf-generator/dossier.ts
  - docs/0417-old/其他土地_現場必問清單.docx
  - docs/0417-old/鄉村區建地_秘書後補清單.docx
  - .spectra.yaml
  - docs/0417-old/套房_現場必問清單.docx
  - src/app/listings/page.tsx
  - stitch_ai/ai/code.html
  - docs/0417-old/建物物調表-母版.dot
tests:
  - src/lib/property-types/__tests__/index.test.ts
  - src/lib/db/__tests__/listing-workflow.test.ts
  - src/lib/form-renderer/__tests__/field-visit-form.test.ts
  - src/lib/db/__tests__/regenerate.test.ts
  - src/lib/db/__tests__/e2e-residential.test.ts
  - src/lib/db/__tests__/index.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/app/api/__tests__/listings.test.ts
  - src/lib/form-renderer/__tests__/supplementary-form.test.ts
-->

---
### Requirement: Top navigation stepper shows five-stage progress on listing pages

The system SHALL render a top navigation stepper on every `/listings/[id]/*` page (fill, supplementary, generating, documents) above the page title. The stepper SHALL display five fixed stages in order: 選類型, 現勘, 補件, 產生中, 文件輸出.

Each stage SHALL display one of three visual states:
- Green (completed): the stage has been reached based on `listing.status`
- Blue (current): the stage matches the currently open page
- Gray (pending): the stage has not been reached

The status-to-stage mapping SHALL be:
- `draft` → stages 1 green, 2 blue/green, 3-5 gray
- `field-visit-complete` → stages 1-2 green, 3 blue/green, 4-5 gray
- `ready-for-generation` → stages 1-3 green, 4 blue/green, 5 gray
- `documents-ready` → stages 1-4 green, 5 blue/green

Stages in green or blue state SHALL be clickable and SHALL navigate to the corresponding page. Stages in gray state SHALL NOT be clickable and MUST show `cursor-not-allowed`. Stage 1 (選類型) SHALL render as green but non-clickable when viewed from any `/listings/[id]/*` page because the property type cannot be changed after creation.

#### Scenario: Stepper on documents page with documents-ready status

- **WHEN** a user opens `/listings/5/documents` and the listing has status `documents-ready`
- **THEN** stages 1-4 SHALL be green and clickable
- **THEN** stage 5 SHALL be blue and marked as the current page
- **THEN** clicking stage 2 SHALL navigate the user to `/listings/5/fill`

#### Scenario: Stepper on fill page with draft status

- **WHEN** a user opens `/listings/5/fill` and the listing has status `draft`
- **THEN** stage 1 SHALL be green and non-clickable
- **THEN** stage 2 SHALL be blue and marked as the current page
- **THEN** stages 3-5 SHALL be gray and non-clickable

#### Scenario: Stepper does not allow skipping ahead

- **WHEN** a user views stages 3-5 in gray state
- **THEN** clicking any gray stage SHALL NOT navigate to any page
- **THEN** the gray stages SHALL visually indicate a disabled state (reduced opacity or `cursor-not-allowed`)


<!-- @trace
source: improve-listings-ux-and-fix-pdf
updated: 2026-04-19
code:
  - src/lib/property-types/schemas/highrise.ts
  - package.json
  - scripts/cleanup-empty-drafts.ts
  - src/components/forms/FieldVisitForm.tsx
  - src/lib/form-renderer/index.ts
  - src/app/listings/[id]/fill/page.tsx
  - src/app/api/listings/[id]/generate/route.ts
  - src/lib/property-types/schemas/farmhouse.ts
  - src/lib/property-types/schemas/shop.ts
  - src/app/api/listings/[id]/route.ts
  - vitest.config.ts
  - src/lib/property-types/schemas/factory.ts
  - src/app/listings/[id]/generating/page.tsx
  - src/lib/property-types/schemas/apartment.ts
  - src/lib/property-types/schemas/other-land.ts
  - src/lib/property-types/schemas/rural-land.ts
  - src/app/listings/[id]/documents/page.tsx
  - src/components/Stepper.tsx
  - src/components/outputs/RegenerateButton.tsx
  - src/lib/property-types/schemas/farmland.ts
  - src/app/api/listings/[id]/photos/route.ts
  - src/lib/form-renderer/chapter-grouper.ts
  - src/lib/property-types/schemas/residential-land.ts
  - src/app/api/listings/[id]/pdf/route.ts
  - src/lib/property-types/schemas/industrial-land.ts
  - src/lib/db/list-recent-helper.ts
  - src/components/Sidebar.tsx
  - src/lib/property-types/schemas/townhouse.ts
  - src/app/listings/[id]/supplementary/page.tsx
  - src/components/forms/SupplementaryForm.tsx
  - src/lib/pdf-generator/dossier.ts
  - src/lib/listing-routes.ts
  - src/app/listings/page.tsx
  - src/lib/property-types/schemas/commercial-land.ts
  - src/lib/property-types/schemas/suite.ts
  - src/components/forms/navigation-helpers.ts
  - src/app/api/listings/route.ts
  - src/lib/db/index.ts
tests:
  - src/app/api/__tests__/listings-delete.test.ts
  - src/lib/form-renderer/__tests__/field-visit-form.test.ts
  - src/components/forms/__tests__/field-visit-navigation.test.ts
  - src/lib/property-types/__tests__/index.test.ts
  - src/lib/db/__tests__/e2e-residential.test.ts
  - src/lib/__tests__/cleanup-empty-drafts.test.ts
  - src/app/api/__tests__/listings.test.ts
  - src/lib/db/__tests__/e2e-farmland.test.ts
  - src/lib/__tests__/listing-routes.test.ts
  - src/lib/property-types/schemas/__tests__/required-fields.test.ts
  - src/components/__tests__/Stepper.test.tsx
  - src/lib/db/__tests__/list-recent.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/app/api/__tests__/listings-photos.test.ts
-->

---
### Requirement: Listing page row navigation depends on listing status

The listing page (`/listings`) SHALL route each listing row based on `listing.status`:
- WHEN `listing.status === 'documents-ready'` THEN the address link and action button SHALL navigate to `GET /listings/{id}/documents` and the action button label SHALL read `查看文件`.
- WHEN `listing.status` is any other value (`draft`, `field-visit-complete`, `ready-for-generation`) THEN the address link and action button SHALL navigate to `GET /listings/{id}/fill` and the action button label SHALL read `進入填寫`.

The routing rule SHALL be implemented as a pure function in `src/lib/listing-routes.ts` so that both the listings table and the sidebar recent-listings component share a single implementation.

#### Scenario: Click address on documents-ready listing

- **WHEN** user clicks the address of a listing whose status is `documents-ready`
- **THEN** the browser SHALL navigate to `/listings/{id}/documents` (HTTP 200 on initial render)

#### Scenario: Click action button on draft listing

- **WHEN** user clicks the action button on a listing whose status is `draft`
- **THEN** the browser SHALL navigate to `/listings/{id}/fill`
- **THEN** the action button SHALL display the label `進入填寫`

#### Scenario: Empty listings table

- **WHEN** the listings list is empty
- **THEN** no routing rules SHALL be triggered and an empty-state message SHALL be displayed


<!-- @trace
source: improve-listings-ux-and-fix-pdf
updated: 2026-04-19
code:
  - src/lib/property-types/schemas/highrise.ts
  - package.json
  - scripts/cleanup-empty-drafts.ts
  - src/components/forms/FieldVisitForm.tsx
  - src/lib/form-renderer/index.ts
  - src/app/listings/[id]/fill/page.tsx
  - src/app/api/listings/[id]/generate/route.ts
  - src/lib/property-types/schemas/farmhouse.ts
  - src/lib/property-types/schemas/shop.ts
  - src/app/api/listings/[id]/route.ts
  - vitest.config.ts
  - src/lib/property-types/schemas/factory.ts
  - src/app/listings/[id]/generating/page.tsx
  - src/lib/property-types/schemas/apartment.ts
  - src/lib/property-types/schemas/other-land.ts
  - src/lib/property-types/schemas/rural-land.ts
  - src/app/listings/[id]/documents/page.tsx
  - src/components/Stepper.tsx
  - src/components/outputs/RegenerateButton.tsx
  - src/lib/property-types/schemas/farmland.ts
  - src/app/api/listings/[id]/photos/route.ts
  - src/lib/form-renderer/chapter-grouper.ts
  - src/lib/property-types/schemas/residential-land.ts
  - src/app/api/listings/[id]/pdf/route.ts
  - src/lib/property-types/schemas/industrial-land.ts
  - src/lib/db/list-recent-helper.ts
  - src/components/Sidebar.tsx
  - src/lib/property-types/schemas/townhouse.ts
  - src/app/listings/[id]/supplementary/page.tsx
  - src/components/forms/SupplementaryForm.tsx
  - src/lib/pdf-generator/dossier.ts
  - src/lib/listing-routes.ts
  - src/app/listings/page.tsx
  - src/lib/property-types/schemas/commercial-land.ts
  - src/lib/property-types/schemas/suite.ts
  - src/components/forms/navigation-helpers.ts
  - src/app/api/listings/route.ts
  - src/lib/db/index.ts
tests:
  - src/app/api/__tests__/listings-delete.test.ts
  - src/lib/form-renderer/__tests__/field-visit-form.test.ts
  - src/components/forms/__tests__/field-visit-navigation.test.ts
  - src/lib/property-types/__tests__/index.test.ts
  - src/lib/db/__tests__/e2e-residential.test.ts
  - src/lib/__tests__/cleanup-empty-drafts.test.ts
  - src/app/api/__tests__/listings.test.ts
  - src/lib/db/__tests__/e2e-farmland.test.ts
  - src/lib/__tests__/listing-routes.test.ts
  - src/lib/property-types/schemas/__tests__/required-fields.test.ts
  - src/components/__tests__/Stepper.test.tsx
  - src/lib/db/__tests__/list-recent.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/app/api/__tests__/listings-photos.test.ts
-->

---
### Requirement: Sidebar shows recent listings for quick access

The sidebar SHALL display a section below the existing navigation items titled `最近物件`. This section SHALL render up to five most recently created listings ordered by `created_at` descending. Each item SHALL show the listing address (truncated to 20 characters with ellipsis when longer) and a status badge.

Clicking any item SHALL navigate using the same routing rule defined in the Listing page row navigation requirement: `documents-ready` → `/listings/{id}/documents`; otherwise `/listings/{id}/fill`.

The sidebar SHALL fetch recent listings by calling `GET /api/listings` once per page mount and SHALL slice the first 5 entries sorted by `created_at` descending on the client. When the listings list is empty the section SHALL display the placeholder text `尚無物件`.

#### Scenario: Sidebar shows five most recent listings

- **WHEN** the system has 8 listings in the database
- **THEN** the sidebar `最近物件` section SHALL show exactly 5 entries
- **THEN** the entries SHALL be ordered by `created_at` descending

#### Scenario: Sidebar with no listings

- **WHEN** the listings list is empty
- **THEN** the sidebar SHALL display `尚無物件` under `最近物件`

#### Scenario: Click on recent listing navigates by status

- **WHEN** user clicks a recent-listing entry whose listing status is `documents-ready`
- **THEN** the browser SHALL navigate to `/listings/{id}/documents`

<!-- @trace
source: improve-listings-ux-and-fix-pdf
updated: 2026-04-19
code:
  - src/lib/property-types/schemas/highrise.ts
  - package.json
  - scripts/cleanup-empty-drafts.ts
  - src/components/forms/FieldVisitForm.tsx
  - src/lib/form-renderer/index.ts
  - src/app/listings/[id]/fill/page.tsx
  - src/app/api/listings/[id]/generate/route.ts
  - src/lib/property-types/schemas/farmhouse.ts
  - src/lib/property-types/schemas/shop.ts
  - src/app/api/listings/[id]/route.ts
  - vitest.config.ts
  - src/lib/property-types/schemas/factory.ts
  - src/app/listings/[id]/generating/page.tsx
  - src/lib/property-types/schemas/apartment.ts
  - src/lib/property-types/schemas/other-land.ts
  - src/lib/property-types/schemas/rural-land.ts
  - src/app/listings/[id]/documents/page.tsx
  - src/components/Stepper.tsx
  - src/components/outputs/RegenerateButton.tsx
  - src/lib/property-types/schemas/farmland.ts
  - src/app/api/listings/[id]/photos/route.ts
  - src/lib/form-renderer/chapter-grouper.ts
  - src/lib/property-types/schemas/residential-land.ts
  - src/app/api/listings/[id]/pdf/route.ts
  - src/lib/property-types/schemas/industrial-land.ts
  - src/lib/db/list-recent-helper.ts
  - src/components/Sidebar.tsx
  - src/lib/property-types/schemas/townhouse.ts
  - src/app/listings/[id]/supplementary/page.tsx
  - src/components/forms/SupplementaryForm.tsx
  - src/lib/pdf-generator/dossier.ts
  - src/lib/listing-routes.ts
  - src/app/listings/page.tsx
  - src/lib/property-types/schemas/commercial-land.ts
  - src/lib/property-types/schemas/suite.ts
  - src/components/forms/navigation-helpers.ts
  - src/app/api/listings/route.ts
  - src/lib/db/index.ts
tests:
  - src/app/api/__tests__/listings-delete.test.ts
  - src/lib/form-renderer/__tests__/field-visit-form.test.ts
  - src/components/forms/__tests__/field-visit-navigation.test.ts
  - src/lib/property-types/__tests__/index.test.ts
  - src/lib/db/__tests__/e2e-residential.test.ts
  - src/lib/__tests__/cleanup-empty-drafts.test.ts
  - src/app/api/__tests__/listings.test.ts
  - src/lib/db/__tests__/e2e-farmland.test.ts
  - src/lib/__tests__/listing-routes.test.ts
  - src/lib/property-types/schemas/__tests__/required-fields.test.ts
  - src/components/__tests__/Stepper.test.tsx
  - src/lib/db/__tests__/list-recent.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/app/api/__tests__/listings-photos.test.ts
-->

---
### Requirement: Listing row delete button removes listing

The listing table row SHALL provide a delete button (trash icon) that removes the listing when clicked and confirmed.

#### Scenario: User clicks delete on any listing row

- **WHEN** a user clicks the trash icon on a listing row regardless of listing status
- **THEN** the system SHALL show a native `window.confirm` dialog with message "確定刪除此物件？此操作無法復原"
- **AND** upon user confirmation, the system SHALL issue `DELETE /api/listings/{id}`
- **AND** on API success, the system SHALL remove the row from the table without a full page refresh
- **AND** on API failure, the system SHALL show an alert with the error message and keep the row visible

#### Scenario: User cancels the confirm dialog

- **WHEN** a user clicks the trash icon but dismisses the confirm dialog
- **THEN** the system SHALL NOT issue any API request
- **AND** the listing row SHALL remain visible and unchanged


<!-- @trace
source: fix-listing-flow-and-add-delete
updated: 2026-04-19
code:
  - scripts/cleanup-empty-drafts.ts
  - src/app/listings/[id]/fill/page.tsx
  - src/components/forms/FieldVisitForm.tsx
  - src/lib/property-types/schemas/industrial-land.ts
  - src/lib/property-types/schemas/residential-land.ts
  - src/app/listings/page.tsx
  - src/lib/db/list-recent-helper.ts
  - src/lib/property-types/schemas/highrise.ts
  - src/components/forms/navigation-helpers.ts
  - src/app/api/listings/[id]/route.ts
  - src/lib/property-types/schemas/farmhouse.ts
  - src/components/forms/SupplementaryForm.tsx
  - src/lib/property-types/schemas/factory.ts
  - src/app/api/listings/route.ts
  - src/lib/property-types/schemas/other-land.ts
  - package.json
  - src/lib/property-types/schemas/farmland.ts
  - src/lib/form-renderer/chapter-grouper.ts
  - src/lib/property-types/schemas/rural-land.ts
  - src/lib/property-types/schemas/townhouse.ts
  - src/lib/property-types/schemas/suite.ts
  - src/lib/property-types/schemas/apartment.ts
  - src/lib/property-types/schemas/commercial-land.ts
  - src/lib/listing-routes.ts
  - src/app/listings/[id]/documents/page.tsx
  - src/lib/db/index.ts
  - src/lib/property-types/schemas/shop.ts
  - src/app/api/listings/[id]/photos/route.ts
  - src/app/listings/[id]/generating/page.tsx
tests:
  - src/components/forms/__tests__/field-visit-navigation.test.ts
  - src/app/api/__tests__/listings-delete.test.ts
  - src/lib/__tests__/cleanup-empty-drafts.test.ts
  - src/app/api/__tests__/listings-photos.test.ts
  - src/lib/db/__tests__/list-recent.test.ts
  - src/lib/__tests__/listing-routes.test.ts
  - src/lib/property-types/schemas/__tests__/required-fields.test.ts
-->

---
### Requirement: Stepper green segments are clickable for navigation back

The stepper navigation SHALL allow users to click any green (completed) segment to navigate back to the corresponding page.

#### Scenario: documents-ready listing navigates back via stepper

- **WHEN** a user is on `/listings/{id}/documents` for a listing with status `documents-ready`
- **THEN** stepper segments 2 (現勘), 3 (補件), and 4 (產生中) SHALL render as green with cursor-pointer styling
- **AND** clicking segment 2 SHALL navigate to `/listings/{id}/fill`
- **AND** clicking segment 3 SHALL navigate to `/listings/{id}/supplementary`
- **AND** clicking segment 4 SHALL navigate to `/listings/{id}/generating`
- **AND** segment 1 (選類型) SHALL remain green but non-clickable when `listingId !== null`


<!-- @trace
source: fix-listing-flow-and-add-delete
updated: 2026-04-19
code:
  - scripts/cleanup-empty-drafts.ts
  - src/app/listings/[id]/fill/page.tsx
  - src/components/forms/FieldVisitForm.tsx
  - src/lib/property-types/schemas/industrial-land.ts
  - src/lib/property-types/schemas/residential-land.ts
  - src/app/listings/page.tsx
  - src/lib/db/list-recent-helper.ts
  - src/lib/property-types/schemas/highrise.ts
  - src/components/forms/navigation-helpers.ts
  - src/app/api/listings/[id]/route.ts
  - src/lib/property-types/schemas/farmhouse.ts
  - src/components/forms/SupplementaryForm.tsx
  - src/lib/property-types/schemas/factory.ts
  - src/app/api/listings/route.ts
  - src/lib/property-types/schemas/other-land.ts
  - package.json
  - src/lib/property-types/schemas/farmland.ts
  - src/lib/form-renderer/chapter-grouper.ts
  - src/lib/property-types/schemas/rural-land.ts
  - src/lib/property-types/schemas/townhouse.ts
  - src/lib/property-types/schemas/suite.ts
  - src/lib/property-types/schemas/apartment.ts
  - src/lib/property-types/schemas/commercial-land.ts
  - src/lib/listing-routes.ts
  - src/app/listings/[id]/documents/page.tsx
  - src/lib/db/index.ts
  - src/lib/property-types/schemas/shop.ts
  - src/app/api/listings/[id]/photos/route.ts
  - src/app/listings/[id]/generating/page.tsx
tests:
  - src/components/forms/__tests__/field-visit-navigation.test.ts
  - src/app/api/__tests__/listings-delete.test.ts
  - src/lib/__tests__/cleanup-empty-drafts.test.ts
  - src/app/api/__tests__/listings-photos.test.ts
  - src/lib/db/__tests__/list-recent.test.ts
  - src/lib/__tests__/listing-routes.test.ts
  - src/lib/property-types/schemas/__tests__/required-fields.test.ts
-->

---
### Requirement: documents-ready listing row shows secondary action button

The listings table SHALL show a secondary "回去補件" button alongside the primary "查看文件" button for `documents-ready` listings.

#### Scenario: documents-ready row renders both buttons

- **WHEN** a listing row has status `documents-ready`
- **THEN** the action cell SHALL contain two buttons: primary "查看文件" linking to `/listings/{id}/documents` and secondary "回去補件" linking to `/listings/{id}/fill`
- **AND** the secondary button SHALL use lower visual weight (lighter border, no fill)

#### Scenario: non-documents-ready row renders single button

- **WHEN** a listing row has status other than `documents-ready`
- **THEN** the action cell SHALL contain only the single primary "進入填寫" button


<!-- @trace
source: fix-listing-flow-and-add-delete
updated: 2026-04-19
code:
  - scripts/cleanup-empty-drafts.ts
  - src/app/listings/[id]/fill/page.tsx
  - src/components/forms/FieldVisitForm.tsx
  - src/lib/property-types/schemas/industrial-land.ts
  - src/lib/property-types/schemas/residential-land.ts
  - src/app/listings/page.tsx
  - src/lib/db/list-recent-helper.ts
  - src/lib/property-types/schemas/highrise.ts
  - src/components/forms/navigation-helpers.ts
  - src/app/api/listings/[id]/route.ts
  - src/lib/property-types/schemas/farmhouse.ts
  - src/components/forms/SupplementaryForm.tsx
  - src/lib/property-types/schemas/factory.ts
  - src/app/api/listings/route.ts
  - src/lib/property-types/schemas/other-land.ts
  - package.json
  - src/lib/property-types/schemas/farmland.ts
  - src/lib/form-renderer/chapter-grouper.ts
  - src/lib/property-types/schemas/rural-land.ts
  - src/lib/property-types/schemas/townhouse.ts
  - src/lib/property-types/schemas/suite.ts
  - src/lib/property-types/schemas/apartment.ts
  - src/lib/property-types/schemas/commercial-land.ts
  - src/lib/listing-routes.ts
  - src/app/listings/[id]/documents/page.tsx
  - src/lib/db/index.ts
  - src/lib/property-types/schemas/shop.ts
  - src/app/api/listings/[id]/photos/route.ts
  - src/app/listings/[id]/generating/page.tsx
tests:
  - src/components/forms/__tests__/field-visit-navigation.test.ts
  - src/app/api/__tests__/listings-delete.test.ts
  - src/lib/__tests__/cleanup-empty-drafts.test.ts
  - src/app/api/__tests__/listings-photos.test.ts
  - src/lib/db/__tests__/list-recent.test.ts
  - src/lib/__tests__/listing-routes.test.ts
  - src/lib/property-types/schemas/__tests__/required-fields.test.ts
-->

---
### Requirement: documents page provides regenerate action with persistence notice

The `/listings/{id}/documents` page SHALL provide a "重新產生文件" button and a persistent notice informing users that field edits require regeneration.

#### Scenario: User regenerates documents

- **WHEN** a user clicks the "重新產生文件" button on `/listings/{id}/documents`
- **THEN** the system SHALL show `window.confirm("重新產生會覆蓋現有 5 份文件，確定？")`
- **AND** on confirmation, the system SHALL invoke the existing generate endpoint (`POST /api/listings/{id}/generate` or the regenerate endpoint, whichever is the implemented one)
- **AND** the page SHALL reload the listing's generated documents after success

#### Scenario: Field update persistence notice is always visible

- **WHEN** a user is on `/listings/{id}/documents` regardless of whether fields have been edited since generation
- **THEN** the page SHALL display a persistent notice: "若修改過現勘/補件欄位，請點『重新產生文件』讓內容反映最新輸入"

<!-- @trace
source: fix-listing-flow-and-add-delete
updated: 2026-04-19
code:
  - scripts/cleanup-empty-drafts.ts
  - src/app/listings/[id]/fill/page.tsx
  - src/components/forms/FieldVisitForm.tsx
  - src/lib/property-types/schemas/industrial-land.ts
  - src/lib/property-types/schemas/residential-land.ts
  - src/app/listings/page.tsx
  - src/lib/db/list-recent-helper.ts
  - src/lib/property-types/schemas/highrise.ts
  - src/components/forms/navigation-helpers.ts
  - src/app/api/listings/[id]/route.ts
  - src/lib/property-types/schemas/farmhouse.ts
  - src/components/forms/SupplementaryForm.tsx
  - src/lib/property-types/schemas/factory.ts
  - src/app/api/listings/route.ts
  - src/lib/property-types/schemas/other-land.ts
  - package.json
  - src/lib/property-types/schemas/farmland.ts
  - src/lib/form-renderer/chapter-grouper.ts
  - src/lib/property-types/schemas/rural-land.ts
  - src/lib/property-types/schemas/townhouse.ts
  - src/lib/property-types/schemas/suite.ts
  - src/lib/property-types/schemas/apartment.ts
  - src/lib/property-types/schemas/commercial-land.ts
  - src/lib/listing-routes.ts
  - src/app/listings/[id]/documents/page.tsx
  - src/lib/db/index.ts
  - src/lib/property-types/schemas/shop.ts
  - src/app/api/listings/[id]/photos/route.ts
  - src/app/listings/[id]/generating/page.tsx
tests:
  - src/components/forms/__tests__/field-visit-navigation.test.ts
  - src/app/api/__tests__/listings-delete.test.ts
  - src/lib/__tests__/cleanup-empty-drafts.test.ts
  - src/app/api/__tests__/listings-photos.test.ts
  - src/lib/db/__tests__/list-recent.test.ts
  - src/lib/__tests__/listing-routes.test.ts
  - src/lib/property-types/schemas/__tests__/required-fields.test.ts
-->

---
### Requirement: Photo and document tab uploads wire through to attachments API

The 照片/文件 tab inside the fill-form page SHALL trigger a real upload to `/api/listings/{listingId}/attachments` immediately after the user selects a file. The upload SHALL be fire-and-forget and SHALL NOT block UI navigation across the three-tab layout.

#### Scenario: Selecting a transcript PDF in the photo/document tab uploads to server

- **WHEN** user selects a `.pdf` file in the 照片/文件 tab of the fill-form page
- **THEN** the UI SHALL POST the file to `/api/listings/{listingId}/attachments` with `type: 'transcript'`
- **THEN** the user SHALL be able to navigate between tabs without waiting for upload completion

#### Scenario: Upload failure does not interrupt fill-form flow

- **WHEN** the attachments API returns 4xx/5xx after a tab upload
- **THEN** the user SHALL NOT see a blocking error dialog
- **THEN** the failure SHALL be logged via `console.error`

<!-- @trace
source: fix-upload-extract-wiring
updated: 2026-05-03
code:
  - src/lib/codex-client/index.ts
  - src/components/forms/FieldVisitForm.tsx
  - Dockerfile
  - src/lib/pdf-generator/templates/dossier.html
  - src/lib/document-generator/build-input.ts
  - listings.db
  - src/lib/pdf-generator/templates/sales-dm.html
  - src/lib/pdf-generator/dossier.ts
  - src/lib/ocr/field-mapping.ts
  - src/components/Sidebar.tsx
  - src/lib/document-generator/pdf/dossier-land.ts
  - src/app/api/listings/[id]/regenerate/route.ts
  - src/components/PhotoUploadClassifier.tsx
  - src/lib/ocr/parsers/land-parser.ts
  - package.json
  - src/lib/codex-client/adapters/gemini.ts
  - src/lib/pdf-generator/survey-sales.ts
  - next.config.ts
  - src/lib/ocr/parsers/building-parser.ts
  - src/lib/pdf-generator/templates/survey.html
  - kimi-statusline-feature-request.md
  - kimi-usage-ux-issue-body.md
  - three-ai.db
  - src/lib/codex-client/types.ts
  - src/lib/document-generator/pdf/dossier-building.ts
  - src/app/layout.tsx
  - src/lib/db/index.ts
  - src/lib/document-generator/types.ts
  - docs/kimi-prompts-wave1-fix-disclosure.md
  - src/app/api/listings/[id]/generate/route.ts
  - src/lib/ocr/pdf-text-layer.ts
  - src/lib/ocr/normalize.ts
  - vitest.config.ts
  - src/app/api/listings/[id]/attachments/route.ts
  - kimi-statusline-issue-body.md
tests:
  - src/lib/ocr/__tests__/normalize.test.ts
  - src/lib/codex-client/__tests__/fallback-chain.test.ts
  - src/lib/ocr/__tests__/land-parser.test.ts
  - e2e/autofill-upload.spec.ts
  - src/lib/ocr/__tests__/e2e-autofill.spec.ts
  - src/lib/ocr/__tests__/building-parser.test.ts
  - src/lib/document-generator/__tests__/build-input.test.ts
  - src/lib/document-generator/pdf/__tests__/dossier-building.test.ts
  - src/app/api/__tests__/listings-delete.test.ts
-->

---
### Requirement: Listing list filters by role

The listing list page SHALL display different content based on the user's role.

#### Scenario: Agent sees only own listings

- **WHEN** an agent user loads the listings page
- **THEN** only listings where owner_id matches the agent's user id SHALL be displayed

##### Example: Agent with 3 listings

- **GIVEN** agent "王小明" (user_id=2) has 3 listings, and the system has 20 total listings
- **WHEN** 王小明 navigates to /listings
- **THEN** the list SHALL show exactly 3 listings, all with owner_id=2

#### Scenario: Admin sees all listings

- **WHEN** an admin user loads the listings page
- **THEN** all listings in the system SHALL be displayed regardless of owner_id

##### Example: Admin sees all 20

- **GIVEN** system has 20 total listings across all agents
- **WHEN** admin navigates to /listings
- **THEN** the list SHALL show all 20 listings with owner name displayed for each


<!-- @trace
source: user-management
updated: 2026-05-04
code:
  - package.json
  - src/app/admin/audit-logs/page.tsx
  - src/lib/db/schema.ts
  - src/lib/db/index.ts
  - src/app/api/auth/logout/route.ts
  - src/lib/audit.ts
  - src/app/api/admin/users/[id]/reset-password/route.ts
  - src/app/admin/users/page.tsx
  - src/app/api/listings/[id]/route.ts
  - src/app/api/listings/route.ts
  - src/lib/pdf-generator/dossier.ts
  - src/app/api/admin/audit-logs/route.ts
  - src/app/admin/transfer/page.tsx
  - src/app/api/admin/users/route.ts
  - src/app/login/page.tsx
  - src/lib/generators/disclosure-document.ts
  - src/proxy.ts
  - src/lib/db/list-recent-helper.ts
  - src/lib/pdf-generator/survey-sales.ts
  - src/app/api/admin/transfer-cases/route.ts
  - src/app/api/admin/users/[id]/disable/route.ts
  - src/app/api/auth/login/route.ts
  - src/lib/auth.ts
  - src/lib/generators/disclaimer.ts
  - src/lib/generators/property-sheet.ts
tests:
  - e2e/user-management.spec.ts
-->

---
### Requirement: Admin can edit any listing

The admin user SHALL be able to open and edit any listing regardless of owner_id.

#### Scenario: Admin edits another agent's listing

- **WHEN** admin opens a listing owned by agent "王小明"
- **THEN** the edit form SHALL be fully functional with save capability

##### Example: Admin modifies address

- **GIVEN** listing id=45 is owned by agent "王小明" (user_id=2)
- **WHEN** admin (user_id=1) navigates to /listings/45/edit and changes address to "新地址"
- **THEN** the update SHALL succeed and audit_logs SHALL record user_id=1, action="update_listing", target_id=45

<!-- @trace
source: user-management
updated: 2026-05-04
code:
  - package.json
  - src/app/admin/audit-logs/page.tsx
  - src/lib/db/schema.ts
  - src/lib/db/index.ts
  - src/app/api/auth/logout/route.ts
  - src/lib/audit.ts
  - src/app/api/admin/users/[id]/reset-password/route.ts
  - src/app/admin/users/page.tsx
  - src/app/api/listings/[id]/route.ts
  - src/app/api/listings/route.ts
  - src/lib/pdf-generator/dossier.ts
  - src/app/api/admin/audit-logs/route.ts
  - src/app/admin/transfer/page.tsx
  - src/app/api/admin/users/route.ts
  - src/app/login/page.tsx
  - src/lib/generators/disclosure-document.ts
  - src/proxy.ts
  - src/lib/db/list-recent-helper.ts
  - src/lib/pdf-generator/survey-sales.ts
  - src/app/api/admin/transfer-cases/route.ts
  - src/app/api/admin/users/[id]/disable/route.ts
  - src/app/api/auth/login/route.ts
  - src/lib/auth.ts
  - src/lib/generators/disclaimer.ts
  - src/lib/generators/property-sheet.ts
tests:
  - e2e/user-management.spec.ts
-->