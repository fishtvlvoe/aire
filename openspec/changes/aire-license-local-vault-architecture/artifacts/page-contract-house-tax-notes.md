# Page Contract: house.tax_notes

Date: 2026-05-20

Status: Draft for Fish review

## Purpose

`house.tax_notes` defines the house-version disclosure page for land value increment tax estimate results and notes.

Reference page:

- `0520/不動產說明書/9-8+9.JPG`

This page continues the land value increment tax estimate. It summarizes general/self-use tax estimate results and prints the conditions/cautions for the estimate and self-use preferential rate.

MVP decision:

```text
Tax values may be blank, manually entered, or auto-calculated.
The seven notes use fixed admin/legal/tax templates; normal users do not freely edit the note wording.
Print the fixed tax notes by default even when estimate values are blank.
```

## References

| Reference | Path | Use |
| --- | --- | --- |
| Page image | `0520/不動產說明書/9-8+9.JPG` | Visual layout, estimate result table, and seven notes. |
| Tax estimate contract | `artifacts/page-contract-house-land-value-tax-estimate.md` | Previous estimate table and calculation metadata. |
| Existing component | `src/components/DossierPage8TaxNotes.tsx` | Existing notes component; useful but wording/order must be aligned with this photo before implementation. |
| Existing tax calculator | `src/lib/tax-calculator.ts` | Candidate formula engine; requires review before paid launch. |

## Observed Page Structure

From `9-8+9.JPG`:

```text
Header:
  建安不動產 logo/name
  物件編號
  物件名稱

Result table:
  概算結果
  一般稅率概算稅額
  自用稅率概算稅額（一人一生一次）

Example values:
  一般稅率概算稅額: 113.603 元
  自用稅率概算稅額: 56.801 元

Notes:
  1. 物價指數基準與資料日期
  2. 國宅、公家配售、拍賣或需主管機關核准移轉
  3. 地籍圖重測或面積/權利變動
  4. 公共設施用地免徵可能性
  5. 都市土地持分面積 > 300m2 / 非都市土地持分面積 > 700m2 不適用自用優惠部分
  6. 出售前一年內營業使用、出租、他人設籍不適用自用優惠
  7. 自用優惠稅率能否適用以稅捐稽徵處審查為準

Footer:
  hard-coded page count appears in reference image, but MVP draft should not hard-code page count
```

## User Workflow

```text
Land value tax estimate page
  ↓
System/manual estimate values
  ↓
Tax notes page
  ↓
Show result summary + caution notes
  ↓
Formal Supplement
  update values after seller/地政士/tax review
  ↓
Final PDF export
```

## Layout Contract

MVP visual direction:

- Use the old/conservative PDF style.
- Keep result table at the top.
- Render all seven notes by default.
- Missing estimate values render blank, not `待補`.
- Do not hard-code page number/page count in draft output.

Required visual zones:

1. Header row with property id/name and company mark.
2. Estimate result table.
3. `附註：` label.
4. Seven numbered notes.
5. Optional final-export page number only if final mode later enables dynamic numbering.

## Field Contract

| Field key | Label | Type | Required | Primary source | Manual fallback / override | Target storage | Preview/PDF slot | Missing behavior | Entitlement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `tax_notes.case_no` | 物件編號 | text | yes | `cases.case_no` | Case Setup | `cases` | Header | Blank/checklist warning | Complete build first |
| `tax_notes.case_name` | 物件名稱 | text | yes | `cases.case_name` | Case Setup | `cases` | Header | Blank/checklist warning | Complete build first |
| `tax_notes.general_tax_amount` | 一般稅率概算稅額 | number/text | no | `land_value_tax_estimate` / calculation | Manual | `disclosure_drafts`, future `tax_estimates` | Result table | Blank | Complete build first |
| `tax_notes.self_use_tax_amount` | 自用稅率概算稅額（一人一生一次） | number/text | no | `land_value_tax_estimate` / calculation | Manual | `disclosure_drafts`, future `tax_estimates` | Result table | Blank | Complete build first |
| `tax_notes.notes[]` | 附註列表 | array | yes | Controlled template | Admin/template override | `disclosure_drafts`, future template table | Body | Default latest | Complete build first |
| `tax_notes.template_version` | 附註模板版本 | text | yes | Template registry | Admin | `disclosure_drafts`, future template table | Hidden/export metadata | Default latest | Complete build first |
| `tax_notes.formula_version` | 公式版本 | text | yes when calculated | Tax engine | Admin/system | `tax_estimates`, `disclosure_drafts` | Hidden/export metadata | Blank if manual-only | Complete build first |
| `tax_notes.source_snapshot_at` | 資料快照時間 | datetime/text | yes when calculated | System | System | `tax_estimates`, `disclosure_drafts` | Hidden/checklist | Blank if manual-only | Complete build first |

## Note Contract

| Note key | Index | Topic | Editable by normal user | Preview/PDF behavior |
| --- | --- | --- | --- | --- |
| `price_index_basis` | 1 | 物價指數基準、資料日期、誤差說明 | no | Print default note. |
| `restricted_transfer_types` | 2 | 國宅、公家配售、拍賣、主管機關核准移轉 | no | Print default note. |
| `cadastral_resurvey_change` | 3 | 地籍圖重測、面積或權利變動 | no | Print default note. |
| `public_facility_land` | 4 | 公共設施用地可能免徵 | no | Print default note. |
| `self_use_area_limit` | 5 | 都市/非都市持分面積上限與自用優惠限制 | no | Print default note. |
| `self_use_disqualification` | 6 | 出售前一年營業使用、出租、他人設籍限制 | no | Print default note. |
| `tax_authority_review` | 7 | 自用優惠適用以稅捐稽徵處審查為準 | no | Print default note. |

Normal users should not freely edit note wording. Wording should be controlled by admin/legal/tax template versioning.

## Storage Contract

Target `disclosure_drafts.payload_json` shape:

```json
{
  "page_contract_version": 1,
  "tax_notes": {
    "template_version": "house-tax-notes-2026-05-20",
    "general_tax_amount": "113.603 元",
    "self_use_tax_amount": "56.801 元",
    "notes": [
      {
        "key": "price_index_basis",
        "index": 1,
        "topic": "物價指數基準與資料日期",
        "text": "物價指數依據行政院主計處於113年11月公布之總指數為基準..."
      }
    ],
    "formula_version": "",
    "source_snapshot_at": ""
  }
}
```

Use `disclosure_drafts` for display/export values. A future tax estimate table can store source values, formula version, and calculation warnings.

## Calculation / Source Rules

- Values should come from `house.land_value_tax_estimate`, automatic calculation, or manual entry.
- Blank values are allowed in draft output.
- AI must not calculate or invent tax amounts.
- Calculated values require formula version and source timestamp.
- Manual override should be visible in the workbench checklist.
- Final paid-launch formulas require tax/地政士 review.

## Preview Contract

Right-side preview payload:

```ts
interface HouseTaxNotesPreviewPayload {
  caseNo: string;
  caseName: string;
  companyName?: string;
  logoDataUrl?: string | null;
  generalTaxAmount: string;
  selfUseTaxAmount: string;
  notes: Array<{
    key: string;
    index: number;
    topic: string;
    text: string;
  }>;
  draftMode: boolean;
  showPageNumber: boolean;
}
```

Preview requirements:

- A4 portrait.
- Result table readable.
- Seven notes readable.
- Missing values render blank.
- No `待補`.
- No hard-coded page count in draft mode.

## PDF Contract

PDF export must use the same normalized payload as the HTML/right-side preview.

Font requirements:

- PDF must use embedded/registered Traditional Chinese capable font.
- Every PDF export path must call `initReactPdfEngine()` before rendering with `@react-pdf/renderer`.
- Renderer must not rely on browser CSS fonts for PDF output.
- Add verification with Chinese sample text from this page:
  - `一般稅率概算稅額`
  - `自用稅率概算稅額（一人一生一次）`
  - `附註`
  - `稅捐稽徵處`

## UI Contract

Workbench surface:

```text
Draft Disclosure
  Page list: 增值稅附註

  Left panel:
    Estimate result source
    Template version status
    Notes checklist/read-only preview
    Warnings/manual override indicators

  Right panel:
    Official-style tax notes preview
```

Editable here:

- estimate result values if manual mode is allowed
- no normal user editing of note wording

Controlled elsewhere:

- note template wording
- formula version
- tax calculation code

## Entitlement Contract

Current build direction:

- Build the complete/highest-capability disclosure workflow first.
- Do not block this Page Contract on Basic/Pro packaging.

Future packaging direction:

- Manual values/template notes should be available for disclosure completion.
- Fish's current MVP requires automatic calculation in the complete build; later Basic/Pro packaging may decide which tiers can use automation.
- Formula review is still required before paid-launch reliability claims.

## Validation Rules

Draft mode:

- Notes template must exist.
- Estimate amounts may be blank.
- Fixed notes still print when estimate values are blank.

Final mode:

- Warn if notes template is stale.
- Warn if estimate amounts are shown without formula version/source timestamp or manual override marker.
- Warn if tax formula review is not complete before paid launch.

Do not block final export until tax/legal review defines hard-blocking requirements.

## Page Number Rule

- Draft mode: no hard-coded `第 X 頁 / 共 Y 頁`.
- Final mode: dynamic numbering may be added later after all inserts/attachments are assembled.
- The source image's `第 9 頁 / 共 9 頁` must not be copied as static text.

## Acceptance Criteria

- Page Contract maps result table and seven notes from `9-8+9.JPG`.
- Missing values render blank in preview/PDF.
- The page can be printed.
- Existing `NotoSansTC` font initialization is required in all PDF paths.
- The contract separates note template, display values, and formula metadata.
- PDF and preview consume one normalized payload.
- No property data is uploaded to AIRE Cloud.

## Implementation Notes

Potential reusable modules:

- `src/components/DossierPage8TaxNotes.tsx`
- `src/lib/tax-calculator.ts`
- `src/lib/pdf-blocks/tax-fee-page.tsx`
- `src/lib/pdf-engine/html-blocks/tax-fee.tsx`

Likely new/changed modules later:

- `src/lib/page-contracts/house-tax-notes.ts`
- `src/components/disclosure-workbench/HouseTaxNotesPanel.tsx`
- `src/components/disclosure-workbench/HouseTaxNotesPreview.tsx`
- `src/lib/pdf-engine/normalize-house-tax-notes.ts`
- `src/lib/pdf-blocks/house-tax-notes-page.tsx`

## Open Questions For Fish

1. Should `house.land_value_tax_estimate` and `house.tax_notes` stay as two separate pages, or combine when content is short?
