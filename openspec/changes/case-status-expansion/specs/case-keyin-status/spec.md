## ADDED Requirements

### Requirement: keyin-status-lifecycle

The case status lifecycle SHALL support four states: `draft` → `keyin` → `completed` → `exported`.

The Rust IPC command `mark_keyin` SHALL transition a case status from `draft` to `keyin`. If the case is already in `keyin`, `mark_keyin` SHALL be idempotent and return the unchanged case. If the case is in `completed` or `exported`, `mark_keyin` SHALL return error code `invalid_status_transition`.

The existing `mark_completed` command SHALL accept both `draft → completed` and `keyin → completed` transitions.

The SQLite `cases` table CHECK constraint SHALL include `'keyin'` as a valid status value (migration required).

##### Example: mark_keyin transitions

| initial status | result |
|----------------|--------|
| draft | keyin (success) |
| keyin | keyin (idempotent) |
| completed | invalid_status_transition error |
| exported | invalid_status_transition error |

#### Scenario: mark_keyin on draft case

- **GIVEN** a case with status `draft`
- **WHEN** `mark_keyin` is called with that case's ID
- **THEN** the case status becomes `keyin` and the updated `Case` struct is returned

#### Scenario: mark_keyin idempotent on keyin case

- **GIVEN** a case with status `keyin`
- **WHEN** `mark_keyin` is called again
- **THEN** the case is returned unchanged with status `keyin`

#### Scenario: mark_keyin rejected on completed case

- **GIVEN** a case with status `completed`
- **WHEN** `mark_keyin` is called
- **THEN** an error with code `invalid_status_transition` is returned

#### Scenario: mark_completed accepts keyin status

- **GIVEN** a case with status `keyin`
- **WHEN** `mark_completed` is called
- **THEN** the case status becomes `completed`

---

### Requirement: keyin-auto-transition

`KeyinSplitPage` SHALL call `mark_keyin` once on mount via `useEffect`. The transition is idempotent, so calling it multiple times is safe.

#### Scenario: KeyinSplitPage triggers mark_keyin

- **GIVEN** a case with status `draft`
- **WHEN** the user navigates to `/cases/:id/keyin`
- **THEN** `mark_keyin` is invoked and the case status transitions to `keyin`

---

### Requirement: keyin-status-badge

The case list `StatusBadge` component SHALL display distinct badges for all four statuses.

##### Example: Status badge by status value

| status | display text | data-testid |
|--------|------|-------------|
| draft | 草稿 | status-badge-draft |
| keyin | 填入中 | status-badge-keyin |
| completed | 完成 | status-badge-completed |
| exported | 已匯出 | status-badge-exported |

#### Scenario: Distinct exported badge

- **GIVEN** a case with status `exported`
- **WHEN** `StatusBadge` renders
- **THEN** `data-testid="status-badge-exported"` shows text "已匯出" (not "完成")
