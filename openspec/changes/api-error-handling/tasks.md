# Tasks

## Wave 1 — TDD 紅燈測試

- [x] 1. 紅燈測試：在 `src/lib/__tests__/ipc-error.test.ts` 寫 6 個失敗測試，覆蓋 `parseIpcError`（JSON 字串輸入、plain object 輸入、null 輸入各一）與 `formatIpcError`（已知 code 各一、unknown code fallback 一）。執行 `pnpm exec vitest run src/lib/__tests__/ipc-error.test.ts`，確認全部紅燈（file not found 或 import error 算紅燈）。驗證：測試執行後沒有任何 PASS。

## Wave 2 — 實作 ipc-error.ts

- [x] 2. 實作 `src/lib/ipc-error.ts`：匯出 `IpcError` interface（`{ code: string; message: string }`）、`isIpcError(e: unknown): e is IpcError` type guard、`parseIpcError(raw: unknown): IpcError | null`（先嘗試 plain object、再嘗試 JSON.parse、其他回 null）、`formatIpcError(code: string): string`（對照表含 not_found / missing_field / db_error / validation_error / forbidden / internal，未知 code → `"操作失敗，請稍後再試"`）。執行 `pnpm exec vitest run src/lib/__tests__/ipc-error.test.ts` → 6/6 全綠。

## Wave 3 — useIpcErrorToast hook

- [x] 3. 建立 `src/hooks/useIpcErrorToast.ts`：匯出 `useIpcErrorToast()` hook，回傳 `{ handleError: (err: unknown) => void }`。`handleError` 邏輯：呼叫 `parseIpcError(err)` → 若非 null 則 `toast.error(formatIpcError(code))`；若為 null 則 `toast.error(err instanceof Error ? err.message : "操作失敗")`。使用 `sonner` 的 `toast` API。執行 `pnpm exec tsc --noEmit` 確認型別無誤。

## Wave 4 — 串接至案件 CRUD UI

- [x] [P] 4. 更新 `src/app/(dashboard)/cases/new/page.tsx`：在 `handleSubmit` 的 `catch(err)` 區塊，加入 `handleError(err)`（從 `useIpcErrorToast` 取得），保留現有的 `setSubmitError(...)` inline 錯誤顯示邏輯（雙軌並行）。執行 `pnpm exec tsc --noEmit` 確認型別無誤。
- [x] [P] 5. 更新 `src/app/(dashboard)/cases/[id]/page.tsx`：找出所有 `casesApi.*` 呼叫的 `catch` block（或目前無 catch 的 await），加入 `handleError(err)` 呼叫。若原本靜音失敗（catch 區塊為空或只有 console.log），改為呼叫 `handleError`。執行 `pnpm exec tsc --noEmit` 確認型別無誤。

## Wave 5 — 驗收

- [x] 6. 跑 `pnpm exec vitest run src/lib/__tests__/ipc-error.test.ts` 確認 6/6 全綠；執行 `pnpm exec tsc --noEmit` 全無型別錯誤。驗證：ipc-error 測試 Pass 數 = 6，TypeScript errors = 0。
