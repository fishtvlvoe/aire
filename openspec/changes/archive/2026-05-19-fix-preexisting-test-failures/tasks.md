# 修復預存在測試失敗

## 1. Mock 層修正（測試隔離）

- [x] 1.1 [P] 修正 `src/components/__tests__/RealtorLicenseField.test.tsx`：在所有其他 `vi.mock` 之後加入 `vi.mock("@/lib/tauri-bridge", () => ({ safeInvoke: mocks.invoke, NotInTauriError: class extends Error {} }))`，並在頂部宣告 `const mocks = vi.hoisted(() => ({ invoke: vi.fn() }))`；移除現有的 `vi.mock("@tauri-apps/api/core", ...)` 並改為只 mock tauri-bridge；確認所有 RLV-001/003/005/007/009/011 測試通過
- [x] 1.2 [P] 修正 `src/components/__tests__/KeyinSplitPage.test.tsx`：在 `vi.mock("@tauri-apps/api/core", ...)` 後加入 `vi.mock("@/lib/tauri-bridge", () => ({ safeInvoke: vi.mocked(invoke), NotInTauriError: class extends Error {} }))`，確認 "shows draft restore toast when get_draft returns data" 測試通過
- [x] 1.3 [P] 修正 `src/app/(dashboard)/settings/sync-status/__tests__/page.test.tsx`：移除 `vi.mock("@tauri-apps/api/core", ...)` 改為 `vi.mock("@/lib/tauri-bridge", () => ({ safeInvoke: mockSafeInvoke, NotInTauriError: class extends Error {} }))`，其中 `mockSafeInvoke = vi.fn()`；同時更新測試內的 `vi.mocked(invoke)` 為 `vi.mocked(mockSafeInvoke)`；確認全部 10 個 SyncStatusPage 測試通過
- [x] 1.4 [P] 修正 `src/app/(dashboard)/cases/__tests__/page.test.tsx`：加入 `vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }) }))` 解決 "invariant expected app router to be mounted" 錯誤；確認 "renders tauri-required message on NotInTauriError" 測試通過
- [x] 1.5 [P] 修正 `src/lib/pdf-blocks/__tests__/logo-anchors.test.tsx`：(a) 在頂部加入 `vi.mock("@/lib/tauri-bridge", () => ({ safeInvoke: vi.fn(), NotInTauriError: class extends Error {} }))` 取代 `vi.mock("@tauri-apps/api/core", ...)`；(b) 在所有 describe 外加入 `import { createPdfEngine } from "@/lib/pdf-engine/engine"` 和 `beforeAll(() => createPdfEngine())`；(c) 在 CLU-005/CLU-009 的 beforeEach 改為 `vi.mocked(safeInvoke).mockResolvedValue(...)`；確認 CLU-005 (4 tests) 和 CLU-009 (2 tests) 通過，CLU-007/CLU-008 的字型錯誤消失

## 2. PDF 引擎字型初始化

- [x] 2.1 [P] 修正 `src/lib/pdf-blocks/__tests__/dynamic-composition.test.tsx`：在 import 區加入 `import { createPdfEngine } from "@/lib/pdf-engine/engine"`；在所有 describe 區塊外頂層加入 `beforeAll(() => createPdfEngine())`；確認 DPC-001/DPC-002/DPC-003/DPC-007/DPC-008 全部通過（不再有 Font family not registered 錯誤）

## 3. 功能修正

- [x] 3.1 [P] 修正 `src/app/login/page.tsx`：將成功登入後的 `router.push("/cases")` 改為 `router.push("/dashboard")`；確認測試 "successful login — calls mockInvoke and redirects to /dashboard" 通過，不影響其他通過的 login 測試
- [x] 3.2 [P] 修正 `src/components/KeyinSplitPage.tsx`：找到顯示印花稅計算結果的元素，加入 `data-testid="fee-stamp-tax"` 屬性；當 `formState` 包含有效的 `transaction_price`, `tax_land_value`, `tax_building_value`, `usage_type`, `transfer_date` 時顯示計算值（如 `1800`），否則顯示 `—`；確認測試 "shows fee-stamp-tax=1800 when formState has valid tax fields" 通過

## 4. 最終驗證

- [x] 4.1 執行完整測試套件 `npx vitest run`，確認本 change 涵蓋的所有測試全數通過，且原本通過的測試無回退
