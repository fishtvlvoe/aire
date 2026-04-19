# field-visit-form Specification

## Purpose

TBD - created by archiving change 'three-stage-listing-workflow-v2'. Update Purpose after archive.

## Requirements

### Requirement: Field visit form renders dynamically based on property type

The system SHALL render a three-tab form on the field visit page:
- Tab 1: 共通欄位 (common fields, all types)
- Tab 2: 類型專屬欄位 (type-specific fields, varies by type)
- Tab 3: 秘書後補 (supplementary fields, filled by secretary)

The form SHALL load the field schema from the property-type-registry for the selected type and render the appropriate fields.

#### Scenario: Load form for farmland listing

- **WHEN** a user opens the fill form page for a `farmland` listing
- **THEN** Tab 1 SHALL show common fields (委託總價、物件地址、優缺點)
- **THEN** Tab 2 SHALL show land_common fields + farmland type_specific fields (灌溉、農路、農作物 etc.)
- **THEN** Tab 3 SHALL show land supplementary fields (謄本標示部、公告現值 etc.)

#### Scenario: Load form for townhouse listing

- **WHEN** a user opens the fill form page for a `townhouse` listing
- **THEN** Tab 2 SHALL show building_common fields + townhouse type_specific fields (騎樓、車庫、前後側院 etc.)


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
### Requirement: Common fields are identical across all types

The system SHALL always render the following common fields in Tab 1 regardless of property type:
- 委託總價（數字，萬元）
- 物件地址（文字）
- 用途（文字）
- 現況（選擇：空屋/自住/出租中）
- 優點 1-3（文字）
- 缺點 1-3（文字）
- 照片上傳說明（說明文字）

#### Scenario: Common fields always present

- **WHEN** a user opens any listing's fill form
- **THEN** 委託總價 and 物件地址 fields SHALL always be visible in Tab 1


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
### Requirement: Building common fields apply to all building-category types

The system SHALL render the following fields in Tab 2 for all building-category types (in addition to type_specific):
- 車位停車方式（勾選：坡道平面/坡道機械/升降機械/一樓平面）
- 陽台座向、大樓座向
- 銷售樓別
- 租金、管理方式、管理費
- 每層幾戶、電梯數
- 建設公司、社區大樓名稱
- 最近學校/公園/市場/商圈名稱

#### Scenario: Building common fields for apartment

- **WHEN** user opens fill form for `apartment` type
- **THEN** 車位停車方式 and 管理費 SHALL appear in Tab 2 before type-specific fields


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
### Requirement: Land common fields apply to all land-category types

The system SHALL render the following fields in Tab 2 for all land-category types:
- 土地謄本、地籍圖（文件說明）
- 使用分區、地目、使用編定
- 地段/地號、地坪
- 是否持分、持分比例
- 臨路寬、面寬、深度
- 是否角地、是否雙面臨路、是否無尾巷
- 是否有通行權、是否可到車、是否有水電
- 現況使用、是否有地上物

#### Scenario: Land common fields for residential-land

- **WHEN** user opens fill form for `residential-land` type
- **THEN** 地坪 and 使用分區 SHALL appear in Tab 2 before type-specific fields


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
### Requirement: Form saves data as structured JSON

The system SHALL save field visit form data as JSON to `field_visit_data` column with structure:
```json
{
  "common": { ... },
  "building_common": { ... },  // only for building types
  "land_common": { ... },      // only for land types
  "type_specific": { ... }
}
```

#### Scenario: Save farmland field visit data

- **WHEN** user submits field visit form for a `farmland` listing
- **THEN** the system SHALL save JSON with `common`, `land_common`, and `type_specific` keys
- **THEN** listing status SHALL advance to `field-visit-complete`

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
### Requirement: Field visit form supports all 13 property types

The field visit form SHALL render dynamically for any of the 13 property types (not limited to 2 as in v2).

#### Scenario: Form renders for all 13 types
- **WHEN** user opens `/listings/[id]/fill` for a listing with any of 13 property types
- **THEN** form SHALL render three layers:
  1. Common fields (shared by all types)
  2. Category common fields (building-common OR land-common)
  3. Type-specific fields (per property type)
- **AND** no placeholder "尚未支援此類型" message SHALL appear


<!-- @trace
source: containerized-three-stage-automation-v3
updated: 2026-04-19
code:
  - src/app/api/listings/[id]/documents/route.ts
  - src/app/listings/new/page.tsx
  - src/app/listings/[id]/documents/page.tsx
  - src/app/api/pre-commission/route.ts
  - docs/0417-old/不動產說明書11.pdf
  - docs/dossier-implementation-spec.md
  - src/app/api/listings/[id]/advance-to-field-visit/route.ts
  - docs/0417-old/其他土地_秘書後補清單.docx
  - src/app/api/pre-commission/[id]/lookup/route.ts
  - src/lib/codex-client/types.ts
  - src/lib/storage/index.ts
  - src/lib/property-types/schemas/farmhouse.ts
  - docs/0417-old/大樓華廈_秘書後補清單.docx
  - docs/0417-old/商業地_秘書後補清單.docx
  - docs/0417-old/店面_現場必問清單.docx
  - src/lib/document-generator/codex-provider.ts
  - src/app/api/listings/route.ts
  - .spectra.yaml
  - src/components/outputs/index.ts
  - docs/handoff/2026-04-17-v3-handoff.md
  - src/app/api/listings/[id]/route.ts
  - next.config.ts
  - docs/0417-old/建物物調表-母版.dot
  - docs/0417-old/商業地_現場必問清單.docx
  - src/lib/document-generator/md/survey.ts
  - docs/0417-old/不動產說明書5.pdf
  - src/lib/property-types/schemas/residential-land.ts
  - docs/0417-old/農地_秘書後補清單.docx
  - src/components/forms/FieldVisitForm.tsx
  - src/lib/codex-client/adapters/ollama.ts
  - src/lib/property-types/schemas/apartment.ts
  - src/components/outputs/SocialPostTabs.tsx
  - docs/0417-old/套房_現場必問清單.docx
  - src/lib/codex-client/adapters/claude-code.ts
  - docs/0417-old/不動產說明書6.pdf
  - docs/0417-old/農舍_現場必問清單.docx
  - docs/0417-old/建地_住宅地_現場必問清單.docx
  - docs/0417-old/不動產說明書14.pdf
  - docs/0417-old/不動產書說明說7.pdf
  - docker/start.sh
  - src/components/Stepper.tsx
  - docs/release-note-v3.0.0.md
  - src/app/page.tsx
  - src/lib/property-types/schemas/highrise.ts
  - docs/0417-old/不動產書說明書10.pdf
  - src/lib/pre-commission/lookup.ts
  - src/lib/codex-client/adapters/gemini.ts
  - docs/0417-old/鄉村區建地_秘書後補清單.docx
  - docs/0417-old/不動產說明書8.pdf
  - src/lib/document-generator/md/dm.ts
  - src/lib/property-types/schemas/commercial-land.ts
  - src/components/forms/navigation-helpers.ts
  - docs/0417-old/農舍_秘書後補清單.docx
  - docker/first-login.sh
  - docs/0417-old/廠房_秘書後補清單.docx
  - src/lib/pdf-generator/templates/dossier.css
  - docs/0417-old/不動產說明說16.pdf
  - src/lib/codex-client/index.ts
  - docs/0417-old/不動產說明書2.pdf
  - src/app/api/listings/[id]/photos/route.ts
  - docker/first-login.bat
  - docs/0417-new/建安不動產欄位總表_建物版.docx
  - src/lib/document-generator/types.ts
  - src/components/outputs/MarketingFlowGuide.tsx
  - docs/0417-old/公寓_現場必問清單.docx
  - src/components/outputs/RegenerateButton.tsx
  - src/lib/property-types/schemas/factory.ts
  - Dockerfile
  - docs/0417-old/店面_秘書後補清單.docx
  - docker/compose.yaml
  - docs/0417-old/土地物調表-母版.docx
  - src/lib/property-types/schemas/other-land.ts
  - docs/0417-old/周遭.pdf
  - docs/0417-old/不動產說明書9.pdf
  - docs/0417-old/不動產說明書3.pdf
  - docs/0417-old/大樓華廈_現場必問清單.docx
  - docs/0417-old/套房_秘書後補清單.docx
  - src/lib/property-types/schemas/suite.ts
  - docker/start.bat
  - package.json
  - vitest.config.ts
  - src/lib/codex-client/adapters/codex.ts
  - docs/dossier-chapter-structure.md
  - docs/0417-old/建地_住宅地_秘書後補清單.docx
  - src/lib/db/list-recent-helper.ts
  - src/app/api/health/route.ts
  - src/lib/form-renderer/index.ts
  - src/app/api/pre-commission/[id]/parse-paste/route.ts
  - src/lib/document-generator/md/listing591.ts
  - src/app/listings/[id]/fill/page.tsx
  - docs/0417-new/建安不動產欄位總表.md
  - docs/0417-old/鄉村區建地_現場必問清單.docx
  - scripts/cleanup-empty-drafts.ts
  - src/app/listings/[id]/supplementary/page.tsx
  - src/lib/form-renderer/chapter-grouper.ts
  - docs/0417-old/廠房_現場必問清單.docx
  - src/app/api/listings/[id]/generate/route.ts
  - docker/安裝說明.md
  - src/lib/property-types/schemas/industrial-land.ts
  - docs/0417-old/不動產說明書4.pdf
  - docs/release-note-v3.md
  - src/lib/db/schema.ts
  - docs/0417-old/不動產說明書1.pdf
  - src/lib/pdf-generator/dossier.ts
  - src/lib/property-types/schemas/shop.ts
  - docs/0417-old/農地_現場必問清單.docx
  - docs/0417-old/透明房價一覽表成交行情.pdf
  - docs/0417-old/不動產說明書12.pdf
  - src/components/forms/SupplementaryForm.tsx
  - docs/0417-old/工業地_秘書後補清單.docx
  - src/app/api/listings/[id]/regenerate/route.ts
  - src/lib/document-generator/md/social.ts
  - docs/0417-new/建安不動產欄位總表_土地版.docx
  - docs/0417-old/透天別墅_現場必問清單.docx
  - src/app/pre-commission/[id]/page.tsx
  - docs/0417-old/透天別墅_秘書後補清單.docx
  - src/lib/document-generator/pdf/dossier-building.ts
  - src/lib/listing-routes.ts
  - src/lib/property-types/schemas/farmland.ts
  - src/lib/property-types/schemas/townhouse.ts
  - src/app/api/listings/[id]/pdf/route.ts
  - src/components/Sidebar.tsx
  - docs/0417-old/其他土地_現場必問清單.docx
  - src/lib/document-generator/pdf/dossier-land.ts
  - docs/extracted-dossier-schema.md
  - src/lib/db/index.ts
  - docs/0417-old/不動產說明說15.pdf
  - docs/0417-old/公寓_秘書後補清單.docx
  - src/components/outputs/ShortVideoScript.tsx
  - src/lib/property-types/index.ts
  - src/lib/pdf-generator/templates/dossier.html
  - src/lib/property-types/schemas/rural-land.ts
  - src/app/listings/page.tsx
  - docs/0417-old/不動產說明書13.pdf
  - src/app/listings/[id]/generating/page.tsx
  - docs/0417-old/工業地_現場必問清單.docx
  - src/app/pre-commission/new/page.tsx
tests:
  - src/app/api/__tests__/listings-photos.test.ts
  - src/app/api/__tests__/listings.test.ts
  - src/lib/document-generator/__tests__/generate-regenerate.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
  - src/components/__tests__/Stepper.test.tsx
  - src/lib/codex-client/__tests__/adapters/claude-code.test.ts
  - src/lib/codex-client/__tests__/codex-client.test.ts
  - src/lib/db/__tests__/state-machine.test.ts
  - src/lib/form-renderer/__tests__/supplementary-form.test.ts
  - src/lib/codex-client/__tests__/adapters/ollama.test.ts
  - src/lib/document-generator/__tests__/five-documents.test.ts
  - src/lib/db/__tests__/list-recent.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/lib/document-generator/__tests__/land-type.test.ts
  - src/lib/db/__tests__/e2e-residential.test.ts
  - src/lib/__tests__/cleanup-empty-drafts.test.ts
  - src/lib/__tests__/listing-routes.test.ts
  - src/lib/property-types/__tests__/all-types.test.ts
  - src/lib/db/__tests__/e2e-farmland.test.ts
  - src/lib/property-types/__tests__/index.test.ts
  - src/lib/db/__tests__/listing-workflow.test.ts
  - src/lib/form-renderer/__tests__/field-visit-form.test.ts
  - src/components/forms/__tests__/field-visit-navigation.test.ts
  - src/app/api/__tests__/listings-delete.test.ts
  - src/lib/form-renderer/__tests__/all-property-types.test.ts
  - src/lib/property-types/schemas/__tests__/required-fields.test.ts
-->

---
### Requirement: Form groups fields by chapter, not by layer

UI SHALL group fields into the 8 chapters matching the Jianan field catalog (not the internal 3-layer structure).

#### Scenario: Chapter-based tabs
- **WHEN** form renders
- **THEN** top-level tabs SHALL be: 封面與識別 / 基本資料 / 權利與登記 / 使用與管理 / 停車與設備 / 瑕疵與風險 / 交易條件 / 周遭環境 / 行情與附錄
- **AND** fields from all 3 layers SHALL be merged and sorted into their respective chapter tab

#### Scenario: Progress indicator per chapter
- **WHEN** form renders
- **THEN** each chapter tab SHALL show completion state: ✅ (all required filled) / 🟡 (partial) / ⬜ (empty)


<!-- @trace
source: containerized-three-stage-automation-v3
updated: 2026-04-19
code:
  - src/app/api/listings/[id]/documents/route.ts
  - src/app/listings/new/page.tsx
  - src/app/listings/[id]/documents/page.tsx
  - src/app/api/pre-commission/route.ts
  - docs/0417-old/不動產說明書11.pdf
  - docs/dossier-implementation-spec.md
  - src/app/api/listings/[id]/advance-to-field-visit/route.ts
  - docs/0417-old/其他土地_秘書後補清單.docx
  - src/app/api/pre-commission/[id]/lookup/route.ts
  - src/lib/codex-client/types.ts
  - src/lib/storage/index.ts
  - src/lib/property-types/schemas/farmhouse.ts
  - docs/0417-old/大樓華廈_秘書後補清單.docx
  - docs/0417-old/商業地_秘書後補清單.docx
  - docs/0417-old/店面_現場必問清單.docx
  - src/lib/document-generator/codex-provider.ts
  - src/app/api/listings/route.ts
  - .spectra.yaml
  - src/components/outputs/index.ts
  - docs/handoff/2026-04-17-v3-handoff.md
  - src/app/api/listings/[id]/route.ts
  - next.config.ts
  - docs/0417-old/建物物調表-母版.dot
  - docs/0417-old/商業地_現場必問清單.docx
  - src/lib/document-generator/md/survey.ts
  - docs/0417-old/不動產說明書5.pdf
  - src/lib/property-types/schemas/residential-land.ts
  - docs/0417-old/農地_秘書後補清單.docx
  - src/components/forms/FieldVisitForm.tsx
  - src/lib/codex-client/adapters/ollama.ts
  - src/lib/property-types/schemas/apartment.ts
  - src/components/outputs/SocialPostTabs.tsx
  - docs/0417-old/套房_現場必問清單.docx
  - src/lib/codex-client/adapters/claude-code.ts
  - docs/0417-old/不動產說明書6.pdf
  - docs/0417-old/農舍_現場必問清單.docx
  - docs/0417-old/建地_住宅地_現場必問清單.docx
  - docs/0417-old/不動產說明書14.pdf
  - docs/0417-old/不動產書說明說7.pdf
  - docker/start.sh
  - src/components/Stepper.tsx
  - docs/release-note-v3.0.0.md
  - src/app/page.tsx
  - src/lib/property-types/schemas/highrise.ts
  - docs/0417-old/不動產書說明書10.pdf
  - src/lib/pre-commission/lookup.ts
  - src/lib/codex-client/adapters/gemini.ts
  - docs/0417-old/鄉村區建地_秘書後補清單.docx
  - docs/0417-old/不動產說明書8.pdf
  - src/lib/document-generator/md/dm.ts
  - src/lib/property-types/schemas/commercial-land.ts
  - src/components/forms/navigation-helpers.ts
  - docs/0417-old/農舍_秘書後補清單.docx
  - docker/first-login.sh
  - docs/0417-old/廠房_秘書後補清單.docx
  - src/lib/pdf-generator/templates/dossier.css
  - docs/0417-old/不動產說明說16.pdf
  - src/lib/codex-client/index.ts
  - docs/0417-old/不動產說明書2.pdf
  - src/app/api/listings/[id]/photos/route.ts
  - docker/first-login.bat
  - docs/0417-new/建安不動產欄位總表_建物版.docx
  - src/lib/document-generator/types.ts
  - src/components/outputs/MarketingFlowGuide.tsx
  - docs/0417-old/公寓_現場必問清單.docx
  - src/components/outputs/RegenerateButton.tsx
  - src/lib/property-types/schemas/factory.ts
  - Dockerfile
  - docs/0417-old/店面_秘書後補清單.docx
  - docker/compose.yaml
  - docs/0417-old/土地物調表-母版.docx
  - src/lib/property-types/schemas/other-land.ts
  - docs/0417-old/周遭.pdf
  - docs/0417-old/不動產說明書9.pdf
  - docs/0417-old/不動產說明書3.pdf
  - docs/0417-old/大樓華廈_現場必問清單.docx
  - docs/0417-old/套房_秘書後補清單.docx
  - src/lib/property-types/schemas/suite.ts
  - docker/start.bat
  - package.json
  - vitest.config.ts
  - src/lib/codex-client/adapters/codex.ts
  - docs/dossier-chapter-structure.md
  - docs/0417-old/建地_住宅地_秘書後補清單.docx
  - src/lib/db/list-recent-helper.ts
  - src/app/api/health/route.ts
  - src/lib/form-renderer/index.ts
  - src/app/api/pre-commission/[id]/parse-paste/route.ts
  - src/lib/document-generator/md/listing591.ts
  - src/app/listings/[id]/fill/page.tsx
  - docs/0417-new/建安不動產欄位總表.md
  - docs/0417-old/鄉村區建地_現場必問清單.docx
  - scripts/cleanup-empty-drafts.ts
  - src/app/listings/[id]/supplementary/page.tsx
  - src/lib/form-renderer/chapter-grouper.ts
  - docs/0417-old/廠房_現場必問清單.docx
  - src/app/api/listings/[id]/generate/route.ts
  - docker/安裝說明.md
  - src/lib/property-types/schemas/industrial-land.ts
  - docs/0417-old/不動產說明書4.pdf
  - docs/release-note-v3.md
  - src/lib/db/schema.ts
  - docs/0417-old/不動產說明書1.pdf
  - src/lib/pdf-generator/dossier.ts
  - src/lib/property-types/schemas/shop.ts
  - docs/0417-old/農地_現場必問清單.docx
  - docs/0417-old/透明房價一覽表成交行情.pdf
  - docs/0417-old/不動產說明書12.pdf
  - src/components/forms/SupplementaryForm.tsx
  - docs/0417-old/工業地_秘書後補清單.docx
  - src/app/api/listings/[id]/regenerate/route.ts
  - src/lib/document-generator/md/social.ts
  - docs/0417-new/建安不動產欄位總表_土地版.docx
  - docs/0417-old/透天別墅_現場必問清單.docx
  - src/app/pre-commission/[id]/page.tsx
  - docs/0417-old/透天別墅_秘書後補清單.docx
  - src/lib/document-generator/pdf/dossier-building.ts
  - src/lib/listing-routes.ts
  - src/lib/property-types/schemas/farmland.ts
  - src/lib/property-types/schemas/townhouse.ts
  - src/app/api/listings/[id]/pdf/route.ts
  - src/components/Sidebar.tsx
  - docs/0417-old/其他土地_現場必問清單.docx
  - src/lib/document-generator/pdf/dossier-land.ts
  - docs/extracted-dossier-schema.md
  - src/lib/db/index.ts
  - docs/0417-old/不動產說明說15.pdf
  - docs/0417-old/公寓_秘書後補清單.docx
  - src/components/outputs/ShortVideoScript.tsx
  - src/lib/property-types/index.ts
  - src/lib/pdf-generator/templates/dossier.html
  - src/lib/property-types/schemas/rural-land.ts
  - src/app/listings/page.tsx
  - docs/0417-old/不動產說明書13.pdf
  - src/app/listings/[id]/generating/page.tsx
  - docs/0417-old/工業地_現場必問清單.docx
  - src/app/pre-commission/new/page.tsx
tests:
  - src/app/api/__tests__/listings-photos.test.ts
  - src/app/api/__tests__/listings.test.ts
  - src/lib/document-generator/__tests__/generate-regenerate.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
  - src/components/__tests__/Stepper.test.tsx
  - src/lib/codex-client/__tests__/adapters/claude-code.test.ts
  - src/lib/codex-client/__tests__/codex-client.test.ts
  - src/lib/db/__tests__/state-machine.test.ts
  - src/lib/form-renderer/__tests__/supplementary-form.test.ts
  - src/lib/codex-client/__tests__/adapters/ollama.test.ts
  - src/lib/document-generator/__tests__/five-documents.test.ts
  - src/lib/db/__tests__/list-recent.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/lib/document-generator/__tests__/land-type.test.ts
  - src/lib/db/__tests__/e2e-residential.test.ts
  - src/lib/__tests__/cleanup-empty-drafts.test.ts
  - src/lib/__tests__/listing-routes.test.ts
  - src/lib/property-types/__tests__/all-types.test.ts
  - src/lib/db/__tests__/e2e-farmland.test.ts
  - src/lib/property-types/__tests__/index.test.ts
  - src/lib/db/__tests__/listing-workflow.test.ts
  - src/lib/form-renderer/__tests__/field-visit-form.test.ts
  - src/components/forms/__tests__/field-visit-navigation.test.ts
  - src/app/api/__tests__/listings-delete.test.ts
  - src/lib/form-renderer/__tests__/all-property-types.test.ts
  - src/lib/property-types/schemas/__tests__/required-fields.test.ts
-->

---
### Requirement: Field visual style reflects displayMode

Fields SHALL visually indicate their displayMode.

#### Scenario: Estimate fields are visually distinct
- **WHEN** a field has `displayMode: 'estimate'`
- **THEN** input border SHALL be yellow
- **AND** helper text SHALL show "需估算（可留空）"

#### Scenario: Blank fields show clearly
- **WHEN** a field has `displayMode: 'blank'`
- **THEN** input border SHALL be gray with dashed style
- **AND** helper text SHALL show "留空回填"

<!-- @trace
source: containerized-three-stage-automation-v3
updated: 2026-04-19
code:
  - src/app/api/listings/[id]/documents/route.ts
  - src/app/listings/new/page.tsx
  - src/app/listings/[id]/documents/page.tsx
  - src/app/api/pre-commission/route.ts
  - docs/0417-old/不動產說明書11.pdf
  - docs/dossier-implementation-spec.md
  - src/app/api/listings/[id]/advance-to-field-visit/route.ts
  - docs/0417-old/其他土地_秘書後補清單.docx
  - src/app/api/pre-commission/[id]/lookup/route.ts
  - src/lib/codex-client/types.ts
  - src/lib/storage/index.ts
  - src/lib/property-types/schemas/farmhouse.ts
  - docs/0417-old/大樓華廈_秘書後補清單.docx
  - docs/0417-old/商業地_秘書後補清單.docx
  - docs/0417-old/店面_現場必問清單.docx
  - src/lib/document-generator/codex-provider.ts
  - src/app/api/listings/route.ts
  - .spectra.yaml
  - src/components/outputs/index.ts
  - docs/handoff/2026-04-17-v3-handoff.md
  - src/app/api/listings/[id]/route.ts
  - next.config.ts
  - docs/0417-old/建物物調表-母版.dot
  - docs/0417-old/商業地_現場必問清單.docx
  - src/lib/document-generator/md/survey.ts
  - docs/0417-old/不動產說明書5.pdf
  - src/lib/property-types/schemas/residential-land.ts
  - docs/0417-old/農地_秘書後補清單.docx
  - src/components/forms/FieldVisitForm.tsx
  - src/lib/codex-client/adapters/ollama.ts
  - src/lib/property-types/schemas/apartment.ts
  - src/components/outputs/SocialPostTabs.tsx
  - docs/0417-old/套房_現場必問清單.docx
  - src/lib/codex-client/adapters/claude-code.ts
  - docs/0417-old/不動產說明書6.pdf
  - docs/0417-old/農舍_現場必問清單.docx
  - docs/0417-old/建地_住宅地_現場必問清單.docx
  - docs/0417-old/不動產說明書14.pdf
  - docs/0417-old/不動產書說明說7.pdf
  - docker/start.sh
  - src/components/Stepper.tsx
  - docs/release-note-v3.0.0.md
  - src/app/page.tsx
  - src/lib/property-types/schemas/highrise.ts
  - docs/0417-old/不動產書說明書10.pdf
  - src/lib/pre-commission/lookup.ts
  - src/lib/codex-client/adapters/gemini.ts
  - docs/0417-old/鄉村區建地_秘書後補清單.docx
  - docs/0417-old/不動產說明書8.pdf
  - src/lib/document-generator/md/dm.ts
  - src/lib/property-types/schemas/commercial-land.ts
  - src/components/forms/navigation-helpers.ts
  - docs/0417-old/農舍_秘書後補清單.docx
  - docker/first-login.sh
  - docs/0417-old/廠房_秘書後補清單.docx
  - src/lib/pdf-generator/templates/dossier.css
  - docs/0417-old/不動產說明說16.pdf
  - src/lib/codex-client/index.ts
  - docs/0417-old/不動產說明書2.pdf
  - src/app/api/listings/[id]/photos/route.ts
  - docker/first-login.bat
  - docs/0417-new/建安不動產欄位總表_建物版.docx
  - src/lib/document-generator/types.ts
  - src/components/outputs/MarketingFlowGuide.tsx
  - docs/0417-old/公寓_現場必問清單.docx
  - src/components/outputs/RegenerateButton.tsx
  - src/lib/property-types/schemas/factory.ts
  - Dockerfile
  - docs/0417-old/店面_秘書後補清單.docx
  - docker/compose.yaml
  - docs/0417-old/土地物調表-母版.docx
  - src/lib/property-types/schemas/other-land.ts
  - docs/0417-old/周遭.pdf
  - docs/0417-old/不動產說明書9.pdf
  - docs/0417-old/不動產說明書3.pdf
  - docs/0417-old/大樓華廈_現場必問清單.docx
  - docs/0417-old/套房_秘書後補清單.docx
  - src/lib/property-types/schemas/suite.ts
  - docker/start.bat
  - package.json
  - vitest.config.ts
  - src/lib/codex-client/adapters/codex.ts
  - docs/dossier-chapter-structure.md
  - docs/0417-old/建地_住宅地_秘書後補清單.docx
  - src/lib/db/list-recent-helper.ts
  - src/app/api/health/route.ts
  - src/lib/form-renderer/index.ts
  - src/app/api/pre-commission/[id]/parse-paste/route.ts
  - src/lib/document-generator/md/listing591.ts
  - src/app/listings/[id]/fill/page.tsx
  - docs/0417-new/建安不動產欄位總表.md
  - docs/0417-old/鄉村區建地_現場必問清單.docx
  - scripts/cleanup-empty-drafts.ts
  - src/app/listings/[id]/supplementary/page.tsx
  - src/lib/form-renderer/chapter-grouper.ts
  - docs/0417-old/廠房_現場必問清單.docx
  - src/app/api/listings/[id]/generate/route.ts
  - docker/安裝說明.md
  - src/lib/property-types/schemas/industrial-land.ts
  - docs/0417-old/不動產說明書4.pdf
  - docs/release-note-v3.md
  - src/lib/db/schema.ts
  - docs/0417-old/不動產說明書1.pdf
  - src/lib/pdf-generator/dossier.ts
  - src/lib/property-types/schemas/shop.ts
  - docs/0417-old/農地_現場必問清單.docx
  - docs/0417-old/透明房價一覽表成交行情.pdf
  - docs/0417-old/不動產說明書12.pdf
  - src/components/forms/SupplementaryForm.tsx
  - docs/0417-old/工業地_秘書後補清單.docx
  - src/app/api/listings/[id]/regenerate/route.ts
  - src/lib/document-generator/md/social.ts
  - docs/0417-new/建安不動產欄位總表_土地版.docx
  - docs/0417-old/透天別墅_現場必問清單.docx
  - src/app/pre-commission/[id]/page.tsx
  - docs/0417-old/透天別墅_秘書後補清單.docx
  - src/lib/document-generator/pdf/dossier-building.ts
  - src/lib/listing-routes.ts
  - src/lib/property-types/schemas/farmland.ts
  - src/lib/property-types/schemas/townhouse.ts
  - src/app/api/listings/[id]/pdf/route.ts
  - src/components/Sidebar.tsx
  - docs/0417-old/其他土地_現場必問清單.docx
  - src/lib/document-generator/pdf/dossier-land.ts
  - docs/extracted-dossier-schema.md
  - src/lib/db/index.ts
  - docs/0417-old/不動產說明說15.pdf
  - docs/0417-old/公寓_秘書後補清單.docx
  - src/components/outputs/ShortVideoScript.tsx
  - src/lib/property-types/index.ts
  - src/lib/pdf-generator/templates/dossier.html
  - src/lib/property-types/schemas/rural-land.ts
  - src/app/listings/page.tsx
  - docs/0417-old/不動產說明書13.pdf
  - src/app/listings/[id]/generating/page.tsx
  - docs/0417-old/工業地_現場必問清單.docx
  - src/app/pre-commission/new/page.tsx
tests:
  - src/app/api/__tests__/listings-photos.test.ts
  - src/app/api/__tests__/listings.test.ts
  - src/lib/document-generator/__tests__/generate-regenerate.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
  - src/components/__tests__/Stepper.test.tsx
  - src/lib/codex-client/__tests__/adapters/claude-code.test.ts
  - src/lib/codex-client/__tests__/codex-client.test.ts
  - src/lib/db/__tests__/state-machine.test.ts
  - src/lib/form-renderer/__tests__/supplementary-form.test.ts
  - src/lib/codex-client/__tests__/adapters/ollama.test.ts
  - src/lib/document-generator/__tests__/five-documents.test.ts
  - src/lib/db/__tests__/list-recent.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/lib/document-generator/__tests__/land-type.test.ts
  - src/lib/db/__tests__/e2e-residential.test.ts
  - src/lib/__tests__/cleanup-empty-drafts.test.ts
  - src/lib/__tests__/listing-routes.test.ts
  - src/lib/property-types/__tests__/all-types.test.ts
  - src/lib/db/__tests__/e2e-farmland.test.ts
  - src/lib/property-types/__tests__/index.test.ts
  - src/lib/db/__tests__/listing-workflow.test.ts
  - src/lib/form-renderer/__tests__/field-visit-form.test.ts
  - src/components/forms/__tests__/field-visit-navigation.test.ts
  - src/app/api/__tests__/listings-delete.test.ts
  - src/lib/form-renderer/__tests__/all-property-types.test.ts
  - src/lib/property-types/schemas/__tests__/required-fields.test.ts
-->

---
### Requirement: Field visit form hydrates initial data from existing listing

The field visit form component SHALL accept an optional `initialData?: Record<string, unknown>` prop. WHEN the prop is provided and contains at least one key, the form SHALL populate each field's initial value from `initialData` by coercing values to strings (non-null primitives) or empty string (null/undefined/unsupported types).

The form SHALL perform a one-time hydration when `initialData` first transitions from `undefined` / empty object to a non-empty object (handling asynchronous parent loading). After the first hydration completes, subsequent `initialData` changes SHALL NOT overwrite user input — this SHALL be guarded by an internal `didHydrate` flag.

The property-type selector clear-form effect SHALL only execute when `propertyType` prop is `undefined` (i.e., uncontrolled mode). In controlled mode (parent passes `propertyType`), changing property types SHALL NOT clear the form because controlled mode implies editing an existing listing.

#### Scenario: Load existing listing for edit

- **WHEN** user navigates to `/listings/{id}/fill` for a listing whose `field_visit_data` contains `{"address": "台南市中西區民族路三段191號", "price": "500"}`
- **THEN** the `物件地址` field SHALL display `台南市中西區民族路三段191號`
- **THEN** the `委託總價` field SHALL display `500`

#### Scenario: Hydrate only once

- **WHEN** the form has been hydrated from `initialData` and the user has edited the `物件地址` field to `新地址`
- **WHEN** the parent component re-fetches and passes a new `initialData` object with the original address
- **THEN** the `物件地址` field SHALL continue to display `新地址` (user input preserved, no re-hydration)

#### Scenario: Empty initial data

- **WHEN** `initialData` is `undefined` or `{}`
- **THEN** the form SHALL render with all fields empty
- **THEN** no hydration effect SHALL occur


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
### Requirement: Chapter navigation badge shows full-field completion with required indicator

Each chapter-navigation tab button SHALL display a badge with the format `filled/total` where `filled` counts all fields (required and non-required) whose trimmed string value is non-empty, and `total` counts all fields in the chapter (required and non-required).

The badge SHALL apply visual states based on completion:
- All fields filled (`filled === total`) → green background with checkmark icon
- Required fields all filled but non-required remain (`filledRequired === totalRequired && filled < total`) → amber background
- At least one required field unfilled (`filledRequired < totalRequired`) → gray background WITH a red dot indicator (width 8px, height 8px, background `#EF4444`, circular) overlaid at the top-right corner of the badge

#### Scenario: Chapter with required fields unfilled

- **WHEN** a chapter has 2 required fields (1 filled) and 3 non-required fields (2 filled)
- **THEN** the tab badge SHALL display `3/5` on a gray background
- **THEN** a red dot SHALL appear at the top-right of the badge

#### Scenario: Chapter with all required filled, some non-required empty

- **WHEN** a chapter has 2 required fields (both filled) and 3 non-required fields (1 filled)
- **THEN** the tab badge SHALL display `3/5` on an amber background
- **THEN** no red dot SHALL appear

#### Scenario: Chapter fully completed

- **WHEN** a chapter has 2 required fields (both filled) and 3 non-required fields (all filled)
- **THEN** the tab badge SHALL display `5/5` on a green background with a checkmark icon


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
### Requirement: Submit button remains clickable and validation errors jump to incomplete chapter

The form submission button on the `/listings/[id]/fill` page SHALL remain clickable at all times except when an in-flight save request is pending (`submitting === true`). Removing the `!isComplete` disabling condition SHALL be required.

WHEN the user clicks the submit button and the form has at least one required field unfilled, the system SHALL:
1. Prevent the save API call from being dispatched.
2. Locate the first chapter (in chapter order) whose `filledRequired < totalRequired` and set it as the active chapter.
3. Apply a `highlight-missing` visual state to every unfilled required field in that chapter (red border and red helper text `此欄位必填`).
4. Display a banner at the top of the form content reading `尚有 N 個必填欄位未完成，已為您跳至「章節 X」` where `N` is the total count of unfilled required fields across all chapters and `X` is the title of the active chapter.

WHEN the user clicks the submit button and all required fields are filled, the system SHALL dispatch the save API call as before (`POST /api/listings/{id}/field-visit` returning HTTP 200 on success).

The banner SHALL automatically dismiss when the user fills all required fields in the highlighted chapter OR when the user manually clicks a close button on the banner.

#### Scenario: Click submit with incomplete required fields

- **WHEN** the form has required fields unfilled in chapter 2
- **WHEN** user clicks the `儲存並前往補件` button
- **THEN** the button SHALL NOT be disabled (not grayed out before click)
- **THEN** no `POST /api/listings/{id}/field-visit` request SHALL be sent
- **THEN** the active chapter SHALL change to chapter 2
- **THEN** the unfilled required fields in chapter 2 SHALL display red borders
- **THEN** a banner SHALL display with the format `尚有 {N} 個必填欄位未完成，已為您跳至「{chapterTitle}」`

#### Scenario: Click submit with all required fields filled

- **WHEN** all required fields across all chapters are filled
- **WHEN** user clicks the `儲存並前往補件` button
- **THEN** `POST /api/listings/{id}/field-visit` SHALL be dispatched with the form payload
- **THEN** HTTP 200 response SHALL trigger navigation to `/listings/{id}/supplementary`

#### Scenario: Banner auto-dismiss when fields are filled

- **WHEN** the validation banner is visible due to unfilled required fields
- **WHEN** user fills in all required fields in the highlighted chapter
- **THEN** the banner SHALL automatically disappear without user interaction

#### Scenario: Submit button during save

- **WHEN** a save request is in flight (`submitting === true`)
- **THEN** the submit button SHALL be disabled with `cursor-not-allowed` and display `儲存中...` text

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