## Why

AIRE 的地政 API 目前透過 OPCOS 中介伺服器（`opcos.aiver.me`）轉接政府地政協作平台（`copapi.moi.gov.tw`），但 OPCOS 尚未部署，導致 `PullParcelDataButton` 的完整查詢流程無法在 `pnpm tauri dev` 環境測試。政府協作平台官方提供免認證的沙箱環境（`copapi.moi.gov.tw/sandbox`），可直接呼叫驗證流程正確性。

## What Changes

- 新增環境變數 `COPAPI_SANDBOX=true`（設定於 `src-tauri/.env`）
- 當 `COPAPI_SANDBOX=true` 時，Rust `pull_parcel_data` 指令繞過 OPCOS OAuth 流程，直接呼叫政府沙箱 API
- 沙箱模式使用固定測試地號（UNIT=BA / SEC=0001 / NO=00010001）驗證完整流程
- 僅 `land_ownership` API 支援沙箱直連（其他 6 種 API 在沙箱模式返回明確的「沙箱不支援此 API」錯誤）
- 回應結果對應到 AIRE 內部資料結構，consent 檢查與 billing_log 記錄維持不變

## Non-Goals

- 不替換 OPCOS：此為開發測試用快速通道，production 仍走 OPCOS
- 不解析 parcel_id → UNIT/SEC/NO：parcel_id 的 OPCOS 格式轉換由 OPCOS 負責，沙箱模式用固定測試地號
- 不新增其他 6 種 API 的沙箱對應（BuildingRegistry、CoOwners、LandValue、Mortgages、BuildingOwnership、Zoning）
- 不建立 mock 伺服器：直接打政府沙箱，取真實資料

## Capabilities

### New Capabilities

- `land-registry-sandbox-direct`: 當 `COPAPI_SANDBOX=true` 時，`pull_parcel_data` Tauri command 的 `land_ownership` API 呼叫政府沙箱（不需 clientId/clientSecret），回傳 LandOwnership 資料供 UI 顯示

### Modified Capabilities

(none)

## Impact

- Affected specs: land-registry-sandbox-direct（新建）
- Affected code:
  - New: src-tauri/src/land_registry/sandbox_client.rs
  - Modified: src-tauri/src/land_registry/pull.rs
  - Modified: src-tauri/src/lib.rs
  - Modified: src-tauri/.env
