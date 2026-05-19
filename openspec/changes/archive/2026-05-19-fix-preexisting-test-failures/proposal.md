## Why

37 個預存在測試（fix-qa-bugs 合入前就已失敗）阻礙 CI 全綠。根因分五群：(A) 測試直接 mock `@tauri-apps/api/core.invoke`，但元件改用 `@/lib/tauri-bridge.safeInvoke`，導致 IPC 永遠拿不到 mock 回應；(B) login page 重導向 `/cases`，但測試期望 `/dashboard`；(C) `cases/page` 測試缺少 `next/navigation` mock；(D) `KeyinSplitPage` 的 `fee-stamp-tax` data-testid 尚未加入 DOM；(E) PDF 引擎測試中 logo 上傳與動態分頁功能尚未實作至對應函式。

## What Changes

- 修改 `src/components/__tests__/RealtorLicenseField.test.tsx`：加入 `vi.mock("@/lib/tauri-bridge", ...)` 讓 `safeInvoke` 受測試控制（8 個 RLV 測試修復）
- 修改 `src/components/__tests__/KeyinSplitPage.test.tsx`：加入 `vi.mock("@/lib/tauri-bridge", ...)` 修復草稿還原 toast 測試
- 修改 `src/app/(dashboard)/settings/sync-status/__tests__/page.test.tsx`：改 mock `@/lib/tauri-bridge` 而非 core invoke（修復 10 個 SyncStatusPage 測試）
- 修改 `src/app/(dashboard)/cases/__tests__/page.test.tsx`：加入 `vi.mock("next/navigation", ...)` 解決 "invariant expected app router" 錯誤
- 修改 `src/app/login/page.tsx`：成功登入後重導向從 `/cases` 改為 `/dashboard`
- 修改 `src/components/KeyinSplitPage.tsx`：在印花稅計算結果元素加入 `data-testid="fee-stamp-tax"`
- 修改 `src/lib/pdf-blocks/logo-anchors.ts` 或對應實作：實作 `uploadLogo`/`deleteLogo` 函式至 CLU-005/CLU-007/CLU-008/CLU-009 規格（metadata 回傳、佔位符文字、preserve_theme_id）
- 修改 `src/lib/pdf-blocks/dynamic-composition.ts` 或對應實作：修復 DPC-001/002/003/007/008（頁數計算、條件分頁、頁碼格式、長表格換行）

## Non-Goals

- 不修改測試的**測試邏輯**（只修測試 mock 架構，不更改測試意圖）
- 不處理 `sync-status/page.tsx` 元件本身的渲染問題以外的功能擴充
- 不修改其他通過中的測試
- 不添加新的業務功能（此次純為修復測試失敗）

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `realtor-license-verification`: RLV 測試 mock 改用 tauri-bridge 層
- `admin-login-page`: 成功登入重導向目的地改為 /dashboard
- `tax-fee-pages`: fee-stamp-tax data-testid 加入 KeyinSplitPage DOM
- `customer-logo-upload`: uploadLogo/deleteLogo CLU-005/007/008/009 函式實作
- `dynamic-page-composition`: DPC-001/002/003/007/008 頁數計算修復

## Impact

- Affected specs: realtor-license-verification, admin-login-page, tax-fee-pages, customer-logo-upload, dynamic-page-composition
- Affected code:
  - Modified:
    - src/components/__tests__/RealtorLicenseField.test.tsx
    - src/components/__tests__/KeyinSplitPage.test.tsx
    - src/app/(dashboard)/settings/sync-status/__tests__/page.test.tsx
    - src/app/(dashboard)/cases/__tests__/page.test.tsx
    - src/app/login/page.tsx
    - src/components/KeyinSplitPage.tsx
    - src/lib/pdf-blocks/logo-anchors.ts
    - src/lib/pdf-blocks/dynamic-composition.ts
  - New: (none)
  - Removed: (none)
