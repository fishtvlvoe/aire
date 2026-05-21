# Page Contract: house.land_display

Date: 2026-05-20

Status: Draft for Fish review

## Purpose

`house.land_display` defines the house-version disclosure page for `二、【土地標示】`.

Reference page:

- `0520/不動產說明書/4.JPG`

This page is registry-heavy. It should pull from local MOI/COP registry payloads where available, but must still support manual editing and blank draft output for handwriting.

## References

| Reference | Path | Use |
| --- | --- | --- |
| Page image | `0520/不動產說明書/4.JPG` | Visual layout and field order. |
| Property-rights page | `artifacts/page-contract-house-property-rights.md` | Previous page and shared header/top workflow. |
| Source inventory | `artifacts/house-building-source-inventory.md` | House-level source matrix and API candidates. |
| API audit | `artifacts/source-api-gap-audit.md` | MOI/COP endpoint and backend wiring gaps. |
| 105 official land reference | `0520/不動產說明書/20-(105-04-29)成屋不動產說明書格式範例.pdf` | Confirms land/base fields: location, area, rights scope, cadastral attachment. |

## Observed Page Structure

From `4.JPG`:

```text
Header:
  建安不動產 logo/name
  物件編號
  物件名稱

Title:
  二、【土地標示】

Note:
  以下記載事項如有未詳盡者，依地政機關登記簿謄本所記載為準
  m2 = 0.3025坪

Land table:
  地段
  地號
  所有權人
  登記日期
  使用分區
  總面積
  權利範圍
  持分面積

Repeated rows:
  土地登記原因

Legal/default notes:
  法定建蔽率
  法定容積率
  開發方式限制

Rights / encumbrance summary:
  管理人
  所有權人姓名
  權利種類
  土地他項權利
  共同擔保建號
  共同擔保地號

Footer:
  hard-coded page count appears in reference image, but MVP draft should not hard-code page count
```

## User Workflow

```text
Case Setup
  ↓
Enter land section / land number
  ↓
Registry pull, if available
  ↓
Draft Disclosure Workbench
  left: land-display fields and registry-source status
  right: official-style land-display preview
  ↓
Print blank/partial draft for owner discussion
  ↓
Formal Supplement Workbench
  correct registry display or fill handwritten notes
  ↓
Final PDF export
```

## Layout Contract

MVP visual direction:

- Use the old/conservative PDF style.
- Keep `二、【土地標示】` as a formal table page.
- Support multiple land rows.
- Keep enough blank row space for handwriting.
- Do not show `待補`.
- Do not hard-code page number/page count in draft output.

Required visual zones:

1. Header row with property id/name and company mark.
2. Page title `二、【土地標示】`.
3. Registry basis note and square-meter-to-ping conversion note.
4. Land parcel table.
5. Land registration reason rows.
6. Legal/default notes for building coverage ratio, floor area ratio, and development restrictions.
7. Rights / encumbrance summary.
8. Optional final-export page number only if final mode later enables dynamic numbering.

## Field Contract

| Field key | Label | Type | Required | Primary source | Manual fallback / override | Target storage | Preview/PDF slot | Missing behavior | Entitlement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `land_display.case_no` | 物件編號 | text | yes | `cases.case_no` | Case Setup | `cases` | Header | Blank/checklist warning | Basic |
| `land_display.case_name` | 物件名稱 | text | yes | `cases.case_name` | Case Setup | `cases` | Header | Blank/checklist warning | Basic |
| `land_display.registry_basis_note` | 謄本依據說明 | text | no | Template | Manual override | `disclosure_drafts` | Note under title | Default phrase or blank | Basic |
| `land_display.area_conversion_note` | 面積換算說明 | text | no | Template | Manual override | `disclosure_drafts` | Note under title | Default `m2 = 0.3025坪` | Basic |
| `land_display.parcels[].section_name` | 地段 | text | yes | 土地標示 API | Manual | `registry_payloads`, `disclosure_drafts` | Land table | Blank | Basic registry/manual |
| `land_display.parcels[].land_no` | 地號 | text | yes | 土地標示 API / Case Setup | Manual | `registry_payloads`, `disclosure_drafts` | Land table | Blank | Basic registry/manual |
| `land_display.parcels[].owner_name_masked` | 所有權人 | text | no | 土地所有權 API | Manual masked display | `registry_payloads`, `disclosure_drafts` | Land table | Blank | Basic registry/manual |
| `land_display.parcels[].registration_date` | 登記日期 | date/text | no | 土地所有權 API | Manual | `registry_payloads`, `disclosure_drafts` | Land table | Blank | Basic registry/manual |
| `land_display.parcels[].zoning` | 使用分區 | text | no | 土地標示/使用分區 source | Manual | `registry_payloads`, `disclosure_drafts` | Land table | Blank | Basic registry/manual |
| `land_display.parcels[].total_area_m2` | 總面積 | number/text | no | 土地標示 API | Manual | `registry_payloads`, `disclosure_drafts` | Land table | Blank | Basic registry/manual |
| `land_display.parcels[].right_scope` | 權利範圍 | text | no | 土地所有權 API | Manual | `registry_payloads`, `disclosure_drafts` | Land table | Blank | Basic registry/manual |
| `land_display.parcels[].share_area_m2` | 持分面積 | number/text | no | Calculated/API | Manual | `registry_payloads`, `disclosure_drafts` | Land table | Blank | Basic registry/manual |
| `land_display.parcels[].registration_reason` | 土地登記原因 | text | no | 土地所有權 API | Manual | `registry_payloads`, `disclosure_drafts` | Reason rows | Blank writable line | Basic |
| `land_display.building_coverage_ratio_note` | 法定建蔽率 | textarea | no | Template / zoning data | Manual | `disclosure_drafts` | Legal/default notes | Default phrase | Basic |
| `land_display.floor_area_ratio_note` | 法定容積率 | textarea | no | Template / zoning data | Manual | `disclosure_drafts` | Legal/default notes | Default phrase | Basic |
| `land_display.development_restriction_note` | 開發方式限制 | textarea | no | Template / zoning data | Manual | `disclosure_drafts` | Legal/default notes | Default phrase | Basic |
| `land_display.manager_name` | 管理人 | text | no | Registry if present | Manual | `registry_payloads`, `disclosure_drafts` | Rights summary | Blank | Basic |
| `land_display.owner_name_summary` | 所有權人姓名 | text | no | 土地所有權 API | Manual masked display | `registry_payloads`, `disclosure_drafts` | Rights summary | Blank | Basic |
| `land_display.right_type` | 權利種類 | text | no | 土地他項權利 API | Manual | `registry_payloads`, `disclosure_drafts` | Rights summary | Blank | Basic |
| `land_display.other_rights_note` | 土地他項權利 | textarea | no | 土地他項權利 API | Manual | `registry_payloads`, `disclosure_drafts` | Rights summary | Blank | Basic |
| `land_display.collateral_building_no` | 共同擔保建號 | text | no | 土地他項權利 API | Manual | `registry_payloads`, `disclosure_drafts` | Rights summary | Blank | Basic |
| `land_display.collateral_land_no` | 共同擔保地號 | text | no | 土地他項權利 API | Manual | `registry_payloads`, `disclosure_drafts` | Rights summary | Blank | Basic |

## COP/MOI API Mapping

| Field group | AIRE api id | MOI/COP source | Endpoint | Status |
| --- | --- | --- | --- | --- |
| Land display/area | `land_registry` | `MOI_API_001 地籍土地標示部資料服務` | `/LandDescription/1.0/QueryByLandNo` | Existing wrapper. |
| Land owner / right scope | `co_owners` naming currently | `MOI_API_002 地籍土地所有權部資料服務` | `/LandOwnership/1.0/QueryByLimit` | Existing wrapper, naming should be clarified. |
| Land other rights / mortgage | `mortgages` | `MOI_API_003 地籍土地他項權利部資料服務` | `/LandOtherRights/1.0/QueryByLimit` | Existing wrapper. |
| Zoning / land value | `zoning`, `land_value` | `MOI_API_001` / `MOI_API_014` candidate | verify exact mapping | Existing partial; clarify before relying on auto values. |
| Cadastral map | future `cadastral_map` | `MOI_WFS_001`, `MOI_WMS_002`, `MOI_API_023`, `MOI_API_024` | WFS/WMS/API | Not for this page's MVP table; image/page slot later. |

Backend prerequisites before using automation:

- COP token endpoint and base URL must be wired.
- Registry payload must persist locally.
- Manual fallback is required for every API-derived field.

## Storage Contract

Current storage candidates:

- `cases.case_no`
- `cases.case_name`
- `cases.land_lot_no`
- `disclosure_drafts.payload_json`
- future/required: durable `registry_payloads` or equivalent local vault table

Target `disclosure_drafts.payload_json` shape:

```json
{
  "page_contract_version": 1,
  "land_display": {
    "registry_basis_note": "以下記載事項如有未詳盡者，依地政機關登記簿謄本所記載為準",
    "area_conversion_note": "m2 = 0.3025坪",
    "parcels": [
      {
        "section_name": "公英段",
        "land_no": "0008",
        "owner_name_masked": "施**",
        "registration_date": "民國86年12月24日",
        "zoning": "",
        "total_area_m2": "70.816",
        "right_scope": "10000000/4662",
        "share_area_m2": "33.01",
        "registration_reason": "買賣"
      }
    ],
    "building_coverage_ratio_note": "本案已開發建築，若買方欲增建、改建時，仍須依中央或各地方政府之都市計畫法或區域計畫法之非都市或都市土地使用分區管制規則，最新建蔽率規定為準。",
    "floor_area_ratio_note": "本案已開發建築，若買方欲增建、改建時，仍須依中央或各地方政府之都市計畫法或區域計畫法之非都市或都市土地使用分區管制規則，最新容積率規定為準。",
    "development_restriction_note": "本案已開發建築，若買方欲增建、改建時，仍須依都市計畫法、建築法規等相關規定辦理。",
    "manager_name": "",
    "owner_name_summary": "",
    "right_type": "",
    "other_rights_note": "",
    "collateral_building_no": "",
    "collateral_land_no": ""
  }
}
```

Registry payload should remain a raw local snapshot. Display values in `disclosure_drafts` are for user override/export snapshot only.

## Default Template Text Rules

The legal/default notes on this page can start with the reference text because they are broad conservative notices.

Controls:

```text
法定建蔽率: [使用預設文字] [自行填寫] [留白]
法定容積率: [使用預設文字] [自行填寫] [留白]
開發方式限制: [使用預設文字] [自行填寫] [留白]
```

Rules:

- Default mode prints the conservative phrase.
- Manual mode prints the user's text.
- Blank mode prints writable blank space.
- Do not print `待補`.

## Preview Contract

Right-side preview payload:

```ts
interface HouseLandDisplayPreviewPayload {
  caseNo: string;
  caseName: string;
  companyName?: string;
  logoDataUrl?: string | null;
  registryBasisNote: string;
  areaConversionNote: string;
  parcels: Array<{
    sectionName: string;
    landNo: string;
    ownerNameMasked: string;
    registrationDate: string;
    zoning: string;
    totalAreaM2: string;
    rightScope: string;
    shareAreaM2: string;
    registrationReason: string;
  }>;
  buildingCoverageRatioNote: string;
  floorAreaRatioNote: string;
  developmentRestrictionNote: string;
  managerName: string;
  ownerNameSummary: string;
  rightType: string;
  otherRightsNote: string;
  collateralBuildingNo: string;
  collateralLandNo: string;
  draftMode: boolean;
  showPageNumber: boolean;
}
```

Preview requirements:

- A4 portrait.
- Old/conservative PDF style.
- Missing values render as blank writable space.
- No `待補`.
- No hard-coded page count in draft mode.
- Multiple parcels must not overflow table text; if rows exceed one page, allow dynamic continuation.

## PDF Contract

PDF export must use the same normalized payload as the HTML/right-side preview.

Font requirements:

- PDF must use embedded/registerd Traditional Chinese capable font.
- Every PDF export path must call `initReactPdfEngine()` before rendering with `@react-pdf/renderer`.
- Renderer must not rely on browser CSS fonts for PDF output.
- Add verification with Chinese sample text from this page:
  - `二、【土地標示】`
  - `以下記載事項如有未詳盡者`
  - `法定建蔽率`
  - `共同擔保建號`

## UI Contract

Workbench surface:

```text
Draft Disclosure
  Page list: 土地標示

  Left panel:
    Registry source status
    Parcel table editor
    Legal/default note controls
    Rights / encumbrance summary
    Missing-field checklist

  Right panel:
    Official-style 土地標示 preview
```

Editable here:

- land parcel rows
- registration reason rows
- building coverage / floor area / development restriction notes
- manager / owner summary
- right type
- land other rights note
- collateral building/land numbers

Edit elsewhere:

- case number/name: Case Setup
- company/logo: Branding Settings
- raw registry payload: not directly edited; user edits derived display fields

## Entitlement Contract

Current build direction:

- Build the complete/highest-capability disclosure workflow first.
- Do not block this Page Contract on Basic/Pro packaging.

MVP behavior:

- Manual fields available.
- Registry pull available if part of the launch scope.
- Missing data renders blank.
- Can print draft and final output.

Future entitlement behavior:

```text
Plan gates automation buttons.
Plan does not remove legal/manual fields from the document.
```

## Validation Rules

Draft mode:

- No hard blocking required except case existence.
- Missing values are allowed and render blank.
- Checklist should show missing recommended fields outside the printable body.

Final mode:

- Warn if no land parcel row exists.
- Warn if land number or section blank.
- Warn if right scope blank.
- Warn if registry source says data pulled but not persisted.

Do not block final export until legal review decides which fields are hard-blocking.

## Page Number Rule

- Draft mode: no hard-coded `第 X 頁 / 共 Y 頁`.
- Final mode: dynamic numbering may be added later after all inserts/attachments are assembled.
- The source image's `第 4 頁 / 共 9 頁` must not be copied as static text.

## Acceptance Criteria

- Page Contract maps visible fields from `4.JPG`.
- Missing fields render blank in preview/PDF.
- The page supports multiple land parcel rows.
- The page can be printed and handwritten.
- Existing `NotoSansTC` font initialization is required in all PDF paths.
- The contract separates raw registry payload from user-edited display/export values.
- PDF and preview consume one normalized payload.
- No property data is uploaded to AIRE Cloud.

## Implementation Notes

Potential reusable modules:

- `src/lib/pdf-engine/react-pdf-init.ts`
- `src/components/PullParcelDataButton.tsx`
- existing land registry pull commands in `src-tauri/src/land_registry`

Likely new/changed modules later:

- `src/lib/page-contracts/house-land-display.ts`
- `src/components/disclosure-workbench/HouseLandDisplayPanel.tsx`
- `src/components/disclosure-workbench/HouseLandDisplayPreview.tsx`
- `src/lib/pdf-engine/normalize-house-land-display.ts`
- `src/lib/pdf-blocks/house-land-display-page.tsx`

## Open Questions For Fish

1. Confirm whether the legal/default notes should always appear, or only appear when data exists.
2. Confirm whether `總面積` / `持分面積` should display square meters only, or both square meters and converted pings.
3. Confirm whether `土地他項權利` should stay in this page summary, or later move to a separate rights/risk page if it becomes too long.
