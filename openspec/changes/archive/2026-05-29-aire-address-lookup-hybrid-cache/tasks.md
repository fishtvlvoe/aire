## 0. SR 收斂與守門

- [x] 0.1 覆蓋 Decision: Three-layer hybrid lookup architecture；確認 Local Cache + Desktop Resolver + SaaS Sync 三層架構，更新本 SR artifacts；以 `spectra analyze aire-address-lookup-hybrid-cache --json` 與 `spectra validate aire-address-lookup-hybrid-cache` 驗證。
- [x] 0.2 覆蓋 Decision: Parallel R02 + COP with cross-validation；確認並行查詢、超時處理、交叉驗證邏輯與 confidence 計算規則已寫入 spec；以文件審查驗證。
- [x] 0.3 覆蓋 Decision: Data completeness resolution chain；確認不完整輸入的三種情境（僅地址 / 僅地段地號 / 僅建號）與對應的 Stage 1/2/3 補全策略已完整定義；以文件審查驗證。
- [x] 0.4 覆蓋 Decision: Confidence and trust model；確認 HIGH/MEDIUM/LOW 的判定條件與 trusted/untrusted 的下游影響已明確；以文件審查驗證。

## 1. 本地 Cache 層（SQLite）

- [x] 1.1 覆蓋 Requirement: Address lookup SHALL use local cache as first layer；新增 migration `015_address_lookup_cache.sql` 建立 `address_lookup_cache` 表（欄位：id, normalized_address, resolved_parcels_json, confidence, trusted, sources_json, source_run_id, created_at, expires_at, synced_to_saas, last_synced_at, saas_conflict）；以 migration test 驗證 schema。
- [x] 1.2 覆蓋 Requirement: Cache entries SHALL carry confidence, trust, and source metadata；實作 `src-tauri/src/db/address_lookup_cache.rs`（CRUD：insert, get_by_address, invalidate, mark_synced, list_stale, list_unsynced）；以 unit test 驗證 TTL 與 metadata 保存。
- [x] 1.3 覆蓋 Requirement: Cache invalidation SHALL support manual refresh；實作 `invalidate_address_lookup_cache(address)` 與對應 IPC command；以 integration test 驗證刪除後重新查詢觸發外部呼叫。
- [x] 1.4 覆蓋 Requirement: Address lookup SHALL use local cache as first layer；在 `land_registry_address_lookup` IPC 中插入 cache-first 邏輯：cache hit → 回傳，cache miss/stale → 進 hybrid lookup；以 mock cache + wiremock 驗證 hit/miss/stale 三種情境。

## 2. Hybrid Resolver（R02 + COP 並行 + 交叉驗證）

- [x] 2.1 覆蓋 Requirement: Address lookup SHALL query multiple sources in parallel；實作 `src-tauri/src/land_registry/hybrid_resolver.rs`：
  - `HybridResolver::lookup(address)` 並行啟動 R02 + COP 查詢
  - 使用 `tokio::join!` 或 `futures::future::join` 實作並行
  - 單分支超時 15s 不阻塞另一方（`tokio::time::timeout`）
  - 回傳 `HybridLookupResult { parcels, confidence, trusted, sources, conflict_info }`
  以 wiremock + unit test 驗證並行、超時、單邊失敗情境。
- [x] 2.2 覆蓋 Requirement: Address lookup SHALL query multiple sources in parallel；實作交叉驗證邏輯：
  - R02.result == COP.result → HIGH/true
  - 只有 R02 → MEDIUM/true
  - 只有 COP → LOW/false
  - 衝突 → LOW/false + conflict_info
  以 fixture test 驗證四種情境的 confidence 與 trusted 判定。
- [x] 2.3 覆蓋 Requirement: Cross-validation results SHALL be recorded for audit；確保 hybrid lookup 結果寫入 `registry_query_runs` 時，`r02_payload_json` 與 `cop_payload_json` 都保存原始回傳；衝突時 `error_summary_json` 記錄差異；以 integration test 驗證。
- [x] 2.4 覆蓋 Decision: Confidence and trust model；修改 `ParcelInfo` 結構或回傳 contract，讓前端收到 `confidence`（HIGH/MEDIUM/LOW）與 `trusted`（bool）；修改 `/cases/new` 與相關 UI 根據 trusted 決定是否允許直接確認或需人工選擇；以 component test 驗證。

## 3. 資料完整性解析鏈（不完整輸入補全）

- [x] 3.1 覆蓋 Requirement: Incomplete input SHALL be resolved through multi-stage chain；實作 `DataCompletenessResolver`：
  - Stage 1: R02 discovery（門牌或地段地號路徑）
  - Stage 2: COP MOI_API_015 地號→建號（僅當 Stage 1 有地段地號但無建號時）
  - Stage 3: COP MOI_API_036 地址→建號 fallback（僅當 Stage 1/2 都失敗時，confidence=LOW）
  以 wiremock + unit test 驗證三個 Stage 的觸發條件與結果合併。
- [x] 3.2 覆蓋 Requirement: Incomplete input SHALL be resolved through multi-stage chain；實作「僅地段地號輸入」的解析路徑：判斷 input kind = land_descriptor → R02 地段地號 discovery → 若無建號則 COP MOI_API_015；以 unit test 驗證。
- [x] 3.3 覆蓋 Requirement: Incomplete input SHALL be resolved through multi-stage chain；實作「僅建號輸入」的拒絕邏輯：input kind = incomplete → 回傳錯誤，不發起外部查詢；以 unit test 驗證。
- [x] 3.4 覆蓋 Requirement: Incomplete input SHALL be resolved through multi-stage chain；確保 Stage 2（COP MOI_API_015）的費用正確計入帳戶：1 NTD/row，結果保存為 resolver candidate run 而非 formal pull；以 billing log test 驗證。

## 4. SaaS Sync 層

- [x] 4.1 覆蓋 Decision: SaaS sync scope and conflict resolution；擴充 `src-tauri/src/land_registry/saas_sync.rs`，新增 `sync_address_lookup_cache()` 函式：
  - 篩選條件：trusted=true AND confidence IN (HIGH, MEDIUM) AND synced_to_saas=false
  - 同步頻率：啟動時 + 每 24h + 新增 trusted entry 後 debounce 5min
  - 衝突解決：比較 updated_at，桌面端較新則覆寫 SaaS
  以 mock SaaS API + unit test 驗證篩選與衝突解決。
- [x] 4.2 覆蓋 Requirement: Desktop cache SHALL sync trusted entries to SaaS；實作 SaaS 端 address lookup endpoint（若 SaaS 架構允許，否則記錄為待 SaaS 團隊實作的接口規格）：
  - GET /api/address-lookup?address={normalized}
  - 查詢 SaaS cache table → hit 回傳 resolved data
  - miss 回傳 `needs_desktop_enrichment`
  以 API contract test 驗證。
- [x] 4.3 覆蓋 Requirement: SaaS cache SHALL NOT store raw JSON payloads；確認 SaaS 端 cache schema 只包含解析後欄位（normalized_address, section_name, land_no, building_no, confidence, sources, created_at），不含 raw JSON；以 schema review 驗證。

## 5. UI/UX 與整合

- [x] 5.1 覆蓋 Requirement: Address lookup SHALL query multiple sources in parallel；更新 `/cases/new` 與地址 lookup UI：
  - 顯示 confidence 標籤（多來源驗證一致 / 系統查詢 / 需確認）
  - trusted=false 時顯示候選清單，要求選擇
  - conflict 時顯示來源差異對比（R02 vs COP）
  以 DOM test 與手動 Chrome 驗證。
- [x] 5.2 覆蓋 Requirement: Address lookup SHALL use local cache as first layer；UI 顯示 cache hit 提示：「已使用既有查詢資料」與上次查詢時間；以 component test 驗證。
- [x] 5.3 覆蓋 Requirement: Cache invalidation SHALL support manual refresh；在地址查詢結果區域新增「重新查詢」按鈕，觸發 cache invalidation 與重新 hybrid lookup；以 DOM test 驗證。
- [x] 5.4 覆蓋 Requirement: SaaS SHALL provide address lookup via cloud cache；若用戶在 SaaS Web 使用 address lookup，UI 處理 `needs_desktop_enrichment` 回應：顯示引導訊息並允許建立 `registry_pending` 案件；以 DOM test 驗證。

## 6. 測試與驗收

- [x] 6.1 覆蓋 Requirement: Address lookup SHALL query multiple sources in parallel；建立 live test matrix，至少包含：
  - R02=COP 一致（HIGH）
  - R02 有、COP 無（MEDIUM）
  - R02 無、COP 有（LOW）
  - R02 與 COP 衝突（LOW + conflict）
  以 Playwright/headed Chrome artifact 與 saved JSON 驗證。
- [x] 6.2 覆蓋 Requirement: Incomplete input SHALL be resolved through multi-stage chain；建立不完整輸入 live test matrix：
  - 僅地址 → Stage 1 R02 門牌 → 完整結果
  - 僅地址 → Stage 1 R02 有地段地號無建號 → Stage 2 COP MOI_API_015 補全
  - 僅地段地號 → Stage 1 R02 地段地號 → 建號候選
  - 僅建號 → 被拒絕
  以 Playwright/headed Chrome artifact 與 billing log 驗證 Stage 2 費用正確。
- [x] 6.3 覆蓋 Decision: Three-layer hybrid lookup architecture；驗收三層架構 E2E：
  - 桌面端查詢 → cache write → sync to SaaS
  - SaaS Web 查詢同一地址 → cloud cache hit → 回傳相同結果
  - SaaS Web 查詢未同步地址 → needs_desktop_enrichment
  以 Playwright + SaaS API test 驗證。
- [x] 6.4 覆蓋全 SR；跑 `spectra analyze aire-address-lookup-hybrid-cache --json` 與 `spectra validate aire-address-lookup-hybrid-cache`，確認所有 requirement 都有對應的 task 與驗證方式。
