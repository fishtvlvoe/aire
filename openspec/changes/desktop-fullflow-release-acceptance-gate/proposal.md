## Why

AIRE 下一步要把 `desktop-fullflow-r02-cop-parity` 做成可給客戶試用的 Desktop App。現在已經有桌面系統藍圖與主流程 SR，但還需要一個明確的 release acceptance gate，規定「做到什麼程度才算桌面完整版完成」，避免只看 build、只看 mock UI、只看單平台 smoke，就誤判成可以交付。

這個 change 將後續工作整理成驗收 SR：從本機到 Desktop App、從地址到地段/地號/建號、從客戶 COP 到 JSON/費用/cache/error log、從物調補件到 PDF、從 macOS 到 Windows、從 OO 授權到客戶 COP 設定，全部要有可追溯的測試證據。

## What Changes

- 新增 Desktop fullflow release acceptance gate，作為 `desktop-fullflow-r02-cop-parity` 完成後、`desktop-auto-update-macos-windows` 開始前的必經驗收。
- 定義 P0/P1/P2 驗收順序：先桌面完整版與真實 E2E，再 OO 授權與客戶 COP 設定，再自動更新。
- 定義必留驗收證據：macOS smoke、Windows smoke、Playwright artifact、查詢 JSON、費用紀錄、cache hit、error log、PDF artifact、OO/AIRE 授權狀態。
- 明確要求不能宣稱 SaaS 已具備 Desktop 完整功能；SaaS 仍只作帳號、授權、方案與入口。
- 明確要求客戶正式查詢使用客戶自己的 COP API key，不使用 Fish 的 key 或平台共用 key 當正式服務。

## Non-Goals

- 不實作桌面主流程；主流程仍屬於 `desktop-fullflow-r02-cop-parity`。
- 不實作自動更新；自動更新仍屬於 `desktop-auto-update-macos-windows`，且必須等本驗收 gate 通過。
- 不把 SaaS 做成完整案件操作平台。
- 不重做 UI 風格；驗收基準是既有本機完整版 UI/UX。
- 不接受只有單一平台、單一 mock、或單一 build 成功作為完成證明。

## Capabilities

### New Capabilities

- `desktop-fullflow-release-acceptance-gate`: 定義 AIRE Desktop fullflow 進入客戶試用與自動更新前的完整驗收門檻。

### Modified Capabilities

- `release-verification`: 發版驗收必須包含 macOS/Windows、JSON/費用/cache/error log、PDF 與授權證據。
- `land-registry-billing-log`: 查詢驗收必須證明正式查詢、cache hit、錯誤與費用紀錄都可追溯。
- `settings-page`: 授權驗收必須證明 OO/AIRE entitlement 與客戶 COP 憑證狀態在系統設定中清楚呈現。

## Impact

- Affected specs: desktop-fullflow-release-acceptance-gate, release-verification, land-registry-billing-log, settings-page
- Affected code:
  - New: docs/release/desktop-fullflow-acceptance-checklist.md, docs/release/desktop-fullflow-acceptance-report.md
  - Modified: openspec/SR-ACTIVE-INDEX.md
  - Removed: none
