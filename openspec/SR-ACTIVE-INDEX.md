# AIRE SR Active Index

更新日期：2026-05-25

這份檔案是新對話接手 AIRE SR / SDD 工作時的入口。先讀這份，再決定是否要讀 `openspec/changes/` 裡的 change。不要直接把所有舊 SR 都當成目前要做的工作。

## 目前工作順序

| 順序 | SR | 狀態 | 用途 | 下一步 |
| --- | --- | --- | --- | --- |
| 0 | `desktop-system-flow-blueprint-html` | 已建立 | 內部圖表式 HTML 藍圖：整理本機、Desktop App、驗收、授權、OO 串接與自動更新的完整路線。 | 接手前先看 `docs/aire-desktop-system-blueprint-2026-05-25.html`。 |
| 1 | `desktop-local-address-to-cop-e2e` | 進行中 / 阻塞修正 | 先打通本機 Web 與 Desktop App 共用的地址 discovery、地政鍵確認、COP formal pull、費用/cache/error/JSON 保存與物調/PDF 串接。 | 完成這個 SR 前，不得把 Desktop fullflow 視為可驗收，也不得壓正式 App。 |
| 2 | `desktop-fullflow-r02-cop-parity` | 排隊 | 本期主線：把 AIRE 做成 Mac/Windows 桌面完整版，從地址輸入、地段地號建號對標、客戶 COP 查詢、物調補件、HTML 預覽到 PDF。 | 先等 `desktop-local-address-to-cop-e2e` 通過，再回到這個 SR 驗收。 |
| 3 | `desktop-fullflow-release-acceptance-gate` | 排隊 | 驗收門檻：確認 Desktop fullflow、macOS/Windows、OO 授權、客戶 COP、JSON、費用、cache、error log、PDF 都有證據。 | 完成第 2 項後立刻跑驗收。 |
| 4 | `desktop-auto-update-macos-windows` | 排隊 | 下一期：本期桌面完整版通過 macOS 與 Windows 實機驗收後，再補自動更新通知、下載、重啟更新與發版流程。 | 完成第 3 項後才開始。 |

## 接手規則

1. 預設先讀 `docs/aire-desktop-system-blueprint-2026-05-25.html`，再讀上表 SR。
2. `desktop-local-address-to-cop-e2e` 未完成前，不要壓正式 App、不要做 Windows/macOS release acceptance、不要開始 auto-update。
3. `desktop-fullflow-r02-cop-parity` 未完成前，不要跑 release acceptance gate。
4. `desktop-fullflow-release-acceptance-gate` 未通過前，不要實作自動更新。
5. 客戶前台 UI 不顯示 R02、便民系統、COP、API、Helper、JSON、payload、adapter、parser 等技術詞。
6. `/cases/new` 是客戶唯一的地址查詢入口；底層候選查詢與正式地政查詢都藏在系統流程中。
7. `查詢紀錄` 只看費用、cache、錯誤、JSON 與追溯，不放查詢表單或試用狀態。
8. `系統設定` 承接方案、授權、試用、客戶 COP 憑證狀態與未來更新設定。
9. 完成任何 SR 前都要跑 `spectra analyze <change> --json` 與 `spectra validate <change>`。
10. 涉及桌面 app 時，不能只跑 build；macOS 與 Windows 都要能安裝、啟動、跑通主流程並留下驗收紀錄。

## 歷史或暫停 SR

以下 SR 不應該被新對話當成當前主線。需要時只能作為歷史參考，不能覆蓋目前的桌面完整版方向。

| SR | 處理方式 | 原因 |
| --- | --- | --- |
| `address-first-registry-match-and-query-ledger` | Parked / 歷史參考 | 地址優先、cache、ledger 的存活需求已收斂進 `desktop-fullflow-r02-cop-parity`。 |
| `disclosure-registry-autofill-system-update` | Parked / 歷史參考 | 物調與地政資料自動帶入需求已收斂進桌面完整版主線。 |
| `opcos-aire-license-serial-integration` | Parked / 歷史參考 | OPCOS 授權仍重要，但本期客戶可用完整桌面 app 優先。 |
| `refine-product-navigation-ia` | 已完成 / 歷史參考 | UI 導航整理已不再是本期主線。 |
| `fix-cr-review-persistence-and-supplement-routing` | 已完成 / 歷史參考 | 修正項已完成，不應重開。 |
| `settings-plan-upgrade-profile-redesign` | 已完成 / 歷史參考 | 設定頁方向保留，但不單獨作為本期主線。 |
| `fix-case-list-destinations-and-workbench-actions` | 已完成 / 歷史參考 | 案件列表修正已完成。 |
| `floor-plan-assets-bridge` | 已完成 / 歷史參考 | 格局圖橋接不是本期優先。 |
| `align-product-ui-with-demo-reference` | 已完成 / 歷史參考 | 視覺校準已完成，不要重做 UI 骨架。 |
| `merge-output-actions-into-case-management` | 已完成 / 歷史參考 | 產出動作已整併。 |
| `settings-dev-feature-toggles-and-land-auth-help` | 已完成 / 歷史參考 | 設定與地政授權說明已完成。 |
| `full-product-flow-ia-ux-acceptance` | 已完成 / 歷史參考 | 整體 IA 驗收已完成，存活需求已併入桌面主線。 |

## 白話流程圖

```text
現在要做
  |
  v
desktop-system-flow-blueprint-html
  |  先讀圖表式藍圖
  |  確認本機 -> App -> 驗收 -> OO -> 更新的順序
  v
desktop-local-address-to-cop-e2e
  |  本機 Web 可查 discovery 狀態
  |  地政鍵確認後可打 COP formal pull
  |  JSON / 費用 / cache / error log 可追
  |  物調 / PDF 只讀保存資料
  v
desktop-fullflow-r02-cop-parity
  |  macOS 實機可用
  |  Windows 實機可用
  |  地址 -> 對標 -> COP -> 物調 -> PDF 跑通
  v
desktop-fullflow-release-acceptance-gate
  |  JSON / 費用 / cache / error log 可追
  |  OO 授權 / 客戶 COP 設定可驗
  |  macOS + Windows 驗收報告完整
  v
驗收通過後
  |
  v
desktop-auto-update-macos-windows
  |  有新版本通知
  |  可下載更新
  |  重啟後升版
  v
下一期發版能力
```
