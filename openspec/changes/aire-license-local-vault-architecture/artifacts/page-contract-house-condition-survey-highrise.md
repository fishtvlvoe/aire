# Page Contract: house.condition_survey_highrise

Date: 2026-05-20

Status: Draft for Fish review

## Purpose

`house.condition_survey_highrise` defines the house-version on-site condition survey / property investigation form for the first target type: 大樓華廈.

Reference pages:

- `0520/不動產說明書/10-房屋-現況調查表-1.JPG`
- `0520/不動產說明書/10-房屋-現況調查表-2.JPG`
- `0520/不動產說明書/10-房屋-現況調查表-3.JPG`
- `0520/不動產說明書/10-房屋-現況調查表-4.JPG`
- `0520/不動產說明書/10-房屋-現況調查表-5-1+5.JPG`

This is not the same UI as the first case setup page. It is a field/survey workbench that supports draft printing, handwriting, and later formal supplement entry.

## References

| Reference | Path | Use |
| --- | --- | --- |
| Survey page images | `0520/不動產說明書/10-房屋-現況調查表-*.JPG` | Visual layout and question order. |
| Field visit source | `docs/0417-old/大樓華廈_現場必問清單.docx` | User workflow and on-site questions for first property type. |
| Secretary supplement | `docs/0417-old/大樓華廈_秘書後補清單.docx` | Back-office supplement fields. |
| Existing survey schema | `src/lib/disclosure-schema-building-survey.ts` | Existing code shape, but not fully aligned with these photos. |
| Existing HTML block | `src/lib/pdf-engine/html-blocks/building-condition-survey.tsx` | Existing renderer for 58-question survey; useful but needs alignment. |
| Existing PDF block | `src/lib/pdf-blocks/building-condition-survey.tsx`, `src/lib/pdf-blocks/condition-survey.tsx` | Existing PDF survey blocks; need Page Contract alignment. |

## Observed Page Structure

The photo set appears to contain 38 numbered questions across 5 pages.

High-level sections from OCR/visual inspection:

```text
Page 1:
  肆、現況調查表
  1-11: use/current condition, co-owner agreement, occupation, private road, important matters, penalty/transaction terms, electricity, water

Page 2:
  12-17: gas, drainage, nearby important environmental facilities, land ownership, other rights, trust registration

Page 3:
  18-25: encumbrances/restrictions/notes, Civil Code 826-1 registration, building coverage ratio, floor area ratio, development restrictions, slope land, soil/water conservation restrictions

Page 4:
  26-35: river/drainage/water-related restrictions, national park protection areas, drinking-water/water-quality protection, pollution site, cadastral resurvey, boundary encroachment, expropriation, zoning/use district

Page 5:
  36: tax items
  37: registration/official fees
  38: other fees
```

Important mismatch:

```text
Current `src/lib/disclosure-schema-building-survey.ts` defines a 58-question building survey.
The photo set here is a 38-question visual form.
Do not assume the current 58-question schema is already aligned with the customer reference.
```

MVP decision:

```text
Use the photo's 38-question customer form as the MVP survey template.
The existing 58-question schema can be mapped, archived, or kept as a later separate template, but it must not be the primary MVP output unless every question is explicitly mapped to the 38-question reference.
```

## User Workflow

```text
Case Setup
  ↓
Draft Disclosure
  ↓
Field Survey Workbench
  print blank/partial survey or fill on device
  ↓
On-site handwriting / customer confirmation
  ↓
Formal Supplement
  enter handwritten answers and fee estimates
  ↓
Final PDF export
```

## Layout Contract

MVP visual direction:

- Use the old/conservative form style.
- Keep question numbers and grouping close to the photos.
- Use yes/no/blank controls for most questions.
- Missing answers render blank checkboxes/lines, not `待補`.
- Keep enough writing space for manual notes.
- Do not hard-code page number/page count in draft output.

Required visual zones:

1. Header row with property id/name and company mark.
2. Title `肆、現況調查表`.
3. Numbered question rows.
4. Yes/no or checkbox answers.
5. Explanation lines.
6. Fee estimate rows on page 5.
7. Optional final-export page number only if final mode later enables dynamic numbering.

## Survey Section Contract

| Section key | Visual pages | Question range | Purpose | Existing code alignment |
| --- | --- | --- | --- | --- |
| `condition_survey.current_use` | page 1 | 1-11 | Current use, agreements, occupation, road/use issues, transaction terms, electricity/water | partially overlaps existing q1-q14 but labels differ. |
| `condition_survey.utilities_rights` | page 2 | 12-17 | Gas, drainage, nearby facilities, ownership/rights/trust | partially overlaps existing q14-q18, rights fields differ. |
| `condition_survey.land_restrictions` | page 3 | 18-25 | Encumbrance/restriction notes, Civil Code 826-1, ratios, development/slope/water-soil restrictions | partially overlaps existing q19-q25, but exact labels differ. |
| `condition_survey.environmental_controls` | page 4 | 26-35 | River/drainage/national park/water protection/pollution/resurvey/encroachment/expropriation/zoning | partially overlaps existing q26-q35. |
| `condition_survey.fee_estimates` | page 5 | 36-38 | Tax/fee/other estimated amounts | overlaps fee/tax pages but is survey-style manual entry. |

## Field Contract

Use a normalized question model instead of hard-coding `q1` meaning globally.

| Field key | Label | Type | Required | Primary source | Manual fallback / override | Target storage | Preview/PDF slot | Missing behavior | Entitlement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `condition_survey.case_no` | 物件編號 | text | yes | `cases.case_no` | Case Setup | `cases` | Header | Blank/checklist warning | Complete build first |
| `condition_survey.case_name` | 物件名稱 | text | yes | `cases.case_name` | Case Setup | `cases` | Header | Blank/checklist warning | Complete build first |
| `condition_survey.form_version` | 表單版本 | text | yes | Page contract/template | Admin | `disclosure_drafts` | Hidden/export metadata | Default latest | Complete build first |
| `condition_survey.questions[].question_no` | 題號 | number | yes | Template | Admin | `disclosure_drafts` | Question row | Default | Complete build first |
| `condition_survey.questions[].label` | 題目 | text | yes | Template | Admin | `disclosure_drafts` | Question row | Default | Complete build first |
| `condition_survey.questions[].answer` | 答案 | enum | no | Field survey | Manual | `disclosure_drafts.survey_data` | Checkbox/radio | Blank checkbox | Complete build first |
| `condition_survey.questions[].note` | 說明/備註 | text | no | Field survey | Manual | `disclosure_drafts.survey_data` | Explanation line | Blank line | Complete build first |
| `condition_survey.questions[].amount` | 金額 | number/text | no | Field survey / supplement | Manual | `disclosure_drafts.survey_data` | Fee rows | Blank line | Complete build first |
| `condition_survey.questions[].attachments` | 相關照片/附件 | asset refs | no | Field photo upload | Manual upload | `case_assets` | Future photo reference | Blank | Complete build first |

Answer enum:

```text
yes | no | unknown | blank | custom
```

MVP printed behavior:

- `blank` or null = no checkbox selected and writable line.
- Use empty yes/no checkboxes plus writable explanation space, following the photo's business-readable form style.
- Do not print `未填` or `待補` inside the PDF body.

## Storage Contract

Target `disclosure_drafts.payload_json` shape:

```json
{
  "page_contract_version": 1,
  "condition_survey": {
    "form_version": "house-condition-survey-highrise-2026-05-20",
    "property_type": "大樓華廈",
    "questions": [
      {
        "question_no": 1,
        "section_key": "current_use",
        "label": "是否有依慣例使用之現況？",
        "answer": "",
        "note": "",
        "amount": "",
        "attachments": []
      }
    ]
  }
}
```

Current code uses a fixed 58-question `BuildingSurveyData` shape. For MVP, implementation should replace/extend the survey model with a Page Contract driven 38-question template. The old 58-question model can only be reused behind an explicit mapping layer.

Preferred direction:

```text
Use Page Contract driven survey templates.
Do not force the customer 38-question form into the existing 58-question schema if labels do not match.
```

## Preview Contract

Right-side preview payload:

```ts
interface HouseConditionSurveyHighrisePreviewPayload {
  caseNo: string;
  caseName: string;
  companyName?: string;
  logoDataUrl?: string | null;
  formVersion: string;
  pages: Array<{
    pageKey: string;
    title: string;
    questions: Array<{
      questionNo: number;
      label: string;
      answer: "yes" | "no" | "unknown" | "blank" | "custom";
      note: string;
      amount?: string;
    }>;
  }>;
  draftMode: boolean;
  showPageNumber: boolean;
}
```

Preview requirements:

- A4 portrait.
- Multiple pages matching the photo page grouping.
- Blank answers render blank checkbox/line.
- No `待補`.
- No hard-coded page count in draft mode.
- Enough line spacing for handwriting.

## PDF Contract

PDF export must use the same normalized payload as the HTML/right-side preview.

Font requirements:

- PDF must use embedded/registered Traditional Chinese capable font.
- Every PDF export path must call `initReactPdfEngine()` before rendering with `@react-pdf/renderer`.
- Renderer must not rely on browser CSS fonts for PDF output.
- Add verification with Chinese sample text from these pages:
  - `肆、現況調查表`
  - `是否有依慣例使用之現況`
  - `周邊環境`
  - `土地增值稅預估`
  - `所有權移轉代辦費預估`

## UI Contract

Workbench surface:

```text
Field Survey
  Page list:
    現況調查表 1
    現況調查表 2
    現況調查表 3
    現況調查表 4
    稅費/規費/其他費用

  Left panel:
    Question groups
    yes/no/blank controls
    explanation text fields
    fee amount fields
    photo/attachment links

  Right panel:
    Official-style survey preview
```

This workbench is separate from:

- Case Setup
- Draft Disclosure main pages
- Formal Supplement
- Images/Maps

## Entitlement Contract

Current build direction:

- Build the complete/highest-capability disclosure workflow first.
- Do not block this Page Contract on Basic/Pro packaging.

Future packaging direction:

- Manual survey input should be available for disclosure completion.
- AI-assisted completion, photo extraction, or automatic environmental checks may be gated later.
- The printed survey layout should not disappear by plan tier.

## Validation Rules

Draft mode:

- No hard blocking required except case existence.
- Unanswered questions are allowed and render blank.
- Checklist can show unanswered recommended questions outside the printable body.

Final mode:

- Warn if required legal/survey questions remain blank.
- Warn if fee estimates are shown without source/manual confirmation.
- Warn if photos are referenced but missing.

Do not block final export until legal/product review decides which survey answers are hard-blocking.

## Page Number Rule

- Draft mode: no hard-coded `第 X 頁 / 共 Y 頁`.
- Final mode: dynamic numbering may be added later after all inserts/attachments are assembled.
- Source image page counts must not be copied as static text.

## Acceptance Criteria

- Page Contract covers the 5 visible `10-房屋-現況調查表-*` pages.
- MVP renders the photo's 38-question form as the primary customer-facing survey.
- Missing answers render blank in preview/PDF.
- The survey can be printed and handwritten.
- The implementation does not blindly reuse the current 58-question schema without mapping.
- Existing `NotoSansTC` font initialization is required in all PDF paths.
- PDF and preview consume one normalized payload.
- No property data is uploaded to AIRE Cloud.

## Implementation Notes

Potential reusable modules:

- `src/lib/disclosure-schema-building-survey.ts`
- `src/lib/pdf-engine/html-blocks/building-condition-survey.tsx`
- `src/lib/pdf-blocks/building-condition-survey.tsx`
- `src/lib/pdf-blocks/condition-survey.tsx`

Likely new/changed modules later:

- `src/lib/page-contracts/house-condition-survey-highrise.ts`
- `src/components/disclosure-workbench/HouseConditionSurveyHighrisePanel.tsx`
- `src/components/disclosure-workbench/HouseConditionSurveyHighrisePreview.tsx`
- `src/lib/pdf-engine/normalize-house-condition-survey-highrise.ts`
- `src/lib/pdf-blocks/house-condition-survey-highrise-page.tsx`

## Open Questions For Fish

1. Should field photos attach to individual survey questions, or only to global case asset slots first?
