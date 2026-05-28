# aire-address-lookup-hybrid-cache Specification

## Purpose

建立 Hybrid Address Lookup Cache 系統，解決單一來源（EasyMap R02）資料不完整與不準確的問題。系統在桌面端並行查詢 R02 與 COP，交叉驗證後寫入本地快取；可信快取同步到 SaaS，讓雲端也能提供 address lookup 服務。對於不完整輸入（僅地址或僅地段地號），系統通過多階段解析鏈補全缺失的 地段/地號/建號。

## Requirements

### Requirement: Address lookup SHALL query multiple sources in parallel

`land_registry_address_lookup` 從單一查詢改為並行查詢 EasyMap R02 與 COP `MOI_API_036`，等待兩者完成後進行交叉驗證。任一分支超時（15 秒）不阻塞另一方結果。

#### Scenario: R02 and COP both return matching results

- **GIVEN** 地址 "台北市大安區和平東路一段100號"
- **WHEN** 並行查詢 R02 與 COP MOI_API_036
- **THEN** R02 回傳地段=「復興段」、地號=「0001」、建號=「00001"
- **AND** COP 回傳地段=「復興段」、地號=「0001」、建號=「00001"
- **AND** 系統標記 confidence=HIGH, trusted=true, sources=[r02, cop]

#### Scenario: R02 succeeds but COP returns empty

- **GIVEN** 地址 "台南市東區裕農路288巷17號8樓之1"
- **WHEN** R02 回傳地段=「富強段」、地號=「00700000」、建號=「00001"
- **AND** COP MOI_API_036 回傳 STATUS!=1 或空列表
- **THEN** 系統以 R02 結果為準，標記 confidence=MEDIUM, trusted=true, sources=[r02]

#### Scenario: R02 fails but COP returns result

- **GIVEN** 地址 "高雄市苓雅區某路某號"
- **WHEN** R02 連線失敗或回傳空結果
- **AND** COP MOI_API_036 回傳單一建號結果
- **THEN** 系統回傳 COP 結果，標記 confidence=LOW, trusted=false, sources=[cop]
- **AND** UI 顯示為「官方資料候選，建議確認」

#### Scenario: R02 and COP return conflicting results

- **GIVEN** 某地址
- **WHEN** R02 回傳建號=「00001"
- **AND** COP 回傳建號=「00002"
- **THEN** 系統標記 confidence=LOW, trusted=false, sources=[r02, cop]
- **AND** 回傳兩組結果，標記 conflict_type="building_no_mismatch"
- **AND** UI 顯示差異對比，要求使用者選擇

### Requirement: Address lookup SHALL use local cache as first layer

系統新增 `address_lookup_cache` 表，以 normalized_address 為 key。每次 lookup 先查 cache，hit 且未過期時直接回傳，不觸發外部查詢。

#### Scenario: Cache hit avoids external API calls

- **GIVEN** 地址 "台北市大安區和平東路一段100號" 已在 cache 中
- **AND** cache entry 未過期（expires_at > now）
- **WHEN** 再次查詢同一地址
- **THEN** 回傳 cache 中的 ResolvedParcel 列表
- **AND** 不發起 R02、COP 或 NLSC 網路請求
- **AND** 回傳結果中 source_run_id 指向原查詢紀錄

#### Scenario: Cache miss triggers hybrid lookup

- **GIVEN** 地址 "新北市板橋區某路某號" 不在 cache 中
- **WHEN** 查詢該地址
- **THEN** 觸發並行 R02 + COP 查詢
- **AND** 結果寫入 `address_lookup_cache`
- **AND** 同時寫入 `registry_query_runs` 作為 audit trail

#### Scenario: Stale cache is refreshed transparently

- **GIVEN** 地址在 cache 中但已過期（expires_at < now）
- **WHEN** 查詢該地址
- **THEN** 視為 cache miss，重新執行 hybrid lookup
- **AND** 新結果覆寫舊 cache entry

### Requirement: Cache entries SHALL carry confidence, trust, and source metadata

每筆 cache entry 必須記錄：confidence 等級（HIGH/MEDIUM/LOW）、trusted 布林值、來源列表（r02/cop/nlsc/cache）、原始查詢的 source_run_id、created_at、expires_at。

#### Scenario: Cache stores complete metadata

- **WHEN** hybrid lookup 完成並寫入 cache
- **THEN** `address_lookup_cache` 記錄包含：
  - `normalized_address`: 標準化後地址
  - `resolved_parcels_json`: ParcelInfo 列表 JSON
  - `confidence`: "HIGH" | "MEDIUM" | "LOW"
  - `trusted`: 1 或 0
  - `sources`: JSON 陣列 ["r02", "cop"]
  - `source_run_id`: 指向 `registry_query_runs.id`
  - `created_at`: Unix timestamp
  - `expires_at`: Unix timestamp（created_at + 90 天）
  - `synced_to_saas`: 0 或 1

### Requirement: Incomplete input SHALL be resolved through multi-stage chain

當輸入無法直接取得完整的 地段+地號+建號 時，系統按定義的解析鏈嘗試補全，而非直接失敗。

#### Scenario: Address only resolves to land descriptor, then building number is filled via COP

- **GIVEN** 輸入為門牌地址 "台中市西屯區某路某號"
- **WHEN** R02 門牌 discovery 只回傳地段=「某段」、地號=「1234」，無建號
- **THEN** 系統自動觸發 Stage 2: COP MOI_API_015 QueryByLandNo
  - 輸入: UNIT=地政事務所代碼, SEC=地段代碼, NO=1234
- **AND** 若 COP 回傳建號列表 ["00001", "00002"]
- **THEN** 合併結果：地段=「某段」、地號=「1234」、建號候選=["00001", "00002"]
- **AND** confidence=MEDIUM（R02 地段地號 + COP 建號補全）
- **AND** 顯示候選清單供使用者選擇單一建號

#### Scenario: Address only resolves to land descriptor, COP building lookup also empty

- **GIVEN** 同上，R02 只回傳地段地號
- **WHEN** COP MOI_API_015 回傳空列表
- **THEN** 結果標記「建號需人工確認」
- **AND** 案件可建立為 `registry_pending`
- **AND** 不觸發額外付費查詢

#### Scenario: Land descriptor input resolves building candidates

- **GIVEN** 輸入為 "台南市東區富強段 00700000"
- **WHEN** 系統判定輸入型態為 `land_descriptor`
- **THEN** 走 R02 地段地號 discovery
- **AND** 若回傳建號列表 → 顯示候選
- **AND** 若無建號 → 觸發 COP MOI_API_015 補全
- **AND** 最終顯示所有建號候選供選擇

#### Scenario: Incomplete input with only building number is rejected

- **GIVEN** 輸入只有建號 "00001"，無地段地號或地址
- **WHEN** 系統判定輸入為 `incomplete`
- **THEN** 回傳錯誤：建號無法獨立定位，請提供完整地址或地段地號
- **AND** 不發起任何外部查詢

### Requirement: Cross-validation results SHALL be recorded for audit

每筆 hybrid lookup 的交叉驗證過程必須保存到 `registry_query_runs`，包含 R02 payload、COP payload、驗證結果與衝突資訊。

#### Scenario: Conflict is preserved in audit trail

- **GIVEN** R02 回傳建號 A，COP 回傳建號 B
- **WHEN** 寫入 `registry_query_runs`
- **THEN** `r02_payload_json` 保存 R02 原始回傳
- **AND** `cop_payload_json` 保存 COP 原始回傳
- **AND** `error_summary_json` 記錄 `{ "conflict": true, "field": "building_no", "r02": "A", "cop": "B" }`

### Requirement: SaaS SHALL provide address lookup via cloud cache

SaaS 端新增 address lookup endpoint，優先查詢已同步的雲端 cache。Cloud hit 時回傳解析結果；miss 時回傳降級訊息，引導用戶使用桌面端。

#### Scenario: SaaS cloud cache hit

- **GIVEN** 用戶在 SaaS Web 輸入地址 "台北市大安區和平東路一段100號"
- **AND** 該地址已從桌面端同步到 SaaS cache
- **WHEN** SaaS 查詢該地址
- **THEN** 回傳 resolved parcels（地段、地號、建號）
- **AND** 包含 `confidence` 與 `sources` 資訊

#### Scenario: SaaS cloud cache miss

- **GIVEN** 用戶在 SaaS Web 輸入地址 "新北市某區某路某號"
- **AND** 該地址尚未同步到 SaaS cache
- **WHEN** SaaS 查詢該地址
- **THEN** 回傳 HTTP 200（非錯誤）with body:
  ```json
  {
    "status": "needs_desktop_enrichment",
    "message": "此地址尚未在您的桌面版 AIRE 中建立快取。請在桌面版查詢此地址，結果將自動同步到雲端。",
    "canCreatePending": true
  }
  ```
- **AND** UI 顯示引導訊息，允許建立 `registry_pending` 案件

### Requirement: Desktop cache SHALL sync trusted entries to SaaS

桌面端定期將 `trusted=true` 且 `confidence >= MEDIUM` 的 cache entries 同步到 SaaS。同步過程處理衝突與網路失敗。

#### Scenario: Trusted cache entry syncs to SaaS

- **GIVEN** 桌面端產生一筆 `trusted=true, confidence=MEDIUM` 的 cache entry
- **WHEN** 同步週期觸發（啟動時 / 24h / debounce 5min）
- **THEN** 該 entry 上傳到 SaaS
- **AND** `synced_to_saas` 標記為 1
- **AND** `last_synced_at` 記錄同步時間

#### Scenario: Sync conflict resolves by timestamp

- **GIVEN** SaaS 已有地址 X 的 cache entry，updated_at = T1
- **AND** 桌面端有同地址 entry，updated_at = T2，T2 > T1
- **WHEN** 同步發生
- **THEN** SaaS 條目被桌面端版本覆寫
- **AND** 桌面端 `synced_to_saas=1, saas_conflict=false`

#### Scenario: Desktop entry is older than SaaS

- **GIVEN** SaaS 已有地址 Y 的 cache entry，updated_at = T1
- **AND** 桌面端同地址 entry，updated_at = T2，T2 < T1
- **WHEN** 同步發生
- **THEN** 桌面端保留本地版本
- **AND** 標記 `saas_conflict=true`
- **AND** 下次桌面端查詢該地址時提示「雲端有較新資料，是否更新」

### Requirement: Cache invalidation SHALL support manual refresh

使用者可通過 UI 觸發「重新查詢」以強制跳過 cache，重新執行 hybrid lookup。

#### Scenario: Manual refresh bypasses cache

- **GIVEN** 地址在 cache 中且未過期
- **WHEN** 使用者點擊「重新查詢」
- **THEN** 系統刪除該 cache entry
- **AND** 重新執行並行 R02 + COP 查詢
- **AND** 新結果寫入 cache

### Requirement: SaaS cache SHALL NOT store raw JSON payloads

SaaS 端只儲存解析後的 地段/地號/建號/信心度/來源標記，不儲存 R02 或 COP 的原始 JSON payload。Raw payload 只保存在客戶本機 DB。

#### Scenario: SaaS cache stores minimal resolved data

- **WHEN** 桌面端同步 cache entry 到 SaaS
- **THEN** SaaS 儲存：normalized_address, section_name, land_no, building_no, confidence, sources, created_at
- **AND** 不儲存 R02 raw JSON、COP raw JSON、或任何原始 API response
