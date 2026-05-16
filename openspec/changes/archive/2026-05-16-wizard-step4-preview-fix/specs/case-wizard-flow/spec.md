## ADDED Requirements

### Requirement: Step indicator navigation

The wizard step indicator (①②③④) SHALL be interactive. Users can click on completed step indicators to navigate directly to that step.

#### Scenario: Click completed step to navigate back

- **WHEN** user is on step 4 and clicks step indicator ①
- **THEN** wizard navigates to step 1, preserving all form data

#### Scenario: Click future step (not yet reached)

- **WHEN** user is on step 2 and clicks step indicator ④
- **THEN** nothing happens; the indicator is visually disabled

#### Scenario: Click current step

- **WHEN** user is on step 2 and clicks step indicator ②
- **THEN** nothing happens; the indicator shows active state but does not re-navigate

### Requirement: Hide next button on final step

The wizard SHALL NOT render the "下一步" button when the user is on the final step (step 4).

#### Scenario: Step 4 navigation buttons

- **WHEN** user reaches step 4
- **THEN** only "上一步" button is visible; "下一步" button is not rendered

### Requirement: Step 4 displays PDF preview

Step 4 "預覽匯出" SHALL embed the PdfPreviewer component to show a live PDF preview of the current case data, along with export and download controls.

#### Scenario: Step 4 content on arrival

- **WHEN** user navigates to step 4
- **THEN** PDF preview iframe loads automatically, showing the disclosure document with current case data; export button and download button are both visible below the preview
