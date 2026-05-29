## Why

AIRE 目前本機 Web、macOS App、Windows App 的正式地政資料路徑不一致，導致新竹案件在本機 Web 正式匯入後混入台北 demo/mock 資料。這會直接污染物件總覽與 PDF 檢查，必須在壓 App 前阻斷並補上跨平台驗收證據。

## What Changes

- 新增 Desktop/Web/App release parity gate，要求正式資料匯入以真實 Tauri/Rust IPC 或明確阻擋為準，不以 Web mock 成功畫面作為驗收。
- 修改本機 Web development fallback，禁止 `land_registry_formal_pull_data` 回傳 mock/demo 正式地政資料。
- 修改正式資料匯入、物件資料總覽與 PDF 檢查 UI，候選確認與正式匯入改成全寬、置中、可核對的工作區。
- 新增新竹錯配防回歸測試，確認新竹案件不得出現台北和平東路、建號 778-2 或北松字第012345號。
- 新增 macOS App 與 Windows installer runtime smoke 的 release evidence checklist，確認安裝、啟動與新增案件主流程。

## Non-Goals

- 本次不導入正式 Windows code signing，也不處理 SmartScreen 信任鏈；該範圍屬於 `desktop-windows-installer-trust-signing`。
- 本次不導入 auto-update；自動更新仍是後續 SR。
- 本次不讓 SaaS/Web 雲端保存屋主個資或正式地政 raw payload。
- 本次不重做整體導航或工作台視覺骨架，只調整正式匯入、候選確認與 PDF 檢查的可讀性。

## Capabilities

### New Capabilities

- `desktop-app-release-parity`: Web、macOS App、Windows App 在正式地政匯入與打包驗收上的一致性守門。

### Modified Capabilities

- `case-management`: 案件工作台的正式匯入、候選確認、物件總覽與 PDF 檢查行為需要防止 mock 污染並改善可讀性。
- `land-registry-address-lookup`: 正式地政匯入不得接受 mock/dev fixture 作為正式資料來源。
- `disclosure-document-generation`: PDF 檢查與 PDF 來源資料不得把 mock/demo 正式欄位視為已匯入。

## Impact

- Affected specs: desktop-app-release-parity, case-management, land-registry-address-lookup, disclosure-document-generation
- Affected code:
  - Modified: src/lib/mock-backend.ts
  - Modified: src/components/PullParcelDataButton.tsx
  - Modified: src/components/workbench/DemoAlignedWorkbench.tsx
  - Modified: src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - Modified: src/lib/__tests__/mock-backend.test.ts
  - Modified: e2e/desktop-local-address-to-cop-e2e.spec.ts
  - New: artifacts/smoke/macos/
  - New: artifacts/smoke/windows/
  - Removed: none
- Dependencies 新增: none
- 環境變數新增: none
