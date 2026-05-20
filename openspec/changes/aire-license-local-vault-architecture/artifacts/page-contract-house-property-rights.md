# Page Contract: house.property_rights

Date: 2026-05-20

Status: Draft for Fish review

## Purpose

`house.property_rights` defines the first core house-version disclosure page after the cover.

Reference page:

- `0520/不動產說明書/3-2+3.JPG`

This page starts the formal disclosure body and contains the first `壹、產權調查表` content. It must support the draft/handwriting workflow and later formal supplement editing.

## References

| Reference | Path | Use |
| --- | --- | --- |
| Page image | `0520/不動產說明書/3-2+3.JPG` | Visual layout and field order. |
| Next page image | `0520/不動產說明書/4.JPG` | Checked for duplicate ownership; it is `土地標示`, not detailed `建物標示`. |
| Optional marketing sheet | `0520/不動產說明書/2-1-房屋-不一定要.JPG.JPG` | Contains building/area marketing summary, but is not the formal disclosure section owner. |
| 105 official format | `0520/不動產說明書/20-(105-04-29)成屋不動產說明書格式範例.pdf` | Confirms 成屋 disclosure should include `建物標示、權利範圍及用途`. |
| Field master | `docs/0417-new/建安不動產欄位總表.md`, `docs/0417-new/建安不動產欄位總表_建物版.docx` | Canonical field names and source priority. |
| Highrise field visit | `docs/0417-old/大樓華廈_現場必問清單.docx` | Manual field visit source for price, address, use, floor, management, etc. |
| Highrise secretary supplement | `docs/0417-old/大樓華廈_秘書後補清單.docx` | Back-office source for building number, areas, rights, legal use, completion date. |
| API audit | `artifacts/source-api-gap-audit.md` | MOI/COP service availability and backend gaps. |
| Source inventory | `artifacts/house-building-source-inventory.md` | House-level source matrix. |

## Observed Page Structure

From `3-2+3.JPG`:

```text
Header:
  建安不動產 logo/name
  物件編號
  物件名稱

Title:
  壹、產權調查表

Top facts:
  土地坐落
  交易種類
  交易價金
  附贈設備
  付款方式

First body section:
  一、【建物標示】略

Footer:
  hard-coded page count appears in reference image, but MVP draft should not hard-code page count
```

The scanned page also faintly shows deeper content/signature rows from the reverse/other side; do not use those faint bleed-through marks as layout source.

Resume check conclusion on 2026-05-20:

- `4.JPG` is `二、【土地標示】`, so it does not own detailed `建物標示`.
- `5.JPG` is transparent-price / transaction-market reference, not formal building display.
- `6.JPG` is `三、【產權相關注意事項】`.
- `7.JPG` is `貳、買賣雙方應負擔費用項目一覽表`.
- OCR across the house-version image set did not find another formal page that clearly owns detailed `建物標示`.
- `2-1-房屋-不一定要.JPG.JPG` has building/area facts, but it is an optional marketing sheet, not the formal disclosure section.
- The 105 成屋 format explicitly starts with `建物標示、權利範圍及用途`.

Therefore this Page Contract should own the formal building-display section unless a later customer-provided page proves otherwise.

Fish decision after comparison:

- MVP should use a compact, business-readable building display section.
- Keep it around one page if possible.
- Use the 105 official format as a source checklist, not as the first visible PDF layout.

## User Workflow

```text
Case Setup
  ↓
Registry/API pull, if available
  ↓
Draft Disclosure Workbench
  left: property-rights fields
  right: official-style page preview
  ↓
Print blank/partial draft for owner discussion
  ↓
Formal Supplement Workbench
  fill handwritten/corrected data
  ↓
Final PDF export
```

## Layout Contract

MVP visual direction:

- Use the old/conservative PDF style.
- Keep enough whitespace for handwriting.
- Do not show `待補`.
- Do not hard-code page number/page count in draft output.
- Use formal black/gray table style, not the decorative new cover style.

Required visual zones:

1. Header row with property id/name and company mark.
2. Page title `壹、產權調查表`.
3. Top fact list.
4. Expanded building-display section.
5. Writable blank spaces for missing values.
6. Optional final-export page number only if final mode later enables dynamic numbering.

## Field Contract

| Field key | Label | Type | Required | Primary source | Manual fallback / override | Target storage | Preview/PDF slot | Missing behavior | Entitlement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `property_rights.case_no` | 物件編號 | text | yes | `cases.case_no` | Case Setup | `cases` | Header | Blank or accepted fallback from case id; checklist warning | Basic |
| `property_rights.case_name` | 物件名稱 | text | yes | `cases.case_name` | Case Setup | `cases` | Header | Blank or accepted address fallback; checklist warning | Basic |
| `property_rights.land_location_text` | 土地坐落 | text | yes | 土地謄本 / case land fields | Manual | `registry_payloads`, `disclosure_drafts` | Top facts | Blank line | Basic registry/manual |
| `property_rights.transaction_type` | 交易種類 | select + custom text | yes | User selection; optional workflow suggestion | Manual/custom option | `disclosure_drafts` | Top facts | Blank line | Basic |
| `property_rights.transaction_price_wan` | 交易價金（萬元） | number | no | `cases.asking_price` / 委託總價 | Field visit / manual | `cases.asking_price`, `disclosure_drafts` | Top facts | Blank line | Basic |
| `property_rights.gifted_equipment_note` | 附贈設備 | text | no | Field visit / contract | Manual | `disclosure_drafts` | Top facts | Blank line | Basic |
| `property_rights.payment_method_note` | 付款方式 | text | no | Contract / template default | Manual | `disclosure_drafts` | Top facts | Blank line | Basic |
| `property_rights.building_display_mode` | 建物標示呈現方式 | enum | yes | Page contract | Manual override by page contract | `disclosure_drafts` | Section marker | Default `expanded` for this page | Basic |
| `property_rights.building_no` | 建號 | text | no | 建物謄本 / secretary supplement | Manual | `registry_payloads`, `disclosure_drafts` | Building display section | Blank | Basic registry/manual |
| `property_rights.land_no` | 地號 | text | no | 土地謄本 / secretary supplement | Manual | `cases.land_lot_no`, `registry_payloads`, `disclosure_drafts` | Land location/top facts | Blank | Basic registry/manual |
| `property_rights.main_building_area` | 主建物坪數 | number | no | 建物標示 API / secretary supplement | Manual | `registry_payloads`, `disclosure_drafts` | Building display section | Blank | Basic registry/manual |
| `property_rights.auxiliary_area` | 附屬建物坪數 | number | no | 建物標示 API / secretary supplement | Manual | `registry_payloads`, `disclosure_drafts` | Building display section | Blank | Basic registry/manual |
| `property_rights.common_area` | 共有部分坪數 | number | no | 建物標示 API / secretary supplement | Manual | `registry_payloads`, `disclosure_drafts` | Building display section | Blank | Basic registry/manual |
| `property_rights.ownership_scope` | 權利範圍 | text | no | 建物所有權 API | Secretary supplement | `registry_payloads`, `disclosure_drafts` | Building display section | Blank | Basic registry/manual |
| `property_rights.other_rights_note` | 他項權利 | text | no | 建物他項權利 API / right status API | Secretary supplement | `registry_payloads`, `disclosure_drafts` | Rights/body later | Blank | Basic manual now; API wrapper needed |
| `property_rights.legal_use` | 法定用途 | text | no | 建物標示 API / secretary supplement | Manual | `registry_payloads`, `disclosure_drafts` | Body/checklist | Blank | Basic registry/manual |
| `property_rights.construction_completion_date` | 建築完成日期 | date/text | no | 建物標示 API / secretary supplement | Manual | `registry_payloads`, `disclosure_drafts` | Body/checklist | Blank | Basic registry/manual |
| `property_rights.solar_photovoltaic_equipment_status` | 有無設置太陽光電發電設備 | tristate | no | Manual legal disclosure | Manual | `disclosure_drafts` | Legal/current condition section, possibly later page | Blank checkbox/line | Basic manual |
| `property_rights.solar_photovoltaic_equipment_location` | 太陽光電設備位置說明 | text | no | Manual legal disclosure | Manual | `disclosure_drafts` | Legal/current condition section, possibly later page | Blank line | Basic manual |
| `property_rights.building_energy_efficiency_status` | 建築效能情形 | text/select | no | Manual legal disclosure | Manual | `disclosure_drafts` | Legal/current condition section, possibly later page | Blank line | Basic manual |
| `property_rights.building_energy_efficiency_notes` | 建築效能備註 | textarea | no | Manual legal disclosure | Manual | `disclosure_drafts` | Legal/current condition section, possibly later page | Blank line | Basic manual |

## COP/MOI API Mapping

| Field group | AIRE api id | MOI/COP source | Endpoint | Status |
| --- | --- | --- | --- | --- |
| Land display/location | `land_registry` | `MOI_API_001` | `/LandDescription/1.0/QueryByLandNo` | Existing wrapper. |
| Land value/zoning | `land_value`, `zoning` | `MOI_API_001` / `MOI_API_014` candidate | `/LandDescription/1.0/QueryByLandNo` and possible land value service | Existing partial; clarify mapping. |
| Building display/areas | `building_registry` | `MOI_API_004` | `/BuildingDescription/1.0/QueryByBuildNo` | Existing wrapper. |
| Building ownership/scope | `building_ownership` | `MOI_API_005` | `/BuildingOwnership/1.0/QueryByLimit` | Existing wrapper. |
| Land other rights/mortgages | `mortgages` | `MOI_API_003` | `/LandOtherRights/1.0/QueryByLimit` | Existing wrapper; land-only naming risk. |
| Building other rights | `building_other_rights` | `MOI_API_006` | verify endpoint before implementation | Missing wrapper. |
| Building number lookup | `building_number_lookup` | `MOI_API_015` | service doc says QueryByLandNo | Missing wrapper. |
| Building right scope/status | `building_right_scope`, `building_right_status` | `MOI_API_026`, `MOI_API_028` | verify interface details | Missing wrappers. |

Backend prerequisites before using automation in this page:

- Wire COP token endpoint and base URL explicitly.
- Verify actual subscription availability for address/building lookup.
- Persist registry payload locally before the workbench depends on it.

## Storage Contract

Current storage candidates:

- `cases.case_no`
- `cases.case_name`
- `cases.land_lot_no`
- `cases.building_lot_no`
- `cases.asking_price`
- `disclosure_drafts.payload_json`
- future/required: durable `registry_payloads` or equivalent local vault table

Target `disclosure_drafts.payload_json` shape:

```json
{
  "page_contract_version": 1,
  "property_rights": {
    "transaction_type": "",
    "transaction_type_custom": "",
    "transaction_price_wan": 898,
    "gifted_equipment_note": "依標的物現況說明書賣方表達內容為準",
    "payment_method_note": "依買賣契約為準",
    "building_display_mode": "expanded",
    "building_no": "",
    "main_building_area": null,
    "auxiliary_area": null,
    "common_area": null,
    "ownership_scope": "",
    "solar_photovoltaic_equipment_status": "",
    "solar_photovoltaic_equipment_location": "",
    "building_energy_efficiency_status": "",
    "building_energy_efficiency_notes": ""
  }
}
```

Registry payload should not be flattened destructively into the draft. Store normalized display fields in draft only when user edits/overrides or when a snapshot is needed for export.

## Gifted Equipment Input Rule

`附贈設備` should help the draft move fast without pretending the system already knows the actual equipment list.

MVP input behavior:

- Default mode: use the conservative template phrase from the reference page.
- Manual mode: allow user to replace the text with a specific equipment list.
- Blank mode: allow user to clear the field so the printed draft has writable blank space.

Default template phrase:

```text
依標的物現況說明書賣方表達內容為準
```

Recommended UI:

```text
附贈設備:
[使用預設文字] [自行填寫] [留白]

使用預設文字 -> 依標的物現況說明書賣方表達內容為準
自行填寫     -> free text / textarea
留白         -> preview/PDF prints writable blank space
```

Preview/PDF output rules:

- Default mode prints the template phrase.
- Manual mode prints the user's text.
- Blank mode prints blank writable space.
- Do not print `待補`.

## Transaction Type Input Rule

`交易種類` must not be hard-coded as `買賣`.

MVP input behavior:

- Render as a select/segmented control, not a free text field only.
- Options:
  - blank / not selected
  - `買賣`
  - `租賃`
  - `交換`
  - `其他`
- When user selects `其他`, show a custom text input.
- The preview/PDF output uses:
  - selected option text when option is `買賣`, `租賃`, or `交換`
  - custom text when option is `其他`
  - blank writable space when empty or custom text is blank

Recommended UI:

```text
交易種類: [空白] [買賣] [租賃] [交換] [其他: ________]
```

This keeps the normal sales case fast while preserving future cases without changing the PDF template.

## Payment Method Input Rule

`付款方式` means the payment arrangement for the real-estate transaction, not the customer's SaaS subscription payment to AIRE.

MVP input behavior:

- Default mode: use the conservative transaction template phrase.
- Manual mode: allow user to replace it with specific payment terms.
- Blank mode: allow user to clear it so the printed draft has writable blank space.

Default template phrase:

```text
依買賣契約為準
```

Recommended UI:

```text
付款方式:
[使用預設文字] [自行填寫] [留白]

使用預設文字 -> 依買賣契約為準
自行填寫     -> free text / textarea
留白         -> preview/PDF prints writable blank space
```

Preview/PDF output rules:

- Default mode prints `依買賣契約為準`.
- Manual mode prints the user's text.
- Blank mode prints blank writable space.
- Do not print `待補`.

## Building Display Ownership Rule

The reference page shows `一、【建物標示】略`, but Fish prefers to include building core facts if they do not duplicate another required page.

Checked sources:

- `4.JPG` owns `土地標示`, not `建物標示`.
- `5.JPG` is market/transaction reference.
- `6.JPG` is產權注意事項.
- `7.JPG` is費用.
- `2-1-房屋-不一定要.JPG.JPG` is an optional marketing summary, not the formal disclosure owner.
- 105 official format expects 成屋 disclosure to include `建物標示、權利範圍及用途`.

Decision:

```text
`house.property_rights` owns the MVP formal `建物標示` section.
MVP renders a compact business-readable version, not the full 105-format long form.
Do not keep it as `略` unless Fish later provides a separate formal page that owns the same section.
```

MVP direction:

- Render an expanded `一、【建物標示】` under the top facts.
- Include building number, area fields, ownership scope, legal use, and completion date.
- Preserve blank writable space for missing values.
- Keep the visible section around one A4 page if possible.
- Treat the 105 official format as a checklist for data completeness and legal review, not the first visible layout.
- Do not duplicate the optional marketing summary sheet.

Candidate fields:

- `建號`
- `主建物坪數`
- `附屬建物坪數`
- `共有部分坪數`
- `權利範圍`
- `法定用途`
- `建築完成日期`

## Preview Contract

Right-side preview payload:

```ts
interface HousePropertyRightsPreviewPayload {
  caseNo: string;
  caseName: string;
  companyName?: string;
  logoDataUrl?: string | null;
  landLocationText: string;
  transactionType: string;
  transactionTypeCustom?: string;
  transactionPriceWan?: number | null;
  giftedEquipmentNote: string;
  paymentMethodNote: string;
  buildingDisplayMode: "brief" | "expanded";
  buildingNo?: string;
  mainBuildingArea?: number | null;
  auxiliaryArea?: number | null;
  commonArea?: number | null;
  ownershipScope?: string;
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
- Enough vertical spacing for handwriting.
- `建物標示` defaults to expanded rendering.

## PDF Contract

PDF export must use the same normalized payload as the HTML/right-side preview.

Font requirements:

- PDF must use an embedded Traditional Chinese capable font.
- Existing candidate font files:
  - `public/pdf-fonts/NotoSansTC-Regular.otf`
  - `src/resources/fonts/NotoSansTC-Regular.otf`
- Existing initializer:
  - `src/lib/pdf-engine/react-pdf-init.ts`
- Every PDF export path must call `initReactPdfEngine()` before rendering with `@react-pdf/renderer`.
- Renderer must not rely on browser CSS fonts for PDF output.
- Add verification with Chinese sample text from this page:
  - `壹、產權調查表`
  - `土地坐落`
  - `附贈設備`
  - `依標的物現況說明書賣方表達內容為準`

Acceptance for font:

- Generated PDF text must not be garbled.
- Bold/regular Chinese must render consistently.
- HTML preview and PDF should both visually use a Traditional Chinese capable font, even if implementations differ.

## UI Contract

Workbench surface:

```text
Draft Disclosure
  Page list: 產權調查表

  Left panel:
    Header/case values status
    Top facts fields
    Legal update fields checklist
    API source status
    Missing-field checklist

  Right panel:
    Official-style 產權調查表 preview
```

Editable here:

- transaction type
- transaction price override
- gifted equipment note
- payment method note
- building number
- building area fields
- ownership scope
- legal update fields
- land location text override only when needed

Edit elsewhere:

- case number/name: Case Setup
- company/logo: Branding Settings
- raw registry payload: not directly edited; user edits derived display fields

## Entitlement Contract

Basic:

- Manual fields available.
- Registry pull available if it is part of base product scope.
- Missing data renders blank.
- Can print draft and final output.

Pro:

- Can auto-populate more surrounding/market/map fields elsewhere.
- Same document slot layout.

Advanced:

- Can add AI/automation assistance later.
- Same document slot layout.

Important:

```text
Plan gates automation buttons.
Plan does not remove legal/manual fields from the document.
```

## Validation Rules

Draft mode:

- No hard blocking required except case existence.
- Missing values are allowed and render blank.
- Checklist should show missing recommended/required fields outside the printable body.

Final mode:

- Warn if case number/name missing.
- Warn if land location blank.
- Warn if transaction type blank.
- Warn if 2026 legal-update fields blank.
- Warn if registry source says data pulled but not persisted.

Do not block final export until legal review decides which fields are hard-blocking.

## Page Number Rule

- Draft mode: no hard-coded `第 X 頁 / 共 Y 頁`.
- Final mode: dynamic numbering may be added later after all inserts/attachments are assembled.
- The source image's `第 3 頁 / 共 9 頁` must not be copied as static text.

## Acceptance Criteria

- Page Contract maps every visible field in the top part of `3-2+3.JPG`.
- Page Contract owns and renders the formal `建物標示` MVP section unless later references prove a separate formal owner exists.
- Missing fields render blank in preview/PDF.
- The page can be printed and handwritten.
- Existing `NotoSansTC` font initialization is required in all PDF paths.
- The page includes placeholders/checklist entries for 2026 legal-update fields.
- The contract separates manual fields from API-derived fields.
- PDF and preview consume one normalized payload.
- No property data is uploaded to AIRE Cloud.

## Implementation Notes

Potential reusable modules:

- `src/lib/pdf-engine/react-pdf-init.ts`
- `src/lib/pdf-blocks/property-data-sheet.tsx`
- `src/lib/pdf-engine/html-blocks/property-data-sheet.tsx`
- `src/components/case-wizard/CaseWizardStep1.tsx`
- `src/components/PullParcelDataButton.tsx`

Likely new/changed modules later:

- `src/lib/page-contracts/house-property-rights.ts`
- `src/components/disclosure-workbench/HousePropertyRightsPanel.tsx`
- `src/components/disclosure-workbench/HousePropertyRightsPreview.tsx`
- `src/lib/pdf-engine/normalize-house-property-rights.ts`
- `src/lib/pdf-blocks/house-property-rights-page.tsx`

## Open Questions For Fish

1. Confirm the exact compact `建物標示` field list after seeing the first preview.
2. If legal review later requires full 105-format details in the printed document, decide whether to add them as later pages or an appendix.
