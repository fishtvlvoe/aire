## 1. TDD 紅燈測試 — Token 認證流程（在 `post_json_with_key` 內整合 token 換取）

- [x] 1.1 在 `src-tauri/src/land_registry/apis/mod.rs` 新增 wiremock 測試 `token_endpoint_set_uses_bearer_auth`（對應 spec: AuthFailed surfaces when COP token acquisition returns non-2xx）：mock `/cp/getToken` 回傳 `{"access_token":"test-tok","expires_in":300}` + mock 業務端點回傳 STATUS=1；呼叫 `post_json_with_key` 並斷言業務請求 Authorization header 為 `Bearer test-tok`。測試必須先跑紅燈（`cargo test token_endpoint_set` 失敗）才算通過此任務
- [x] 1.2 在 `src-tauri/src/land_registry/apis/mod.rs` 新增 wiremock 測試 `token_endpoint_401_returns_auth_failed`（對應 spec: AuthFailed surfaces when COP token acquisition returns non-2xx）：mock token endpoint 回 401；呼叫 `post_json_with_key` 並斷言回傳 `Err(LandRegistryError::AuthFailed { .. })`。紅燈確認
- [x] 1.3 新增 wiremock 測試 `empty_token_endpoint_uses_basic_auth`（對應 spec: Empty token_endpoint preserves Basic auth for sandbox compatibility）：使用 `StaticApiKeyProvider::configured(id, secret)`（token_endpoint 空）呼叫 `post_json_with_key`；斷言業務請求 Authorization header 為 `Basic base64(id:secret)` 且無 `/cp/getToken` 呼叫。紅燈確認

## 2. 實作 `ApiCredentials` token_endpoint（`ApiCredentials` 新增 `token_endpoint` 欄位）＋ `post_json_with_key` Bearer flow（在 `post_json_with_key` 內整合 token 換取）

- [x] [P] 2.1 修改 `src-tauri/src/land_registry/apis/mod.rs` 中 `ApiCredentials` struct：新增 `pub token_endpoint: String` 欄位（預設空字串）。修改 `StaticApiKeyProvider::configured(client_id, secret)` 保持不變（token_endpoint 留空）；新增 `StaticApiKeyProvider::with_token_endpoint(client_id, secret, token_endpoint)` 供測試用。確認 `cargo build` 通過（允許 test 失敗）
- [x] [P] 2.2 修改 `src-tauri/src/land_registry/apis/mod.rs` 的 `post_json_with_key` 函式：在組 auth header 前判斷 `credentials.token_endpoint`：非空時以 `GET {token_endpoint}` + `Authorization: Basic base64(id:secret)` 取 token，解析 `access_token` 組成 `Bearer {tok}`；空時維持 `build_auth_header(id, secret)` → Basic（Empty token_endpoint preserves Basic auth for sandbox compatibility）。token 取得 HTTP 非 2xx 或 JSON 解析失敗 → 回 `LandRegistryError::AuthFailed { message, response_body }`。跑 `cargo test` 確認 1.1、1.2、1.3 測試轉為綠燈

## 3. 修正四支 API endpoint path 與 parse_response（四支 API 的 COP 真實 path 與 response container）

- [x] [P] 3.1 修改 `src-tauri/src/land_registry/apis/building_registry.rs`：`BuildingRegistryEndpoint::endpoint_path()` 改為 `"/BuildingDescription/1.0/QueryByBuildingNo"`；`parse_response` 改為讀 `RESPONSE[0].BUILDREG`（COP 格式），`BUILDREG.BLDGAREA` → `building_area: f64`，`BUILDREG.MAINUSE` → `building_purpose`，`BUILDREG.COMPLETE` → `construction_date`；更新 wiremock test `parses_building_registry_and_records_cost` 的 mock path 改為 `/BuildingDescription/1.0/QueryByBuildingNo`、mock body 改為 COP 格式 `{"STATUS":1,"RESPONSE":[{"BUILDREG":{"BLDGAREA":"52.5","MAINUSE":"住家用","COMPLETE":"090/09/01"}}]}`
- [x] [P] 3.2 修改 `src-tauri/src/land_registry/apis/co_owners.rs`：`CoOwnersEndpoint::endpoint_path()` 改為 `"/LandOwnership/1.0/QueryByLandNo"`；`parse_response` 改為讀 `RESPONSE[0].LANDOWNER`（陣列），每筆 `{OWNERNAME, OWNERPERCENT}` → `CoOwner { name, share }`；更新 wiremock test mock path + body 對齊 COP 格式
- [x] [P] 3.3 修改 `src-tauri/src/land_registry/apis/building_ownership.rs`：`BuildingOwnershipEndpoint::endpoint_path()` 改為 `"/BuildingOwnership/1.0/QueryByBuildingNo"`；`parse_response` 改為讀 `RESPONSE[0].BUILDOWNER[0]`，`{OWNERNAME, REGNO, REGDATE}` → `BuildingOwnershipData { owner_name, certificate_no, issue_date }`；更新 wiremock test
- [x] [P] 3.4 修改 `src-tauri/src/land_registry/apis/mortgages.rs`：`MortgagesEndpoint::endpoint_path()` 改為 `"/LandOtherRight/1.0/QueryByLandNo"`；`parse_response` 改為讀 `RESPONSE[0].LANDOTHER`（陣列），每筆 `{RIGHTPERSON, SETTING}` → `Mortgage { creditor, amount: SETTING.parse::<f64>().unwrap_or(0.0) }`；更新 wiremock test

## 4. 整合驗證（沙箱）

- [x] 4.1 撰寫 `/tmp/test-cop-sandbox-bearer.mjs` 腳本：使用 `LAND_REGISTRY_CLIENT_ID` + `LAND_REGISTRY_CLIENT_SECRET` 呼叫沙箱 token endpoint（`https://copapi.moi.gov.tw/sandbox/api/...` 或確認沙箱 token endpoint），取得 Bearer token，以 Bearer 打四支 API 沙箱端點，記錄 STATUS 與 container 欄位名稱到 `/tmp/cop-sandbox-bearer-result.txt`
- [x] 4.2 依據 4.1 沙箱實際回應，驗證 `parse_response` 的 container 名稱（`BUILDREG` / `LANDOWNER` / `BUILDOWNER` / `LANDOTHER`）與欄位名稱正確；若不符則修正 3.1-3.4 的 `parse_response` 並重跑 `cargo test` 確認全綠
- [x] 4.3 執行 `cargo test -p aire-lib 2>&1 | tail -5`，確認 0 failed；git add + commit `fix(land_registry): Bearer token auth + COP 真實 API 路徑修正`
