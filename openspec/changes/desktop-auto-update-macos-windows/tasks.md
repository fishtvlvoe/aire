<!--
Each task description MUST state:
- the behavior or contract being delivered, and
- the verification target that proves completion.
-->

## 0. 前置條件

- [ ] 0.1 實作 Requirement: Desktop shell supports production update lifecycle 與 design goals/non-goals，確認 `desktop-fullflow-r02-cop-parity` 已完成並通過 macOS 與 Windows 實機或 VM 驗收，且本 SR 不實作 SaaS 自動更新、強制更新、多 channel UI 或地政主流程變更；以該 SR 的 release verification report、`spectra validate desktop-fullflow-r02-cop-parity` 與實機截圖/影片紀錄驗證。

## 1. Tauri updater 設定

- [ ] 1.1 實作 Requirement: Signed desktop updates are configured 與 design decision 1: use Tauri updater as the only desktop update path，讓 `src-tauri/tauri.conf.json` 啟用 Tauri updater stable endpoint、版本比對與簽章驗證；以 config unit check 與 release dry-run 驗證 updater manifest 可被 app 讀取。
- [ ] 1.2 實作 Requirement: Electron updater is not used，移除或忽略舊 Electron updater 路徑，讓新更新流程只有 Tauri updater 一條；以 dependency scan 驗證未新增 Electron updater package。
- [ ] 1.3 實作 Requirement: Update checks are non-blocking 與 design decision 3: update checks are non-blocking，封裝 `src/lib/desktop-update.ts`，讓啟動檢查 timeout 或錯誤不阻斷案件頁；以 mocked timeout integration test 驗證 `/cases/new` 可正常載入。

## 2. 系統設定 UI

- [ ] 2.1 實作 Requirement: System settings owns entitlement and authorization，新增「系統設定 > 版本與更新」區塊，顯示目前版本、最後檢查時間、更新狀態與手動檢查按鈕，並讓試用、方案、授權與客戶 COP 憑證狀態仍由系統設定承接；以 settings component test 驗證 up-to-date、available、failed 與 credential-not-configured 狀態。
- [ ] 2.2 實作 Requirement: Customer UI hides update internals 與 design decision 4: customer UI uses task language，讓設定頁不得顯示 Tauri、manifest、signature、GitHub Releases、endpoint 等工程詞；以 content assertion 驗證客戶可見文字只使用任務語言。
- [ ] 2.3 實作 Requirement: Downloaded updates require user restart，讓下載完成後顯示「重新啟動完成更新」按鈕，且不在使用者填寫案件時強制關閉；以 Playwright flow 驗證案件表單未被自動中斷。

## 3. 發版流程

- [ ] 3.1 實作 Requirement: Release artifacts include updater metadata 與 design decision 2: stable channel first, GitHub Releases first，更新 release workflow 產出 macOS、Windows 安裝檔、updater manifest 與 signature；以 GitHub Actions dry-run 或 release candidate run 驗證 stable channel artifacts 名稱與 checksum。
- [ ] 3.2 實作 Requirement: macOS production build is signed and notarized，讓 macOS 正式版沒有簽章或 notarization 時不得標記為可發布；以 release workflow gate 與 macOS 首次啟動 smoke 驗證。
- [ ] 3.3 實作 Requirement: Windows production build is signed，讓 Windows 正式版沒有簽章時不得標記為可發布；以 release workflow gate 與 Windows 安裝 smoke 驗證。

## 4. 更新後資料保留

- [ ] 4.1 實作 Requirement: Local data survives app update 與 design decision 5: update must preserve local data，建立舊版測試資料後升級到新版，確認案件、查詢 JSON、費用紀錄、錯誤 log、補件資料與客戶 COP 憑證狀態仍存在；以 old-to-new smoke report 驗證。
- [ ] 4.2 實作 Requirement: Desktop update is verified on macOS and Windows，更新後跑通地址輸入、地段地號建號確認、正式查詢 gate、物調預覽與 PDF；以 macOS 與 Windows 各一份 smoke report 驗證。

## 5. 文件與驗收

- [ ] 5.1 建立 `docs/release/desktop-update-verification.md`，記錄 release 版本、平台、artifact、簽章、更新來源、測試帳號、舊版升新版結果與失敗處理；以文件審查與 artifact link 驗證。
- [ ] 5.2 跑 Spectra consistency gate；以 `spectra analyze desktop-auto-update-macos-windows --json` 0 Critical/0 Warning 與 `spectra validate desktop-auto-update-macos-windows` 通過驗證。
- [ ] 5.3 提交並推送乾淨分支，避免混入桌面完整版主 SR 的未驗收程式碼；以 `git status`、commit diff review 與 branch push 驗證。
