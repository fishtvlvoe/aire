<!--
Each task description MUST state:
- the behavior or contract being delivered, and
- the verification target that proves completion.
-->

## 1. P0 桌面完整版與真實 E2E

- [x] 1.1 實作 Requirement: Desktop fullflow release gate blocks downstream work、design goals/non-goals 與 decision 1: acceptance gate blocks auto-update work，建立 `docs/release/desktop-fullflow-acceptance-checklist.md`，列出 Desktop fullflow 未通過前不得開始自動更新與正式客戶試用，且本 SR 不實作 UI、API、R02、COP 或 updater；以文件審查與 SR index 連結驗證。
- [x] 1.2 實作 Requirement: P0 validates the product workflow 與 decision 3: P0 validates the product workflow，跑通地址輸入、地段/地號/建號確認、正式查詢 gate、物調補件、HTML 預覽與 PDF；以 Playwright artifact、桌面截圖與 `docs/release/desktop-fullflow-acceptance-report.md` 驗證。
- [x] 1.3 驗證 R02/candidate discovery 與人工確認斷點，讓多候選、查無候選、未確認 registry key 都不會進付費查詢；以候選 JSON、`registry_match_required` 或等效狀態、費用 0 紀錄驗證。
- [x] 1.4 驗證客戶 COP 正式查詢，讓正式查詢使用客戶自己的 COP API key，不使用 Fish key 或平台共用 key；以設定頁狀態、查詢 run metadata 與驗收報告驗證。
- [x] 1.5 實作 Requirement: Registry acceptance evidence includes billing and cache records，驗證查詢紀錄與 PDF 不重複扣費，讓 JSON、費用、cache hit、sourceRunId、error log 與 PDF artifact 都可追溯；以 query record detail、cache-hit run、PDF artifact 與 saved JSON id 驗證。

## 2. P1 授權、COP 設定與桌面打包

- [x] 2.1 實作 Requirement: P1 validates entitlement and installability、Requirement: Acceptance verifies authorization status in settings 與 decision 4: P1 validates entitlement and installability，驗證 OO 帳號、AIRE entitlement、試用/方案狀態與客戶 COP 憑證狀態都在系統設定中正確呈現；以設定頁截圖與 entitlement test record 驗證。
- [x] 2.2 驗證 macOS Desktop App 可安裝、啟動並跑完整 P0 流程；以 macOS Tauri smoke report、截圖/影片與 PDF artifact 驗證。
- [ ] 2.3 驗證 Windows Desktop App 可安裝、啟動並跑完整 P0 流程；以 Windows runner/VM/實機 smoke report、截圖/影片與 PDF artifact 驗證。
- [x] 2.4 實作 Requirement: SaaS parity is not claimed without evidence，驗證 release copy 不宣稱 SaaS 已具備 Desktop 完整流程，讓 `aire.opcos.me` 僅被描述為帳號、授權、方案與入口；以文案掃描與驗收報告驗證。

## 3. P2 自動更新前置與交接

- [ ] 3.1 實作 Requirement: P2 starts only after P0/P1 pass 與 decision 5: P2 starts only after P0/P1 pass，確認 `desktop-auto-update-macos-windows` 的前置條件已滿足後才允許實作；以驗收報告中的 pass/fail matrix 驗證。
- [x] 3.2 實作 Requirement: Desktop fullflow release report is required、Requirement: Evidence must be product-visible or artifact-visible 與 decision 2: evidence must be product-visible or artifact-visible，整理所有測試證據到 `docs/release/desktop-fullflow-acceptance-report.md`，包含 branch、commit、平台、測試地址、JSON、費用、cache、error log、PDF 與已知風險；以文件審查驗證。
- [x] 3.3 跑 Spectra consistency gate；以 `spectra analyze desktop-fullflow-release-acceptance-gate --json` 0 Critical/0 Warning 與 `spectra validate desktop-fullflow-release-acceptance-gate` 通過驗證。
