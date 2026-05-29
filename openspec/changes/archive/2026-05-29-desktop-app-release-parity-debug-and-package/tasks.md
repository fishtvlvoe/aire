## 1. SR 與測試基線

- [x] 1.1 覆蓋 Decision: Formal import uses real IPC or explicit blocking；確認 SR artifacts 描述本機 Web mock 污染、App IPC source of truth 與壓 App release gate，並以 `spectra analyze desktop-app-release-parity-debug-and-package --json` 驗證。
- [x] 1.2 覆蓋 Requirement: Case workbench SHALL prevent formal import data mismatch；新增新竹案件防回歸測試，驗證物件總覽與 PDF 檢查不出現台北和平東路、建號 778-2、北松字第012345號；以 `pnpm vitest run src/components/__tests__/DemoAlignedWorkbench.test.tsx` 驗證。
- [x] 1.3 覆蓋 Requirement: Formal registry import SHALL reject mock and dev fixture sources；新增 land-registry API wrapper 測試，驗證 browser dev formal import 不會呼叫 mock/safeInvoke trusted payload，Tauri 則走 IPC；以 `pnpm vitest run src/lib/__tests__/land-registry-api.test.ts` 驗證。

## 2. 資料流修正

- [x] 2.1 覆蓋 Requirement: Formal import SHALL not use browser mock data as release evidence；修改 browser dev fallback 行為，正式匯入沒有真實來源時回可讀錯誤且不保存 trusted formal entries；以 PullParcelDataButton component test 驗證。
- [x] 2.2 覆蓋 Requirement: Formal registry import SHALL preserve confirmed target identity；確認正式匯入只使用 active case 的 confirmed registry key，候選或測試資料不可進 paid formal import；以 Rust `cargo test formal_pull` 與前端 component test 驗證。
- [x] 2.3 覆蓋 Requirement: PDF check SHALL exclude mock formal registry data；確認 PDF 檢查只把 `moi_api` 或 `manual` trusted entries 列為已匯入；以 DemoAlignedWorkbench test 驗證。

## 3. UI 修正

- [x] 3.1 覆蓋 Decision: Candidate and formal import become full-width work surfaces；調整工作台正式匯入與候選確認區塊，候選 key、摘要、狀態、費用、動作在全寬主內容中可讀；以 component DOM assertion 驗證。
- [x] 3.2 覆蓋 Requirement: Formal import review SHALL use a full-width readable layout；調整 PDF 檢查表格，十欄以上資料仍可讀且不重疊；以 component DOM assertion 與本機 Web 截圖驗證。

## 4. App 與打包驗收

- [x] 4.1 覆蓋 Decision: Release parity evidence is platform-specific 與 Requirement: Desktop release parity SHALL include runtime evidence per platform；在本機 Web 跑新竹錯配 smoke，保存截圖或 artifact 證明錯配已阻斷。
- [x] 4.2 覆蓋 Decision: Release parity evidence is platform-specific 與 Requirement: Desktop release parity SHALL include runtime evidence per platform；在 macOS Tauri App 跑地址查詢、建立案件與正式匯入 gate smoke，保存 App 截圖與 log。
- [x] 4.3 覆蓋 Decision: Release parity evidence is platform-specific 與 Requirement: Desktop release parity SHALL include runtime evidence per platform；產出 Windows installer 或選定 GitHub Windows build，保存 commit SHA、installer checksum、runtime smoke report 與限制說明。
- [x] 4.4 覆蓋全 SR；跑 `spectra analyze desktop-app-release-parity-debug-and-package --json`、`spectra validate desktop-app-release-parity-debug-and-package`、`pnpm build`，確認 SR 與 web build gate 通過。
