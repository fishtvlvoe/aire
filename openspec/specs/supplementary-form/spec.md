# supplementary-form Specification

## Purpose

TBD - created by archiving change 'three-stage-listing-workflow-v2'. Update Purpose after archive.

## Requirements

### Requirement: Supplementary form renders fields for secretary to complete

The system SHALL render a supplementary data form in Tab 3 of the fill form page. This form is intended for secretary use after the business visits the property.

The form SHALL show different fields based on the property category:

**Building category common fields** (公寓/大樓/套房/透天/店面/廠房/農舍):
- 建號
- 權狀坪數（主建物/附屬建物/共有部分）
- 地號/建號核對
- 他項權利
- 樓層/總樓層核對
- 法定用途核對
- 建築完成日期核對
- 增建/頂加/外推/夾層範圍整理
- 租客/租期/押金/可否提前交付核對
- 合約書條件核對
- 照片命名整理
- 591/DM/FB/說明書一致性檢核

**Land category common fields** (農地/建地/商業地/工業地/鄉村/其他):
- 土地謄本標示部
- 土地謄本所有權部
- 土地謄本他項權利部
- 地籍圖對照
- 使用分區圖
- 國土或都計資料
- 公告現值
- 公告地價
- 歷史實登或行情
- 法規限制
- 權利與地號核對
- 地圖與照片整理

#### Scenario: Secretary opens supplementary tab for apartment

- **WHEN** secretary opens Tab 3 for an `apartment` listing
- **THEN** the system SHALL show building common supplementary fields including 建號 and 權狀坪數

#### Scenario: Secretary opens supplementary tab for farmland

- **WHEN** secretary opens Tab 3 for a `farmland` listing
- **THEN** the system SHALL show land common supplementary fields including 公告現值 and 法規限制
- **THEN** the system SHALL also show farmland type-specific supplementary fields: 農牧用地或地目核對、農舍可否、農用限制、套繪/分割限制


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
### Requirement: Type-specific supplementary fields append after category common

The system SHALL append type-specific supplementary fields after the category common fields in Tab 3.

Type-specific supplementary fields per implemented type:
- `farmland`: 農牧用地或地目核對、特定/一般農業區核對、農舍可否、農用限制、套繪/分割限制、農路/灌溉/排水法規、周邊實登/行情
- `townhouse`: 騎樓/車庫/夾層/頂夾範圍核對、樓層用途分配與照片整理、臨路/巷寬/角地資料核對
- `apartment`: 頂加/鐵皮/外推/違建/夾層範圍核對、樓梯間與公共空間照片整理、共管/管委資料核對
- `highrise`: 總戶數/公設比/管理費核對、車位權屬與獨立性核對、社區公設與集中收包裹資訊整理
- `residential-land`: 建蔽率、容積率、建築線核對、套繪/分割/合併限制、使用分區法規、道路退縮規定
- `farmhouse`: 合法農舍與土地建物權屬核對、農用資格/農用限制整理、農路/供水/供電/灌排資訊核對

#### Scenario: Farmland type-specific supplementary fields

- **WHEN** secretary views Tab 3 for a `farmland` listing
- **THEN** 農舍可否 and 農用限制 fields SHALL appear after the land common fields


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
### Requirement: Supplementary data saves as structured JSON

The system SHALL save supplementary form data as JSON to `supplementary_data` column with structure:
```json
{
  "building": { ... },     // only for building types
  "land": { ... },         // only for land types
  "type_specific": { ... }
}
```

Saving supplementary data SHALL advance listing status from `field-visit-complete` to `ready-for-generation`.

#### Scenario: Save supplementary data for townhouse

- **WHEN** secretary submits Tab 3 for a `townhouse` listing
- **THEN** supplementary_data SHALL contain `building` and `type_specific` keys
- **THEN** listing status SHALL advance to `ready-for-generation`

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
### Requirement: Supplementary form renders secretary fields for all 13 types

The supplementary form SHALL support 13 property types with their `sourceType: 'secretary'` fields.

#### Scenario: Secretary fields auto-filtered
- **WHEN** secretary opens `/listings/[id]/supplementary` for any property type
- **THEN** form SHALL show ONLY fields with `sourceType: 'secretary'` or `sourceType: 'public-data'`
- **AND** fields with `sourceType: 'onsite'` or `'deed'` SHALL be read-only reference


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
### Requirement: Pre-commission data is visible as reference

Fields populated in pre-commission stage SHALL be visible (read-only) in the supplementary form for context.

#### Scenario: Pre-commission public data shown
- **WHEN** supplementary form opens
- **THEN** a collapsible "委託前已查資料" section SHALL show all fields populated in pre-commission stage
- **AND** section SHALL be read-only in supplementary view
- **AND** secretary CAN navigate back to pre-commission to edit if needed

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
### Requirement: grouped-optional-field-sections

The supplementary form page SHALL display four collapsible sections for the new optional fields: 身份資訊, 交易資訊, 建物補充, 周遭機能.

#### Scenario: optional sections are collapsed by default

- **WHEN** the user opens the supplementary form page
- **THEN** the four new sections are collapsed by default; the user can expand any section to reveal and fill the fields


<!-- @trace
source: disclosure-complete-and-fillable
updated: 2026-05-03
code:
  - three-ai.db
  - src/lib/pdf-generator/dossier.ts
  - kimi-usage-ux-issue-body.md
  - src/lib/document-generator/build-input.ts
  - src/lib/pdf-generator/templates/dossier.html
  - src/lib/schemas/supplementary-schema.ts
  - src/app/api/listings/[id]/pdf/route.ts
  - src/lib/document-generator/tax-calculator.ts
  - src/app/listings/[id]/supplementary/page.tsx
  - package.json
  - src/lib/document-generator/pdf/dossier-building.ts
  - src/lib/document-generator/pdf/acroform-overlay.ts
tests:
  - src/lib/document-generator/__tests__/tax-calculator.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/lib/document-generator/__tests__/acroform-overlay.test.ts
-->

---
### Requirement: sale-price-in-wan-unit

The sale_price_text field in the form SHALL be labeled "成交價（萬元）" and accept numeric input representing units of 萬 (10,000 NTD). The stored value SHALL be the text string as-is; the conversion to NTD is performed at tax-calculation time.

#### Scenario: sale price input

- **WHEN** the user enters "800" in the 成交價（萬元）field and saves
- **THEN** supplementary_data.sale_price_text = "800", and tax-calculator converts this to 8,000,000 NTD for computation

<!-- @trace
source: disclosure-complete-and-fillable
updated: 2026-05-03
code:
  - three-ai.db
  - src/lib/pdf-generator/dossier.ts
  - kimi-usage-ux-issue-body.md
  - src/lib/document-generator/build-input.ts
  - src/lib/pdf-generator/templates/dossier.html
  - src/lib/schemas/supplementary-schema.ts
  - src/app/api/listings/[id]/pdf/route.ts
  - src/lib/document-generator/tax-calculator.ts
  - src/app/listings/[id]/supplementary/page.tsx
  - package.json
  - src/lib/document-generator/pdf/dossier-building.ts
  - src/lib/document-generator/pdf/acroform-overlay.ts
tests:
  - src/lib/document-generator/__tests__/tax-calculator.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/lib/document-generator/__tests__/acroform-overlay.test.ts
-->

---
### Requirement: Supplementary form accessible via independent route

The supplementary form SHALL be accessible at /listings/[id]/supplement as a standalone page, no longer embedded within the listing creation flow.

#### Scenario: Standalone page rendering

- **WHEN** user navigates to /listings/5/supplement
- **THEN** the full supplementary form SHALL render with all fields for listing #5
- **THEN** a "返回列表" navigation link SHALL be present

#### Scenario: Form submission returns to list

- **WHEN** user completes and saves the supplementary form
- **THEN** user SHALL be redirected back to the listings page

##### Example: Redirect after save

- **GIVEN** user is on /listings/5/supplement
- **WHEN** user fills all fields and clicks "儲存"
- **THEN** browser SHALL navigate to /listings

<!-- @trace
source: supplementary-independence
updated: 2026-05-04
code:
  - src/lib/listings/supplementary-status.ts
  - src/app/listings/page.tsx
  - package.json
  - src/components/listings/SupplementStatusIcon.tsx
  - src/app/api/listings/[id]/restore/route.ts
  - src/app/api/listings/[id]/archive/route.ts
  - src/app/listings/[id]/generating/page.tsx
  - src/app/api/admin/users/[id]/reset-password/route.ts
  - src/app/admin/transfer/page.tsx
  - src/lib/db/schema.ts
  - src/lib/generators/disclaimer.ts
  - src/app/listings/[id]/supplementary/page.tsx
  - src/app/login/page.tsx
  - src/components/FolderSidebar.tsx
  - src/app/api/listings/[id]/route.ts
  - src/proxy.ts
  - src/app/admin/users/page.tsx
  - src/app/api/listings/route.ts
  - src/app/listings/[id]/documents/page.tsx
  - src/components/Stepper.tsx
  - src/app/api/admin/audit-logs/route.ts
  - src/lib/db/list-recent-helper.ts
  - src/lib/pdf-generator/dossier.ts
  - src/app/admin/audit-logs/page.tsx
  - src/lib/audit.ts
  - src/app/listings/[id]/fill/page.tsx
  - src/lib/pdf-generator/survey-sales.ts
  - src/app/api/listings/folders/[id]/route.ts
  - src/lib/generators/disclosure-document.ts
  - src/app/listings/[id]/supplement/page.tsx
  - src/lib/auth.ts
  - src/lib/db/index.ts
  - src/app/api/auth/login/route.ts
  - src/components/SearchBar.tsx
  - src/app/api/admin/transfer-cases/route.ts
  - src/lib/generators/property-sheet.ts
  - src/app/api/listings/[id]/folder/route.ts
  - src/app/api/listings/folders/route.ts
  - src/app/api/admin/users/[id]/disable/route.ts
  - src/app/api/admin/users/route.ts
  - src/app/api/auth/logout/route.ts
tests:
  - e2e/user-management.spec.ts
  - src/components/__tests__/Stepper.test.tsx
  - e2e/listing-ux.spec.ts
-->