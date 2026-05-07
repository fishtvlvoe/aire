## ADDED Requirements

### Requirement: License table displays five columns in fixed order

The license management dashboard SHALL display a table with exactly five columns in this order: Index (sequential number), Key (license serial), Status (badge), User (contact info), Actions (icon buttons).

#### Scenario: Table renders with correct column order
- **WHEN** admin navigates to the license management page
- **THEN** the table header displays columns in order: Index, Key, Status, User, Actions

##### Example: Column header text
| Column Position | Header Text |
|---|---|
| 1 | 編號 |
| 2 | 序號 (Key) |
| 3 | 狀態 |
| 4 | 使用者 |
| 5 | 操作 |

### Requirement: Index column shows sequential numbering

The Index column SHALL display a zero-padded sequential number (001, 002, 003...) computed from the API response order. The index is NOT persisted in Vercel KV.

#### Scenario: Sequential numbering displayed
- **WHEN** the license list contains 3 entries
- **THEN** they are numbered 001, 002, 003

#### Scenario: Search results retain index numbering
- **WHEN** admin searches and 2 results are returned
- **THEN** results are numbered 001, 002 (re-indexed from filtered set)

### Requirement: User column displays three-line contact info

The User column SHALL display contact information in three lines: contact name (line 1), company name (line 2), email address (line 3). For licenses with status "issued" (not yet activated), the User column SHALL display "—".

#### Scenario: Activated license shows full contact info
- **WHEN** a license has contactName="王大明", company="大明不動產", email="fish@example.com"
- **THEN** the User column displays three lines: "王大明", "大明不動產", "fish@example.com"

#### Scenario: Issued license shows placeholder
- **WHEN** a license has status "issued" with no contact info
- **THEN** the User column displays "—"

### Requirement: Action buttons have tooltips

The Actions column SHALL contain two icon buttons: Copy (copies license key to clipboard) and Revoke (disables the license). Each button MUST display a tooltip on hover. The Revoke button SHALL NOT appear for already-revoked licenses.

#### Scenario: Hover copy button shows tooltip
- **WHEN** admin hovers over the copy icon button
- **THEN** a tooltip "複製序號到剪貼簿" appears

#### Scenario: Hover revoke button shows tooltip
- **WHEN** admin hovers over the revoke icon button
- **THEN** a tooltip "停用此序號" appears

#### Scenario: Revoked license hides revoke button
- **WHEN** a license has status "revoked"
- **THEN** only the copy button is visible; the revoke button is hidden

### Requirement: User info supports inline editing

Admin SHALL be able to click on any of the three user info fields (contactName, company, email) to switch it into an editable input. Pressing Enter or clicking outside (blur) SHALL trigger a PATCH request to save the change. Pressing Escape SHALL cancel the edit.

#### Scenario: Click to edit contact name
- **WHEN** admin clicks on the contact name text "王大明"
- **THEN** the text transforms into an input field pre-filled with "王大明"

#### Scenario: Save on Enter
- **WHEN** admin edits the contact name to "李小華" and presses Enter
- **THEN** the system sends PATCH /api/license/update-info with { key, contactName: "李小華" } and updates the display on success

#### Scenario: Cancel on Escape
- **WHEN** admin presses Escape while editing
- **THEN** the input reverts to the original text without sending any API request

##### Example: Cancel restores original value
- **GIVEN** contact name is "王大明" and admin clicked to edit, typed "李"
- **WHEN** admin presses Escape
- **THEN** the field displays "王大明" and no PATCH request is sent

### Requirement: Transfer dialog for license reassignment

The dashboard SHALL provide a "轉讓" (Transfer) action that opens a confirmation dialog. The dialog MUST show the old license info, accept new company/contact/email inputs, and a reason field. Submitting SHALL call POST /api/license/transfer.

#### Scenario: Open transfer dialog
- **WHEN** admin clicks the transfer action for license ABCD-1234-EFGH-5678
- **THEN** a dialog opens showing current license info with input fields for new contactName, company, email, and reason

#### Scenario: Confirm transfer
- **WHEN** admin fills in new info and clicks confirm
- **THEN** the system sends POST /api/license/transfer and on success refreshes the table showing the old license as "revoked" and a new license as "issued"

#### Scenario: Cancel transfer
- **WHEN** admin clicks cancel in the transfer dialog
- **THEN** the dialog closes with no changes

##### Example: Cancel leaves license unchanged
- **GIVEN** license ABCD-1234-EFGH-5678 has status "activated" with contactName "王大明"
- **WHEN** admin opens transfer dialog, fills in new info, then clicks cancel
- **THEN** the dialog closes and license ABCD-1234-EFGH-5678 still shows status "activated" with contactName "王大明"

### Requirement: Search includes index and contact info

The search input SHALL filter licenses by matching against: index number, license key, contactName, company, and email. Search results SHALL display with re-indexed sequential numbers.

#### Scenario: Search by company name
- **WHEN** admin types "大明不動產" in the search field
- **THEN** only licenses with company containing "大明不動產" are displayed

#### Scenario: Search by index number
- **WHEN** admin types "003" in the search field
- **THEN** the license originally at index 003 is displayed (re-indexed as 001 in results)

### Requirement: Creation date column is removed

The license table SHALL NOT display a creation date column.

#### Scenario: No date column present
- **WHEN** admin views the license table
- **THEN** no "建立日期" column exists in the table header or rows
