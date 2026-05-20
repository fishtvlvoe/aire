## ADDED Requirements

### Requirement: System renders the keyin page as a left-right split layout

The system SHALL provide a dedicated full-page keyin route at `/cases/[id]/keyin` that renders a left panel for data entry and a right panel for live HTML disclosure preview. The page SHALL replace the `CaseSupplementDialog` popup as the primary data entry interface.

#### Scenario: User navigates to keyin page

- **WHEN** user clicks the 補件 action button for a case in the case list
- **THEN** the system navigates to `/cases/[id]/keyin` and renders the split layout with left panel showing unfilled fields and right panel showing the live HTML disclosure preview

#### Scenario: Left panel shows structured entry checklist

- **WHEN** the keyin page loads for a residential case
- **THEN** the left panel renders a checklist of fillable items: 承辦人, 物件地址, 交易價金, 交屋日, 使用性質, 附建物平面圖 (thumbnail if approved), and 現場照片 upload

#### Scenario: Left panel shows land case fields

- **WHEN** the keyin page loads for a land case
- **THEN** the left panel renders the land-specific disclosure form fields using `DisclosureFormLand` component with `onChange` prop wired to the preview state

#### Scenario: Right panel renders HTML live preview

- **WHEN** user edits any field in the left panel
- **THEN** the right panel immediately re-renders the HTML disclosure document component with the updated field value, without requiring a page reload or PDF generation

#### Scenario: Page navigation back to case list

- **WHEN** user clicks the back button or navigates away from `/cases/[id]/keyin`
- **THEN** the system flushes any pending draft save before unmounting the page and returns to the case list

### Requirement: System auto-saves draft on keyin page with debounce and interval

The system SHALL automatically persist the keyin form state to the local SQLite `disclosure_drafts` table using a combination of: (1) 2-second debounce after the last user input change, (2) a 15-second interval heartbeat save regardless of input activity, and (3) a flush save when the user navigates away from the page.

#### Scenario: Auto-save triggers after typing

- **WHEN** user types in any field on the left panel
- **THEN** the system schedules a debounced save that fires 2 seconds after the last keystroke, calling the `save_draft` Tauri IPC command with the current form state

#### Scenario: Interval save triggers every 15 seconds

- **WHEN** the keyin page is mounted and the user has made at least one edit
- **THEN** the system calls `save_draft` every 15 seconds via interval, independent of user input activity

#### Scenario: Flush save on page leave

- **WHEN** the keyin page component unmounts (navigation or app close)
- **THEN** the system immediately calls `save_draft` synchronously (or via `beforeunload` listener) before the component is destroyed, ensuring no data loss on unexpected exit

#### Scenario: Draft restore toast on reopen

- **WHEN** the keyin page mounts and `get_draft` returns a non-empty saved draft for the current case
- **THEN** the system pre-populates the left panel form with the saved draft data AND displays a toast notification: "已還原上次未儲存的草稿" with a dismiss button

##### Example: draft restore values

| Saved draft field | Pre-populated value in left panel |
| ----------------- | --------------------------------- |
| `agent_name: "林美玲"` | 承辦人 input = "林美玲" |
| `asking_price: 5800000` | 交易價金 input = "5,800,000" |
| `handover_date: "2026-06-15"` | 交屋日 date picker = "2026-06-15" |

### Requirement: SQLite WAL mode is active for draft persistence

The system SHALL ensure the SQLite database connection used for `disclosure_drafts` writes operates with `PRAGMA journal_mode=WAL` enabled, guaranteeing atomic commits and preventing data corruption on power loss.

#### Scenario: WAL mode confirmed at app startup

- **WHEN** the Tauri app initializes the SQLite connection
- **THEN** the connection SHALL execute `PRAGMA journal_mode=WAL` before any draft read or write operation, and the returned journal mode value SHALL equal `"wal"`
