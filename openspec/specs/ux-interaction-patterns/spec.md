# ux-interaction-patterns Specification

## Purpose

TBD - created by archiving change 'aire-desktop-phase1'. Update Purpose after archive.

## Requirements

### Requirement: Three-state UI for async operations

The system SHALL render every async data-loading view with three explicit states: `loading`, `empty`, and `error`; each state MUST have a defined visual treatment matching OPCOS conventions and SHALL NOT degrade into a blank screen.

##### Example: three-state UI matrix

| Page | Loading state | Empty state | Error state |
| --- | --- | --- | --- |
| Cases list | spinner + `載入案件中` | empty card `尚無案件，按右上角「新增案件」開始` + primary CTA | red card `載入失敗：<reason>` + `重試` button |
| Case detail form | skeleton blocks (5 lines) | n/a (form always renders) | red banner `儲存失敗，已保留輸入` (transient) |
| License verify | inline spinner on launch | n/a | activation screen with reason text |

#### Scenario: Loading state on initial cases list load

- **WHEN** the user opens `/cases` and the IPC `list_cases` has not yet returned
- **THEN** the page renders a centered spinner with the label `載入案件中` and does NOT display a blank area

#### Scenario: Empty state primary action

- **WHEN** the user opens `/cases` with zero cases
- **THEN** the page renders the empty card with text `尚無案件，按右上角「新增案件」開始` and the only primary action button is `新增案件`

#### Scenario: Error state offers retry

- **WHEN** `list_cases` returns an error
- **THEN** the page displays a red card with the error reason and a `重試` button that re-invokes `list_cases` on click

---
### Requirement: Draft autosave behavior

The system SHALL implement draft autosave for all multi-field forms (disclosure-form-residential, disclosure-form-land) using a 1000-millisecond debounce, with a top-right status indicator showing one of three states: `已儲存 HH:mm:ss` (success), `儲存中` (in flight), `儲存失敗，已保留輸入` (failure with in-memory retention).

#### Scenario: Successful save updates indicator

- **WHEN** the user types a character into a form field and 1000 milliseconds pass without further input
- **THEN** the indicator transitions to `儲存中`, the IPC `save_draft` is called once, and on success the indicator transitions to `已儲存 14:35:22` (Asia/Taipei time)

#### Scenario: Failed save preserves user input

- **WHEN** `save_draft` returns an error
- **THEN** the indicator displays `儲存失敗，已保留輸入` in red, the form's in-memory state is unchanged, and the next debounce cycle retries

---
### Requirement: Confirmation dialog triggers

The system SHALL present a modal confirmation dialog only for actions that satisfy at least one of: irreversible data loss, multi-record effect, or network-side state change. Reversible single-field edits (form input, status flag toggle that is reversible) MUST NOT trigger a confirmation dialog.

##### Example: confirmation dialog policy

| Action | Confirms? | Reason |
| --- | --- | --- |
| Save form field (debounced) | no | reversible, no irreversible loss |
| Mark case as completed (`draft` → `completed`) | no | reversible by editing |
| Delete case | yes | irreversible loss; cascades to drafts |
| Deactivate license on this device | yes | network-side state change |
| Export PDF | no | non-destructive |
| Switch tab in form | no | preserves state |

#### Scenario: Delete case shows modal

- **WHEN** the user clicks `刪除` on a case
- **THEN** a modal opens with title `刪除此案件？`, body `案件資料與草稿將永久刪除，無法復原。`, two buttons `取消` (default focus) and `確定刪除` (destructive style)

#### Scenario: Cancel modal preserves state

- **WHEN** the user clicks `取消` or presses Escape
- **THEN** the modal closes, no IPC is called, and the user remains on the case edit page

---
### Requirement: Error message tone and content

The system SHALL render user-facing error messages in Traditional Chinese using the patterns below; messages MUST NOT expose stack traces, raw error codes, or English-only text to end users.

##### Example: error message templates

| Failure | Template | Example |
| --- | --- | --- |
| Network failure | `無法連線 <服務>，請檢查網路` | `無法連線 OPCOS，請檢查網路` |
| Permission failure | `<操作>需要 <角色>權限` | `修改設定需要老闆權限` |
| Validation failure | `<欄位名>: <原因>` | `地號: 為必填` |
| Storage failure | `儲存失敗：<原因>，已保留輸入` | `儲存失敗：磁碟空間不足，已保留輸入` |
| Remote rejection | `<服務>回應：<reason>` | `OPCOS 回應：序號已綁定其他電腦` |

#### Scenario: Network error during license verify

- **WHEN** the license verify call fails with a network error
- **THEN** the error toast text is exactly `無法連線 OPCOS，請檢查網路` and does NOT contain words such as `ECONNRESET`, `fetch failed`, or stack traces

---
### Requirement: Toast notification policy

The system SHALL emit toast notifications for transient success and recoverable error feedback only; persistent or destructive errors MUST be rendered as in-page banners or modal dialogs, not toasts.

##### Example: toast vs. banner vs. modal

| Event | Surface | Auto-dismiss |
| --- | --- | --- |
| PDF export succeeded | toast (success, bottom-right) | yes, 3 seconds |
| Draft autosave succeeded | top-right indicator (not toast) | n/a |
| Network temporarily unreachable | toast (warning) | yes, 5 seconds |
| License revoked | activation screen redirect (not toast) | no |
| Delete confirmation | modal | requires click |

#### Scenario: PDF export success toast

- **WHEN** PDF export completes successfully
- **THEN** a green toast appears at bottom-right with text `匯出成功` and a `開啟所在資料夾` action button, and auto-dismisses after 3 seconds

#### Scenario: Critical error does not use toast

- **WHEN** the license is remotely revoked
- **THEN** the system navigates to the activation screen with an inline banner, and does NOT emit a transient toast

##### Example: surface routing by error severity

| Trigger | Surface chosen | Auto-dismiss |
| --- | --- | --- |
| `verify_license` returns 401 `revoked` | activation screen + inline banner | no |
| `verify_license` network error within 30-day grace | none (silent log) | n/a |
| `save_draft` disk-full error | top-right indicator `儲存失敗` | no (stays until next save attempt) |
| `export_pdf` template missing | error dialog (modal) | no |
| `list_cases` transient network blip recovers on retry | toast `已重新連線` | yes, 5 seconds |

---
### Requirement: Keyboard shortcut conventions

The system SHALL provide the following keyboard shortcuts shared with OPCOS conventions; these shortcuts MUST work consistently across all pages where the underlying action is available.

##### Example: keyboard shortcut table

| Shortcut | Action | Available on |
| --- | --- | --- |
| `Cmd/Ctrl+N` | New case | `/cases`, `/cases/<id>` |
| `Cmd/Ctrl+S` | Force flush draft autosave | `/cases/<id>` |
| `Cmd/Ctrl+,` | Open settings | global |
| `Esc` | Close modal / cancel | when modal open |
| `Cmd/Ctrl+K` | Open command palette (Phase 1: stub, no behavior) | global |

#### Scenario: Cmd+N opens new case page

- **WHEN** the user presses Cmd+N (macOS) or Ctrl+N (Windows) on the `/cases` page
- **THEN** the application navigates to `/cases/new`

#### Scenario: Esc closes confirmation modal

- **WHEN** the delete confirmation modal is open and the user presses Esc
- **THEN** the modal closes, no deletion occurs, and focus returns to the originating `刪除` button
