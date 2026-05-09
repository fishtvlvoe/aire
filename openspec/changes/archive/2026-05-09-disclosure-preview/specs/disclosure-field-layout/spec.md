## ADDED Requirements

### Requirement: System defines field positions for disclosure template using percentage-based coordinates

The system SHALL define the position of each editable field on the disclosure template background using percentage-based coordinates. The field layout is defined as a TypeScript constant in src/lib/branding/field-layouts.ts and can be extended in the future to support per-customer layouts stored in the database.

#### Scenario: Default field layout for disclosure cover page

- **WHEN** the system renders the disclosure preview cover page
- **THEN** it reads the DEFAULT_COVER_FIELDS array from field-layouts.ts, which defines positions for: object-id (物件編號), object-name (物件名稱), agent-name (委託人), store-name (店名), broker-name (經紀人), broker-cert (經紀人證書), company-name (公司名稱), company-address (地址), company-phone (電話), and document-date (日期)

**Example:**

| fieldKey | label | x (%) | y (%) | width (%) | height (%) | fontSize (px) | textAlign |
|----------|-------|-------|-------|-----------|------------|---------------|-----------|
| object-id | 物件編號 | 28 | 24 | 40 | 3 | 14 | left |
| object-name | 物件名稱 | 28 | 28 | 55 | 3 | 14 | left |
| agent-name | 委託人 | 15 | 65 | 18 | 3 | 13 | center |
| store-name | 店名 | 33 | 65 | 18 | 3 | 13 | center |
| broker-name | 經紀人 | 51 | 65 | 18 | 3 | 13 | center |
| broker-cert | 經紀人證書 | 69 | 65 | 18 | 3 | 13 | center |
| company-name | 公司名稱 | 28 | 78 | 55 | 3 | 13 | left |
| company-address | 地址 | 28 | 82 | 55 | 3 | 13 | left |
| company-phone | 電話 | 28 | 86 | 30 | 3 | 13 | left |
| document-date | 日期 | 28 | 90 | 30 | 3 | 13 | left |

#### Scenario: Field position uses percentage coordinates

- **WHEN** a field is defined with x=28, y=24, width=40, height=3
- **THEN** the rendered HTML element has style left: 28%, top: 24%, width: 40%, height: 3% relative to the A4 container

#### Scenario: FieldPosition interface structure

- **WHEN** a developer imports FieldPosition from field-layouts.ts
- **THEN** the interface includes fieldKey (string), label (string), x (number), y (number), width (number), height (number), fontSize (number), textAlign (left|center|right), and page (cover|content)

**Example:**

```typescript
const field: FieldPosition = {
  fieldKey: 'object-id',
  label: '物件編號',
  x: 28, y: 24, width: 40, height: 3,
  fontSize: 14, textAlign: 'left', page: 'cover'
};
```

#### Scenario: No content page fields defined initially

- **WHEN** the system renders the content page of the disclosure preview
- **THEN** the DEFAULT_CONTENT_FIELDS array is empty, and the content page shows only the background image without any overlaid fields (content page field definitions will be added in a future iteration)

**Example:**

| Array | Length | Content page render |
|-------|--------|-------------------|
| DEFAULT_CONTENT_FIELDS | 0 | Background image displayed, no text overlays, no editable fields |
