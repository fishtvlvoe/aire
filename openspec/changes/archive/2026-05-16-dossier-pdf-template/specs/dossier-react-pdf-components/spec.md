## ADDED Requirements

### Requirement: System SHALL provide a PdfCover component for document covers

The system SHALL provide a `PdfCover` React component that accepts `PdfTokens` and cover data, renders using `@react-pdf/renderer` View/Text primitives, and outputs a single full-page cover section including company name, document title, case number, address, and generation date.

#### Scenario: PdfCover renders required fields

- **WHEN** `PdfCover` is rendered with valid `PdfTokens` and cover data containing `companyName`, `caseNo`, `address`, and `generatedAt`
- **THEN** the rendered output contains text nodes for each of those four fields

#### Scenario: PdfCover uses theme primary color for title bar

- **WHEN** `PdfCover` is rendered with `tokens.primary = "#3B82F6"`
- **THEN** the title bar background style SHALL be `backgroundColor: "#3B82F6"`

### Requirement: System SHALL provide a PdfPageHeader component

The system SHALL provide a `PdfPageHeader` React component that accepts `PdfTokens`, document title string, and page number, renders a top-of-page strip with the title and page number using View/Text primitives.

#### Scenario: PdfPageHeader renders title and page number

- **WHEN** `PdfPageHeader` is rendered with `title="不動產說明書"` and `pageNumber={2}`
- **THEN** the rendered output contains text "不動產說明書" and "2"

### Requirement: System SHALL provide a PdfPageFooter component

The system SHALL provide a `PdfPageFooter` React component that accepts `PdfTokens` and disclaimer text, renders a bottom-of-page strip containing the disclaimer using View/Text primitives.

#### Scenario: PdfPageFooter renders disclaimer

- **WHEN** `PdfPageFooter` is rendered with `disclaimer="本文件依法製作"`
- **THEN** the rendered output contains text "本文件依法製作"

### Requirement: System SHALL provide a PdfSection component

The system SHALL provide a `PdfSection` React component that accepts `PdfTokens`, a section title string, and child elements, renders a titled section block with a colored header bar and content area using View/Text primitives.

#### Scenario: PdfSection renders section title

- **WHEN** `PdfSection` is rendered with `title="一、法規告知"`
- **THEN** the rendered output contains text "一、法規告知"

#### Scenario: PdfSection renders children

- **WHEN** `PdfSection` is rendered with a child `<Text>` node containing "test content"
- **THEN** the rendered output contains "test content"

### Requirement: System SHALL provide a PdfFieldTable component for field-value pairs

The system SHALL provide a `PdfFieldTable` React component that accepts `PdfTokens` and an array of `{ label: string; value: string }` rows, renders each row as a two-column table row using View/Text primitives. Missing or empty values SHALL display as "待補".

#### Scenario: PdfFieldTable renders field-value pairs

- **WHEN** `PdfFieldTable` is rendered with rows `[{ label: "地號", value: "123-45" }]`
- **THEN** the rendered output contains text "地號" and "123-45"

#### Scenario: PdfFieldTable shows 待補 for empty values

- **WHEN** `PdfFieldTable` is rendered with rows `[{ label: "建號", value: "" }]`
- **THEN** the rendered output contains text "待補"

##### Example: empty value substitution

| label | value input | rendered text |
|-------|-------------|---------------|
| "地號" | "" | "待補" |
| "地號" | undefined | "待補" |
| "地號" | "123-45" | "123-45" |

### Requirement: Components SHALL consume PdfTokens for all color and font values

The system SHALL define a `PdfTokens` interface with fields `primary`, `text`, `textMuted`, `bg`, `bgAlt`, `border`, and `fontFamily`. All components SHALL use only values from the provided `PdfTokens` instance for colors, backgrounds, borders, and font families — no hardcoded color literals.

#### Scenario: Token substitution changes rendered colors

- **WHEN** a component is rendered with `tokens.primary = "#FF0000"`
- **THEN** the primary-color elements in that component SHALL use `backgroundColor: "#FF0000"` or `color: "#FF0000"` as appropriate

### Requirement: System SHALL export a getThemePdfTokens function

The system SHALL export a `getThemePdfTokens(themeId: string): PdfTokens` function that maps the three theme IDs (`theme-a-minimal`, `theme-b-professional`, `theme-c-tech-elegant`) to their corresponding `PdfTokens` values. An unknown `themeId` SHALL return the `theme-a-minimal` tokens as the default.

#### Scenario: Known theme ID returns correct tokens

- **WHEN** `getThemePdfTokens("theme-b-professional")` is called
- **THEN** the returned `PdfTokens.primary` SHALL match the theme-b primary color defined in `src/lib/pdf-themes/theme-b-professional/index.tsx`

#### Scenario: Unknown theme ID returns theme-a tokens

- **WHEN** `getThemePdfTokens("unknown-theme")` is called
- **THEN** the returned tokens SHALL equal `getThemePdfTokens("theme-a-minimal")`
