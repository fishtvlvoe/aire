## ADDED Requirements

### Requirement: Overlay input layer in PdfPreviewer

`PdfPreviewer` SHALL render an absolutely-positioned transparent overlay div over the PDF canvas. The overlay SHALL contain `<input>` elements positioned at the coordinates defined in `src/lib/pdf-field-coords.ts` for the current PDF page. The initial version SHALL cover only the cover page (page 1) fields: 承辦人, 經紀人, 物件名稱. Each input SHALL be invisible (transparent background, no border) until focused.

#### Scenario: Clicking a cover page field

- **GIVEN** the PDF cover page is rendered at 99% zoom (scale = 0.99)
- **AND** `PDF_FIELD_COORDS.agent_name = { page: 1, x: 100, y: 618, w: 200, h: 22 }`
- **WHEN** the user clicks the overlay at approximately (99, 612)
- **THEN** the `<input>` for `agent_name` receives focus and displays a visible underline border

##### Example:

| field_key | PDF coords (x, y, w, h) | scale | overlay position (left, top, width, height) |
|-----------|------------------------|-------|---------------------------------------------|
| agent_name | 100, 618, 200, 22 | 0.99 | 99, 612, 198, 21 |
| broker_name | 100, 645, 200, 22 | 0.99 | 99, 638, 198, 21 |
| property_name | 100, 518, 300, 22 | 0.99 | 99, 513, 297, 21 |

### Requirement: Blur saves and re-renders

When an overlay input loses focus (blur event), `PdfPreviewer` SHALL call `save_draft(caseId, updatedPayload, schemaVersion)` with the new field value merged into the existing payload. On save success, `PdfPreviewer` SHALL trigger a PDF re-render to reflect the updated value. On save failure, a toast "預覽更新失敗" SHALL appear and the previous rendered PDF SHALL remain visible.

#### Scenario: Editing承辦人 field

- **WHEN** the user types a value in the 承辦人 overlay input and clicks outside
- **THEN** `save_draft` is called, the PDF re-renders, and the承辦人 field in the PDF shows the new value

#### Scenario: Save failure

- **WHEN** `save_draft` returns an error after blur
- **THEN** a toast "預覽更新失敗" appears and the PDF continues to show the previous value

### Requirement: Scale-aware coordinate adjustment

Overlay input positions SHALL be multiplied by the current PDF viewer scale factor (default 0.99 ≈ 99% zoom) to maintain alignment with the rendered PDF canvas. If the PDF viewer scale changes, overlay positions SHALL update accordingly.

#### Scenario: Overlay alignment at default zoom

- **WHEN** the PDF is displayed at 99% zoom (the default)
- **THEN** each overlay input is visually aligned with its corresponding field in the rendered PDF
