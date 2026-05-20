# Page Contract: house.land_value_tax_estimate

Date: 2026-05-20

Status: Draft for Fish review

## Purpose

`house.land_value_tax_estimate` defines the house-version disclosure page for the land value increment tax estimate.

Reference page:

- `0520/不動產說明書/8.JPG`

This page is a tax estimate page, not a final tax bill. It should show calculation inputs/results only when the source data and formula assumptions are reliable. Draft mode may print blank fields for manual completion.

MVP decision:

```text
The MVP must support blank fields, manual tax estimate values, and automatic calculation.
Automatic calculation is useful in the first full-feature build, but must be clearly marked as an estimate with source/formula metadata and warnings.
```

Tax/legal output rule:

```text
Calculated or manually entered values must be presented as estimates.
The printable page must preserve wording equivalent to `概算` and `正確應納稅額以稅捐機關核發稅單金額為準`.
```

## References

| Reference | Path | Use |
| --- | --- | --- |
| Page image | `0520/不動產說明書/8.JPG` | Visual layout and field order. |
| Fee responsibility contract | `artifacts/page-contract-house-fee-responsibility.md` | Previous fee responsibility page that references this estimate. |
| Dossier spec | `docs/dossier-implementation-spec.md` | Tax calculation rules are system-computed, not AI-generated. |
| Existing tax calculator | `src/lib/tax-calculator.ts` | Current tax calculation engine; useful but formula assumptions need review. |
| Existing PDF tax page | `src/lib/pdf-blocks/tax-fee-page.tsx`, `src/lib/pdf-engine/html-blocks/tax-fee.tsx` | Current PDF/HTML tax estimate rendering; needs Page Contract alignment. |

## Observed Page Structure

From `8.JPG`:

```text
Header:
  建安不動產 logo/name
  物件編號
  物件名稱

Title:
  參、增值稅概算表

Currency:
  幣別：新台幣

Table columns:
  地段
  地號
  總面積(m2)
  權利範圍
  持分面積(m2)
  前次移轉(元)
  公告現值
  前次日
  物價指數
  自用稅額(元)
  一般稅額(元)

Bottom note:
  Estimate is based on seller-provided data and registry transcript data.
  If seller-provided data is wrong/incomplete or registry data changes, the estimate may be inaccurate.
  Correct payable tax is based on tax authority bill.
  Seller pays according to law.
  Estimate uses the tax law rate after the 99/11/24 land tax law amendment.

Footer:
  hard-coded page count appears in reference image, but MVP draft should not hard-code page count
```

OCR caution:

- The visual table headers are clearer than OCR.
- Some row values in the photo may omit decimal points or be visually compressed.
- Preserve display strings in draft/export when exact numeric normalization is uncertain.

## User Workflow

```text
Registry/API pull and/or manual land values
  ↓
Tax estimate workbench
  left: parcel tax inputs and formula/source status
  right: official-style tax estimate preview
  ↓
Print blank/partial draft if inputs incomplete
  ↓
Formal Supplement
  update values after seller/地政士 confirmation
  ↓
Final PDF export
```

## Layout Contract

MVP visual direction:

- Use the old/conservative PDF style.
- Keep the page compact, similar to the reference.
- Render one row per land parcel.
- Missing values render blank, not `待補`.
- Do not hard-code page number/page count in draft output.
- Bottom disclaimer must remain visible.

Required visual zones:

1. Header row with property id/name and company mark.
2. Page title `參、增值稅概算表`.
3. Currency note.
4. Tax estimate table.
5. Bottom estimate disclaimer.
6. Optional final-export page number only if final mode later enables dynamic numbering.

## Field Contract

| Field key | Label | Type | Required | Primary source | Manual fallback / override | Target storage | Preview/PDF slot | Missing behavior | Entitlement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `land_value_tax_estimate.case_no` | 物件編號 | text | yes | `cases.case_no` | Case Setup | `cases` | Header | Blank/checklist warning | Complete build first |
| `land_value_tax_estimate.case_name` | 物件名稱 | text | yes | `cases.case_name` | Case Setup | `cases` | Header | Blank/checklist warning | Complete build first |
| `land_value_tax_estimate.currency_label` | 幣別 | text | no | Template | Manual | `disclosure_drafts` | Currency note | Default `新台幣` | Complete build first |
| `land_value_tax_estimate.rows[].section_name` | 地段 | text | yes | 土地標示 API | Manual | `registry_payloads`, `disclosure_drafts` | Table | Blank | Complete build first |
| `land_value_tax_estimate.rows[].land_no` | 地號 | text | yes | 土地標示 API | Manual | `registry_payloads`, `disclosure_drafts` | Table | Blank | Complete build first |
| `land_value_tax_estimate.rows[].total_area_m2` | 總面積(m2) | number/text | no | 土地標示 API | Manual | `registry_payloads`, `disclosure_drafts` | Table | Blank | Complete build first |
| `land_value_tax_estimate.rows[].right_scope` | 權利範圍 | text | no | 土地所有權 API | Manual | `registry_payloads`, `disclosure_drafts` | Table | Blank | Complete build first |
| `land_value_tax_estimate.rows[].share_area_m2` | 持分面積(m2) | number/text | no | Calculated/API | Manual | `registry_payloads`, `disclosure_drafts` | Table | Blank | Complete build first |
| `land_value_tax_estimate.rows[].previous_transfer_value` | 前次移轉(元) | number/text | no | Seller data / registry/tax source | Manual | `disclosure_drafts` | Table | Blank | Complete build first |
| `land_value_tax_estimate.rows[].announced_current_value` | 公告現值 | number/text | no | land value source / `land_value` API candidate | Manual | `registry_payloads`, `disclosure_drafts` | Table | Blank | Complete build first |
| `land_value_tax_estimate.rows[].previous_transfer_date_value` | 前次日/前次移轉現值欄 | text | no | Seller data / tax source | Manual | `disclosure_drafts` | Table | Blank | Complete build first |
| `land_value_tax_estimate.rows[].price_index` | 物價指數 | number/text | no | tax source | Manual | `disclosure_drafts` | Table | Blank | Complete build first |
| `land_value_tax_estimate.rows[].self_use_tax_amount` | 自用稅額(元) | number/text | no | Calculation | Manual override | `disclosure_drafts`, future `tax_estimates` | Table | Blank | Complete build first |
| `land_value_tax_estimate.rows[].general_tax_amount` | 一般稅額(元) | number/text | no | Calculation | Manual override | `disclosure_drafts`, future `tax_estimates` | Table | Blank | Complete build first |
| `land_value_tax_estimate.disclaimer_note` | 概算免責說明 | textarea | yes | Template | Admin/template override | `disclosure_drafts` | Bottom note | Default | Complete build first |
| `land_value_tax_estimate.formula_version` | 公式版本 | text | yes when calculated | Tax engine | Admin/system | `tax_estimates`, `disclosure_drafts` | Hidden/export metadata | Blank if manual-only | Complete build first |
| `land_value_tax_estimate.source_snapshot_at` | 資料快照時間 | datetime/text | yes when calculated | System | System | `tax_estimates`, `disclosure_drafts` | Hidden/checklist | Blank if manual-only | Complete build first |

## Storage Contract

Target `disclosure_drafts.payload_json` shape:

```json
{
  "page_contract_version": 1,
  "land_value_tax_estimate": {
    "currency_label": "新台幣",
    "rows": [
      {
        "section_name": "公英段",
        "land_no": "0008",
        "total_area_m2": "70.816",
        "right_scope": "10000000/4662",
        "share_area_m2": "33.01",
        "previous_transfer_value": "36887元",
        "announced_current_value": "62908元",
        "previous_transfer_date_value": "36887元",
        "price_index": "",
        "self_use_tax_amount": "",
        "general_tax_amount": ""
      }
    ],
    "disclaimer_note": "上列增值稅系依賣方提供之資料及地政機關核發之謄本資料概算，若賣方提供之資料有誤或不完整或因地政機關日後更動謄本資料者，皆無法正確估算增值稅，本表僅供賣方參考之用，正確應納稅額應以稅捐機關核發稅單金額為準，並由賣方依法繳納。",
    "formula_version": "",
    "source_snapshot_at": ""
  }
}
```

Use `disclosure_drafts` for display/export values. A future `tax_estimates` table can store calculation inputs, formula version, warnings, and source timestamps.

## Calculation Mapping

Existing code:

- `src/lib/tax-calculator.ts`
- `src/lib/pdf-blocks/tax-fee-page.tsx`
- `src/lib/pdf-engine/html-blocks/tax-fee.tsx`

Current gap:

```text
The existing tax calculator uses simplified assumptions and does not yet fully match the reference table fields.
Do not rely on it for paid-launch tax correctness until reviewed by a qualified tax/地政士 source.
```

MVP rule:

- Manual/display values are allowed.
- Blank values are allowed.
- Calculated values are part of MVP, but only with source timestamp, formula version, and warnings.
- Blank values are acceptable in draft mode.
- AI must not invent or calculate tax amounts.

## Preview Contract

Right-side preview payload:

```ts
interface HouseLandValueTaxEstimatePreviewPayload {
  caseNo: string;
  caseName: string;
  companyName?: string;
  logoDataUrl?: string | null;
  currencyLabel: string;
  rows: Array<{
    sectionName: string;
    landNo: string;
    totalAreaM2: string;
    rightScope: string;
    shareAreaM2: string;
    previousTransferValue: string;
    announcedCurrentValue: string;
    previousTransferDateValue: string;
    priceIndex: string;
    selfUseTaxAmount: string;
    generalTaxAmount: string;
  }>;
  disclaimerNote: string;
  draftMode: boolean;
  showPageNumber: boolean;
}
```

Preview requirements:

- A4 portrait.
- Table should remain readable despite many columns.
- Missing values render blank.
- No `待補`.
- No hard-coded page count in draft mode.
- If many land rows exist, paginate dynamically.

## PDF Contract

PDF export must use the same normalized payload as the HTML/right-side preview.

Font requirements:

- PDF must use embedded/registered Traditional Chinese capable font.
- Every PDF export path must call `initReactPdfEngine()` before rendering with `@react-pdf/renderer`.
- Renderer must not rely on browser CSS fonts for PDF output.
- Add verification with Chinese sample text from this page:
  - `參、增值稅概算表`
  - `幣別：新台幣`
  - `自用稅額`
  - `一般稅額`
  - `正確應納稅額應以稅捐機關核發稅單金額為準`

## UI Contract

Workbench surface:

```text
Draft Disclosure
  Page list: 增值稅概算表

  Left panel:
    Land parcel tax rows
    Source/formula status
    Manual override fields
    Disclaimer/template status
    Warnings

  Right panel:
    Official-style tax estimate preview
```

Editable here:

- manual row values
- manual tax amounts
- disclaimer note only if admin/template override is allowed

Controlled elsewhere:

- formula version
- tax calculation code
- legal/tax assumptions

## Entitlement Contract

Current build direction:

- Build the complete/highest-capability disclosure workflow first.
- Do not block this Page Contract on Basic/Pro packaging.

Future packaging direction:

- Manual tax estimate fields can remain available for disclosure completion.
- Fish's current MVP requires an automatic-calculation path in the complete build; later Basic/Pro packaging may decide which tiers can use automation.
- Automatic calculation must pass legal/tax review before it is presented as paid-launch reliable.
- The output slot should remain stable; plan gates automation, not the document layout.

## Validation Rules

Draft mode:

- Rows may be blank.
- Warn if no land row exists.
- Warn if calculated values exist without formula version/source timestamp.

Final mode:

- Warn if formula version is stale.
- Warn if source values are missing but tax amounts are shown.
- Warn if tax amounts were manually overridden.

Do not block final export until tax/legal review defines hard-blocking requirements.

## Page Number Rule

- Draft mode: no hard-coded `第 X 頁 / 共 Y 頁`.
- Final mode: dynamic numbering may be added later after all inserts/attachments are assembled.
- The source image's `第 8 頁 / 共 9 頁` must not be copied as static text.

## Acceptance Criteria

- Page Contract maps visible table columns from `8.JPG`.
- Missing values render blank in preview/PDF.
- The page can be printed as a tax estimate table.
- Existing `NotoSansTC` font initialization is required in all PDF paths.
- The contract separates formula/calculation metadata from display/export values.
- PDF and preview consume one normalized payload.
- No property data is uploaded to AIRE Cloud.

## Implementation Notes

Potential reusable modules:

- `src/lib/tax-calculator.ts`
- `src/lib/pdf-blocks/tax-fee-page.tsx`
- `src/lib/pdf-engine/html-blocks/tax-fee.tsx`

Likely new/changed modules later:

- `src/lib/page-contracts/house-land-value-tax-estimate.ts`
- `src/components/disclosure-workbench/HouseLandValueTaxEstimatePanel.tsx`
- `src/components/disclosure-workbench/HouseLandValueTaxEstimatePreview.tsx`
- `src/lib/pdf-engine/normalize-house-land-value-tax-estimate.ts`
- `src/lib/pdf-blocks/house-land-value-tax-estimate-page.tsx`

## Open Questions For Fish

1. Should the wide table stay as one page with smaller text, or split into two lines/sections for readability?
2. Who should review the final land-value-increment tax formula before paid launch?
