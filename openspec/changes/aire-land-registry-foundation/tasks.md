## 1. 基礎設定：依賴與資料表

- [x] 1.1 在 `src-tauri/Cargo.toml` 加入 `thiserror`、`jsonwebtoken`、`sysinfo`，並把現有 `rusqlite` 切換到 `bundled-sqlcipher` feature。驗證：`cargo build -p aire-tauri` 跨 macOS / Windows 雙平台通過、`cargo tree | grep -i sqlcipher` 確認 sqlcipher 已被靜態連結（對應 design 決策 SQLite 加密：sqlcipher `bundled-sqlcipher` feature 而非應用層 AES）
- [x] [P] 1.2 撰寫 `src-tauri/migrations/002_land_registry.sql`，建立 `land_registry_cache`、`land_registry_billing_log`、`opcos_offline_state`、`time_sync_state` 四張表，欄位與 design Interface / Data Shape 段落定義一致。驗證：執行 migration runner 後 `PRAGMA table_info(<table>)` 對四張表都回傳預期欄位

## 2. 通用錯誤型別

- [x] [P] 2.1 在 `src-tauri/src/land_registry/errors.rs` 定義 `LandRegistryError`（用 `thiserror`）涵蓋 `Network`、`AuthFailed`、`InsufficientBalance`、`FieldSchemaChanged`、`DiskFull { available_bytes }`、`GracePeriodExpired`、`MigrationFailed`、`TimeSkew`、`Internal` 九個 variant，每個 variant 攜帶 design Implementation Contract 要求的 structured fields（HTTP status、available bytes、parcel ID 等），使 A single typed error enum SHALL cover all land registry failure modes 與 Errors SHALL carry actionable context, never bare strings 兩個 requirement 通過。驗證：`cargo test land_registry::errors`、確認每個 variant 都能透過 `Display` 印出 actionable message、無單純 `String` 錯誤

## 3. 時間校正

- [x] 3.1 撰寫 `src-tauri/src/land_registry/time_sync.rs`：實作 `sync_from_opcos()`（解析 OPCOS 回應 `Date` header 計算 offset 寫入 `time_sync_state`）與 `sync_from_ntp()`（fallback、不阻擋啟動），對應 design 決策 時間校正：OPCOS server time 為主、NTP 為備援。驗證：unit test 餵入 mock `Date` header `Tue, 14 Jan 2026 12:00:00 GMT` 配合假本機時間 12:30 GMT 後，`offset_ms == -1_800_000`，使 Time-synced "now" SHALL be derived from a trusted source, not the wall clock 通過
- [x] [P] 3.2 對外 export `synced_now()` 與 `is_synced()`、確保兩個 source 都失敗時 App 啟動仍繼續（使用上次 persisted offset）。驗證：integration test 把 OPCOS + NTP 都關掉、確認 `is_synced() == false` 但 App 程序未退出，使 Time-sync failure SHALL NOT block App startup 通過

## 4. 磁碟空間防護

- [x] [P] 4.1 撰寫 `src-tauri/src/land_registry/disk_resilience.rs`，實作 `check_writable(min_bytes: u64) -> Result<(), LandRegistryError>` 用 `sysinfo` 跨平台拿可用空間，對應 design 決策 磁碟空間防護：寫前檢查 + < 100 MB 警告 + < 10 MB 阻擋。驗證：unit test 模擬 5 MB 可用空間呼叫 `check_writable(10 MB)` 回 `DiskFull { available_bytes: 5_242_880 }`，使 All write paths SHALL check disk space before persisting 通過
- [x] 4.2 在 `cache.rs`、`billing_log.rs`、`migration_rollback.rs` 所有寫入路徑前呼叫 `check_writable`、用 `?` 把 `DiskFull` bubble up、絕不 `unwrap()` 或 `panic!`。驗證：跑 `grep -rn "unwrap\|expect\|panic" src-tauri/src/land_registry src-tauri/src/encryption.rs` 結果為空（或只在 test code）、使 Disk-full failures SHALL be graceful, never panicking 通過

## 5. SQLite 加密

- [x] 5.1 撰寫 `src-tauri/src/encryption.rs`：開啟 DB 連線時對所有 `Connection` 物件 `execute("PRAGMA key = ?", [key])`，沿用 Phase 1 既有 keychain 整合產生 / 讀取 32-byte key，對應 design 決策 DB 加密 key：OS keychain (`keyring` crate)，與 Phase 1 序號 secret 共用儲存。驗證：integration test 開啟加密 DB 後用一般 `sqlite3` CLI 連線（不給 key）必 fail，使 All SQLite connections SHALL go through an encrypted channel 與 Encryption key SHALL be generated on first run and persisted in OS keychain 通過
- [x] 5.2 實作 plain-text → encrypted 一次性遷移：偵測既存 Phase 1 plain-text DB、`ATTACH` 加密新 DB、逐表 `INSERT INTO new SELECT * FROM old`、atomically rename。驗證：integration test 建一份明文 DB 含 `cases` / `disclosure_drafts` / `settings` 範例資料、跑遷移、確認新加密 DB 內 row count 與舊 DB 一致，使 Existing plaintext DB from Phase 1 SHALL be migrated to encrypted on first encrypted boot 通過

## 6. Migration rollback

- [x] 6.1 撰寫 `src-tauri/src/land_registry/migration_rollback.rs`：在跑每次 migration 前用 `VACUUM INTO 'backup-<unix_ts>.db'` 產出完整檔案備份，對應 design 決策 Migration rollback：完整 DB 備份 + 失敗自動還原。驗證：unit test 觸發 migration 後檢查目錄含 `backup-<ts>.db`、size > 0，使 SQLite migrations SHALL be preceded by a full-file backup 通過
- [x] 6.2 實作失敗 rollback：捕捉 migration 例外、用 backup 檔取代 live DB、回傳 `LandRegistryError::MigrationFailed { failed_statement, source }`；以及 7 天備份清理 pass。驗證：integration test 跑一段刻意失敗的 migration script 後確認 live DB 還原成功 + 8 天前的 backup mtime 模擬檔在啟動時被刪除、3 天前的保留，使 Failed migrations SHALL be rolled back from the pre-migration backup 與 Migration backups SHALL be retained for 7 days then deleted 兩個 requirement 通過

## 7. HTTP client + JWT

- [x] 7.1 撰寫 `src-tauri/src/land_registry/client.rs`：實作 `request_token()` 用 `GET ${LAND_REGISTRY_TOKEN_ENDPOINT}` + `Authorization: Basic base64(CLIENT_ID:CLIENT_SECRET)`、TLS 1.2、parse JSON 為 `{access_token, expires_in, token_type}`、cache token in-memory，對應 design 決策 Token 取得：Basic Auth + GET 而非 POST，依官方 C# 範例。驗證：用 `wiremock` mock token endpoint 回 200 / 401 / 5xx、確認 200 解析正確、4xx 5xx 都 surface 為 `AuthFailed`，使 HTTP client SHALL obtain JWT bearer tokens via Basic Auth 通過
- [x] [P] 7.2 實作 `is_token_expired(jwt: &str) -> bool` 解 JWT base64url payload 拿 `exp` claim、與 `synced_now()` 比較，對應 design 決策 JWT 過期判斷：解 payload `exp` 而非靠 `expires_in` 計時器。驗證：unit test 餵入手工製作 JWT、`exp` 為未來時間 → false、`exp` 為過去時間 → true，使 Client SHALL detect JWT expiry by parsing the `exp` claim 通過
- [x] 7.3 實作 `call_api(method: &str, body: serde_json::Value) -> Result<serde_json::Value, LandRegistryError>`：包 Bearer + JSON content-type + TLS 1.2、retry-with-backoff（5xx / 網路 timeout 3 次 with exponential backoff、4xx 不重試、401 觸發 token refresh 後 retry 一次）。驗證：wiremock 整合測試：503 三次 → 第四次 `Network` error；401 → 自動 refresh 後重試一次；4xx 其他狀態（如 400）直接 surface 不重試，使 Client SHALL send authenticated business calls with TLS 1.2 and JSON 與 Client SHALL retry idempotent failures with backoff 兩個 requirement 通過

## 8. Cache

- [x] 8.1 撰寫 `src-tauri/src/land_registry/cache.rs`：`get_or_fetch<F>(parcel_id, query_date, api_id, fetch)` 以 `(parcel_id, query_date, api_id)` 為 PRIMARY KEY 讀寫 `land_registry_cache`，對應 design 決策 Cache key 設計：`parcel_id + query_date`，不綁案件 ID。驗證：integration test：同一 parcel + 同一日期分別由兩個 case 查 → 第二次 hit cache 不發 network；不同日期 → miss → 第二筆 row 插入，使 Cache SHALL store API responses keyed by parcel and query date 通過
- [x] [P] 8.2 實作 `cache::invalidate(parcel_id, api_id)` 刪除 cache row、並讓所有 cache 寫入路徑經過 `disk_resilience::check_writable`。驗證：unit test 呼叫 invalidate 後同 key 的 `get_or_fetch` 為 miss；模擬 disk full 時寫入 cache 回 `DiskFull` 不 panic，使 Cache SHALL support forced refresh by deletion 與 Cache writes SHALL respect disk resilience guard 兩個 requirement 通過

## 9. Batch dispatcher

- [x] [P] 9.1 撰寫 `src-tauri/src/land_registry/batch.rs`：`dispatch(items: Vec<QueryItem>) -> Vec<Result<Value, LandRegistryError>>` 將輸入切成每批 ≤ 25 筆、async 並行送出（同一上游 endpoint），回傳結果依輸入 index 排序。驗證：unit test 餵 50 筆 → 兩個 upstream call、餵 27 筆 → 兩個 call（25 + 2）；某批失敗時其他批 index 不偏移，使 Batch queue SHALL split requests into chunks of at most 25 items 與 Batch results SHALL preserve original input order 兩個 requirement 通過

## 10. Field mapping

- [x] [P] 10.1 撰寫 `src-tauri/src/land_registry/field_mapping.rs`：在 build time embed `field_mappings.toml` config（或 runtime 從 `resources/` 載入），`map(api_id, response) -> Result<Value, LandRegistryError>` 依 config 翻譯欄位；未知 `api_id` 回 `FieldSchemaChanged { api_id }`。驗證：unit test 餵新 `MOI_API_999` 在 config 中新增 entry 後 reload 即生效（不改 Rust）；缺 config entry 時呼叫回 `Err(FieldSchemaChanged)`，使 Field mapping SHALL be config-driven, not hard-coded in Rust 與 Unknown API IDs SHALL produce typed errors, not silent fallbacks 兩個 requirement 通過

## 11. Billing log

- [x] 11.1 撰寫 `src-tauri/src/land_registry/billing_log.rs`：實作 `write_call(api_id, parcel_id, status, transaction_id, cost_cents, error)`（成功 / 失敗皆寫一列）與 `sum_cost_cents(start, end) -> u64`。驗證：integration test：200 成功一筆 → row.status=200, cost_cents 由 api 單價推導；503 失敗一筆 → row.status=503, cost=0, error 非空；月份 aggregation 餵 100/200/300 → sum_cost_cents 回 600，使 Every call SHALL be recorded with cost and transaction ID 與 Billing log SHALL support monthly cost aggregation 兩個 requirement 通過

## 12. OPCOS 離線 grace

- [x] 12.1 撰寫 `src-tauri/src/land_registry/opcos_offline_grace.rs`：成功 OPCOS 驗證時寫 `opcos_offline_state(last_verified_at, last_verified_serial)`、離線時用 `synced_now() - last_verified_at` 判斷 grace（7 天）、超過回 `GracePeriodExpired`，對應 design 決策 OPCOS 離線 grace period：本機保留授權 7 天。驗證：integration test：模擬 last_verified 3 天前 + OPCOS 斷線 → 啟動成功且 `status()` 回 `Active { days_remaining: 4 }`；模擬 8 天前 + 斷線 → 啟動失敗 `GracePeriodExpired`；額外把本機時鐘往前撥 30 天但 `synced_now` 校正後實際只過 6 天 → 仍允許啟動，使 Successful OPCOS verifications SHALL be persisted with timestamp、Offline boots SHALL be permitted within a 7-day grace window、Grace period SHALL use time-synced now, never raw system clock 三個 requirement 通過

## 13. 整合啟動順序

- [x] 13.1 修改 `src-tauri/src/main.rs` 將 land_registry 模組與 encryption 層註冊進 Tauri builder，啟動順序為「keychain key → encrypted DB → migration_rollback → time_sync → opcos_offline_grace → 主畫面」，對應 design Implementation Contract 段落定義的 Observable Behavior。驗證：手動跑 `npm run tauri dev` 從 fresh 環境（刪除 DB 與 keychain entry）啟動成功且第二次啟動讀回相同 key、且模擬 OPCOS 斷線下啟動仍進主畫面（grace 內）

## 14. 範圍與驗收對齊（design 章節對位）

- [x] 14.1 對齊 design 的 goals 與 non-goals 章節：本 change 的範圍 in scope 限於 `src-tauri/src/land_registry/`、`src-tauri/src/encryption.rs`、`src-tauri/migrations/002_land_registry.sql`、`src-tauri/src/main.rs` 啟動順序、`src-tauri/Cargo.toml` 依賴；範圍 out of scope 包含所有業務 API endpoint 實作、UI 變動、主密碼派生 / 救援碼 / .aire 匯出匯入、PDF 渲染相關。驗證：把本 change 觸碰的檔案清單以 `git diff --name-only origin/main..HEAD` 列出、人工核對全部落在 in scope 清單內、沒有任何 out of scope 路徑被修改
- [x] 14.2 對齊 design 的 acceptance criteria 章節：以 design Implementation Contract 段落列出的全部驗收項目作為合併前的 gate（含 cargo test、wiremock 整合測試、磁碟模擬測試、migration rollback 測試、keychain 重建測試、時鐘錯亂測試）。驗證：執行 `cargo test --workspace -p aire-tauri` 全綠 + 上述六項手動 / 整合測試逐一打勾、結果寫入本 change 的 verification log
