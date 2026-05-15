## Why

AIRE Phase 3 要接內政部地政整合資訊服務共享協作平台（copapi.moi.gov.tw）的 8 支謄本 / 地價 API，把房仲助理製作說明書時最痛的「抄謄本」1 小時+ 自動化。但這些 API 共用的基礎建設（OAuth 2.0 JWT token 取得 / 重試 / cache / 計費 log / 批次 / 錯誤型別 / SQLite 加密 / 時間校正 / 磁碟空間防護 / migration rollback / OPCOS 離線 grace period）若不先打對，後續每接一支 API 都會重做白工，且本機資料庫含屋主個資若無加密就直接落地就違反個資法。本 change 只做「地基」層，不接任何業務 API、不動 UI，保證 Phase 1 既有功能不受影響，並為下一個 change（`aire-land-registry-apis-ui`）提供可被任何 endpoint 重用的 Rust crate 級基礎。

## What Changes

- 新增 `src-tauri/src/land_registry/mod.rs`：`land_registry` 模組入口，公開 client / cache / errors / batch / field_mapping / billing_log 等子模組
- 新增 `src-tauri/src/land_registry/client.rs`：HTTP client 包含 OAuth 2.0 JWT 取得（`GET /cp/getToken` + Basic Auth）、Bearer token 自動換新（讀 JWT payload `exp` 而非 `expires_in`）、TLS 1.2、retry-with-backoff、user-agent
- 新增 `src-tauri/src/land_registry/cache.rs`：SQLite 永久 cache，**cache key 以 `parcel_id + query_date` 為主、不綁案件 ID**（同地號跨案件複用，省客戶錢）、強制重拉、過期偵測
- 新增 `src-tauri/src/land_registry/errors.rs`：通用錯誤型別（網路 / 認證失敗 / 餘額不足 / 欄位變動 / 磁碟錯誤 / grace period 過期），使用 `thiserror`
- 新增 `src-tauri/src/land_registry/batch.rs`：async 批次 queue，自動拆 25 筆/批，符合協作平台 batch 上限
- 新增 `src-tauri/src/land_registry/field_mapping.rs`：config-driven 對應表 API 欄位 → 說明書欄位，新增 API 只需加 config 不改 Rust 程式碼
- 新增 `src-tauri/src/land_registry/billing_log.rs`：每次成功 / 失敗的 call 寫 log 含成本、HTTP status、TRANSACTIONID，月底結算
- 新增 `src-tauri/src/land_registry/time_sync.rs`：用 OPCOS API server time 或 NTP 校正本機時鐘 offset，cache TTL / 序號驗證皆套用校正後時間（防客戶電腦時鐘錯亂）
- 新增 `src-tauri/src/land_registry/disk_resilience.rs`：磁碟空間檢查（< 100 MB 警告 + 阻擋新案件 / cache 寫入），所有寫檔操作包 graceful 錯誤路徑、不 crash host
- 新增 `src-tauri/src/land_registry/migration_rollback.rs`：SQLite migration 前自動備份完整 DB、migration 失敗自動 rollback 還原備份、保留失敗備份檔待支援
- 新增 `src-tauri/src/land_registry/opcos_offline_grace.rs`：OPCOS 序號驗證連線失敗時，本機保留授權狀態最多 7 天（可設定），超期才強制 online 驗證；用 time_sync 校正後時間判斷 grace 期限
- 新增 `src-tauri/src/encryption.rs`：sqlcipher 整合層，啟動時從 OS keychain 取得 / 建立 DB 加密 key，所有 SQLite 連線改用加密通道
- 新增 `src-tauri/migrations/002_land_registry.sql`：cache / billing_log / audit_log / opcos_offline_state 表結構
- 新增 `Cargo.toml` 依賴：`thiserror`、`jsonwebtoken`（解 JWT payload）、`rusqlite` 開啟 `bundled-sqlcipher` feature、`keyring`（DB 加密 key 儲存）、`reqwest` 已存在沿用
- 新增單元測試覆蓋 cache 跨案件複用 / batch 拆 25 / errors 型別 / JWT 過期判斷 / disk 滿模擬 / migration rollback / encryption 開關
- 修改 `src-tauri/src/main.rs`：註冊 land_registry 模組與 encryption layer 啟動順序

## Non-Goals

- **不接任何業務 API**：address-to-parcel、parcel-data 等實際 endpoint 留 `aire-land-registry-apis-ui`
- **不動任何 UI**：disclosure-form-residential / disclosure-form-land / case-management UI 改動全在 `aire-land-registry-apis-ui`
- **不做設定頁 / API key 管理 / 餘額顯示 / 手填 fallback**：在 `aire-land-registry-apis-ui`
- **不做屋主授權勾選 / 二次確認**：法規 + UX 議題、在 `aire-land-registry-apis-ui`
- **不做主密碼派生 / 救援碼 / .aire 匯出匯入**：在 `aire-phase1-data-portability`（SDD #1c）
- **不做 PDF 座標校對 / 資料來源標記**：在 `aire-phase1-pdf-calibration`（SDD #1b）
- **不做七審檢核閘門 / 實價登錄 / AI 生成 / Crash 自動回報 / 多助理**：Phase 4+
- **不引入 refresh token 機制**：協作平台無此規格，token 過期重抓即可
- **不支援 PKCS#11 / HSM 等硬體加密**：本機 OS keychain 已符合 Phase 3 風險水位

## Capabilities

### New Capabilities

- `land-registry-client`：OAuth 2.0 JWT 取得 + 自動換新 + Bearer 包裝 + 重試 / timeout / TLS 1.2，可被任何協作平台 API 重用
- `land-registry-cache`：SQLite 永久快取，cache key = `parcel_id + query_date`，跨案件複用、支援強制重拉
- `land-registry-errors`：通用錯誤型別，覆蓋網路 / 認證 / 餘額 / 磁碟 / grace period 等情境
- `land-registry-batch`：批次 queue 自動拆 25 筆/批，async 模式
- `land-registry-field-mapping`：config-driven 對應 API 欄位 → 說明書欄位，加新 API 不改 Rust
- `land-registry-billing-log`：呼叫日誌含成本、TRANSACTIONID、HTTP status，月底結算
- `land-registry-time-sync`：NTP / OPCOS server time 校正本機時鐘 offset，所有 TTL / 序號驗證套用
- `land-registry-disk-resilience`：磁碟空間檢查 + 寫檔 graceful 錯誤、不 crash
- `land-registry-migration-rollback`：SQLite migration 失敗自動 rollback + 保留失敗備份
- `opcos-offline-grace`：OPCOS 連線失敗時本機授權 grace period
- `sqlite-encryption`：sqlcipher 整合，DB 加密 key 走 OS keychain

### Modified Capabilities

(none — 全新 capability，Phase 1 既有 capability 不修改)

## Impact

- Affected specs：
  - New：11 個（見上）
- Affected code：
  - New：
    - `src-tauri/src/land_registry/mod.rs`
    - `src-tauri/src/land_registry/client.rs`
    - `src-tauri/src/land_registry/cache.rs`
    - `src-tauri/src/land_registry/errors.rs`
    - `src-tauri/src/land_registry/batch.rs`
    - `src-tauri/src/land_registry/field_mapping.rs`
    - `src-tauri/src/land_registry/billing_log.rs`
    - `src-tauri/src/land_registry/time_sync.rs`
    - `src-tauri/src/land_registry/disk_resilience.rs`
    - `src-tauri/src/land_registry/migration_rollback.rs`
    - `src-tauri/src/land_registry/opcos_offline_grace.rs`
    - `src-tauri/src/encryption.rs`
    - `src-tauri/migrations/002_land_registry.sql`
  - Modified：
    - `src-tauri/src/main.rs`（註冊新模組 + 加密啟動順序）
    - `src-tauri/Cargo.toml`（新增依賴）
  - Removed：(none)
- Dependencies 新增：
  - `thiserror`（錯誤型別）
  - `jsonwebtoken`（解 JWT payload 拿 exp）
  - `rusqlite` feature `bundled-sqlcipher`（替換既有 rusqlite，DB 加密）
  - `keyring`（既有，DB 加密 key 走 keychain）
- 環境變數新增：
  - 已在 `.env`：`LAND_REGISTRY_CLIENT_ID`、`LAND_REGISTRY_CLIENT_SECRET`、`LAND_REGISTRY_API_BASE_URL`、`LAND_REGISTRY_TOKEN_ENDPOINT`
  - 本 change 不再新增其他環境變數
