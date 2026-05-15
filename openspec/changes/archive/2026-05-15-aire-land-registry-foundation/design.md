## Context

AIRE 是房仲業務的桌面 App（Tauri 2.x + Next.js 16 + Rust 後端），目前 Phase 1 已完成基礎殼層、SQLite migrations（明文）、案件 CRUD、PDF 渲染器（缺實檔資產，在 `aire-phase1-pdf-assets` 補）。Phase 3 要接內政部地政整合資訊服務共享協作平台的 8 支 API，但若不先打地基直接接 endpoint，每個 API 都要重複寫 token / cache / errors / 重試邏輯，且本機 SQLite 含屋主謄本個資也無加密。本 change 是 Phase 3 的「**只動 Rust 後端、不動 UI / 業務 API**」純地基層。

當前限制：
- Tauri 2.x 預設使用 `rusqlite`（明文 SQLite）；改用 `bundled-sqlcipher` feature 需確認 Tauri 跨平台 build 相容性
- 協作平台規格只有「Token 300 秒、JWT 含 `exp`」官方文件，無 sandbox 文件之外的錯誤碼 / rate limit 規範，須以 `client.rs` 抽象層吸收未來變動
- OPCOS 平台序號驗證會依賴本機時鐘；客戶電腦時鐘錯亂歷史上是真實事故來源

利害關係人：
- Fish（架構、決策）
- 房仲客戶（最終受益者，但本 change 內部、客戶無感）
- 法規（個資法、不動產經紀業管理條例：DB 含個資必須加密）

## Goals / Non-Goals

### Goals

- 打可重用 Rust crate 級地基：任何協作平台 API 加進來、只需寫 endpoint adapter，不重做 token / cache / retry
- DB 全程加密（sqlcipher），key 走 OS keychain
- 所有寫檔操作 graceful：磁碟滿、migration 失敗、OPCOS 離線都不能 crash host process
- Cache 設計支援「同地號跨案件複用」，省客戶 API 費用
- 時間相關邏輯（cache TTL、序號 grace、JWT exp）皆以校正後時間判斷，不信本機時鐘

### Non-Goals

- 不接任何業務 API（留 `aire-land-registry-apis-ui`）
- 不動 UI / 表單 / 案件詳情頁
- 不做主密碼派生 / 救援碼（留 `aire-phase1-data-portability`）
- 不引入 refresh token（協作平台無此規格）
- 不支援硬體加密（HSM / PKCS#11）

## Decisions

### Token 取得：Basic Auth + GET 而非 POST，依官方 C# 範例

協作平台官方 PDF 文字寫「POST」、但官方 C# 範例 `ApiHelper.cs` 使用 `request.Method = "GET"`。實測以 C# 範例為準（範例可執行、文字可能誤植）。

替代方案：POST + Basic Auth header。理由不選：與官方 C# 範例不符，若協作平台後端只接 GET，POST 會 405。

### JWT 過期判斷：解 payload `exp` 而非靠 `expires_in` 計時器

官方 C# 範例 `IsExpired(jwtToken)` 解 JWT payload 拿 `exp`、與 `DateTime.Now` 比較。`expires_in: 300` 只是 server hint、實際過期時間以 JWT 內 `exp` 為準（這兩者理論等價、但若 server 變更 token TTL 政策、`exp` 為唯一可信來源）。

替代方案：用 `expires_in` 算本機 expiry 時間。理由不選：依賴本機時鐘準確、且 server 端 TTL 政策若變動本機計時器不會跟著動。

### Cache key 設計：`parcel_id + query_date`，不綁案件 ID

協作平台 API 按筆計費。同一塊地號跨多個案件（A 客戶賣失敗後 B 客戶又來賣）若 cache key 綁 case_id，第二次查仍要付錢。改 cache key = 地號 + 查詢日期，跨案件複用、省錢。「強制重拉」UI 由 `aire-land-registry-apis-ui` 提供，本 change 只保證 cache 結構支援這個語意。

替代方案：cache key 綁 case_id。理由不選：浪費客戶錢、且每筆 1-3 元在多案件情境累積快。

### SQLite 加密：sqlcipher `bundled-sqlcipher` feature 而非應用層 AES

`rusqlite` 的 `bundled-sqlcipher` feature 直接靜態連結 sqlcipher、跨平台 build 統一、不依賴 OS 內建 SQLite 版本。對開發者透明（標準 SQL）、所有 query 自動加密。

替代方案 1：應用層 AES 加密欄位。理由不選：query 不能用 WHERE、indexing、JOIN 失效、屬於倒退。
替代方案 2：作業系統層級 FileVault / BitLocker。理由不選：使用者可能關閉、不可控、且偷拷貝 DB 後在另一台機器仍可開啟。

### DB 加密 key：OS keychain (`keyring` crate)，與 Phase 1 序號 secret 共用儲存

復用 Phase 1 既有 keychain 整合，避免兩套 secret storage。Key 在首次啟動時隨機產生 32 bytes、存進 keychain，重啟讀取。客戶換電腦匯入 .aire 備份時的 key 移轉留 `aire-phase1-data-portability`（主密碼派生 / 救援碼設計）。

替代方案：固定 key 寫在程式碼裡。理由不選：反向工程取出即破解、不符合個資法基本要求。

### 時間校正：OPCOS server time 為主、NTP 為備援

OPCOS API 已是 AIRE 必連線目標、回應 header 可能含 `Date`；解析後與本機時間取 offset 寫入 SQLite。離線時 OPCOS 取不到、fallback 用 NTP（`pool.ntp.org`）但不阻擋啟動、僅在能連時校正。所有 TTL 比較皆套用 offset。

替代方案：純信任本機時鐘。理由不選：客戶電腦 CMOS 電池死、出差時區手動改、駭客攻擊等都可能讓時鐘錯亂、引發 cache 全部過期 / 序號驗證錯誤。

### Migration rollback：完整 DB 備份 + 失敗自動還原

每次 migration 跑之前先 `VACUUM INTO 'backup-{timestamp}.db'`、migration 失敗（任何一條 SQL 拋例外）自動還原備份、刪除半完成新 DB。備份保留 7 天供支援查診。

替代方案：用 sqlite savepoint / transaction rollback。理由不選：跨多個 migration 檔的 ALTER TABLE 不一定都能放進單一 transaction、且 schema 變動後若 application code 與舊 schema 不相容、就算 transaction rollback 完還是死局。完整檔案備份較粗暴但 100% 可還原。

### OPCOS 離線 grace period：本機保留授權 7 天

OPCOS 雲端短暫掛掉不該讓客戶 App 整個不能開。本機在啟動時序號驗證失敗（HTTP error），讀取上次成功驗證時間、若距今 < 7 天則允許啟動、UI 顯示 yellow banner「離線授權中，X 天後須連網」。超過 7 天才強制阻擋。Grace 期限以校正後時間判斷。

替代方案：永久離線。理由不選：等同放棄序號管理、盜版風險爆增。
替代方案：完全不允許離線。理由不選：客戶網路斷一小時就被 lock out、體驗極差。

### 磁碟空間防護：寫前檢查 + < 100 MB 警告 + < 10 MB 阻擋

所有 SQLite 寫入 / cache 寫入 / log 寫入前檢查磁碟空間。< 100 MB 時 UI banner 警告「磁碟空間不足、請清理」、< 10 MB 時阻擋新案件 / cache 寫入、改寫到 stderr log。所有寫檔錯誤改 graceful Result 回傳、不 panic。

替代方案：完全不檢查。理由不選：磁碟滿時 SQLite 寫入會中斷交易、可能導致 DB 損壞。

## Implementation Contract

### Observable Behavior

- 任何 Rust 模組呼叫 `land_registry::client::call_api(endpoint, body)` 都會：
  1. 確認本機有效 JWT、無效則 `GET /cp/getToken` 重抓
  2. 用 Bearer + Content-Type JSON 發 POST
  3. 失敗時依錯誤型別判斷是否重試（5xx / 網路 timeout 重試 3 次 with backoff、4xx 不重試）
  4. 每次呼叫寫一筆 `billing_log` 含成本、TRANSACTIONID、status
- 任何 SQLite 連線都走加密通道、未經 keychain key 無法直接開啟 DB 檔
- 啟動序列：keychain key → DB 加密通道 → migration with rollback → time_sync 校正 → opcos_offline_grace 檢查 → 進主畫面
- 任何寫檔前 disk_resilience 檢查、空間不足時 UI banner + log

### Interface / Data Shape

- `client::call_api(method: &str, body: serde_json::Value) -> Result<serde_json::Value, LandRegistryError>`
- `cache::get_or_fetch<F>(parcel_id: &str, query_date: NaiveDate, fetch: F) -> Result<Value, LandRegistryError> where F: FnOnce() -> ...`
- `batch::dispatch(items: Vec<QueryItem>) -> Vec<Result<Value, LandRegistryError>>`（自動拆 25 筆 / 批）
- `field_mapping::map(api_id: &str, response: &Value) -> serde_json::Value`
- `errors::LandRegistryError` 列舉：`Network`、`AuthFailed`、`InsufficientBalance`、`FieldSchemaChanged`、`DiskFull`、`GracePeriodExpired`、`MigrationFailed`、`TimeSkew`、`Internal`
- SQLite 表：
  - `land_registry_cache(parcel_id TEXT, query_date TEXT, api_id TEXT, payload JSON, fetched_at TEXT, cost_cents INT, PRIMARY KEY(parcel_id, query_date, api_id))`
  - `land_registry_billing_log(id INT PK, ts TEXT, api_id TEXT, parcel_id TEXT, status INT, transaction_id TEXT, cost_cents INT, error TEXT)`
  - `opcos_offline_state(last_verified_at TEXT, last_verified_serial TEXT)`
  - `time_sync_state(offset_ms INT, last_synced_at TEXT, source TEXT)`

### Acceptance Criteria

- `cargo test -p land-registry-core`（或 workspace 對應 path）全綠
- 整合測試：用 `wiremock` mock 協作平台 token + business API，模擬 token 過期 / 5xx 重試 / 餘額不足 / cache hit / cache miss / batch 50 筆自動拆 2 批
- 整合測試：磁碟空間 < 10 MB 模擬（tmpfs size 限制）、寫入失敗時回 `DiskFull` 而非 panic
- 整合測試：先跑 migration 然後人工破壞 DB 檔模擬 migration 失敗、確認 rollback 還原成功
- 手動驗證：刪除 keychain key、確認 App 啟動時重建 key 並能正常進主畫面
- 手動驗證：手動把本機系統時間調快 1 小時、確認 time_sync 校正後 cache TTL 不被誤判過期

### In Scope

- `src-tauri/src/land_registry/` 整個模組
- `src-tauri/src/encryption.rs`（sqlcipher 整合）
- `src-tauri/migrations/002_land_registry.sql`
- `src-tauri/src/main.rs`（只動 module 註冊 + 啟動順序）
- `src-tauri/Cargo.toml`（依賴）
- 上述模組的單元測試 + 整合測試

### Out of Scope

- 所有業務 API endpoint 實作（`address_to_parcel`、`parcel_data` 等都在 `aire-land-registry-apis-ui`）
- 所有 UI 變動（disclosure forms、case detail、設定頁）
- API key 客戶端設定 UI、餘額顯示、手填 fallback、屋主授權、二次確認
- 主密碼派生、救援碼、.aire 匯出匯入
- PDF 渲染相關（其他 SDD 處理）

## Risks / Trade-offs

- sqlcipher 跨平台 build 失敗 → CI 加 Windows / macOS build 驗證、開 Tauri runner workflow 預先驗證
- 沙箱 API 回傳格式與正式不同 → 在 `client::call_api` 抽象層吸收、record/replay 測試用實際沙箱 response 重播
- JWT exp 解析失敗（token 不是合法 JWT） → 錯誤型別 `AuthFailed` 處理、不 panic
- 磁碟空間檢查在 macOS / Windows / Linux 不同 syscall → 用 `sysinfo` crate 跨平台抽象
- migration 備份檔累積 → 7 天後自動清理，但若客戶從未開 App 超過 7 天備份不會清；接受、預期客戶會定期使用
- OPCOS server time 解析（Date header 多種格式）→ 用 `chrono` 多格式 fallback、解析失敗就 fallback NTP

## Migration Plan

- 既有 Phase 1 SQLite DB 是明文，本 change 啟動時要做一次性「mass migration」：
  1. 偵測 DB 是否加密（嘗試開無 key、若成功就是明文）
  2. 明文 DB → 開新加密 DB → `ATTACH DATABASE` + `INSERT INTO new SELECT * FROM old` 逐表複製
  3. 完成後刪除舊 DB、改名新 DB
  4. 失敗時保留兩份、UI 提示「資料庫升級失敗、請聯絡支援、原檔在 X 路徑」
- 不可逆：升級成功後沒辦法回明文（本來就是目標）
- Rollback：若整個 change apply 失敗、`git revert` 後 App 看到的是加密 DB 卻無 sqlcipher 連線層、會啟動失敗；解法：保留 fallback「啟動時偵測加密狀態、若 binary 無 sqlcipher 但 DB 是加密的、UI 提示版本不相容」

## Open Questions

(none — 所有技術問題已在 plan 對焦階段解決：協作平台規格、cache 策略、加密方案、時間校正、grace period、disk 防護都已決定)
