# Page Contract: house.market_reference

Date: 2026-05-20

Status: Draft for Fish review

## Purpose

`house.market_reference` defines the house-version attachment/page for transparent price and transaction-market reference.

Reference page:

- `0520/不動產說明書/5.JPG`

This page is not the core registry/legal disclosure table. It is a market reference appendix that helps the agent and customer understand nearby transaction prices. Because Fish decided to build the complete/highest-capability disclosure flow first, this page is included in the Page Contract set now, while Basic/Pro packaging remains deferred.

MVP decision:

```text
透明房價/成交行情 should be output-ready in the first version, but it is an optional appendix.
Do not treat it as a hard mandatory MVP output unless a later customer/legal review requires it.
```

## References

| Reference | Path | Use |
| --- | --- | --- |
| Page image | `0520/不動產說明書/5.JPG` | Visual layout and table structure. |
| Extracted reference | `docs/reference-disclosure-document.md` | OCR/extracted page-5 row examples. |
| Dossier spec | `docs/dossier-implementation-spec.md` | Defines 成交行情/透明房價 as an appendix sourced from external data. |
| Dossier schema | `docs/extracted-dossier-schema.md` | Classifies transparent price / market page as 市況/行情附錄. |
| Source inventory | `artifacts/house-building-source-inventory.md` | Field source and entitlement direction. |
| Existing HTML block | `src/lib/pdf-engine/html-blocks/transaction-history.tsx` | Existing transaction-history table shape to reuse/refactor. |
| Existing backend command | `src-tauri/src/commands/real_price.rs` | Existing real-price query command placeholder. |

## Observed Page Structure

From `5.JPG`:

```text
Header:
  建安不動產 brand
  store/company phone
  agent phone / Line ID

Title:
  透明房價一覽表/成交行情

Subtitle:
  相同地段小段成交行情及周遭2000公尺內內部成交行情

Subject:
  物件名稱 + 物件編號 + 成交行情

Table:
  地址(或區段地址)
  several numeric/date columns

Bottom notes:
  unit/source explanation
  warning that unregistered building parts, relatives/friends transactions, etc. may affect transaction price
  customer signature/date line
  reference-only disclaimer

Slogan:
  建立長久的信任 安心滿意的成交

Footer:
  hard-coded attachment page count appears in reference image, but MVP should not hard-code volatile page counts
```

OCR confidence note:

- The first visible table header is clear: `地址(或區段地址)`.
- Numeric/date columns are visible but not fully readable from the photo.
- Existing code and older extraction suggest the practical columns should be `成交總價`, `交易日期`, `單價`, and `面積/坪數`.
- The first implementation should allow configurable display labels and not hard-code uncertain OCR labels.

## User Workflow

```text
Case Setup
  ↓
Market data source selection
  ↓
Draft Disclosure Workbench
  left: market rows + source/explanation controls
  right: transparent-price preview
  ↓
Print draft/appendix if needed
  ↓
Formal Supplement Workbench
  update rows, notes, signature/date
  ↓
Final PDF export
```

## Layout Contract

MVP visual direction:

- Use the old/conservative page structure, but keep this page visibly separate as a market appendix.
- Keep the table readable; avoid squeezing too many columns into tiny type.
- Missing fields render blank, not `待補`.
- Do not hard-code page number/page count in draft output.
- Support row pagination when there are many transaction records.

Required visual zones:

1. Branded header with company/store/agent contact.
2. Title `透明房價一覽表/成交行情`.
3. Scope subtitle.
4. Subject line with property name and case number.
5. Transaction table.
6. Unit/source note and disclaimer.
7. Customer signature/date line.
8. Optional slogan/brand footer.
9. Optional final-export page number only if final mode later enables dynamic numbering.

## Field Contract

| Field key | Label | Type | Required | Primary source | Manual fallback / override | Target storage | Preview/PDF slot | Missing behavior | Entitlement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `market_reference.case_no` | 物件編號 | text | yes | `cases.case_no` | Case Setup | `cases` | Subject/header | Blank/checklist warning | Complete build first |
| `market_reference.case_name` | 物件名稱 | text | yes | `cases.case_name` | Case Setup | `cases` | Subject/header | Blank/checklist warning | Complete build first |
| `market_reference.company_name` | 公司名稱 | text | no | Settings | Manual | `company_settings` | Header | Blank | Complete build first |
| `market_reference.store_contact` | 店名/電話 | text | no | Settings | Manual | `company_settings` | Header | Blank | Complete build first |
| `market_reference.agent_contact` | 業務電話/Line | text | no | Case/agent settings | Manual | `company_settings`, `cases` | Header | Blank | Complete build first |
| `market_reference.title` | 標題 | text | yes | Template | Manual | `disclosure_drafts` | Title | Default | Complete build first |
| `market_reference.scope_note` | 範圍說明 | text | no | Template / query params | Manual | `disclosure_drafts`, `market_snapshots` | Subtitle | Default/blank | Complete build first |
| `market_reference.query_radius_m` | 查詢半徑 | number | no | Query config | Manual | `market_snapshots` | Scope note | Blank | Complete build first |
| `market_reference.same_section_only` | 是否相同地段小段 | boolean | no | Query config | Manual | `market_snapshots` | Scope note | Blank | Complete build first |
| `market_reference.records[].address_or_section` | 地址或區段地址 | text | yes | Real-price/public data | Manual row entry | `market_snapshots`, `disclosure_drafts` | Table | Blank row cell | Complete build first |
| `market_reference.records[].total_price_wan` | 成交總價（萬元） | number/text | no | Real-price/public data | Manual row entry | `market_snapshots`, `disclosure_drafts` | Table | Blank row cell | Complete build first |
| `market_reference.records[].transaction_date` | 交易日期 | date/text | no | Real-price/public data | Manual row entry | `market_snapshots`, `disclosure_drafts` | Table | Blank row cell | Complete build first |
| `market_reference.records[].unit_price_wan_per_ping` | 單價（萬元/坪） | number/text | no | Real-price/public data | Manual/calculated | `market_snapshots`, `disclosure_drafts` | Table | Blank row cell | Complete build first |
| `market_reference.records[].area_ping` | 坪數 | number/text | no | Real-price/public data | Manual row entry | `market_snapshots`, `disclosure_drafts` | Table | Blank row cell | Complete build first |
| `market_reference.records[].notes` | 備註/註記 | text | no | Real-price/public data | Manual row entry | `market_snapshots`, `disclosure_drafts` | Optional table/footnote | Blank | Complete build first |
| `market_reference.unit_note` | 單位說明 | text | no | Template | Manual | `disclosure_drafts` | Bottom notes | Default/blank | Complete build first |
| `market_reference.data_source_note` | 資料來源說明 | textarea | no | Template / data source | Manual | `market_snapshots`, `disclosure_drafts` | Bottom notes | Default/blank | Complete build first |
| `market_reference.disclaimer_note` | 參考免責說明 | textarea | no | Template | Manual | `disclosure_drafts` | Bottom notes | Default/blank | Complete build first |
| `market_reference.customer_signature_name` | 客戶簽名 | text | no | Formal supplement | Manual | `disclosure_drafts` | Signature line | Blank line | Complete build first |
| `market_reference.signature_date` | 日期 | date/text | no | Formal supplement | Manual | `disclosure_drafts` | Signature line | Blank line | Complete build first |

## Data Source Mapping

| Source | Current status | MVP behavior |
| --- | --- | --- |
| Manual table entry | Always available | User can type/paste records. |
| Existing `query_real_price` command | `src-tauri/src/commands/real_price.rs` exists but is thin and calls `mcp_client::call_opendata_query` | Treat as integration candidate, not proven final source. |
| Existing HTML table block | `src/lib/pdf-engine/html-blocks/transaction-history.tsx` exists | Reuse/refactor, but change missing value behavior from dash-style placeholders to blank for draft output. |
| Public real-price / 實價登錄 data | Project docs discuss open-data delay and batch/API approaches | Record source/update date and show disclaimer. |
| Internal/transparent price source | Reference image says internal nearby transactions within 2000m | Keep as configurable/imported data source; do not assume cloud upload of customer case data. |

## Storage Contract

Current storage candidates:

- `cases.case_no`
- `cases.case_name`
- `market_snapshots`
- `disclosure_drafts.payload_json`

Target `disclosure_drafts.payload_json` shape:

```json
{
  "page_contract_version": 1,
  "market_reference": {
    "title": "透明房價一覽表/成交行情",
    "scope_note": "相同地段小段成交行情及周遭2000公尺內成交行情",
    "query_radius_m": 2000,
    "same_section_only": true,
    "records": [
      {
        "address_or_section": "公英段700-1地號",
        "total_price_wan": "26.6",
        "transaction_date": "114/11/11",
        "unit_price_wan_per_ping": "44",
        "area_ping": "0.60",
        "notes": ""
      }
    ],
    "unit_note": "單位說明：成交價(萬元)、單價(萬元/坪)、建坪(坪)。",
    "data_source_note": "",
    "disclaimer_note": "",
    "customer_signature_name": "",
    "signature_date": ""
  }
}
```

`market_snapshots` should store imported/fetched market data locally. `disclosure_drafts` stores display overrides and final export snapshot. Do not upload property/case market context to AIRE Cloud unless the privacy model is explicitly changed.

## Preview Contract

Right-side preview payload:

```ts
interface HouseMarketReferencePreviewPayload {
  caseNo: string;
  caseName: string;
  companyName?: string;
  storeContact?: string;
  agentContact?: string;
  logoDataUrl?: string | null;
  title: string;
  scopeNote: string;
  records: Array<{
    addressOrSection: string;
    totalPriceWan: string;
    transactionDate: string;
    unitPriceWanPerPing: string;
    areaPing: string;
    notes?: string;
  }>;
  unitNote: string;
  dataSourceNote: string;
  disclaimerNote: string;
  customerSignatureName: string;
  signatureDate: string;
  draftMode: boolean;
  showPageNumber: boolean;
}
```

Preview requirements:

- A4 portrait.
- Table is readable at print size.
- Missing values render as blank, not `待補` or dash placeholders in draft output.
- No hard-coded page count in draft mode.
- Rows paginate dynamically.
- Keep the page visibly marked as market/reference appendix, not government registry fact.

## PDF Contract

PDF export must use the same normalized payload as the HTML/right-side preview.

Font requirements:

- PDF must use embedded/registered Traditional Chinese capable font.
- Every PDF export path must call `initReactPdfEngine()` before rendering with `@react-pdf/renderer`.
- Renderer must not rely on browser CSS fonts for PDF output.
- Add verification with Chinese sample text from this page:
  - `透明房價一覽表/成交行情`
  - `相同地段小段成交行情`
  - `地址(或區段地址)`
  - `建立長久的信任 安心滿意的成交`

## UI Contract

Workbench surface:

```text
Draft Disclosure
  Page list: 透明房價/成交行情

  Left panel:
    Data source controls
    Query/import status
    Transaction table editor
    Source/disclaimer notes
    Signature/date controls

  Right panel:
    Official-style transparent-price preview
```

Editable here:

- query radius / scope note
- transaction rows
- unit/source/disclaimer notes
- signature/date fields

Edit elsewhere:

- case number/name: Case Setup
- company/logo/contact: Branding Settings
- raw imported/fetched market data: stored locally; user edits display snapshot

## Entitlement Contract

Current build direction:

- Build the complete/highest-capability disclosure workflow first.
- Do not block this Page Contract on Basic/Pro packaging.

Future packaging direction:

- Manual table entry/upload can remain available in lower tiers if the product allows it.
- Automated real-price lookup and market analysis are likely Pro/Advanced automation features.
- The output slot should remain stable; plan gates automation, not the document layout.

## Validation Rules

Draft mode:

- No hard blocking required except case existence.
- Empty records are allowed and render a blank table or blank rows.
- Checklist should indicate when no market rows exist.

Final mode:

- Warn if no market rows exist and this page is included.
- Warn if data source/update date is blank.
- Warn if source says auto-query ran but no local snapshot is persisted.

Do not block final export when this optional appendix is excluded or left blank.

## Page Number Rule

- Draft mode: no hard-coded page count.
- Final mode: dynamic numbering may be added later after all inserts/attachments are assembled.
- The source image's `第1頁 / 共1頁` must not be copied as static text.

## Acceptance Criteria

- Page Contract maps the visible purpose and core table fields from `5.JPG`.
- Missing fields render blank in preview/PDF.
- The page supports optional inclusion, manual row entry, and future auto-import/query.
- The page can be printed.
- Existing `NotoSansTC` font initialization is required in all PDF paths.
- The contract separates raw market snapshot from user-edited display/export values.
- PDF and preview consume one normalized payload.
- No property data is uploaded to AIRE Cloud.

## Implementation Notes

Potential reusable modules:

- `src/lib/pdf-engine/react-pdf-init.ts`
- `src/lib/pdf-engine/html-blocks/transaction-history.tsx`
- `src-tauri/src/commands/real_price.rs`

Likely new/changed modules later:

- `src/lib/page-contracts/house-market-reference.ts`
- `src/components/disclosure-workbench/HouseMarketReferencePanel.tsx`
- `src/components/disclosure-workbench/HouseMarketReferencePreview.tsx`
- `src/lib/pdf-engine/normalize-house-market-reference.ts`
- `src/lib/pdf-blocks/house-market-reference-page.tsx`

## Open Questions For Fish

1. Should the first MVP table show the same 5 visible columns as the photo, or use the existing code's clearer columns: 地址、面積、總價、單價、交易日期?
2. Should AI generate a short market interpretation paragraph later, or should MVP only show raw rows and disclaimers?
