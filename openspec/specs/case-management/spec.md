# case-management Specification

## Purpose

TBD - created by archiving change 'aire-desktop-phase1'. Update Purpose after archive.

## Requirements

### Requirement: Case list view

The system SHALL provide a `/cases` page that lists all cases ordered by `updated_at DESC`, displaying for each case: `case_no` (or `--` if empty), `property_type` (display as `成屋` or `土地`), `land_lot_no`, `address`, `owner_name`, `status` (display as `草稿` / `已完成` / `已匯出`), and `updated_at` formatted as `YYYY-MM-DD HH:mm` in Asia/Taipei timezone.

##### Example: list rendering

| Column | Source | Display rule |
| --- | --- | --- |
| Type | `property_type` | `residential` → `成屋`, `land` → `土地` |
| Status | `status` | `draft` → `草稿`, `completed` → `已完成`, `exported` → `已匯出` |
| Updated | `updated_at` | Unix seconds → `YYYY-MM-DD HH:mm` in Asia/Taipei |
| Case No | `case_no` | Empty string or NULL → `--` |

#### Scenario: Empty list state

- **WHEN** the user opens `/cases` with no cases in the database
- **THEN** the page displays the empty state message `尚無案件，按右上角「新增案件」開始` and a button labelled `新增案件`

#### Scenario: List with cases

- **WHEN** the user opens `/cases` with three cases in the database
- **THEN** all three rows are visible, ordered with the most recently updated at the top

---
### Requirement: Create case flow

The system SHALL provide a `/cases/new` page that asks the user to select `property_type` (`residential` or `land`) and enter required fields `land_lot_no` and `address`; on submit, the system SHALL create the row in `cases` and navigate to `/cases/<id>` for that new case.

#### Scenario: Successful creation

- **WHEN** the user submits `property_type='residential'`, `land_lot_no='台南市東區大同段123-4'`, `address='台南市東區大同路100號'`, `owner_name='王小明'`
- **THEN** a new row is inserted with `status='draft'` and the browser navigates to `/cases/<new-id>`

#### Scenario: Missing required field is rejected

- **WHEN** the user submits with `land_lot_no` empty
- **THEN** the form displays `地號為必填` next to the field and does NOT submit

#### Scenario: Property type is required

- **WHEN** the user submits without selecting `property_type`
- **THEN** the form displays `請選擇物件類型` and does NOT submit

---
### Requirement: Edit case page

The system SHALL provide a `/cases/<id>` page that loads the case header (case_no, property_type, land_lot_no, address, owner_name) and the disclosure form matching the case's `property_type`.

#### Scenario: Load existing case with draft

- **WHEN** the user opens `/cases/<id>` for a case that has a row in `disclosure_drafts`
- **THEN** the page renders the header and populates the disclosure form fields from `disclosure_drafts.payload_json`

#### Scenario: Case not found

- **WHEN** the user opens `/cases/<id>` for an id not present in `cases`
- **THEN** the page displays `找不到此案件` and a link back to `/cases`

---
### Requirement: Delete case

The system SHALL allow deleting a case from the edit page via a `刪除` button that requires explicit confirmation through a modal dialog.

#### Scenario: Confirm deletion

- **WHEN** the user clicks `刪除` and confirms `確定刪除` in the modal
- **THEN** the row is removed from `cases`, the cascade removes the matching row from `disclosure_drafts`, an `operation_log` row is written with `action='case_delete'`, and the user is navigated to `/cases`

#### Scenario: Cancel deletion

- **WHEN** the user clicks `刪除` and then clicks `取消` in the modal
- **THEN** no database change occurs and the user remains on the edit page

---
### Requirement: Case status transitions

The system SHALL update `cases.status` based on user actions: `draft` → `completed` when the user clicks `標示為完成`, `completed` → `exported` when a PDF export succeeds, and shall reject manual transitions backwards.

##### Example: status transition matrix

| From | Action | To |
| --- | --- | --- |
| `draft` | click `標示為完成` | `completed` |
| `completed` | export PDF | `exported` |
| `exported` | export PDF again | `exported` (no change) |
| `completed` | click `回到草稿` | rejected (button hidden) |

#### Scenario: Mark draft as completed

- **WHEN** the user clicks `標示為完成` on a case with `status='draft'`
- **THEN** the row updates to `status='completed'` and `updated_at` reflects the new time
