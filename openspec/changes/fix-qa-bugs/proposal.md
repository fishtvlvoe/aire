## Why

QA 自動化驗收（2026-05-19）在 mock 環境執行全流程測試，發現 7 個功能缺陷，涵蓋揭露資料持久化、品牌設定持久化、Key-in autosave、授權驗證安全性、UI 反饋缺失等核心路徑。這些缺陷直接影響業務員的日常操作流程，部分涉及安全漏洞，必須在交付前修復。

## What Changes

- 修改 `owner-authorization-consent`（Bug#3）：拉謄本 dialog 在未勾授權 checkbox 時點「確認」，必須顯示紅框 + 錯誤訊息，阻止繼續
- 修改 `building-condition-survey`（Bug#4）：揭露資料「現況」tab 的漏水滲水等選項點選後，必須持久化寫入 SQLite（mock: 寫入 mock store cases）
- 修改 `brand-settings-persistence`（Bug#5）：品牌設定儲存後必須持久化（mock: 寫入 mock store `branding` 欄位），reload 後欄位不得清空
- 修改 `license-activation-ui`（Bug#6）：授權序號啟用必須呼叫後端 API 驗證，不得純 client-side 字串比對
- 修改 `settings-land-api-section`（Bug#7）：地政 API 設定點「儲存」後必須顯示成功 toast
- 修改 `supplementary-form`（Bug NEW-2）：Key-in 頁面 autosave indicator 更新時，資料必須實際寫入持久層（mock: mock store cases）；reload 後欄位應還原已儲存值；「已還原上次未儲存的草稿」toast 不得在無 draft 時出現
- 修改 `browser-dev-mock`（Bug NEW-4）：地政 API 測試連線功能必須實際驗證 credentials，不得 client-side mock 回傳假成功；假 credentials 應回傳連線失敗

## Non-Goals

- 不修改 Bug NEW-3（停用授權觸發 browser confirm）— 屬 browser API 限制，另立 change 處理
- 不修改 地政 API 實際連線邏輯（cop.land.moi.gov.tw 端點呼叫）— 測試連線 bug 僅修 mock 層
- 不新增品牌設定欄位或改 UI layout
- 不修改授權後端 server logic — Bug#6 僅修前端，確保呼叫後端，後端接受 AIRE-TEST-2026-ADMIN 序號即可

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `owner-authorization-consent`：checkbox 未勾時點「確認」必須顯示紅框 + 錯誤文字，阻止送出
- `building-condition-survey`：現況選項（漏水滲水、重大裝修、違章增建）點選後必須寫入持久層
- `brand-settings-persistence`：品牌設定存檔後持久化到 `branding` 欄位，reload 後還原
- `license-activation-ui`：序號啟用必須透過後端 API，純 client-side 比對為不合格行為
- `settings-land-api-section`：儲存操作必須提供成功/失敗 toast 反饋
- `supplementary-form`：autosave 必須寫入持久層，reload 後還原已存欄位；無 draft 不顯示還原 toast
- `browser-dev-mock`：測試連線 mock 必須驗證 credentials 格式，假 credentials 回傳失敗狀態

## Impact

- Affected specs: owner-authorization-consent, building-condition-survey, brand-settings-persistence, license-activation-ui, settings-land-api-section, supplementary-form, browser-dev-mock
- Affected code:
  - Modified: src/components/dialogs/OwnerAuthorizationDialog.tsx（或對應路徑）
  - Modified: src/app/cases/[id]/components/DisclosureConditionTab.tsx（或對應路徑）
  - Modified: src/app/settings/branding/page.tsx（或對應路徑）
  - Modified: src/app/settings/page.tsx（或對應路徑）
  - Modified: src/hooks/useKeyinAutosave.ts（或對應路徑）
  - Modified: src/lib/mock/mockStore.ts（或對應路徑）
  - Modified: src/app/cases/[id]/keyin/page.tsx（或對應路徑）
