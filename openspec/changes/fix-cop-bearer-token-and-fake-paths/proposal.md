## Why

生產環境下所有地政 API 呼叫均以 Basic auth 直接打 COP 端點，COP 回傳 COP311「取得帳號資訊失敗」。根因一：`get_token()` 是 stub（回傳空字串）從未實際呼叫 `GET /cp/getToken`，導致 Bearer token 未建立。根因二：building_registry / co_owners / building_ownership / mortgages 四支 API 的路徑沿用假路徑（`/land/parcel/...`），非真實 COP API 格式，呼叫必然 404。沙箱接受 Basic auth 才未被發現；切換正式環境後完全無法取得謄本資料。

## What Changes

- 修改 `src-tauri/src/land_registry/client/mod.rs`：
  - 恢復 `get_token()` 真實實作：`GET https://copapi.moi.gov.tw/cp/getToken` Basic auth → 解析 `access_token`（expires_in 300s）→ 以 Bearer token 用於所有後續 API 呼叫
  - 增加 token 到期判斷（距到期 < 30s 即提前刷新）
  - `build_auth_header()` 改為回傳 Bearer token header（非 Basic）
- 修改 `src-tauri/src/land_registry/apis/building_registry.rs`：路徑改為 `/BuildingDescription/1.0/QueryByBuildingNo`，payload/回應格式配合 COP BUILDREG 結構
- 修改 `src-tauri/src/land_registry/apis/co_owners.rs`：路徑改為 `/LandOwnership/1.0/QueryByLandNo`，回應格式配合 COP LANDOWNER 結構
- 修改 `src-tauri/src/land_registry/apis/building_ownership.rs`：路徑改為 `/BuildingOwnership/1.0/QueryByBuildingNo`，回應格式配合 COP BUILDOWNER 結構
- 修改 `src-tauri/src/land_registry/apis/mortgages.rs`：路徑改為 `/LandOtherRight/1.0/QueryByLandNo`，回應格式配合 COP LANDOTHER 結構
- 更新上述五個檔案的 wiremock 單元測試，mock path 與 response body 對齊真實 COP 格式

## Non-Goals

- 不修改 UI 層（IPC 介面不變）
- 不修改 land_registry.rs / zoning.rs / land_value.rs / address_to_parcel.rs（這些在前次 CR 已修正）
- 不實作 token 持久化（token 存在 memory，process 重啟重取即可，300s 週期足夠）
- 不實作 token 共享跨 API instance（各 instance 獨立取 token）
- 不修改 TwinkleAI 整合（已在前次修正）

## Capabilities

### New Capabilities

（none）

### Modified Capabilities

- `land-registry-errors`：錯誤碼 COP311（auth 失敗）現在會在 token 取得失敗時正確回傳給呼叫端，取代原本的 200 但資料空白情況

## Impact

- Affected specs: land-registry-errors（error surface 改變）
- Affected code:
  - Modified: src-tauri/src/land_registry/client/mod.rs
  - Modified: src-tauri/src/land_registry/apis/building_registry.rs
  - Modified: src-tauri/src/land_registry/apis/co_owners.rs
  - Modified: src-tauri/src/land_registry/apis/building_ownership.rs
  - Modified: src-tauri/src/land_registry/apis/mortgages.rs
  - New: (none)
  - Removed: (none)
