## Context

AIRE Rust 後端的所有 IPC 指令（`create_case`、`get_case`、`update_case` 等）在失敗時回傳：

```json
{"code": "not_found", "message": "case not found"}
```

Tauri 把這個 JSON 序列化為字串，作為 `invoke()` 的 rejected value 傳回前端。目前 `safeInvoke` 直接重拋，導致前端 catch 到的是原始 JSON 字串（非 `Error` 物件），各呼叫端各自拼接錯誤訊息，且均為英文或原始 JSON。

已知 error code 清單（`src-tauri/src/commands/cases.rs`）：
- `not_found` — 資源不存在
- `missing_field` — 必填欄位空白
- `db_error` — SQLite 操作失敗
- `validation_error` — 資料驗證不通過
- `forbidden` — 操作不允許
- `internal` — 未預期錯誤

## Goals / Non-Goals

**Goals:**

- 解析 Rust IpcError JSON → 前端 typed error，保留 `code` 屬性
- 提供中文使用者訊息對照表
- 案件 CRUD 失敗時呼叫 `toast.error()` 顯示友善訊息
- TDD：先寫 `ipc-error.ts` 的解析邏輯測試

**Non-Goals:**

- 不修改 Rust 端 IpcError 結構
- 不加自動重試
- 不建 React Error Boundary

## Decisions

**決策 1：IpcError 解析在 `ipc-error.ts`，不在 `safeInvoke`**
`safeInvoke` 保持薄層（只做 env 分流），error 解析獨立為純函式，方便單元測試。

**決策 2：前端不擴展 `Error` class，改用 interface + type guard**
TypeScript 擴展 Error 的 prototype chain 在 Tauri bundler 環境有已知相容問題。改用 `{ code: string; message: string }` interface + `isIpcError()` type guard。

**決策 3：toast 使用 sonner `toast()` API（already used in project）**
確認 `sonner` 已在 `package.json` dependencies，不引入新依賴。

## Implementation Contract

### ipc-error.ts（`src/lib/ipc-error.ts`）

**介面：**
```ts
interface IpcError { code: string; message: string; }
function isIpcError(e: unknown): e is IpcError
function parseIpcError(raw: unknown): IpcError | null
function formatIpcError(code: string): string
```

**行為：**
- `parseIpcError(raw)` — 若 `raw` 是含 `code: string` 的物件 → 回傳 `IpcError`；若 `raw` 是 JSON 字串 → 先解析再判斷；其他 → 回傳 `null`
- `formatIpcError(code)` — 對照表回傳中文；未知 code → 回傳 `"操作失敗，請稍後再試"`
- 對照表（覆蓋所有已知 code）：
  - `not_found` → `"找不到指定的資源"`
  - `missing_field` → `"請填寫所有必填欄位"`
  - `db_error` → `"資料庫操作失敗，請重試"`
  - `validation_error` → `"資料驗證未通過，請確認輸入"`
  - `forbidden` → `"您沒有執行此操作的權限"`
  - `internal` → `"系統發生錯誤，請聯絡技術支援"`

**失敗模式：**
- 完全無法解析的 `raw` → `parseIpcError` 回傳 `null`，不拋錯
- 未知 code → `formatIpcError` 回傳 fallback 字串，不拋錯

**驗收標準：**
- `pnpm test src/lib/__tests__/ipc-error.test.ts` 全綠（6 個測試，含 JSON string 解析、plain object 解析、unknown code fallback、null 輸入）

### useIpcErrorToast.ts（`src/hooks/useIpcErrorToast.ts`）

**介面：**
```ts
function useIpcErrorToast(): { handleError: (err: unknown) => void }
```

**行為：**
- `handleError(err)` 呼叫 `parseIpcError(err)` → `formatIpcError(code)` → `toast.error(message)`
- 若 `parseIpcError` 回傳 `null`（非 IPC 錯誤）→ `toast.error(err instanceof Error ? err.message : "操作失敗")` 作為 fallback

### cases/new/page.tsx 與 cases/[id]/page.tsx

**行為：**
- 在 `catch(err)` block 中呼叫 `handleError(err)`，取代現有的 `setSubmitError(...)` 或靜音處理
- `new/page.tsx` 保留 `submitError` state 顯示 inline 錯誤區塊，額外加 toast（雙軌並行）

## Risks / Trade-offs

- **sonner API 版本**：confirm `toast.error` API 一致（sonner ≥ 1.0）
- **mock-backend 錯誤格式**：mock 在 dev 環境拋的是 `throw new Error(message)`（非 IpcError JSON），`parseIpcError` 的 `null` fallback 需正確處理
