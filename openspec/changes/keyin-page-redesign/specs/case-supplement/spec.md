## MODIFIED Requirements

### Requirement: Supplement dialog

The system SHALL navigate to `/cases/[id]/keyin` when the user clicks the 補件 action button for a case, replacing the previous dialog. The `CaseSupplementDialog` component SHALL NOT be rendered.

#### Scenario: User clicks 補件 button

- **WHEN** user clicks the 補件 icon button for any case in the case list
- **THEN** the system navigates to `/cases/[id]/keyin` (where `id` is the case's ID) and no modal overlay appears

#### Scenario: No dialog appears

- **WHEN** user clicks the 補件 icon button
- **THEN** the `CaseSupplementDialog` component SHALL NOT be rendered; the browser URL changes to `/cases/<id>/keyin`

#### Scenario: CaseSupplementDialog is deleted

- **WHEN** the developer runs `grep -r "CaseSupplementDialog" src/`
- **THEN** the command returns zero results, confirming the component file is removed
