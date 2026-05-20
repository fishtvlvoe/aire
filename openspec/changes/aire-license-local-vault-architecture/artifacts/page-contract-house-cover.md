# Page Contract: house.cover

Date: 2026-05-20

Status: Reviewed with Fish, pending implementation

## Purpose

`house.cover` defines the cover page for the house-version disclosure MVP.

This page should be mostly generated from existing case and company settings, with a small number of editable override fields. It should not become a heavy manual form.

## References

| Reference | Path | Notes |
| --- | --- | --- |
| Old formal cover PDF | `docs/0417-old/不動產說明書1.pdf` | Conservative legal-document style; company identity, property id/name, signature blocks, store/company/contact, production date. |
| New visual cover | `0520/不動產說明書/1-封面.png` | Rich visual design; includes property id, property name, 10 summary bullets, signature table, store/company/contact/date. |
| Background/base visual | `0520/不動產說明書/不動產說明書底版.png` | Possible template base. |
| Existing PDF block | `src/lib/pdf-blocks/cover.tsx` | Already renders cover-like data, but uses generic names and needs Page Contract payload alignment. |
| Existing case setup | `src/components/case-wizard/CaseWizardStep1.tsx` | Has owner, address, case name, asking price, case number. |
| Existing branding UI | `src/app/(dashboard)/settings/branding/branding-content.tsx` | Has agent name/cert, company name/license/address/phone/realtor name and Logo uploader. |

## User Workflow

```text
Case Setup / Branding Settings
  ↓
house.cover payload is assembled automatically
  ↓
Draft Disclosure preview shows cover
  ↓
User can override cover summary if needed
  ↓
PDF export uses the same payload
```

This page belongs to:

- Case Setup for source data
- Draft Disclosure for preview
- Export for final rendering

It should not require its own long editing page unless required fields are missing.

## Layout Contract

Target visual sections:

1. Brand/header area
2. Document title: `不動產說明書`
3. Property id row
4. Property name row
5. Short disclosure summary block, up to 10 lines
6. Signature/acknowledgement table
7. Store/company/contact information table
8. Production date

MVP visual direction:

```text
Use the conservative old PDF style first.
Do not use the decorative/new visual cover for MVP because it may slow template iteration.
The final art style can become a template option later, after the document workflow is stable.
```

## Field Contract

| Field key | Label | Type | Required | Primary source | Manual fallback / override | Target storage | Preview/PDF slot | Missing behavior | Entitlement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `cover.logo_asset_id` | 公司 Logo | asset_ref | no | Branding logo upload | Upload from Branding Settings | `branding.logo_blob` now; future `case_assets/company_logo` optional | Brand/header | Show text placeholder `未設定 LOGO` | Basic |
| `cover.company_name` | 公司名稱 | text | yes | Branding settings | Branding Settings edit | `branding.company_name` / storage branding | Company info table | Show `未填寫公司名稱` and export checklist warning | Basic |
| `cover.store_name` | 店名 | text | no | Branding/company settings | Branding Settings edit | existing storage branding or future `company_settings.store_name` | Company info table | Blank | Basic |
| `cover.company_license_no` | 公司牌照號 | text | no | Branding settings | Branding Settings edit | `branding.company_license_no` | Company info table | Blank | Basic |
| `cover.company_address` | 公司地址 | text | yes | Branding settings | Branding Settings edit | `branding.company_address` | Company info table | Show `未填寫地址` and export checklist warning | Basic |
| `cover.company_phone` | 公司電話 | text | yes | Branding settings | Branding Settings edit | `branding.company_phone` | Company info table | Show `未填寫電話` and export checklist warning | Basic |
| `cover.realtor_name` | 不動產經紀人 | text | no | Branding settings | Branding Settings edit | `branding.realtor_name` | Signature/info table | Blank | Basic |
| `cover.agent_name` | 業務員姓名 / 承辦人 | text | no | Branding settings or case assignment | Branding Settings / per-case override | `branding.agent_name`; future case assignment | Signature table | Blank | Basic |
| `cover.agent_cert_no` | 業務員證號 | text | no | Branding settings | Branding Settings edit | `branding.agent_cert_no` | Signature table or info table | Blank | Basic |
| `cover.case_no` | 物件編號 | text | yes | Case setup | Case Setup edit | `cases.case_no` | Property id row | Fallback to case id short code; checklist warning | Basic |
| `cover.case_name` | 物件名稱 | text | yes | Case setup | Case Setup edit | `cases.case_name` | Property name row/title | Fallback to address; checklist warning | Basic |
| `cover.address` | 物件地址 | text | yes | Case setup | Case Setup edit | `cases.address` | Summary source / optional hidden data | Checklist warning if empty | Basic |
| `cover.production_date` | 製表日期 | date | yes | System date at export/draft creation | Manual override only if enabled | `disclosure_drafts.cover.production_date` or generated at export | Date row | Auto-fill Asia/Taipei date | Basic |
| `cover.summary_items` | 摘要說明 | string[] max 10 | no | Generated from known fields | User override in cover summary editor | `disclosure_drafts.cover.summary_items` | Summary block | Show blank numbered rows or omit empty rows depending template | Basic manual; Pro/Advanced may auto-compose |
| `cover.signature_columns` | 簽認欄位 | enum/string[] | yes | Template default | Admin/template config later | static template config | Signature table | Default `承辦人 / 店長 / 經紀人 / 經紀人證號` for new visual cover, or old PDF style if chosen | Basic |

## Summary Items

The summary block should be generated from normalized disclosure fields when available.

Default candidate order for house/highrise:

1. 登記坪數 / 建物面積
2. 停車方式
3. 樓層規劃
4. 格局
5. 方位 / 座向
6. 銷售樓層
7. 用途
8. 建築完成日
9. 建設公司
10. 社區大樓名稱

Source mapping:

| Summary line | Candidate source |
| --- | --- |
| 登記坪數 | registry building display, `floor_area`, secretary supplement |
| 停車方式 | field visit parking field, registry if available |
| 樓層規劃 | `floor_this`, `floor_total`, field visit |
| 格局 | field visit / floor-plan payload |
| 方位 | field visit balcony/building orientation |
| 銷售樓層 | field visit sales floor |
| 用途 | registry legal use + field visit |
| 建築完成日 | registry/secretary supplement |
| 建設公司 | field visit / registry if available |
| 社區大樓名稱 | field visit |

MVP behavior:

- If source values are missing, do not hallucinate.
- Missing values must render as blank space, not `待補`.
- Blank space is intentional because the draft may be printed and handwritten on site.
- Allow user to edit summary items after auto-fill.

## Storage Contract

Current reusable storage:

- `cases.case_no`
- `cases.case_name`
- `cases.address`
- `cases.owner_name`
- `branding.logo_blob`
- `branding.logo_mime`
- `branding.agent_name`
- `branding.agent_cert_no`
- `branding.company_name`
- `branding.company_license_no`
- `branding.company_address`
- `branding.company_phone`
- `branding.realtor_name`
- `disclosure_drafts.payload_json`

Target payload shape in `disclosure_drafts.payload_json`:

```json
{
  "page_contract_version": 1,
  "cover": {
    "production_date": "2026-05-20",
    "summary_items": [
      "登記坪數：43.797 坪",
      "停車方式：坡道平面"
    ],
    "summary_overridden": true,
    "signature_columns": ["承辦人", "店長", "經紀人", "經紀人證號"]
  }
}
```

Do not duplicate stable branding text into every draft unless a per-case snapshot is intentionally created.

Recommended MVP rule:

```text
Use live branding settings for draft preview.
At PDF export time, create an export snapshot so later branding changes do not silently alter exported records.
```

Production date rule:

```text
Default to the Asia/Taipei export date.
Allow manual override during Beta because users may need to regenerate, backdate, or align with a customer-facing draft date.
```

## Preview Contract

Right-side preview input:

```ts
interface HouseCoverPreviewPayload {
  logoDataUrl?: string | null;
  companyName: string;
  storeName?: string;
  companyLicenseNo?: string;
  companyAddress: string;
  companyPhone: string;
  realtorName?: string;
  agentName?: string;
  agentCertNo?: string;
  caseNo: string;
  caseName: string;
  address: string;
  productionDate: string;
  summaryItems: string[];
  signatureColumns: string[];
}
```

Preview must:

- Fit A4 portrait ratio.
- Show the same values that PDF export will use.
- Avoid editing directly inside the preview for MVP.
- Highlight missing required fields in the left panel/checklist, not by breaking the preview.
- Preserve handwriting space for blank fields where the draft may be printed and taken to the property owner.

## PDF Contract

PDF renderer should consume the same normalized `HouseCoverPreviewPayload`.

Existing candidate:

- `src/lib/pdf-blocks/cover.tsx`

Required alignment changes later:

- Map `caseData.caseId` to `cover.case_no`.
- Map `caseData.propertyName` to `cover.case_name`.
- Map `caseData.summary` to `cover.summary_items`.
- Map branding fields to existing company/agent slots.
- Remove/debug-hide `Theme Cover: ...` text before production output.

## UI Contract

MVP UI should not be a separate full form unless required data is missing.

Recommended UI:

```text
Draft Disclosure Workbench
  Left panel:
    Cover status card
    Missing fields checklist
    Optional "edit summary" accordion
    Links/buttons to Case Setup and Branding Settings

  Right panel:
    Official-style cover preview
```

Editable on this page:

- `summary_items`
- `production_date`, with export-date default and manual override available during Beta

Edit elsewhere:

- Company/logo fields: Branding Settings
- Property id/name/address: Case Setup

## Entitlement Contract

Basic:

- Can manually set branding.
- Can manually set case name/id.
- Can manually edit cover summary.
- Can export cover in PDF.

Pro:

- Same as Basic.
- May auto-compose summary from registry/market data if available.

Advanced:

- Same as Pro.
- May use AI-assisted summary wording later.

Important:

```text
Plan should gate automation, not the existence of the cover page.
```

## Validation Rules

Required before export:

- `company_name`
- `company_address`
- `company_phone`
- `case_no` or generated fallback accepted by user
- `case_name` or address fallback accepted by user
- `production_date`

Warning only:

- Missing logo
- Missing agent name
- Missing agent certificate
- Missing company license number
- Fewer than 3 summary items

Draft-print behavior:

- Missing fields should not force `待補` text into the document body.
- Missing fields may appear in the left-panel checklist or export checklist, but the actual printable page should keep those spaces blank.
- The document must preserve enough vertical and horizontal space for handwriting on printed drafts.

Page number behavior:

- Do not hard-code `第 X 頁 / 共 Y 頁` into MVP page templates.
- Page count can change after adding attachments such as cadastral maps, images, or supplemental documents.
- If page numbers are needed later, they should be generated at final export only and disabled for draft/working copies by default.

## Acceptance Criteria

- Cover can render from existing case and branding data.
- Missing branding/case fields produce checklist warnings instead of a blank failure.
- Missing document body values render as blank writable space, not `待補`.
- User can preview cover before PDF export.
- User can edit summary text without changing underlying registry/source data.
- User can keep the default export date or manually override the date during Beta.
- PDF and preview use the same normalized payload.
- No cover data is uploaded to AIRE Cloud.

## Implementation Notes

Likely reusable modules:

- `src/components/case-wizard/CaseWizardStep1.tsx`
- `src/app/(dashboard)/settings/branding/branding-content.tsx`
- `src/lib/branding-api.ts`
- `src/lib/pdf-blocks/cover.tsx`
- `src/app/(dashboard)/cases/[id]/preview/page.tsx`

Likely new/changed modules later:

- `src/lib/page-contracts/house-cover.ts`
- `src/components/disclosure-workbench/HouseCoverPanel.tsx`
- `src/components/disclosure-workbench/HouseCoverPreview.tsx`
- `src/lib/pdf-engine/normalize-house-cover.ts`

## Decisions From Fish Review

1. MVP cover style uses the old/conservative PDF mode first.
2. Missing data renders blank, not `待補`.
3. Production date defaults to export date, with manual override available during Beta.
4. Draft documents must support a two-stage workflow: print blank draft for owner discussion and handwriting, then enter corrected data later for final output.
5. Do not hard-lock page number/page count into draft templates because pages may be inserted or expanded later.
