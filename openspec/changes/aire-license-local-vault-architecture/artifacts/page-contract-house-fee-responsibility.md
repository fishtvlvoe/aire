# Page Contract: house.fee_responsibility

Date: 2026-05-20

Status: Draft for Fish review

## Purpose

`house.fee_responsibility` defines the house-version disclosure page for buyer/seller expense responsibility.

Reference page:

- `0520/不動產說明書/7.JPG`

This page explains which transaction taxes/fees are typically borne by seller or buyer, and which items depend on contract agreement or actual tax authority assessment. It is not the same as the later land-value-increment tax calculation page.

## References

| Reference | Path | Use |
| --- | --- | --- |
| Page image | `0520/不動產說明書/7.JPG` | Visual layout and item order. |
| Dossier spec | `docs/dossier-implementation-spec.md` | Tax/fee source and calculation responsibilities. |
| Existing page component | `src/components/DossierPage7FeeTable.tsx` | Existing fee table/calculation component; useful but not aligned with the photo's buyer/seller responsibility wording. |
| Existing tax calculator | `src/lib/tax-calculator.ts` | Current formula helpers and tax calculation engine. |
| Existing PDF block | `src/lib/pdf-engine/html-blocks/tax-fee.tsx`, `src/lib/pdf-blocks/tax-fee-page.tsx` | Current PDF fee/tax rendering; needs alignment with Page Contracts. |

## Observed Page Structure

From `7.JPG`:

```text
Header:
  建安不動產 logo/name
  物件編號
  物件名稱

Title:
  貳、買賣雙方應負擔費用項目一覽表

Seller section:
  賣方部分
  1. 土地增值稅：詳如增值稅概算表
  2. 地價稅：於交屋日依實際使用比例分算
  3. 房屋稅：於交屋日依實際使用比例分算
     住家用按房屋現值 x 1.2%；營業用按房屋現值 x 3%
  4. 水、電、瓦斯費、管理費、電話費等雜項費用：於交屋日依實際使用比例分算
  5. 簽約費、所有權移轉代辦費：詳如附件資料之地政士作業標準計收
  6. 工程受益費：過戶登記日前已開徵或已開徵未到期（含緩徵）者，由賣方負擔
  7. 所得稅：詳如不動產說明書注意事項說明
  8. 公證費：是否有此費用及金額，依買賣雙方之約定為主

Buyer section:
  買方部分
  1. 印花稅：按[核定契價 + (土地公告現值 x 持分面積)] x 0.1%
  2. 契稅：按核定契價 x 6%
  3. 登記規費：詳如附件資料之地政士作業標準計收
  4. 簽約費、所有權移轉代辦費：詳如附件資料之地政士作業標準計收
  5. 工程受益費：過戶登記日前尚未開徵者，由買方負擔
  6. 公證費：是否有此費用及金額，依買賣雙方之約定為主

Bottom notes:
  上述應納稅額、規費項目及負擔方式由買賣雙方另以契約約定。
  上述應納稅額僅為概算，正確稅額依稅捐機關核發稅單之金額為準。
```

OCR note:

- The page title is visually `貳、買賣雙方應負擔費用項目一覽表`.
- OCR may misread some labels; use the image and existing tax/fee code as secondary references.

## User Workflow

```text
Draft Disclosure Workbench
  ↓
System loads default buyer/seller responsibility template
  ↓
Tax/fee estimates may be blank, manually entered, or auto-calculated when inputs/formula metadata are available
  ↓
Right preview shows fee responsibility page
  ↓
Formal Supplement
  update contract-specific burden agreement or manual estimates
  ↓
Final PDF export
```

## Layout Contract

MVP visual direction:

- Use the old/conservative PDF style.
- Render two clear sections: seller and buyer.
- The primary page is responsibility wording; amount estimates are optional.
- Missing estimate values render blank, not `待補`.
- Do not hard-code page number/page count in draft output.

Required visual zones:

1. Header row with property id/name and company mark.
2. Page title `貳、買賣雙方應負擔費用項目一覽表`.
3. Seller section label and numbered items.
4. Buyer section label and numbered items.
5. Bottom notes / disclaimer.
6. Optional final-export page number only if final mode later enables dynamic numbering.

## Item Contract

| Item key | Party | Index | Label | Formula / wording | Estimate source | Editable by normal user |
| --- | --- | --- | --- | --- | --- | --- |
| `seller.land_value_increment_tax` | seller | 1 | 土地增值稅 | 詳如增值稅概算表 | `taxCalculation.landValueIncrementTax` / later land-value page | amount/manual note only |
| `seller.land_price_tax` | seller | 2 | 地價稅 | 於交屋日依實際使用比例分算 | manual/calculation later | amount/manual note only |
| `seller.building_tax` | seller | 3 | 房屋稅 | 於交屋日依實際使用比例分算；住家用 1.2%，營業用 3% | `buildingTax(...)` candidate | amount/manual note only |
| `seller.utilities_management_misc` | seller | 4 | 水電瓦斯管理電話等雜項費用 | 於交屋日依實際使用比例分算 | manual | amount/manual note only |
| `seller.contract_transfer_agent_fee` | seller | 5 | 簽約費、所有權移轉代辦費 | 詳如附件資料之地政士作業標準計收 | manual / fee settings later | amount/manual note only |
| `seller.betterment_charge_before_transfer` | seller | 6 | 工程受益費 | 過戶登記日前已開徵或已開徵未到期（含緩徵）者，由賣方負擔 | manual | amount/manual note only |
| `seller.income_tax` | seller | 7 | 所得稅 | 詳如不動產說明書注意事項說明 | manual / no MVP formula | amount/manual note only |
| `seller.notary_fee` | seller | 8 | 公證費 | 是否有此費用及金額，依買賣雙方之約定為主 | manual | amount/manual note only |
| `buyer.stamp_tax` | buyer | 1 | 印花稅 | 按[核定契價 + (土地公告現值 x 持分面積)] x 0.1% | `stampTax(...)` candidate | amount/manual note only |
| `buyer.deed_tax` | buyer | 2 | 契稅 | 按核定契價 x 6% | `deedTax(...)` candidate | amount/manual note only |
| `buyer.registration_fee` | buyer | 3 | 登記規費 | 詳如附件資料之地政士作業標準計收 | `registrationFee` candidate / manual | amount/manual note only |
| `buyer.contract_transfer_agent_fee` | buyer | 4 | 簽約費、所有權移轉代辦費 | 詳如附件資料之地政士作業標準計收 | manual / fee settings later | amount/manual note only |
| `buyer.betterment_charge_after_transfer` | buyer | 5 | 工程受益費 | 過戶登記日前尚未開徵者，由買方負擔 | manual | amount/manual note only |
| `buyer.notary_fee` | buyer | 6 | 公證費 | 是否有此費用及金額，依買賣雙方之約定為主 | manual | amount/manual note only |

Normal users may edit amounts/notes for the case, but template wording is fixed and controlled by admin/legal template versioning.

## Field Contract

| Field key | Label | Type | Required | Primary source | Manual fallback / override | Target storage | Preview/PDF slot | Missing behavior | Entitlement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `fee_responsibility.case_no` | 物件編號 | text | yes | `cases.case_no` | Case Setup | `cases` | Header | Blank/checklist warning | Complete build first |
| `fee_responsibility.case_name` | 物件名稱 | text | yes | `cases.case_name` | Case Setup | `cases` | Header | Blank/checklist warning | Complete build first |
| `fee_responsibility.template_version` | 費用模板版本 | text | yes | Template registry | Admin | `disclosure_drafts`, future template table | Hidden/export metadata | Default latest | Complete build first |
| `fee_responsibility.seller_items[]` | 賣方費用項目 | array | yes | Template + tax calculation | Manual amount/note | `disclosure_drafts` | Seller section | Default wording, blank estimates | Complete build first |
| `fee_responsibility.buyer_items[]` | 買方費用項目 | array | yes | Template + tax calculation | Manual amount/note | `disclosure_drafts` | Buyer section | Default wording, blank estimates | Complete build first |
| `fee_responsibility.bottom_note` | 底部負擔約定說明 | textarea | yes | Template | Admin/manual override if allowed | `disclosure_drafts` | Bottom notes | Default | Complete build first |
| `fee_responsibility.tax_authority_note` | 稅額概算免責 | textarea | yes | Template | Admin/manual override if allowed | `disclosure_drafts` | Bottom notes | Default | Complete build first |

## Storage Contract

Target `disclosure_drafts.payload_json` shape:

```json
{
  "page_contract_version": 1,
  "fee_responsibility": {
    "template_version": "house-fee-responsibility-2026-05-20",
    "seller_items": [
      {
        "key": "land_value_increment_tax",
        "index": 1,
        "label": "土地增值稅",
        "text": "詳如增值稅概算表",
        "estimated_amount": "",
        "note": ""
      }
    ],
    "buyer_items": [
      {
        "key": "stamp_tax",
        "index": 1,
        "label": "印花稅",
        "text": "按[核定契價 + (土地公告現值 x 持分面積)] x 0.1%",
        "estimated_amount": "",
        "note": ""
      }
    ],
    "bottom_note": "上述應納稅額、規費項目及負擔方式由買賣雙方另以契約約定。",
    "tax_authority_note": "上述應納稅額僅為概算，正確稅額依稅捐機關核發稅單之金額為準。"
  }
}
```

## Calculation Mapping

Existing code has useful calculation pieces, but the page contract is responsibility-first.

| Existing code | Use | Gap |
| --- | --- | --- |
| `src/lib/tax-calculator.ts` | stamp/deed/building/land tax helpers and broader `calculateTaxFees` | Formula assumptions need review against current customer wording and Taiwan legal/tax changes. |
| `src/components/DossierPage7FeeTable.tsx` | Simple fee calculation UI | Does not match buyer/seller responsibility wording and missing blank-draft behavior. |
| `src/lib/pdf-engine/html-blocks/tax-fee.tsx` | Existing PDF/HTML tax block | Combines fee overview and land-value tax page; needs Page Contract separation. |
| `src/lib/pdf-blocks/tax-fee-page.tsx` | Existing React PDF tax block | Similar separation and font QA needed. |

MVP rule:

```text
Print responsibility wording first.
MVP supports all three estimate states: blank, manually entered, and auto-calculated.
Auto-calculated values must carry source/formula status and warnings before paid launch.
```

## Preview Contract

Right-side preview payload:

```ts
interface HouseFeeResponsibilityPreviewPayload {
  caseNo: string;
  caseName: string;
  companyName?: string;
  logoDataUrl?: string | null;
  templateVersion: string;
  sellerItems: Array<{
    key: string;
    index: number;
    label: string;
    text: string;
    estimatedAmount: string;
    note: string;
  }>;
  buyerItems: Array<{
    key: string;
    index: number;
    label: string;
    text: string;
    estimatedAmount: string;
    note: string;
  }>;
  bottomNote: string;
  taxAuthorityNote: string;
  draftMode: boolean;
  showPageNumber: boolean;
}
```

Preview requirements:

- A4 portrait.
- Old/conservative PDF style.
- Seller/buyer section labels are visually clear.
- Missing estimated amounts render blank.
- No `待補`.
- No hard-coded page count in draft mode.

## PDF Contract

PDF export must use the same normalized payload as the HTML/right-side preview.

Font requirements:

- PDF must use embedded/registered Traditional Chinese capable font.
- Every PDF export path must call `initReactPdfEngine()` before rendering with `@react-pdf/renderer`.
- Renderer must not rely on browser CSS fonts for PDF output.
- Add verification with Chinese sample text from this page:
  - `貳、買賣雙方應負擔費用項目一覽表`
  - `賣方部分`
  - `買方部分`
  - `土地增值稅`
  - `契稅`

## UI Contract

Workbench surface:

```text
Draft Disclosure
  Page list: 費用負擔

  Left panel:
    Seller item list
    Buyer item list
    Calculation/source status
    Manual estimate/notes
    Bottom-note template status

  Right panel:
    Official-style fee responsibility preview
```

Editable here:

- estimated amounts
- case-specific notes
- calculation input status

Controlled elsewhere:

- default item wording
- bottom disclaimer wording
- formula assumptions

## Entitlement Contract

Current build direction:

- Build the complete/highest-capability disclosure workflow first.
- Do not block this Page Contract on Basic/Pro packaging.

Future packaging direction:

- Manual fee responsibility page should be available when the disclosure is produced.
- Fish's current MVP requires both manual/blank and auto-calculation paths in the complete build; later Basic/Pro packaging may decide which tiers can use automation.
- The output slot should remain stable; plan gates automation, not the document layout.

## Validation Rules

Draft mode:

- Default seller/buyer item templates must exist.
- Amount estimates may be blank.
- Warn if calculation data is stale or incomplete.

Final mode:

- Warn if required template items are missing.
- Warn if estimates are shown without source/calculation timestamp.
- Warn if formula assumptions are stale compared with legal/tax review.

Do not block final export until legal/tax review decides which fields are hard-blocking.

## Page Number Rule

- Draft mode: no hard-coded `第 X 頁 / 共 Y 頁`.
- Final mode: dynamic numbering may be added later after all inserts/attachments are assembled.
- The source image's `第 7 頁 / 共 9 頁` must not be copied as static text.

## Acceptance Criteria

- Page Contract maps seller and buyer sections from `7.JPG`.
- Missing estimates render blank in preview/PDF.
- The page can be printed and read as a responsibility list.
- Existing `NotoSansTC` font initialization is required in all PDF paths.
- The contract separates responsibility wording from tax calculation values.
- PDF and preview consume one normalized payload.
- No property data is uploaded to AIRE Cloud.

## Implementation Notes

Potential reusable modules:

- `src/lib/tax-calculator.ts`
- `src/components/DossierPage7FeeTable.tsx`
- `src/lib/pdf-engine/html-blocks/tax-fee.tsx`
- `src/lib/pdf-blocks/tax-fee-page.tsx`

Likely new/changed modules later:

- `src/lib/page-contracts/house-fee-responsibility.ts`
- `src/components/disclosure-workbench/HouseFeeResponsibilityPanel.tsx`
- `src/components/disclosure-workbench/HouseFeeResponsibilityPreview.tsx`
- `src/lib/pdf-engine/normalize-house-fee-responsibility.ts`
- `src/lib/pdf-blocks/house-fee-responsibility-page.tsx`

## Open Questions For Fish

1. Should tax/fee formulas be reviewed by a land administration scrivener/tax specialist before paid launch?
