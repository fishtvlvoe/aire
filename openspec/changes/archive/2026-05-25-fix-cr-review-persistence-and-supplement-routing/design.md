## Goals

- Make every visible action in the accepted UI either persist data or navigate to the right workflow.
- Keep all supplement work in the current `物件審核 -> 補件/現場` flow.
- Keep profile settings editable without pretending production account security is done.

## Non-Goals

- Real binary file upload is out of scope. The current acceptance only needs selected file names to persist in browser/mock mode.
- Production password change is out of scope. The UI must call a backend command and receive a persisted status, but not implement auth security.
- Formal supplement automation is out of scope.

## Design Decisions

### 1. 補件入口統一到物件審核

The case row already uses row click for the main case workbench. The `補件` icon is a shortcut into a specific workbench tab, so it must navigate to `/cases/:id?tab=supplements` and not to the legacy key-in page.

### 2. 補件/現場資料先用 mock draft persistence

`DemoAlignedWorkbench` is currently the accepted product workbench. It should load a case-scoped supplement draft from mock backend and save field visit answers, status selections, upload file names, and supplement-list state. This gives users stable behavior during local/browser acceptance without claiming the final production backend exists.

### 3. PDF check reads the same persisted draft

The `PDF 檢查` step should not count uploads from transient component state. It should use the persisted draft so the count is consistent after remount.

### 4. 個人設定接 mock profile settings

Profile settings should call backend commands:

- `get_profile_settings`
- `save_profile_settings`
- `update_profile_password`

This keeps UI acceptance honest: saved data survives page remount in mock mode. Production auth/security can replace the command implementation later.

### 5. Tests must catch persistence, not only presence

Tests must verify save calls and remount persistence for profile settings, and verify supplement shortcut routing plus workbench draft persistence.

## Implementation Contract

### Case management

- `補件` row action SHALL navigate to `/cases/:id?tab=supplements`.
- The supplement workbench SHALL load persisted supplement draft data for the current case.
- Updating a field-visit answer or status SHALL persist to the case supplement draft.
- Selecting an upload file SHALL persist the selected file name under the matching slot.
- Clicking `加入補件清單` SHALL persist supplement-list state.
- The PDF check upload count SHALL be derived from persisted upload file names.

### Profile settings

- `/settings` SHALL load profile settings from mock backend on mount.
- Saving personal name and Email SHALL call `save_profile_settings`.
- Saving brand color and Logo file name SHALL call `save_profile_settings`.
- Updating password SHALL call `update_profile_password`.
- Saved profile settings SHALL survive page remount in mock mode.

## Risks

- Browser file inputs cannot be fully controlled after remount. Persist the file name display, not the actual selected File object.
- Existing tests may only assert UI presence; add persistence assertions to avoid false confidence.
