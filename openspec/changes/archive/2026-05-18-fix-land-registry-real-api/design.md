## Context

AIRE 的地政（COP API）與實價登錄（TwinkleAI MCP）Rust 整合模組於初期開發時僅為 wiremock TDD 測試環境而寫，API endpoint 路徑、request body 格式、auth 機制均為測試用 mock，從未針對真實 API 更新。經 Node.js 測試腳本驗證，共發現 7 個 bug 導致整合在正式環境完全失敗。

**COP API 真實規格（已驗證）：**
- Auth：`Authorization: Basic base64(CLIENT_ID:CLIENT_SECRET)`（不需 Bearer token）
- URL 格式：`https://copapi.moi.gov.tw/{env}/api/{ServiceName}/{version}/{FunctionName}`
- 地址查建號：`POST /BuildingNo/1.0/QueryByAddress`，body `[{"CITY":"D","ADDRESS":"..."}]`
- 土地謄本：`POST /LandDescription/1.0/QueryByLandNo`，body `[{"UNIT":"BA","SEC":"0001","NO":"00010001"}]`
- 回傳結構：`{"STATUS":1,"RESPONSE":[{"UNIT":"...","LANDREG":{...}}]}`

**TwinkleAI MCP 真實規格（已驗證）：**
- Auth：`Authorization: Bearer {TWINKLE_AI_API_KEY}`
- Headers：`Content-Type: application/json`、`Accept: application/json, text/event-stream`
- Response format：SSE（event stream），每筆回傳 `data: {json}` 行，取 `.result.content[0].text` 再 JSON.parse
- 台南市買賣案件 dataset_id：`128852`；全國 `lvr-trades` 對台南市無資料
- 正確欄位：`鄉鎮市區`、`土地區段位置或建物區門牌`、`單價每平方公尺`

## Goals / Non-Goals

**Goals:**

- 修正 mcp_client.rs 的 5 個 bug（env var、header、參數名、欄位名、dataset routing）
- 修正 land_registry client 的 get_token() stub（改用 Basic Auth only，廢棄 token 函式）
- 修正所有 land_registry/apis/ 的 endpoint 路徑與 request body 格式為真實 COP API 規格
- 新增城市代碼對照輔助函式（地址 → CITY code，例如台南市 → "D"）
- 新增 dataset 路由輔助函式（城市名 → TwinkleAI dataset_id）
- cargo test 全部通過（既有 wiremock 測試繼續有效）

**Non-Goals:**

- 不實作 COP API 正式 token endpoint（get_token 廢棄，非替換）
- 不補全所有縣市的 TwinkleAI dataset ID
- 不修改 wiremock 測試基礎設施
- 不改動 UI 層或 pull.rs 的業務邏輯
- 不處理 COP API 正式環境訂閱（用戶需手動在 portal 訂閱）

## Decisions

**D1：mcp_client.rs 改為直接解析 SSE event stream**
TwinkleAI API 回傳 SSE 格式（`event: message\ndata: {...}\n`）。修正後用換行分割找到 `data:` 前綴的行，取出 JSON，再解析 `result.content[0].text`（內含另一層 JSON 字串）。Rust 用 `lines()` 迭代取第一個 `data:` 開頭的行。

**D2：dataset_id_for_city() 寫在 mcp_client.rs 內的輔助函式**
不新建獨立模組，直接在同檔案定義 `fn dataset_id_for_city(city: &str) -> &'static str`，以 match 分支決定 dataset_id。台南市 → `"128852"`；其餘 → `"lvr-trades"` 作 fallback。

**D3：city_code() 函式寫在 land_registry/client/mod.rs**
地址解析城市代碼的輔助函式 `fn city_code_from_address(address: &str) -> &'static str`，以前綴 match（台北市 → "A"，台南市 → "D" 等）。未匹配時 default "A"（台北市），並 log warning。

**D4：LandDescription 一次回傳 ZONING/ALVALUE/ALPRICE，不需獨立 zoning/land_value endpoint**
COP API `/LandDescription/1.0/QueryByLandNo` 回傳 `LANDREG.ZONING`、`LANDREG.ALVALUE`（公告地價）、`LANDREG.ALPRICE`（公告現值），zoning.rs 和 land_value.rs 的獨立 endpoint 不存在對應 COP service。統一從 LandDescription 回傳值萃取，相關呼叫改為從 land_registry.rs 的回傳共享資料。

**D5：get_token() 加上 #[deprecated] 或移除**
COP API 用 Basic Auth，不需 Bearer token。`get_token()` 改為回傳 `Ok(String::new())`（空字串），並在函式上方加 `// DEPRECATED: COP API uses Basic Auth, not Bearer token. This function is unused.` 註解，保留編譯但不呼叫。

## Implementation Contract

### mcp_client.rs

**env var 讀取：**
`std::env::var("TWINKLE_AI_API_KEY")` — 若 missing 則回傳 `Err(McpError::ConfigMissing("TWINKLE_AI_API_KEY"))`，不靜默略過。

**HTTP headers：**
必須同時附帶：
- `Authorization: Bearer {key}`
- `Content-Type: application/json`
- `Accept: application/json, text/event-stream`

**Request body 結構：**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "id": 1,
  "params": {
    "name": "opendata-query_rows",
    "arguments": {
      "dataset_id": "<city-specific>",
      "where": "\"鄉鎮市區\" = '<district>' AND \"土地區段位置或建物區門牌\" LIKE '%<road>%'",
      "limit": 50
    }
  }
}
```

**Response 解析：**
1. 以 `\n` 分割 response body
2. 找第一個以 `data:` 開頭的行
3. 去除 `data:` 前綴，JSON.parse → `outer`
4. 取 `outer.result.content[0].text` → JSON.parse → `records`（array 或 error object）
5. 若 `records` 為 array，每筆取 `records[i]["單價每平方公尺"]` 作為 unit_price

**dataset_id_for_city() 合約：**
- 輸入：城市名稱字串（e.g. `"台南市"`）
- 輸出：`&'static str` dataset_id
- 台南市 → `"128852"`
- 其餘 → `"lvr-trades"`

### land_registry/client/mod.rs

**build_auth_header() 合約（不變）：**
回傳 `format!("Basic {}", base64(CLIENT_ID:CLIENT_SECRET))`

**city_code_from_address() 合約：**
- 輸入：地址字串
- 輸出：`&'static str` 單字母縣市代碼
- 台北市 → "A"、台中市 → "B"、台南市 → "D"、高雄市 → "E"
- 未匹配 → "A" 並 `log::warn!`

### land_registry/apis/address_to_parcel.rs

**endpoint：** `POST /BuildingNo/1.0/QueryByAddress`（相對 API_BASE_URL）

**request body：**
```json
[{"CITY": "<city_code>", "ADDRESS": "<address>"}]
```

**response 解析：**
`RESPONSE[0].BLDGREG` 為建號（或 RDBID for MOI_API_036）。若 null 則回傳 `Ok(None)`，不拋錯。

### land_registry/apis/land_registry.rs

**endpoint：** `POST /LandDescription/1.0/QueryByLandNo`

**request body：**
```json
[{"UNIT": "<unit>", "SEC": "<sec>", "NO": "<no>"}]
```

**response 解析：**
取 `RESPONSE[0].LANDREG`，映射：
- `area` ← `LANDREG.AREA`（字串，坪數）
- `zoning` ← `LANDREG.ZONING`
- `announced_value` ← `LANDREG.ALVALUE`
- `assessed_value` ← `LANDREG.ALPRICE`

### 失敗模式

| 情況 | 行為 |
|------|------|
| env var 缺失 | 回傳 `Err` with 明確訊息，不 panic |
| API STATUS ≠ 1 | 回傳 `Err(ApiError::StatusFailed(status_code))` |
| RESPONSE 為空陣列 | 回傳 `Ok(None)` |
| SSE 無 `data:` 行 | 回傳 `Err(McpError::ParseError("no data line"))` |
| network error | 回傳底層 reqwest error |

### 驗收條件

1. `cargo test` 0 failure（wiremock 測試繼續通過）
2. Node 腳本 `/tmp/test-cop-tainan.mjs` 對沙箱回傳 `STATUS: 1` + LANDREG 有欄位
3. TwinkleAI 查永康區勝利街回傳 ≥ 1 筆記錄，每筆含 `單價每平方公尺` 數字

## Risks / Trade-offs

**R1：zoning/land_value 合併到 LandDescription**
好處：節省 API 呼叫次數（從 5 次減為 3 次）。風險：若 COP 有獨立的 zoning endpoint（MOI_API_010？）功能更豐富，但沙箱無法驗證正式服務。決策：先合併，若正式環境需更多欄位再分拆。

**R2：TwinkleAI dataset routing 僅補台南市**
lvr-trades fallback 對其他城市也可能失效，但目前無法一次補全所有 dataset ID，待後續依需求擴充。

**R3：wiremock 測試路徑與真實路徑不同**
wiremock mock 用 `/land/address-to-parcel` 假路徑，修正後真實路徑為 `/BuildingNo/1.0/QueryByAddress`。測試 mock 必須同步更新，否則編譯會過但整合失敗。
