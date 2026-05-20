## ADDED Requirements

### Requirement: HTML preview is embedded in the keyin split-page right panel

The system SHALL render the HTML disclosure preview as a React component (`DisclosureHtmlPreview`) embedded in the right panel of the `/cases/[id]/keyin` page. The preview SHALL re-render reactively whenever the left panel form state changes, without navigating to a separate preview route.

#### Scenario: Preview updates on field change

- **WHEN** user edits a field in the left panel of the keyin page
- **THEN** the `DisclosureHtmlPreview` component in the right panel re-renders within 100ms, displaying the updated value in the correct position within the disclosure document layout

#### Scenario: Preview is not a standalone page

- **WHEN** the user is on the keyin page
- **THEN** the disclosure HTML preview SHALL be a React component rendered within the keyin page layout, NOT accessible via a separate `/documents/preview` navigation route during the keyin session

## REMOVED Requirements

### Requirement: System renders disclosure document as HTML preview with template background

**Reason**: The standalone preview route (`/listings/[id]/documents/preview`) is superseded by the embedded `DisclosureHtmlPreview` component in the keyin split page. The `PdfPreviewer` iframe is removed in favor of direct React component rendering.
**Migration**: The `PdfPreviewer` component used as the right-side iframe SHALL be replaced by `DisclosureHtmlPreview`. Any navigation links pointing to `/documents/preview` SHALL be updated or removed.

#### Scenario: Standalone preview route is removed

- **WHEN** developer runs `grep -r "PdfPreviewer" src/`
- **THEN** the command returns zero results, confirming the component file is deleted and no code imports it
