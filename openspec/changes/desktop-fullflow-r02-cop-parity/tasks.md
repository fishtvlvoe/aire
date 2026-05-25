<!--
Each task description MUST state:
- the behavior or contract being delivered, and
- the verification target that proves completion.
-->

## 1. SDD 與文案規範

- [x] 1.1 實作 Requirement: Customer-facing language guard 與 decision: technical language is hidden from customer workflow，讓客戶操作頁不得出現 R02、便民系統、COP、API、Helper、adapter、parser、payload、JSON 等技術詞；以文字掃描單元測試與 Playwright content assertion 驗證。
- [x] 1.2 實作 Requirement: Desktop fullflow is the release surface，更新 Desktop-first SDD spec delta，讓新增案件、查詢紀錄、系統設定、桌面殼與正式文件產出各自職責明確；以 `spectra analyze desktop-fullflow-r02-cop-parity --json` 0 Critical/0 Warning 驗證。

## 2. 新增案件成為查詢入口

- [x] 2.1 實作 Requirement: Create case flow 與 decision: new case is the only customer-facing lookup entry，讓使用者輸入地址後在同頁看到地段、地號、建號確認欄位與簡潔狀態；以 component test 驗證成功、多候選、需人工補填三種狀態。
- [x] 2.2 實作 Requirement: Address lookup UX，將地址候選查詢包裝成後台流程，讓 UI 只顯示 `地址資料補齊`、`資料確認` 與 `判斷地政資料`；以 E2E 驗證前台不顯示底層來源名稱。
- [x] 2.3 實作 Requirement: Confirmed registry match gates formal lookup，讓未確認地段、地號、建號時無法打正式地政查詢；以 route/hook test 驗證未確認回 `registry_match_required` 且費用為 0。

## 3. 查詢紀錄與系統設定重切

- [x] 3.1 實作 Requirement: Settings page 與 decision: system settings owns entitlement and authorization，將方案、試用到期、授權與客戶 COP 憑證狀態移至系統設定，讓權限資訊只在設定頁出現；以 settings component test 驗證 active/expired/not-configured 狀態。
- [x] 3.2 實作 decision: query records are for audit only，移除查詢紀錄頁的 SaaS 試用卡與 R02 Helper 操作區，讓該頁只顯示搜尋、歷史紀錄、費用、cache、錯誤與明細；以 component test 驗證頁面不含試用與 R02 操作表單。
- [x] 3.3 保留查詢紀錄 detail 的 JSON、錯誤與 API rows，但預設收合並標成管理用途；以 component test 驗證 detail 可展開且主列表不暴露技術詞。

## 4. 快取、費用與資料帶入

- [x] 4.1 實作 Requirement: Billing log records and cache hits，讓第二次同物件查詢建立 cache-hit run 且 `totalCostCents = 0`；以 integration test 驗證 sourceRunId 指向原 run。
- [x] 4.2 正式查詢成功後自動帶入物調表與補件工作台，讓左側補件欄位與右側 HTML 預覽同步更新；以 UI test 驗證漏水/壁癌、車庫、電梯、水塔、通行狀況欄位可填並反映到預覽。
- [x] 4.3 實作 Requirement: Disclosure generation uses confirmed registry data，讓正式 PDF 產出使用已保存的查詢 JSON，不在 PDF 產出時重新打付費查詢；以 integration test 驗證產出 PDF 後 paid call count 不增加。

## 5. Desktop App 打包與驗收

- [x] 5.1 實作 Requirement: Desktop shell 與 decision: desktop packaging is part of acceptance，驗證 macOS Desktop App 可啟動並跑通新增案件、資料確認、正式查詢、物調預覽、PDF 流程；以 macOS Tauri smoke report 驗證。
- [ ] 5.2 驗證 Windows Desktop App 可啟動並跑通同一流程；以 Windows runner/VM/CI installer smoke report 驗證。
- [x] 5.3 實作 Requirement: SaaS parity is not claimed for this release，建立本期 E2E 報告與 release copy 檢查，保留每次查詢的 JSON、費用、錯誤、cache 命中與斷點狀態，且不宣稱 SaaS 已具備 Desktop 完整流程；以 Playwright artifact、release verification report 與文案掃描驗證。

## 6. 收斂與交接

- [x] 6.1 跑 Spectra consistency gate；以 `spectra analyze desktop-fullflow-r02-cop-parity --json` 與 `spectra validate desktop-fullflow-r02-cop-parity` 通過證明 SDD 可執行。
- [ ] 6.2 實作完成後提交乾淨分支，避免混入舊 SR archive、SaaS trial 殘留與測試輸出；以 `git status`、commit diff review 與 branch push 驗證。
