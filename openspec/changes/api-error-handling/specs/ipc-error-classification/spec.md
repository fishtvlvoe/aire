## ADDED Requirements

### Requirement: IPC error parsing

The `parseIpcError` function in `src/lib/ipc-error.ts` SHALL accept an `unknown` value and return an `IpcError` object (`{ code: string; message: string }`) or `null`.

- **WHEN** given a plain object with a `code: string` field, it SHALL return that object as `IpcError`.
- **WHEN** given a JSON string containing `{"code": "...", "message": "..."}`, it SHALL parse and return `IpcError`.
- **WHEN** given `null`, `undefined`, a number, or an unparseable string, it SHALL return `null`.

##### Example: JSON string input
- **GIVEN** `raw = '{"code":"not_found","message":"case not found"}'`
- **WHEN** `parseIpcError(raw)` is called
- **THEN** returns `{ code: "not_found", message: "case not found" }`

##### Example: null input
- **GIVEN** `raw = null`
- **WHEN** `parseIpcError(raw)` is called
- **THEN** returns `null`

### Requirement: Error code to Chinese message mapping

The `formatIpcError` function SHALL map known error codes to Traditional Chinese user messages.

| Error Code | Expected Message |
|---|---|
| `not_found` | `找不到指定的資源` |
| `missing_field` | `請填寫所有必填欄位` |
| `db_error` | `資料庫操作失敗，請重試` |
| `validation_error` | `資料驗證未通過，請確認輸入` |
| `forbidden` | `您沒有執行此操作的權限` |
| `internal` | `系統發生錯誤，請聯絡技術支援` |
| (unknown) | `操作失敗，請稍後再試` |

##### Example: unknown code fallback
- **GIVEN** `code = "some_unknown_code"`
- **WHEN** `formatIpcError(code)` is called
- **THEN** returns `"操作失敗，請稍後再試"`

### Requirement: useIpcErrorToast hook

The `useIpcErrorToast` hook in `src/hooks/useIpcErrorToast.ts` SHALL return `{ handleError: (err: unknown) => void }`.

- **WHEN** `handleError(err)` is called with a parseable IPC error, it SHALL call `toast.error(formatIpcError(err.code))`
- **WHEN** `handleError(err)` is called with a non-IPC error (parseIpcError returns null), it SHALL call `toast.error(err instanceof Error ? err.message : "操作失敗")`
