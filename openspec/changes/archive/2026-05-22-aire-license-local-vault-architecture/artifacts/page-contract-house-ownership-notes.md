# Page Contract: house.ownership_notes

Date: 2026-05-20

Status: Draft for Fish review

## Purpose

`house.ownership_notes` defines the house-version disclosure page for `三、【產權相關注意事項】`.

Reference page:

- `0520/不動產說明書/6.JPG`

This page is mostly fixed legal/risk notice text. It should be generated from a controlled template, not treated like ordinary free-form user content. Case-specific toggles may be added later, but the MVP should first reproduce the business-readable notice page.

MVP decision:

```text
Use fixed legal/risk templates. Normal users cannot freely edit clause wording in the case workbench.
Wording changes must go through admin/legal template versioning.
MVP prints the fixed legal clauses by default instead of conditionally hiding clauses.
```

## References

| Reference | Path | Use |
| --- | --- | --- |
| Page image | `0520/不動產說明書/6.JPG` | Visual layout and clause order. |
| Existing component | `src/components/DossierPage6Notices.tsx` | Existing but incomplete notice component; current code has 6 generic notices, while photo has 11 practical clauses. |
| Existing test | `src/components/__tests__/DossierPage6Notices.test.tsx` | Current test expectations; will need update when implementation follows the Page Contract. |
| 105 official format | `0520/不動產說明書/20-(105-04-29)成屋不動產說明書格式範例.pdf` | Related legal/risk disclosure categories. |
| Source inventory | `artifacts/house-building-source-inventory.md` | Risk/condition fields that may feed future toggles. |

## Observed Page Structure

From `6.JPG`:

```text
Header:
  建安不動產 logo/name
  物件編號
  物件名稱

Title:
  三、【產權相關注意事項】

Numbered clauses:
  1. 平均地權條例第47條 / 實價登錄申報
  2. 財產交易所得稅 / 房地合一所得稅申報
  3. 優惠性貸款資格與額度
  4. 營業用途與相關主管機關審查
  5. 增建部分無所有權與拆除/永久使用風險
  6. 頂樓/一樓前後院空地增建承受
  7. 未承購停車位時使用共有地下室/停車空間
  8. 增值稅重購退稅資格自行確認
  9. 土地增值稅及所得稅重購退稅條件與義務
  10. 建物現況使用須符合登記用途、使用執照、使用分區、住戶規約
  11. 違約或解約罰則與仲介服務費

Footer:
  hard-coded page count appears in reference image, but MVP draft should not hard-code page count
```

## User Workflow

```text
Draft Disclosure Workbench
  ↓
System loads default notice template
  ↓
Right preview shows legal/risk notices
  ↓
Formal Supplement, if needed
  ↓
Admin/operator can adjust wording only through controlled template process
  ↓
Final PDF export
```

## Layout Contract

MVP visual direction:

- Use the old/conservative PDF style.
- Render as a numbered legal notice page.
- Keep it readable; do not over-compress line height.
- No `待補`; most clauses are fixed text and should print by default.
- Do not hard-code page number/page count in draft output.

Required visual zones:

1. Header row with property id/name and company mark.
2. Page title `三、【產權相關注意事項】`.
3. Numbered clauses 1-11.
4. Optional continuation page if legal text is too long.
5. Optional final-export page number only if final mode later enables dynamic numbering.

## Clause Contract

| Clause key | Index | Topic | Source | Editable by normal user | Preview/PDF behavior |
| --- | --- | --- | --- | --- | --- |
| `ownership_notes.real_price_registration` | 1 | 平均地權條例第47條 / 實價登錄申報 | Template | no | Print default clause. |
| `ownership_notes.property_income_tax` | 2 | 財產交易所得稅 / 房地合一稅 | Template | no | Print default clause. |
| `ownership_notes.preferential_loan` | 3 | 優惠性貸款資格與額度 | Template | no | Print default clause. |
| `ownership_notes.business_use_check` | 4 | 營業用途法規與主管機關審查 | Template | no | Print default clause. |
| `ownership_notes.addition_no_ownership` | 5 | 增建部分無所有權與拆除/永久使用風險 | Template + future case toggle | no | Print default clause; future may highlight if case has addition. |
| `ownership_notes.roof_yard_addition` | 6 | 頂樓/一樓前後院空地增建承受 | Template + future case toggle | no | Print default clause. |
| `ownership_notes.parking_shared_space` | 7 | 未承購停車位時共有地下室/停車空間使用 | Template + future parking data | no | Print default clause. |
| `ownership_notes.land_value_tax_refund` | 8 | 增值稅重購退稅資格自行確認 | Template | no | Print default clause. |
| `ownership_notes.repurchase_tax_obligations` | 9 | 土地增值稅及所得稅重購退稅條件與義務 | Template | no | Print default clause. |
| `ownership_notes.use_compliance` | 10 | 現況使用與登記用途/使用執照/使用分區/住戶規約一致 | Template + future use-status data | no | Print default clause. |
| `ownership_notes.breach_termination_fee` | 11 | 違約/解約罰則與仲介服務費 | Template | no | Print default clause. |

Normal case workers should not freely rewrite these clauses in the workbench. If wording must change, it should be an admin/legal template update, because this page affects legal risk.

## Field Contract

| Field key | Label | Type | Required | Primary source | Manual fallback / override | Target storage | Preview/PDF slot | Missing behavior | Entitlement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ownership_notes.case_no` | 物件編號 | text | yes | `cases.case_no` | Case Setup | `cases` | Header | Blank/checklist warning | Complete build first |
| `ownership_notes.case_name` | 物件名稱 | text | yes | `cases.case_name` | Case Setup | `cases` | Header | Blank/checklist warning | Complete build first |
| `ownership_notes.template_version` | 注意事項模板版本 | text | yes | Template registry | Admin | `disclosure_drafts`, future template table | Hidden/export metadata | Default latest | Complete build first |
| `ownership_notes.clauses[]` | 條款列表 | array | yes | Controlled template | Admin/legal update only | `disclosure_drafts`, future template table | Body | Default latest | Complete build first |
| `ownership_notes.case_highlights.addition_present` | 增建提示 | boolean/null | no | Field survey | Manual survey | `disclosure_drafts` | Future checklist/highlight | Blank/no highlight | Complete build first |
| `ownership_notes.case_highlights.parking_not_purchased` | 未承購車位提示 | boolean/null | no | Parking data | Manual | `disclosure_drafts` | Future checklist/highlight | Blank/no highlight | Complete build first |
| `ownership_notes.case_highlights.use_mismatch_risk` | 用途不符提示 | boolean/null | no | Registry/field survey | Manual | `disclosure_drafts` | Future checklist/highlight | Blank/no highlight | Complete build first |

## Storage Contract

Target `disclosure_drafts.payload_json` shape:

```json
{
  "page_contract_version": 1,
  "ownership_notes": {
    "template_version": "house-ownership-notes-2026-05-20",
    "clauses": [
      {
        "key": "real_price_registration",
        "index": 1,
        "topic": "平均地權條例第47條 / 實價登錄申報",
        "text": "依平均地權條例第47條規定，權利人及義務人應於買賣案件申請所有權移轉登記時，向主管機關申報登錄土地及建物成交案件實際資訊..."
      }
    ],
    "case_highlights": {
      "addition_present": null,
      "parking_not_purchased": null,
      "use_mismatch_risk": null
    }
  }
}
```

MVP can store the template snapshot in `disclosure_drafts` so exported PDFs remain reproducible. A future admin template table can own master wording.

## Source / API Mapping

This page has no primary MOI/COP API dependency for rendering the base clauses.

Future data-assisted highlights may use:

| Highlight | Source candidate |
| --- | --- |
| Addition present | Field survey / secretary supplement |
| Parking not purchased | Parking section / registry parking data |
| Use mismatch risk | 建物用途, 使用分區, field survey |
| Real-price registration reminder | Transaction workflow state |

Do not block MVP on these future highlights.

## Preview Contract

Right-side preview payload:

```ts
interface HouseOwnershipNotesPreviewPayload {
  caseNo: string;
  caseName: string;
  companyName?: string;
  logoDataUrl?: string | null;
  templateVersion: string;
  clauses: Array<{
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
- Old/conservative PDF style.
- Numbered list must be readable at print size.
- No `待補`.
- No hard-coded page count in draft mode.
- If clauses overflow, continue to next dynamic page.

## PDF Contract

PDF export must use the same normalized payload as the HTML/right-side preview.

Font requirements:

- PDF must use embedded/registered Traditional Chinese capable font.
- Every PDF export path must call `initReactPdfEngine()` before rendering with `@react-pdf/renderer`.
- Renderer must not rely on browser CSS fonts for PDF output.
- Add verification with Chinese sample text from this page:
  - `三、【產權相關注意事項】`
  - `平均地權條例第47條`
  - `增建部份`
  - `重購退稅`
  - `違約或解約`

## UI Contract

Workbench surface:

```text
Draft Disclosure
  Page list: 產權相關注意事項

  Left panel:
    Template version status
    Clause checklist/read-only preview
    Future case highlights
    Legal review warning

  Right panel:
    Official-style notice page preview
```

Editable here:

- MVP: no normal user clause editing.
- Future: admin/legal template editor outside the case workbench.
- Future: case-highlight toggles from survey/parking/use-status data.

## Entitlement Contract

Current build direction:

- Build the complete/highest-capability disclosure workflow first.
- Do not block this Page Contract on Basic/Pro packaging.

Future packaging direction:

- This legal notice page should not be gated away by plan tier.
- Automation/highlighting may be gated later, but fixed legal notices should remain part of the output when the page is included.

## Validation Rules

Draft mode:

- Require a template version and at least the default clause set.
- Warn if case number/name missing.
- Print the default clause set even before case-specific highlights are available.

Final mode:

- Warn if template version is stale compared with admin/legal current version.
- Warn if any default clause is missing.
- Do not allow normal user edits to silently alter legal wording without marking an override.

## Page Number Rule

- Draft mode: no hard-coded `第 X 頁 / 共 Y 頁`.
- Final mode: dynamic numbering may be added later after all inserts/attachments are assembled.
- The source image's `第 6 頁 / 共 9 頁` must not be copied as static text.

## Acceptance Criteria

- Page Contract maps the 11 visible notice topics from `6.JPG`.
- The implementation does not regress to the existing 6-generic-notice component.
- Clauses render in readable Traditional Chinese.
- The page can be printed.
- Existing `NotoSansTC` font initialization is required in all PDF paths.
- PDF and preview consume one normalized payload.
- No property data is uploaded to AIRE Cloud.

## Implementation Notes

Potential reusable modules:

- `src/lib/pdf-engine/react-pdf-init.ts`
- `src/components/DossierPage6Notices.tsx` only as a starting point; it is incomplete relative to this contract.

Likely new/changed modules later:

- `src/lib/page-contracts/house-ownership-notes.ts`
- `src/components/disclosure-workbench/HouseOwnershipNotesPanel.tsx`
- `src/components/disclosure-workbench/HouseOwnershipNotesPreview.tsx`
- `src/lib/pdf-engine/normalize-house-ownership-notes.ts`
- `src/lib/pdf-blocks/house-ownership-notes-page.tsx`

## Open Questions For Fish

1. Should case-specific risks such as 增建, 未承購車位, or 用途不符 be highlighted visually, or remain plain text first?
