## Why

AIRE 目前同時存在桌面版能力、Web/SaaS 試用討論與地政查詢紀錄 UI，但客戶真正需要的是一條低認知負荷的桌面完整流程。現在 `查詢紀錄` 頁暴露 SaaS 試用、R02、Helper、API/COP 等底層名詞，會讓客戶誤以為這些是他們必須理解與操作的功能。這個 change 將本期範圍收斂為 Mac/Windows Desktop App 完整版，並把地址查詢、候選對標、正式地政查詢、物調、補件、預覽與 PDF 打包成同一條可驗收流程。

## What Changes

- 新增 Desktop-first 完整流程：使用者在 `新增案件` 輸入地址後，系統於後台補齊地段、地號、建號，使用者確認後才可正式查詢地政資料。
- 修改前台資訊架構：`新增案件` 是唯一查詢入口；`查詢紀錄` 只保留歷史、費用、錯誤與快取追溯；`系統設定` 承接授權、方案、試用到期與客戶 COP 憑證狀態。
- 新增前台降噪規則：客戶操作頁不得顯示 R02、便民系統、COP、API、Helper、adapter、parser、payload、JSON 等技術詞；這些資訊只保留在管理/除錯層。
- 修改查詢紀錄 UX：移除 `SaaS 試用狀態` 與 `R02 便民系統 Helper` 操作區，避免查詢紀錄變成第二個查詢入口。
- 修改地政查詢 gate：未確認地段、地號、建號前不得正式查詢；同一 registry key 已有有效資料時自動帶入快取，不重複扣費。
- 新增 Desktop App 打包驗收：Mac 與 Windows build 必須能跑通新增案件、資料確認、正式查詢、物調預覽與 PDF 流程。

## Non-Goals

- 不在本期把 SaaS 做到與 Desktop 同等功能；SaaS 暫時只作授權、帳號、方案與入口。
- 不在客戶前台暴露 R02 / COP / API 等技術名詞。
- 不使用 Fish 的 COP API 或平台共用 key；正式查詢仍使用客戶自己的 COP 權限。
- 不把候選資料當成正式謄本資料；正式文件必須使用已確認 key 與正式查詢資料。
- 不重做整套視覺風格；以現有本機 AIRE UI 骨架為基準，只重排流程與文案。

## Capabilities

### New Capabilities

- `desktop-fullflow-r02-cop-parity`: Desktop App 提供地址到物調/PDF 的完整低噪流程。
- `customer-facing-language-guard`: 前台客戶操作頁只顯示任務語言，不顯示底層技術名詞。

### Modified Capabilities

- `case-management`: 新增案件頁承接地址補齊、地段地號建號確認與正式查詢入口。
- `land-registry-address-lookup`: 地址候選查詢改為後台流程，前台只呈現可確認欄位。
- `land-registry-billing-log`: 查詢紀錄只作追溯與管理，不作候選查詢輸入。
- `settings-page`: 授權、方案與試用資訊移到系統設定。
- `desktop-shell`: 桌面版打包驗收成為本期完成標準。
- `disclosure-document-generation`: 物調、補件、預覽與 PDF 必須使用已確認地政資料或清楚標示參考狀態。

## Impact

- Affected specs: desktop-fullflow-r02-cop-parity, customer-facing-language-guard, case-management, land-registry-address-lookup, land-registry-billing-log, settings-page, desktop-shell, disclosure-document-generation
- Affected code:
  - New: src/lib/customer-facing-language.ts, e2e/desktop-fullflow-r02-cop-parity.spec.ts
  - Modified: src/app/(dashboard)/cases/new/page.tsx, src/app/(dashboard)/settings/page.tsx, src/lib/land-registry-api.ts, src/lib/mock-backend.ts, src/lib/product-navigation-ia.ts, src-tauri/tauri.conf.json
  - Removed: none
