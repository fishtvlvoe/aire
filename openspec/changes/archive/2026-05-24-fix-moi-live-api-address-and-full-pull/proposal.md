## Why

裕農路真實地址驗收顯示 AIRE 目前沒有真正把 MOI/COP 地址查詢打通：本機 UI 可產 PDF，但 live `address_to_parcel` 回傳 0 筆，導致後續建物與土地資料都無法拉出來。官方 MOI_API_037 文件要求地址包含縣市名稱，現有後端卻把縣市切掉，必須修正後再跑全部可用 MOI API。

## What Changes

- 修改地址轉建號 API payload，依 MOI_API_037 文件送出完整地址。
- 新增 live 驗收路徑，針對 `台南市東區裕農路288巷17號8樓之1` 輸出地址查詢、建物端點、土地端點、費用與失敗原因。
- 明確區分 AIRE 已實作的建物端點與土地端點，避免只跑局部 API。
- 對 AIRE 尚未有 typed client、但本案已有足夠輸入可呼叫的 MOI/COP 服務，先以 raw live endpoint attempts 記錄 payload、HTTP/COP 狀態與原始回應。
- 保存完整 JSON 驗收檔到 `/tmp` 與使用者下載資料夾，讓 Fish 能直接檢查所有 API 回傳內容。

## Non-Goals

- 不在本 SR 把尚未實作的 MOI 端點正式產品化成 typed client 或 UI 功能。
- 不把 live API 憑證寫入 git。
- 不改 UI 版面與 PDF 模板，除非 live 資料證明既有映射有錯。
- 不以 mock 資料當作真實 API 驗收。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `land-registry-address-lookup`: 地址查詢 SHALL 依官方文件送完整地址，不能切掉縣市。
- `land-registry-parcel-apis`: 全量拉取驗收 SHALL 涵蓋 AIRE 已實作的所有建物與土地 MOI/COP 端點，並以 raw attempts 記錄其他本案可提供輸入的 MOI/COP 端點成功、失敗與費用線索。

## Impact

- Affected specs: land-registry-address-lookup, land-registry-parcel-apis
- Affected code:
  - Modified: src-tauri/src/land_registry/apis/address_to_parcel.rs
  - New: src-tauri/tests/cop_api_yunong_live.rs
- Dependencies 新增: none
- 環境變數新增: none
