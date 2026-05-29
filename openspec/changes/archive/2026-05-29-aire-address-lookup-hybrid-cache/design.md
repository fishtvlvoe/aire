## Context

現有 `land_registry_address_lookup` IPC（`src-tauri/src/land_registry/pull.rs:682`）只調用 `easymap_r02::discover_easymap_r02_address`，不回傳信心度，也不與 COP 交叉驗證。`land_registry_address_lookup_core`（同一檔案 line 111）雖然有 COP + NLSC fallback 邏輯，但從未被 IPC 使用。

實際使用中的問題：
- R02 對某些地址回傳的地段/地號/建號與 COP `MOI_API_036` 不一致。
- R02 門牌 discovery 有時只能定位到土地（有地段地號，無建號），對建物案件造成阻塞。
- COP `MOI_API_036` 雖可從地址反查建號，但準確率有限，單獨使用風險高。
- 沒有 address-level cache：同一地址每天重複查詢會重複打 R02 與 COP。
- SaaS 無法提供 address lookup，因為 EasyMap R02 需要 desktop session。

## Goals / Non-Goals

Goals:

- 建立 address-level 本地快取，支援 TTL、信心度、來源標記與 SaaS 同步。
- 讓桌面端 address lookup 同時查詢 R02 與 COP，交叉驗證後回傳最可信結果。
- 定義不完整輸入（僅地址 / 僅地段地號）的多階段補全策略，明確每階段成本與信心度。
- 讓 SaaS 能回答已同步地址的 lookup，miss 時優雅降級為「需桌面端補強」。
- 保留現有 R02-first discovery 與 formal COP gate 不變；hybrid lookup 只影響 discovery 階段。

Non-Goals:

- 不做 R02 替代。
- 不做 SaaS 端直接查 EasyMap。
- 不改變 confirmed registry key 的 formal pull 規則。
- 不做全量預爬。

## Architecture Decisions

### Decision: Three-layer hybrid lookup architecture

```text
Layer 1: Local Address Lookup Cache (SQLite)
  - Key: normalized_address
  - Value: Vec<ResolvedParcel> + confidence + sources[] + trusted + expires_at
  - 桌面端查詢時優先命中，避免重複外部呼叫
  - 只儲存實際查詢過的地址，不做全量預爬

Layer 2: Desktop Real-time Resolver (Rust/Tauri)
  - Cache miss → 並行查詢 EasyMap R02 + COP MOI_API_036
  - 交叉驗證結果 → 計算 confidence → 寫入 cache
  - 若 R02 與 COP 都失敗 → NLSC fallback（零成本）→ 標記 needs_selection
  - 若只有地段地號無建號 → 用 COP MOI_API_015（地號→建號）補全

Layer 3: SaaS Cloud Cache (Postgres via SaaS API)
  - 桌面端定期上傳 trusted=1 的 cache entries
  - SaaS 提供 address lookup endpoint，查雲端 cache
  - Cloud miss → 回傳 { status: "needs_desktop_enrichment", hint: "請在桌面版 AIRE 查詢此地址以建立快取" }
```

### Decision: Parallel R02 + COP with cross-validation

標準 hybrid lookup 流程：

```text
normalized_address
  -> 查本地 cache (address_lookup_cache)
     -> cache hit 且未過期 -> 回傳 cached result
     -> cache miss 或過期 -> 進入並行查詢

並行查詢：
  Branch A: EasyMap R02 discover(address)
  Branch B: COP MOI_API_036 QueryByAddress(address)

等待兩者完成（timeout: 15s，任一分支超時不阻塞另一方）

交叉驗證：
  若 R02.result == COP.result（地段+地號+建號一致）
    -> confidence: HIGH, trusted: true, sources: [r02, cop]
  若只有 R02 有結果（COP 無結果或 STATUS!=1）
    -> confidence: MEDIUM, trusted: true, sources: [r02]
      （R02 歷史準確率高，單獨可信但低於交叉驗證）
  若只有 COP 有結果（R02 失敗）
    -> confidence: LOW, trusted: false, sources: [cop]
      （COP 地址反查準確率低，標記為候選需人工確認）
  若 R02 與 COP 結果衝突
    -> confidence: LOW, trusted: false, sources: [r02, cop]
      -> 儲存兩組結果，標記 conflict，UI 顯示差異供使用者選擇

寫入 cache，回傳結果
```

### Decision: Data completeness resolution chain

當輸入不完整時，系統不是直接失敗，而是嘗試多階段補全：

**Scenario A: 只有門牌地址（無地段地號建號）**

```text
Stage 1: EasyMap R02 門牌 discovery
  -> 若回傳完整 地段+地號+建號 → 完成
  -> 若只回傳 地段+地號（無建號）→ 進 Stage 2
  -> 若完全找不到 → 進 Stage 3

Stage 2: COP MOI_API_015 地號→建號查詢（1 NTD/row）
  -> 輸入: R02 回傳的地段代碼 + 地號
  -> 若回傳建號 → 與 R02 結果合併，confidence 依交叉驗證規則
  -> 若無建號 → 標記「建號需人工確認」，案件可為 registry_pending

Stage 3: COP MOI_API_036 地址→建號查詢（免費）
  -> 作為最後 fallback，但結果 confidence: LOW，不直接 trusted
  -> 若回傳多筆 → 列為候選供使用者選擇
  -> 若回傳單筆 → 仍需使用者確認
```

**Scenario B: 只有地段+地號（無建號）**

```text
Stage 1: EasyMap R02 地段地號 discovery
  -> 若回傳建號列表 → 完成
  -> 若無建號 → 進 Stage 2

Stage 2: COP MOI_API_015 地號→建號查詢（1 NTD/row）
  -> 輸入: 地段代碼 + 地號
  -> 回傳建號列表 → 列為候選供使用者選擇
  -> 無回傳 → 標記「建號需人工確認」
```

**Scenario C: 只有建號（無地段地號）**

```text
建號本身無法獨立定位（需地段+地號）。系統回傳 "incomplete_input"，
要求使用者至少提供地段+地號，或提供完整地址。
```

成本邊界：
- Stage 1 (R02): 零成本
- Stage 2 (COP MOI_API_015): 1 NTD/row，只在 Stage 1 不完整時觸發
- Stage 3 (COP MOI_API_036): 免費，但 confidence 低

### Decision: Confidence and trust model

| Condition | Confidence | Trusted | UI Behavior |
|-----------|-----------|---------|-------------|
| R02 == COP，完全一致 | HIGH | true | 可直接確認，顯示「多來源驗證一致」 |
| 只有 R02 有結果 | MEDIUM | true | 可確認，顯示「系統查詢結果」 |
| R02 有結果 + COP MOI_API_015 補全建號 | MEDIUM | true | 可確認，顯示「地址與地籍資料交叉比對」 |
| 只有 COP 有結果 | LOW | false | 顯示為候選，需人工確認 |
| R02 與 COP 衝突 | LOW | false | 顯示差異對比，需人工選擇 |
| NLSC fallback | LOW | false | 顯示為參考候選，需選擇 |

`trusted=true` 的結果可直接作為 confirmed registry key 用於 formal COP。
`trusted=false` 的結果只能作為候選，需使用者確認後才能 formal pull。

### Decision: Cache TTL and invalidation

- `address_lookup_cache` 預設 TTL: 90 天（不動產地段地號變更頻率低）。
- 使用者可手動觸發「重新查詢」以跳過 cache。
- cache 條目標記 `synced_to_saas: bool` 與 `last_synced_at: Option<i64>`。
- 當 R02 或 COP 返回與 cache 不同的結果時，標記 cache entry 為 `stale`，優先回傳新結果並更新 cache。

### Decision: SaaS sync scope and conflict resolution

- 只同步 `trusted=true` 且 `confidence >= MEDIUM` 的條目。
- 同步頻率：桌面端啟動時 + 每 24 小時 + 每次新增 trusted cache entry 後 debounce 5 分鐘。
- 衝突解決：若 SaaS 已有同地址條目，比較 `updated_at`；桌面端較新則覆寫，較舊則保留桌面端並標記 `saas_conflict`。
- SaaS cache 不儲存 raw JSON payload，只儲存解析後的 地段/地號/建號/信心度/來源標記。

### Decision: SaaS lookup graceful degradation

SaaS address lookup endpoint 行為：

```text
SaaS 收到 address lookup 請求
  -> 查雲端 cache
     -> hit -> 回傳 resolved parcels
     -> miss -> 回傳 {
          status: "needs_desktop_enrichment",
          message: "此地址尚未在您的桌面版 AIRE 中建立快取。請在桌面版查詢此地址，結果將自動同步到雲端。",
          canCreatePending: true
        }
```

這確保 SaaS 不會因為沒有 R02 能力而完全無法服務，而是引導用戶使用桌面端建立快取。
