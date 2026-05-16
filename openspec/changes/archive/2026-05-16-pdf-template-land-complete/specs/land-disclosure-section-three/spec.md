# land-disclosure-section-three

## Purpose

Define the field layout and rendering rules for Section Three (三、權利種類及登記狀態) of the land disclosure PDF, aligned with the 105-year government-mandated format.

## ADDED Requirements

### Requirement: LandPages SHALL render Section Three with all government-mandated fields

The system SHALL render a PDF page titled "三、權利種類及登記狀態" within `LandPages` containing the following fields in order:

1. 限制登記 (`restrictionRegistration?: string`) — any registration restrictions on the land
2. 他項權利明細 — derived from existing `mortgages` array, displayed as creditor + amount rows; if `mortgages` is empty or undefined, display "待補"
3. 信託登記 (`trustRegistration?: string`) — trust registration status
4. 預告登記 (`cautionRegistration?: string`) — caution/preliminary registration status
5. 其他權利登記事項 (`otherRightsDetail?: string`) — any other registered rights

Each field SHALL be rendered using `PdfFieldTable`. When the corresponding `CaseDossierData` field is `undefined`, `null`, or empty string, the value cell SHALL display "待補" in muted text color.

#### Scenario: Section Three renders with partial data

- **WHEN** `PdfDocument` renders with `propertyType: 'land'` and `restrictionRegistration: '禁止處分'` and all other Section Three fields undefined
- **THEN** the Section Three page SHALL display "禁止處分" for 限制登記 AND "待補" for all other fields

#### Scenario: Section Three renders with mortgage details

- **WHEN** `PdfDocument` renders with `propertyType: 'land'` and `mortgages: [{ creditor: '台灣銀行', amount: 5000000 }]`
- **THEN** the Section Three page SHALL display "台灣銀行 / NT$ 5,000,000" in the 他項權利明細 row

#### Scenario: Section Three renders with all fields undefined

- **WHEN** `PdfDocument` renders with `propertyType: 'land'` and no Section Three fields populated
- **THEN** the Section Three page SHALL render without errors AND all value cells SHALL display "待補"
