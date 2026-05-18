## Wave 1：TDD — mcp_client 紅燈測試

- [x] [P] 1.1 在 `src-tauri/src/mcp_client.rs` 的 `#[cfg(test)]` 模組新增 5 個 failing tests，驗證以下行為（測試先紅燈，不寫實作）：`test_reads_twinkle_ai_api_key` — `TWINKLE_AI_API_KEY` 正確讀取（用 "TWINKLE_HUB_API_KEY" 的舊程式碼應 fail）；`test_accept_header_for_event_stream` — request 含 `Accept: application/json, text/event-stream`；`test_dataset_id_not_dataset` — request body 用 `dataset_id` 欄位；`test_dataset_id_for_city_tainan` — `dataset_id_for_city("台南市")` 回傳 `"128852"`；`test_sse_response_parsing` — SSE `data:` 行格式解析正確取出 records。執行 `cargo test mcp_client` 確認 5 個測試全紅燈。[Tool: Copilot CLI]

## Wave 2：TDD — land_registry client 紅燈測試

- [x] [P] 2.1 在 `src-tauri/src/land_registry/client/mod.rs` 的 `#[cfg(test)]` 模組新增 3 個 failing tests：`test_city_code_from_address_tainan` — `city_code_from_address("台南市永康區...")` 回傳 `"D"`；`test_city_code_from_address_taipei` — 台北市 → `"A"`；`test_get_token_deprecated_returns_empty` — `get_token()` 回傳 `Ok("")`。執行 `cargo test land_registry::client` 確認全紅燈。[Tool: Copilot CLI]

## Wave 3：修正 mcp_client.rs

- [x] 3.1 在 `src-tauri/src/mcp_client.rs` 修正 env var 讀取：(a) 將 `TWINKLE_HUB_API_KEY` 改為 `TWINKLE_AI_API_KEY`，缺失時回傳 `Err` 含 "TWINKLE_AI_API_KEY" 字串；(b) 加入 `Accept: application/json, text/event-stream` header；(c) request body arguments 的 `"dataset"` 改為 `"dataset_id"`；(d) where clause 中 `district` 改為 `"鄉鎮市區"`，`road` 改為 `"土地區段位置或建物區門牌"`。執行 `cargo test mcp_client` 確認 Wave 1 的 5 個測試轉綠燈。[Tool: Copilot CLI]

- [x] 3.2 在 `src-tauri/src/mcp_client.rs` 新增 `fn dataset_id_for_city(city: &str) -> &'static str`：`"台南市" => "128852"`，`_ => "lvr-trades"`。在 `call_opendata_query` 呼叫時使用此函式決定 `dataset_id`。執行 `cargo test mcp_client::test_dataset_id_for_city_tainan` 確認綠燈。[Tool: Copilot CLI]

- [x] 3.3 在 `src-tauri/src/mcp_client.rs` 修正 SSE response 解析：分割 response body 以 `\n`，找第一個 `data:` 開頭行，去除前綴後 JSON 反序列化，取 `result.content[0].text` 字串再次反序列化為 records array，從每筆取 `"單價每平方公尺"` 作為 unit_price，缺失欄位的記錄忽略。無 `data:` 行時回傳 `Err(McpError::ParseError)`。執行 `cargo test mcp_client::test_sse_response_parsing` 確認綠燈。[Tool: Copilot CLI]

## Wave 4：修正 land_registry client

- [x] 4.1 在 `src-tauri/src/land_registry/client/mod.rs`：(a) 新增 `pub fn city_code_from_address(address: &str) -> &'static str`，以前綴 match 回傳縣市代碼（台北市→"A"、台中市→"B"、台南市→"D"、高雄市→"E"、新北市→"F"、桃園市→"H"），未匹配時 `log::warn!` 並回傳 `"A"`；(b) 在 `get_token()` 上方加 `// DEPRECATED: COP API uses Basic Auth only. This function is unused.` 並將函式體改為 `Ok(String::new())`。執行 `cargo test land_registry::client` 確認 Wave 2 的 3 個測試轉綠燈。[Tool: Copilot CLI]

## Wave 5：修正 COP API endpoint 路徑與 request body

- [x] [P] 5.1 修正 `src-tauri/src/land_registry/apis/address_to_parcel.rs`，使 COP API endpoint paths SHALL follow the real service URL pattern：(a) path 改為 `/BuildingNo/1.0/QueryByAddress`；(b) request body 改為 `serde_json::json!([{"CITY": city_code, "ADDRESS": address}])`，`city_code` 來自 `city_code_from_address(&address)`；(c) response 解析：檢查 `STATUS == 1`，取 `RESPONSE[0].BLDGREG`，null 時回傳 `Ok(None)`。同步更新 wiremock test mock path 為 `/BuildingNo/1.0/QueryByAddress`。執行 `cargo test address_to_parcel` 確認綠燈。[Tool: Copilot CLI]

- [x] [P] 5.2 修正 `src-tauri/src/land_registry/apis/land_registry.rs`，使 COP API endpoint paths SHALL follow the real service URL pattern：(a) path 改為 `/LandDescription/1.0/QueryByLandNo`；(b) request body 改為 `[{"UNIT": unit, "SEC": sec, "NO": no}]` array 格式；(c) response 解析：檢查 `STATUS == 1`，取 `RESPONSE[0].LANDREG`，映射 `AREA`、`ZONING`（LandDescription response SHALL supply zoning and land value data）、`ALVALUE`（announced_value）、`ALPRICE`（assessed_value）。同步更新 wiremock mock path。執行 `cargo test land_registry::apis::land_registry` 確認綠燈。[Tool: Copilot CLI]

## Wave 6：更新 zoning / land_value 取自 LandDescription

- [x] 6.1 修正 `src-tauri/src/land_registry/apis/zoning.rs`：LandDescription response SHALL supply zoning and land value data，移除獨立 endpoint 呼叫，改從 LandDescription response 的 `LANDREG.ZONING` 取值。`ZONING` 為 null 時回傳 `Ok(None)`。執行 `cargo test zoning` 確認無 regression。[Tool: Copilot CLI]

- [x] 6.2 修正 `src-tauri/src/land_registry/apis/land_value.rs`：同理從 `LANDREG.ALVALUE` / `LANDREG.ALPRICE` 取值，移除假 endpoint 呼叫。執行 `cargo test land_value` 確認無 regression。[Tool: Copilot CLI]

## Wave 7：端對端驗證

- [x] 7.1 執行 `cargo test --workspace` 確認 0 failures（所有 wiremock + 新增 TDD 測試）。若有 failure 修至全綠再繼續。[Tool: Copilot CLI]

- [x] 7.2 執行 Node.js 腳本 `/tmp/test-cop-tainan.mjs` 對 COP sandbox 驗證：MOI_API_037 回傳 STATUS:1、MOI_API_001 回傳 STATUS:1 且 LANDREG.AREA 非空字串。輸出記錄到 `/tmp/cop-sandbox-result.txt`。[Tool: 主對話直接執行]

- [x] 7.3 呼叫 TwinkleAI dataset 128852，where `"鄉鎮市區" = '永康區' AND "土地區段位置或建物區門牌" LIKE '%勝利街%'`，確認回傳 ≥ 1 筆且含 `"單價每平方公尺"` 欄位。結果記錄到 `/tmp/twinkle-result.txt`。[Tool: 主對話直接執行]
