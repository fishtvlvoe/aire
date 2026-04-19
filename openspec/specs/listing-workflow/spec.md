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

---
### Requirement: Listing state machine supports pre-commission stage

The listing workflow SHALL add a new initial state `pre-commission` before `draft` to represent the pre-signing data-collection phase.

#### Scenario: New listing starts in pre-commission
- **WHEN** agent creates a new listing via `/pre-commission/new`
- **THEN** listing state SHALL be `pre-commission`
- **AND** only owner contact and property identifier fields SHALL be required

#### Scenario: State progression
- **WHEN** listing advances through the workflow
- **THEN** state SHALL transition in order: `pre-commission` → `field-visit` → `field-visit-complete` → `ready-for-generation` → `documents-ready`
- **AND** each transition SHALL require the prior state's required fields to be filled


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
### Requirement: Workflow rejects invalid transitions

The state machine SHALL prevent skipping states.

#### Scenario: Cannot skip to documents-ready
- **WHEN** code attempts to transition a listing from `pre-commission` directly to `documents-ready`
- **THEN** transition SHALL be rejected with error `invalid-state-transition`
- **AND** listing state SHALL remain unchanged

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
### Requirement: Listings support hard delete via DELETE API

The system SHALL expose an endpoint to hard delete a listing by id, removing the row from the `listings` table without soft-delete semantics.

#### Scenario: Delete existing listing

- **WHEN** a client sends `DELETE /api/listings/{id}` for an existing listing id
- **THEN** the system SHALL execute `DELETE FROM listings WHERE id = ?`
- **AND** the system SHALL return HTTP 200 with an empty or `{ success: true }` body
- **AND** subsequent `GET /api/listings/{id}` requests SHALL return HTTP 404

#### Scenario: Delete non-existent listing

- **WHEN** a client sends `DELETE /api/listings/{id}` for an id that does not exist
- **THEN** the system SHALL return HTTP 404 with body `{ error: "not found" }`

#### Scenario: Delete listing with foreign key references

- **WHEN** a client deletes a listing that has related rows in other tables via foreign keys
- **THEN** the system SHALL cascade the delete to related rows OR return HTTP 409 with a descriptive error
- **AND** the chosen behavior SHALL be consistent and documented in the implementation comments


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
### Requirement: Listing status remains unchanged when middle-stage fields are edited after documents are generated

The `listing.status` field SHALL NOT be automatically downgraded when a user edits `field_visit_data` or `supplementary_data` after `status` has reached `documents-ready`.

#### Scenario: Edit field_visit_data on documents-ready listing

- **WHEN** a user navigates to `/listings/{id}/fill` for a listing with status `documents-ready` and updates a field via the existing field-visit form save flow
- **THEN** the system SHALL persist the updated `field_visit_data`
- **AND** the system SHALL keep `listing.status` equal to `documents-ready`
- **AND** the `generated_documents` column SHALL remain unchanged

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