## Context

COP API（內政部不動產資訊整合查詢服務）要求兩步驟認證：
1. `GET {token_endpoint}` — Basic auth → 取得 Bearer token（expires_in 300s）
2. 所有業務 API 呼叫使用 `Authorization: Bearer {token}`

目前 Rust 後端的 `get_token()` 是 stub（直接回傳空字串），導致所有 API 呼叫都以 Basic auth 打業務端點。沙箱環境接受 Basic auth 所以測試通過，但正式環境 COP 回 STATUS=COP311（取得帳號資訊失敗）。

同時，`BuildingRegistryApi`、`CoOwnersApi`、`BuildingOwnershipApi`、`MortgagesApi` 四支 API 的 endpoint path 為假路徑（`/land/parcel/...`），並非 COP 真實格式。

`post_json_with_key`（`apis/mod.rs`）目前呼叫 `build_auth_header(client_id, secret)` 生成 Basic header，所有 API 都走這條路徑。

## Goals / Non-Goals

**Goals:**
- `post_json_with_key` 改為 Basic → Bearer token 換取 → 以 Bearer 打業務端點
- 四支 API 的 endpoint path 改為 COP 真實格式，`parse_response` 配合 COP wrapper 結構
- wiremock 單元測試同步更新（path + response body 對齊 COP 格式）

**Non-Goals:**
- 不在 `post_json_with_key` 加入跨呼叫 token cache（每次 API 呼叫獨立取 token；300s TTL 在正常使用情境足夠）
- 不修改 `LandRegistryClient`（已有 token cache 架構但未被 API 模組使用）
- 不修改 land_registry / zoning / land_value / address_to_parcel（上次 CR 已完成）
- 不修改 IPC 介面或前端

## Decisions

### 在 `post_json_with_key` 內整合 token 換取

**選項 A（本次採用）**：`post_json_with_key` 在組 auth header 時，若 `credentials.token_endpoint` 非空，先以 Basic auth 打 token endpoint 取得 access_token，再以 `Bearer {token}` 作為業務 API 的 Authorization header。若 token_endpoint 為空（unit test 的 StaticApiKeyProvider），維持 Basic auth（沙箱相容）。

**選項 B（棄用）**：在每個 `*Api` 的 `fetch()` 中各自呼叫 `LandRegistryClient::get_token()`。缺點：需修改 6 支 API 檔案 + 注入 client 依賴，工作量大且破壞 trait 抽象。

**理由選 A**：改動集中在 `apis/mod.rs` + `ApiCredentials` struct，所有 API 自動受益；既有 wiremock 測試不需改認證邏輯，只需更新 path 與 response body。

### `ApiCredentials` 新增 `token_endpoint` 欄位

`ApiCredentials` 加 `token_endpoint: String`（可為空字串）。`StaticApiKeyProvider::configured()` 的 `token_endpoint` 預設空字串（unit test 走 Basic）；正式 app 初始化從 `LAND_REGISTRY_TOKEN_ENDPOINT` env var 填入。

### 四支 API 的 COP 真實 path 與 response container

| API 模組 | 假路徑（舊） | 真實路徑（新） | Response container | Container 類型 |
|---|---|---|---|---|
| building_registry | `/land/parcel/building-registry` | `/BuildingDescription/1.0/QueryByBuildingNo` | `BUILDREG` | 物件 |
| co_owners | `/land/parcel/co-owners` | `/LandOwnership/1.0/QueryByLandNo` | `LANDOWNER` | 陣列 |
| building_ownership | `/land/parcel/building-ownership` | `/BuildingOwnership/1.0/QueryByBuildingNo` | `BUILDOWNER` | 陣列 |
| mortgages | `/land/parcel/mortgages` | `/LandOtherRight/1.0/QueryByLandNo` | `LANDOTHER` | 陣列 |

COP 回應統一格式：`{"STATUS": 1, "RESPONSE": [{"<CONTAINER>": <物件或陣列>}]}`

**已知欄位（依據 COP 命名慣例，沙箱測試確認）**：
- `BUILDREG`: `BLDGAREA`（建物面積，字串）、`MAINUSE`（主要用途）、`COMPLETE`（完工日期）
- `LANDOWNER[]`: `OWNERNAME`（所有人）、`OWNERPERCENT`（持分，如 "1/2"）
- `BUILDOWNER[]`: `OWNERNAME`（所有人）、`REGNO`（登記字號）、`REGDATE`（登記日期）
- `LANDOTHER[]`: `RIGHTPERSON`（權利人）、`SETTING`（設定金額，字串）

**沙箱驗證要求**：實作後必須對沙箱 endpoint 執行實際呼叫，確認 container 名稱與欄位名稱無誤；若與上表不符，依沙箱實際回應修正 `parse_response`。

## Implementation Contract

**Token 取得行為**：
- `post_json_with_key` 在 `credentials.token_endpoint` 非空時，以 `GET {token_endpoint}` + `Authorization: Basic base64(client_id:secret)` 取得 token
- 解析 JSON `{"access_token": "<tok>", "expires_in": 300}`，取 `access_token`
- 業務 API 請求使用 `Authorization: Bearer {access_token}`
- token_endpoint 為空時維持 Basic auth（單元測試相容）
- token 取得失敗（HTTP 非 2xx 或 JSON 解析失敗）→ 回傳 `LandRegistryError::AuthFailed { message, response_body }`

**`ApiCredentials` 介面**：
```rust
pub struct ApiCredentials {
    pub client_id: String,
    pub client_secret: String,
    pub token_endpoint: String,  // 新增：空字串=Basic，非空=Bearer flow
}
```

**四支 API endpoint_path**：
- `BuildingRegistryEndpoint::endpoint_path()` → `"/BuildingDescription/1.0/QueryByBuildingNo"`
- `CoOwnersEndpoint::endpoint_path()` → `"/LandOwnership/1.0/QueryByLandNo"`
- `BuildingOwnershipEndpoint::endpoint_path()` → `"/BuildingOwnership/1.0/QueryByBuildingNo"`
- `MortgagesEndpoint::endpoint_path()` → `"/LandOtherRight/1.0/QueryByLandNo"`

**`parse_response` 合約**：
- 四支 API 均先檢查 `STATUS == 1`，不符則回 `LandRegistryError::Internal { message: "COP API returned non-success STATUS" }`
- 從 `RESPONSE[0].<CONTAINER>` 取資料
- `building_registry`：`BUILDREG.BLDGAREA` → `building_area: f64`，`BUILDREG.MAINUSE` → `building_purpose`，`BUILDREG.COMPLETE` → `construction_date`
- `co_owners`：`LANDOWNER` 陣列 → `CoOwner { name: OWNERNAME, share: OWNERPERCENT }`
- `building_ownership`：`BUILDOWNER[0]`（取第一筆）→ `BuildingOwnershipData { owner_name: OWNERNAME, certificate_no: REGNO, issue_date: REGDATE }`
- `mortgages`：`LANDOTHER` 陣列 → `Mortgage { creditor: RIGHTPERSON, amount: SETTING.parse::<f64>().unwrap_or(0.0) }`

**接受標準**：
- `cargo test -p aire-lib` 全綠（含 wiremock 測試）
- 以測試腳本對沙箱執行四支 API，STATUS=1 且欄位非空即為通過

**Scope boundaries**（明確範圍）：
- 在範圍內：`apis/mod.rs`（`ApiCredentials` + `post_json_with_key`）、四支 API 的 `endpoint_path` + `parse_response` + wiremock tests、`StaticApiKeyProvider` 預設值
- 在範圍外：`LandRegistryClient`（不改）、`land_registry.rs` / `zoning.rs` / `land_value.rs` / `address_to_parcel.rs`（不改）、IPC 介面（不改）

## Risks / Trade-offs

- [Risk] 沙箱 COP container 名稱與欄位名稱跟設計文件不符 → Mitigation：實作後必跑沙箱測試腳本；`parse_response` 使用 `.unwrap_or_default()` 使欄位缺失不 panic，僅以空值回傳
- [Risk] 每次 `post_json_with_key` 都發 token 請求（無 cache） → Mitigation：正常操作一次 pull 5-6 支 API，各取一次 token；300s TTL 足夠；後續 CR 可加 cache
- [Risk] 正式環境 token endpoint HTTPS 憑證 → Mitigation：reqwest 預設驗憑證，COP 是政府平台；沙箱 URL 不同，測試用沙箱時不影響正式 token endpoint
