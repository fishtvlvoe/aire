# case-management Specification

## Purpose

調整案件管理總覽的使用者任務：`/cases` 應負責選案件與看案件狀態，不應同時扮演案件內工作台。

## MODIFIED Requirements

### Requirement: Case list view

The system SHALL provide a `/cases` page that lists all cases ordered by `updated_at DESC`, displaying customer-facing case identity, address/owner summary, case type, status, updated time, and secondary row actions.

The `/cases` page SHALL be a second-level case selection surface. It SHALL NOT render the same second-level labels already available in the sidebar as page-level tabs.

The `/cases` page SHALL provide a single primary action per case for entering the case workbench at `/cases/:id`.

##### Example: list rendering

| Area | Display rule |
| --- | --- |
| Page heading | `案件管理` |
| Case identity | `case_name` if present, otherwise `case_no`, otherwise shortened id |
| Address/owner | Primary line: address; Secondary line: owner name or `待補件` |
| Case type | `residential` → `成屋`, `land` → `土地` |
| Status | `draft` → `草稿`, `keyin` → `填入中`, `completed` → `完成`, `exported` → `已匯出` |
| Main action | Click row or one explicit link/button to `/cases/:id`; if both exist, they SHALL perform the exact same action |

#### Scenario: List with cases

- **WHEN** the user opens `/cases` with cases in the database
- **THEN** all rows are visible, ordered with the most recently updated at the top
- **AND** each row provides exactly one primary way to enter the case workbench
- **AND** the page does NOT render page-level tabs named `案件總覽`, `說明書工作台`, `補件清單`

#### Scenario: Empty list state

- **WHEN** the user opens `/cases` with no cases in the database
- **THEN** the page displays an empty state telling the user to create a case
- **AND** the only primary action is `新增案件`
- **AND** the page does NOT display case-scoped workbench tools
