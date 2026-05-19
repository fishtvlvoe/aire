## Context

AIRE 的地政查詢架構分三層：前端 `PullParcelDataButton` → Tauri `pull_parcel_data` command → OPCOS 中介伺服器 → `copapi.moi.gov.tw`（政府地政協作平台）。

目前 OPCOS（`opcos.aiver.me`）尚未部署，導致沙箱模式無法在 `pnpm tauri dev` 中驗證完整流程。政府協作平台提供官方沙箱（`https://copapi.moi.gov.tw/sandbox/api/`），免 token、免帳號，直接可呼叫，回傳真實地籍資料。

已驗證沙箱可用性（curl POST 無 token）：
- 沙箱 URL：`https://copapi.moi.gov.tw/sandbox/api/LandOwnership/1.0/QueryByLimit`
- 測試地號：UNIT=BA / SEC=0001 / NO=00010001（此為政府測試地號，所有人=中華民國）
- 回傳 `{"STATUS":1,"RETURNROWS":1,"RESPONSE":[{"LANDOWNERSHIP":[...]}]}`

現有 `pull_data_for_api_type()` 函式接收 `api_id: &str`（7 種：building_registry / land_registry / co_owners / land_value / mortgages / building_ownership / zoning）與 `base_url: &str`（OPCOS URL）。沙箱模式需在此函式入口加分支。

## Goals / Non-Goals

**Goals:**

- 新增 `COPAPI_SANDBOX=true` 環境變數，設定於 `src-tauri/.env`
- `AsyncIpcState` 增加 `copapi_sandbox: bool` 欄位
- 新增 `SandboxDirectClient`（`src-tauri/src/land_registry/sandbox_client.rs`），處理 `land_registry` api_id 的沙箱直連
- `pull_data_for_api_type()` 在 `copapi_sandbox=true` 時，路由 `land_registry` 至 `SandboxDirectClient`
- consent 檢查與 billing_log 在沙箱模式保持不變
- 其餘 6 種 api_id 在沙箱模式返回 `LandRegistryError::SandboxUnsupported { api_id }`

**Non-Goals:**

- 不部署 OPCOS；沙箱模式為開發測試快速通道，production 仍走 OPCOS
- 不解析 parcel_id 字串→UNIT/SEC/NO；沙箱模式使用固定測試地號，不驗案件地號正確性
- 不新增其他 6 種 API 的沙箱對應；只需驗證完整程式碼路徑，1 種 API 已足夠
- 不修改前端程式碼；沙箱模式完全在 Rust 層透明處理

## Decisions

**Decision 1：env var 讀取時機**
於 `lib.rs` 的 `AsyncIpcState::new()` 中讀取 `COPAPI_SANDBOX` env var（字串 "true" → `copapi_sandbox = true`，其他值或不存在 → `false`）。在 `tauri::Builder::build()` 前完成，所有 IPC commands 共享同一 state。

**Decision 2：固定測試地號**
沙箱模式使用固定地號（UNIT="BA", SEC="0001", NO="00010001"），定義為 `sandbox_client.rs` 的模組層常數。這個選擇是因為：
a) parcel_id "0301-0001" 是 OPCOS 自訂格式，無法直接對應政府 UNIT/SEC/NO
b) 沙箱目的是驗證程式碼流程，不是驗證案件資料

**Decision 3：錯誤型別擴展**
在 `LandRegistryError` enum 新增 `SandboxUnsupported { api_id: String }` variant，用於其餘 6 種 API 在沙箱模式的明確錯誤回應（不使用已有的 `Internal`，以便前端日後顯示明確提示）。

**Decision 4：SandboxDirectClient 無 ApiKeyProvider**
`SandboxDirectClient` 不使用 `ApiKeyProvider` trait，直接呼叫沙箱 HTTP endpoint，無 Authorization header。這區別於正式 API structs（均需 credentials）。

## Implementation Contract

**Behavior（可觀察行為）：**
- 啟動 `pnpm tauri dev` 且 `src-tauri/.env` 含 `COPAPI_SANDBOX=true` 時，點擊「拉謄本」確認後：
  - `land_registry` api_id：呼叫政府沙箱，回傳包含 owner_name / land_area / land_purpose 的結構化資料，UI 顯示成功結果
  - 其他 6 種 api_id：返回 SandboxUnsupported 錯誤，UI 顯示對應失敗項目（與一般 API 錯誤走同一 UI fallback 路徑）
- `COPAPI_SANDBOX` 不設或設為其他值：行為與現行完全相同（呼叫 OPCOS）

**Interface / Data Shape：**

```rust
// src-tauri/src/land_registry/errors.rs — 新增 variant
pub enum LandRegistryError {
    // ... 既有 variants ...
    SandboxUnsupported { api_id: String },
}

// src-tauri/src/land_registry/sandbox_client.rs — 新增模組
const SANDBOX_BASE: &str = "https://copapi.moi.gov.tw/sandbox/api/LandOwnership/1.0";
const TEST_UNIT: &str = "BA";
const TEST_SEC: &str = "0001";
const TEST_NO: &str = "00010001";

pub struct SandboxDirectClient;

impl SandboxDirectClient {
    pub async fn fetch_land_registry() -> Result<LandRegistryData, LandRegistryError>;
    // POST SANDBOX_BASE/QueryByLimit，body: [{"UNIT":TEST_UNIT,"SEC":TEST_SEC,"NO":TEST_NO,"OFFSET":1,"LIMIT":1}]
    // 從回應 RESPONSE[0].LANDOWNERSHIP[0] 提取：
    //   owner_name  ← OWNER.LNAME
    //   land_area   ← DLPRICE（公告地價，作為面積代理值；實際面積需 LandArea API）
    //   land_purpose ← OTHERREG[0].CONTENT（如有）或空字串
}

// src-tauri/src/lib.rs — AsyncIpcState 新增欄位
pub struct AsyncIpcState {
    // ... 既有欄位 ...
    pub copapi_sandbox: bool,
}
// 從 std::env::var("COPAPI_SANDBOX").unwrap_or_default() == "true" 設定

// src-tauri/src/land_registry/pull.rs — pull_data_for_api_type() 新增前置分支
async fn pull_data_for_api_type(
    api_id: &str,
    base_url: &str,
    billing_log: BillingLog,
    key_provider: Arc<impl ApiKeyProvider>,
    copapi_sandbox: bool,  // 新增參數
) -> Result<Value, LandRegistryError> {
    if copapi_sandbox {
        return match api_id {
            "land_registry" => SandboxDirectClient::fetch_land_registry()
                .await
                .and_then(|d| serde_json::to_value(d).map_err(...)),
            _ => Err(LandRegistryError::SandboxUnsupported { api_id: api_id.to_string() }),
        };
    }
    // ... 既有 match api_id { "building_registry" => ... }
}
```

**Failure Modes：**
- 沙箱 HTTP 請求失敗（網路錯誤）→ `LandRegistryError::Network`，與正式 API 錯誤相同
- 沙箱回傳 STATUS≠1 → `LandRegistryError::Internal { message: "sandbox returned STATUS=N" }`
- RESPONSE 陣列空 → `LandRegistryError::Internal { message: "sandbox returned empty RESPONSE" }`
- 沙箱模式下其他 api_id → `LandRegistryError::SandboxUnsupported { api_id }`

**Acceptance Criteria：**
1. `cargo test -p app -- land_registry` 全部通過（不破壞既有測試）
2. `COPAPI_SANDBOX=true pnpm tauri dev` → 點擊 PullParcelDataButton 確認 → 「land_registry」結果欄位非空（owner_name 含「中華民國」）
3. `COPAPI_SANDBOX=true pnpm tauri dev` → 其他 6 種 api_id 顯示失敗/手動填入入口
4. 不設 `COPAPI_SANDBOX` → 行為與現行相同（呼叫 OPCOS base_url）

**Scope Boundaries：**
- In scope: `src-tauri/src/land_registry/` 模組、`src-tauri/src/lib.rs`、`src-tauri/.env`
- Out of scope: 前端程式碼、OPCOS 部署、其他 6 種 API 的沙箱對應、parcel_id 解析

## Risks / Trade-offs

- **政府沙箱穩定性**：沙箱 uptime 不保證，測試時段可能無法連線 → 非阻塞風險，本地開發測試偶爾失敗可接受
- **固定測試地號**：回傳的是政府測試地號資料（所有人=中華民國），不代表真實案件 → 只能驗流程，不能驗案件資料準確性，這是此 change 的已知限制
- **land_area 代理值**：沙箱 LandOwnership API 回傳公告地價（DLPRICE）而非面積，以此填入 land_area 是近似值 → 備註於 sandbox_client.rs 程式碼，正式環境由 OPCOS 提供正確面積
