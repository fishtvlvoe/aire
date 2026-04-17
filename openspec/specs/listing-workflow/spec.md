# listing-workflow

## Purpose

Defines the state machine and lifecycle for real estate listings in the three-stage workflow system.

## Requirements

### Requirement: Listing status machine supports 13 property types

The listing status machine SHALL support the property_type field accepting any of the 13 registered type identifiers.

The DB column `property_type` SHALL use TEXT type (not a restricted enum) to allow future type additions without migration. The application layer SHALL validate against the registered type list.

Status flow remains unchanged:
`draft` → `field-visit-complete` → `ready-for-generation` → `documents-ready`

#### Scenario: Create listing with farmland type

- **WHEN** a POST request is made to `/api/listings` with `property_type: "farmland"`
- **THEN** the system SHALL create a listing with status `draft`

#### Scenario: Reject unavailable type

- **WHEN** a POST request is made with `property_type: "storefront"` (not yet implemented)
- **THEN** the system SHALL return 422 with error `type-not-available`

#### Scenario: Reject unknown type

- **WHEN** a POST request is made with `property_type: "unknown-type"`
- **THEN** the system SHALL return 422 with error `invalid-property-type`

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