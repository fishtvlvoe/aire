# AIRE SR Active Index

更新日期：2026-05-29

這份檔案是新對話接手 AIRE SR / SDD 工作時的入口。先讀這份，再決定是否要讀 `openspec/changes/` 裡的 change。不要直接把所有舊 SR 都當成目前要做的工作。

## 目前工作順序

| 順序 | SR | 狀態 | 用途 | 下一步 |
| --- | --- | --- | --- | --- |
| 0 | `desktop-system-flow-blueprint-html` | 已封存 / 歷史參考 | 內部圖表式 HTML 藍圖：整理本機、Desktop App、驗收、授權、OO 串接與自動更新的完整路線。 | 僅作背景，不作完成依據。 |
| 1 | `desktop-local-address-to-cop-e2e` | 進行中 / 唯一主線 | 先完成本機 Web 與 Mac App：地址查詢、confirmed key、正式 COP、本機 DB、cache、費用明細、公告值、實價登錄與 PDF；Windows 驗收延後。 | 完成這個 SR 並留下 Web/Mac/DB/cache/PDF 證據前，不得把 Desktop fullflow 視為可驗收，也不得壓正式 App。 |
| 2 | `desktop-fullflow-r02-cop-parity` | 已封存 / 被吸收 | 舊桌面完整版主線；存活需求已併入 `desktop-local-address-to-cop-e2e`。 | 不再單獨實作或驗收。 |
| 3 | `desktop-fullflow-release-acceptance-gate` | 已封存 / 被吸收 | 舊 release gate；證據要求已併入 `desktop-local-address-to-cop-e2e`。 | 不再單獨實作或驗收。 |
| 4 | `desktop-auto-update-macos-windows` | 已封存 / 延後 | 自動更新不是本期範圍。 | `desktop-local-address-to-cop-e2e` 完整驗收後，另開新 SR。 |

## 接手規則

1. 預設先讀 `docs/aire-desktop-system-blueprint-2026-05-25.html`，再讀上表 SR。
2. `desktop-local-address-to-cop-e2e` 未完成前，不要壓正式 App、不要恢復 Windows acceptance、不要開始 auto-update。
3. `desktop-local-address-to-cop-e2e` 的完成證據必須包含查詢 JSON、費用、cache hit、sourceRunId、error log、PDF artifact 與本機 DB 證據。
4. 舊的 `desktop-fullflow-r02-cop-parity` 與 `desktop-fullflow-release-acceptance-gate` 報告只能當歷史參考，不得拿來抵充目前 SR 驗收。
5. 客戶前台 UI 不顯示 R02、便民系統、COP、API、Helper、JSON、payload、adapter、parser 等技術詞。
6. `/cases/new` 是客戶唯一的地址查詢入口；底層候選查詢與正式地政查詢都藏在系統流程中。
7. `查詢紀錄` 只看費用、cache、錯誤、JSON 與追溯，不放查詢表單或試用狀態。
8. `系統設定` 承接方案、授權、試用、客戶 COP 憑證狀態與未來更新設定。
9. 完成任何 SR 前都要跑 `spectra analyze <change> --json` 與 `spectra validate <change>`。
10. 當前完成定義以本機 Web 與 macOS 主流程為先；Windows 驗收屬下一順位，待主線穩定後再恢復。

## 2026-05-29 收斂決策

- `mvp-land-lookup-unify` 已 park。原因：lookup 契約仍保留參考價值，但目前不再單獨作為 active 開發面；其有效需求由 `desktop-local-address-to-cop-e2e` 主線承接。
- `browser-local-runtime-mvp` 已 park。原因：剩餘工作以 Windows runtime / 環境驗收為主，非目前 Mac first 主線 blocker。
- 現在 `spectra list` 應只剩 `desktop-local-address-to-cop-e2e` 為 active change。

## 歷史或暫停 SR

以下 SR 不應該被新對話當成當前主線。需要時只能作為歷史參考，不能覆蓋目前的桌面完整版方向。

2026-05-26 被吸收或延後的 SR 已移到 `docs/sr-archive/absorbed-2026-05-26.tar.gz`，保留歷史內容但不再出現在 `spectra list` active changes。

| SR | 處理方式 | 原因 |
| --- | --- | --- |
| `address-first-registry-match-and-query-ledger` | 已封存 / 被吸收 | 地址優先、cache、ledger、多候選與付費查詢閘門已收斂進 `desktop-local-address-to-cop-e2e`。 |
| `disclosure-registry-autofill-system-update` | 已封存 / 被吸收 | 物調、PDF 與地政資料自動帶入需求已收斂進 `desktop-local-address-to-cop-e2e`。 |
| `opcos-aire-license-serial-integration` | 已封存 / 延後參考 | OPCOS 授權仍重要，但本 SR 只保留「App 登入從 SaaS 取得 AIRE 授權碼」作為差異，其餘流程不得分叉。 |
| `desktop-fullflow-r02-cop-parity` | 已封存 / 被吸收 | 舊桌面完整版主線已被 `desktop-local-address-to-cop-e2e` 取代。 |
| `desktop-fullflow-release-acceptance-gate` | 已封存 / 被吸收 | 舊驗收門檻已被 `desktop-local-address-to-cop-e2e` 取代。 |
| `desktop-auth-credential-fulfillment-smoke` | 已封存 / 被吸收 | App 登入差異收斂為 SaaS AIRE 授權碼，其他流程不得分叉。 |
| `desktop-auto-update-macos-windows` | 已封存 / 延後 | 自動更新是下一期能力，不屬於本 SR。 |
| `mvp-land-lookup-unify` | 已 park / 主線吸收中 | 地址查詢契約仍可作歷史參考，但 active 開發已收斂到 `desktop-local-address-to-cop-e2e`。 |
| `browser-local-runtime-mvp` | 已 park / Windows 延後 | 剩餘工作以 Windows runtime 驗收為主，不是目前 Mac first 主線 blocker。 |
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
  |  本機 Web 先完成
  |  本機 Web 可查 discovery 狀態
  |  discovery 失敗仍可建立 registry_pending
  |  地政鍵確認後可打 COP formal pull
  |  JSON / 費用 / cache / error log 可追
  |  sourceRunId / 本機 DB 證據可追
  |  補件圖資屬於單一案件/物件
  |  物調 / PDF 只讀保存資料
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
