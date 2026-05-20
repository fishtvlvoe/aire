## Why

目前 AIRE 的 IPC 錯誤處理分散且不一致：Rust 後端回傳的 `IpcError`（含 `code` 與 `message` 欄位）在前端被當成不透明字串處理。當操作失敗時，使用者看到的是原始 Rust 錯誤訊息（例如 `{"code":"not_found","message":"case not found"}`），而非本地化的中文提示。部分元件完全靜音失敗（Promise rejected 但無任何 toast）。

## What Changes

1. 新增 `src/lib/ipc-error.ts`：解析 `IpcError` JSON，提供 `getIpcErrorCode()` 與 `formatIpcError()` helper。
2. 更新 `src/lib/tauri-bridge.ts` 的 `safeInvoke`：捕捉 Tauri invoke 拋出的字串，嘗試解析為 `IpcError`，重新拋出標準 `Error` 物件含 `code` 屬性。
3. 新增 `src/hooks/useIpcErrorToast.ts`：將 IPC 錯誤代碼對應到繁體中文使用者訊息，呼叫 `toast.error()`。
4. 更新案件 CRUD 相關呼叫端（`cases/new/page.tsx`、`cases/[id]/page.tsx`）使用 `useIpcErrorToast` 顯示友善訊息。

## Non-Goals

- 不修改 Rust `IpcError` 結構（已是 `{code, message}` 格式）。
- 不加入自動重試邏輯（土地登記 API 重試在 `land-registry-errors` spec 範圍內）。
- 不建立 React Error Boundary（屬 UI 架構層，另立 change）。

## Capabilities

### New Capabilities

- `ipc-error-classification`：前端能解析 Rust IpcError JSON，取得結構化錯誤代碼，並對應到繁體中文使用者訊息。

### Modified Capabilities

- `case-management`：案件 CRUD 操作失敗時顯示 toast 錯誤提示，而非靜音失敗或顯示原始 JSON。

## Impact

- Affected specs: `ipc-error-classification`（新建），`case-management`（修改）
- Affected code:
  - New: `src/lib/ipc-error.ts`, `src/hooks/useIpcErrorToast.ts`, `src/lib/__tests__/ipc-error.test.ts`
  - Modified: `src/lib/tauri-bridge.ts`, `src/app/(dashboard)/cases/new/page.tsx`, `src/app/(dashboard)/cases/[id]/page.tsx`
  - Removed: （無）
