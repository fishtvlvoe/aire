## ADDED Requirements

### Requirement: Listing row delete button removes listing

The listing table row SHALL provide a delete button (trash icon) that removes the listing when clicked and confirmed.

#### Scenario: User clicks delete on any listing row

- **WHEN** a user clicks the trash icon on a listing row regardless of listing status
- **THEN** the system SHALL show a native `window.confirm` dialog with message "確定刪除此物件？此操作無法復原"
- **AND** upon user confirmation, the system SHALL issue `DELETE /api/listings/{id}`
- **AND** on API success, the system SHALL remove the row from the table without a full page refresh
- **AND** on API failure, the system SHALL show an alert with the error message and keep the row visible

#### Scenario: User cancels the confirm dialog

- **WHEN** a user clicks the trash icon but dismisses the confirm dialog
- **THEN** the system SHALL NOT issue any API request
- **AND** the listing row SHALL remain visible and unchanged

### Requirement: Stepper green segments are clickable for navigation back

The stepper navigation SHALL allow users to click any green (completed) segment to navigate back to the corresponding page.

#### Scenario: documents-ready listing navigates back via stepper

- **WHEN** a user is on `/listings/{id}/documents` for a listing with status `documents-ready`
- **THEN** stepper segments 2 (現勘), 3 (補件), and 4 (產生中) SHALL render as green with cursor-pointer styling
- **AND** clicking segment 2 SHALL navigate to `/listings/{id}/fill`
- **AND** clicking segment 3 SHALL navigate to `/listings/{id}/supplementary`
- **AND** clicking segment 4 SHALL navigate to `/listings/{id}/generating`
- **AND** segment 1 (選類型) SHALL remain green but non-clickable when `listingId !== null`

### Requirement: documents-ready listing row shows secondary action button

The listings table SHALL show a secondary "回去補件" button alongside the primary "查看文件" button for `documents-ready` listings.

#### Scenario: documents-ready row renders both buttons

- **WHEN** a listing row has status `documents-ready`
- **THEN** the action cell SHALL contain two buttons: primary "查看文件" linking to `/listings/{id}/documents` and secondary "回去補件" linking to `/listings/{id}/fill`
- **AND** the secondary button SHALL use lower visual weight (lighter border, no fill)

#### Scenario: non-documents-ready row renders single button

- **WHEN** a listing row has status other than `documents-ready`
- **THEN** the action cell SHALL contain only the single primary "進入填寫" button

### Requirement: documents page provides regenerate action with persistence notice

The `/listings/{id}/documents` page SHALL provide a "重新產生文件" button and a persistent notice informing users that field edits require regeneration.

#### Scenario: User regenerates documents

- **WHEN** a user clicks the "重新產生文件" button on `/listings/{id}/documents`
- **THEN** the system SHALL show `window.confirm("重新產生會覆蓋現有 5 份文件，確定？")`
- **AND** on confirmation, the system SHALL invoke the existing generate endpoint (`POST /api/listings/{id}/generate` or the regenerate endpoint, whichever is the implemented one)
- **AND** the page SHALL reload the listing's generated documents after success

#### Scenario: Field update persistence notice is always visible

- **WHEN** a user is on `/listings/{id}/documents` regardless of whether fields have been edited since generation
- **THEN** the page SHALL display a persistent notice: "若修改過現勘/補件欄位，請點『重新產生文件』讓內容反映最新輸入"
