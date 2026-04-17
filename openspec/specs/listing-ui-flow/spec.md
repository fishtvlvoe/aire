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