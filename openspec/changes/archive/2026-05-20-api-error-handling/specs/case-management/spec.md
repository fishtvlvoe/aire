## MODIFIED Requirements

### Requirement: Case CRUD operations display user-friendly error messages

**MODIFIED from baseline**: Cases CRUD operations (`create_case`, `get_case`, `update_case`, `delete_case`) in `src/app/(dashboard)/cases/new/page.tsx` and `src/app/(dashboard)/cases/[id]/page.tsx` SHALL surface IPC errors to users via `toast.error()` with Traditional Chinese messages.

- **WHEN** a case creation operation fails with code `missing_field`, the UI SHALL display toast: `"請填寫所有必填欄位"`
- **WHEN** a case operation fails with code `not_found`, the UI SHALL display toast: `"找不到指定的資源"`
- **WHEN** a case operation fails with any other known error code, the UI SHALL display the corresponding message from `formatIpcError`
- **WHEN** a case operation fails with an unknown error, the UI SHALL display toast: `"操作失敗，請稍後再試"`

##### Example: create case with missing address
- **GIVEN** user submits new case form with empty address field
- **WHEN** `create_case` IPC returns `{"code":"missing_field","message":"地址為必填"}`
- **THEN** toast error displays `"請填寫所有必填欄位"` and the form remains on screen
