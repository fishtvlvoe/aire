## Problem

AIRE 的 Rust 後端有 7 個已確認的整合 Bug，導致地政 API（COP API）與實價登錄（TwinkleAI MCP）在正式環境完全無法運作：

**Bug 1 — env var 名稱不一致**
`src-tauri/src/mcp_client.rs` 讀取 `TWINKLE_HUB_API_KEY`，但 `.env` 只有 `TWINKLE_AI_API_KEY`，導致 key 永遠讀不到（空字串），所有實價登錄呼叫帶空 Bearer token。

**Bug 2 — TwinkleAI 參數名錯誤**
`mcp_client.rs` 的 JSON body 用 `"dataset": "lvr-trades"`，但 TwinkleAI API 要求 `"dataset_id"`，導致 422 Input validation error。

**Bug 3 — TwinkleAI 缺 Accept header**
未附 `Accept: application/json, text/event-stream`，API 回 406 Not Acceptable。

**Bug 4 — TwinkleAI 查詢欄位名不存在**
查詢 SQL 用 `district` / `road` 欄位，但 `lvr-trades` 實際欄位是 `鄉鎮市區` / `土地位置建物門牌`，導致 Binder Error。

**Bug 5 — 使用全國 lvr-trades 查台南市無資料**
`lvr-trades` 全國整合資料集對台南市回傳 0 筆；需按城市使用對應 dataset（台南市買賣案件 = `128852`；需動態決定 dataset_id）。

**Bug 6 — get_token() 是假 stub**
`src-tauri/src/land_registry/client/mod.rs` 的 `get_token()` 函式生成假 JWT，從未呼叫 `https://copapi.moi.gov.tw/cp/getToken`。COP API 實際以 Basic Auth 運作，不需要 Bearer token，此函式邏輯完全錯誤。

**Bug 7 — Endpoint 路徑為 wiremock mock path**
`src-tauri/src/land_registry/apis/` 下所有 API 用 `/land/address-to-parcel`、`/land/parcel/land-registry` 等路徑，這些是 wiremock 測試用的假路徑。真實 COP API 路徑格式為 `/{ServiceName}/{version}/{FunctionName}`，例如 `/LandDescription/1.0/QueryByLandNo`、`/BuildingNo/1.0/QueryByAddress`。

## Root Cause

地政與實價登錄的 Rust 模組最初為 TDD wiremock 測試環境而寫，從未針對真實 API 端點更新。API discovery（真實 URL、欄位名、auth 機制）是在開發後期測試腳本才確認，Rust code 未跟進。

## Proposed Solution

**實價登錄（mcp_client.rs）修正：**
1. 將 `TWINKLE_HUB_API_KEY` 改為 `TWINKLE_AI_API_KEY`
2. 加入 `Accept: application/json, text/event-stream` header
3. JSON body 的 `dataset` 改為 `dataset_id`
4. 新增 `dataset_id_for_city(city: &str) -> &str` 函式，根據城市名稱回傳正確 dataset ID（台南市→`128852`，台北市→待確認，其餘暫用 `lvr-trades`）
5. 查詢 SQL 的 where clause 欄位名改為 `鄉鎮市區`、`土地區段位置或建物區門牌`
6. 解析回傳的 SSE `data:` 行格式（event stream），取出 JSON 後解析 `result.content[0].text` 再 JSON.parse

**地政（land_registry/client/mod.rs）修正：**
1. 移除 `get_token()` stub 函式（或標示為 deprecated 留測試用）
2. `build_auth_header()` 已是正確 Basic Auth，保留
3. 確認所有 HTTP 呼叫使用 Basic Auth header，不帶 Bearer token

**地政 Endpoint 路徑（land_registry/apis/）修正：**
1. `address_to_parcel.rs`：path 改為 `/BuildingNo/1.0/QueryByAddress`，request body 改為 `[{CITY, ADDRESS}]` array，CITY 從地址解析縣市代碼
2. `land_registry.rs`：path 改為 `/LandDescription/1.0/QueryByLandNo`，body 改為 `[{UNIT, SEC, NO}]`
3. `zoning.rs`、`land_value.rs`、`mortgages.rs`：依相應 COP API service 更新（LandDescription 回傳欄位包含 ZONING、ALVALUE、ALPRICE，可從同一 endpoint 取得，不需獨立呼叫）
4. 新增城市代碼對照 `city_code(city_name: &str) -> &str` 輔助函式

## Non-Goals

- 不處理 COP API 正式訂閱（需用戶在 cop.moi.gov.tw 手動訂閱各服務）
- 不實作 COP API token 端點（COP 用 Basic Auth，get_token 廢棄）
- 不補全所有縣市的 TwinkleAI dataset ID（只補台南市，其餘用 lvr-trades fallback）
- 不修改 wiremock 測試基礎設施（保留既有測試，新增整合測試驗實際 API 回傳格式）

## Success Criteria

1. `cargo test` 全部通過（含既有 wiremock 測試）
2. 執行 `/tmp/test-cop-tainan.mjs` Node 腳本對沙箱（sandbox）回傳 `STATUS: 1` 且欄位有值
3. 執行 TwinkleAI 查詢（台南市永康區勝利街）回傳 ≥ 1 筆實價登錄記錄
4. AIRE Tauri app 啟動後，地政+實價登錄資料能正確顯示在 UI 調閱畫面

## Impact

- Affected code:
  - Modified: src-tauri/src/mcp_client.rs
  - Modified: src-tauri/src/land_registry/client/mod.rs
  - Modified: src-tauri/src/land_registry/apis/address_to_parcel.rs
  - Modified: src-tauri/src/land_registry/apis/land_registry.rs
  - Modified: src-tauri/src/land_registry/apis/zoning.rs
  - Modified: src-tauri/src/land_registry/apis/land_value.rs
  - Modified: src-tauri/src/land_registry/apis/mortgages.rs
  - New: src-tauri/src/land_registry/city_code.rs
  - New: src-tauri/src/mcp_client/dataset_registry.rs
