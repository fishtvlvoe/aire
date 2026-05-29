## Why

AIRE 目前的地址查詢（`land_registry_address_lookup`）只依賴單一來源 EasyMap R02。實際使用中發現兩個核心問題：

1. **資料抓不完整**：R02 對部分地址回傳缺失地段、地號或建號，或回傳的建號與 COP 官方資料不一致。單一來源無法交叉驗證，導致下游 formal COP 查詢使用錯誤的 registry key，產生額外費用與錯誤結果。

2. **不完整輸入無法補全**：使用者有時只有門牌地址（缺地段地號），有時只有地段地號（缺建號）。現有流程中，R02 門牌 discovery 若找不到建號，只能進入 `registry_pending` 或依賴付費 resolver；而 COP `MOI_API_036` 雖可從地址反查建號，但準確率有限，不能獨立信任。

此外，SaaS 端目前無法提供 address lookup 服務（EasyMap R02 需要 session cookie 與 desktop-only token），導致 web 用戶無法在瀏覽器端完成地址解析。

本 SR 建立一個 **Hybrid Address Lookup Cache** 系統：在桌面端同時查詢 EasyMap R02 與 COP 官方 API，交叉驗證後寫入本地可信快取；可信快取定期同步到 SaaS，讓 SaaS 也能回答「這個地址對應什麼地段/地號/建號」。對於不完整輸入，系統通過多階段解析鏈補全缺失欄位，而非直接失敗。

## What Changes

- 新增 `address_lookup_cache` 本地資料表：以 normalized address 為 key，儲存聚合後的 地段/地號/建號、信心度、來源標記、TTL 與 SaaS 同步狀態。
- 擴充 `land_registry_address_lookup` IPC：從「只查 R02」改為「R02 + COP 並行查詢 → 交叉驗證 → 寫入 cache → 回傳聚合結果」。
- 新增 Data Completeness Resolver：定義當輸入只有地址（無地段地號）或只有地段地號（無建號）時的多階段補全策略，明確每個階段的來源、成本與信心度。
- 新增 SaaS Cache Sync 模組：桌面端將 `trusted=1` 且 `confidence >= medium` 的快取條目同步到 SaaS DB；SaaS 端提供 address lookup API，優先查雲端 cache，miss 時回傳「needs_desktop_enrichment」。
- 擴充 `land_registry_address_lookup_core`（現有 COP+NLSC fallback）為正式 hybrid resolver，納入 cache-first、R02 並行、交叉驗證邏輯。
- 新增 Address Lookup Audit Trail：每筆 cache write 記錄來源（R02/COP/cache_hit/conflict）、原始 payload hash、信心度計算依據。

## Non-Goals

- 不做 R02 的替代或移除；R02 仍是 primary discovery 來源。
- 不做 COP 獨立作為 discovery 入口；COP 只用於交叉驗證與不完整輸入補全，不直接產生未確認候選。
- 不做 SaaS 端直接呼叫 EasyMap R02；SaaS 只查已同步的快取，miss 時引導用戶使用桌面端。
- 不改變現有 formal COP pull 的 gate 規則；confirmed registry key 仍是 formal pull 的必要條件。
- 不做全國地址庫的預先爬取；cache 只儲存用戶實際查詢過的地址。

## Capabilities

### New Capabilities

- `address-lookup-hybrid-cache`: 多來源並行查詢、交叉驗證、信心度評分、本地持久化快取與 TTL 管理。
- `address-lookup-saas-sync`: 桌面端可信快取同步到 SaaS，SaaS 提供 address lookup cloud API。
- `address-lookup-data-completeness`: 不完整輸入的多階段補全解析鏈。

### Modified Capabilities

- `land-registry-address-lookup`: 從 R02-only 改為 hybrid (R02 + COP + cache)，回傳結果帶信心度與來源標記。
- `land-registry-cache`: 擴充支援 address-level cache（與現有 parcel-level API response cache 區分）。
- `saas_sync`: 新增 address_lookup_cache 的同步規則與衝突解決策略。

## Impact

- Affected specs: land-registry-address-lookup, land-registry-cache, saas_sync, web-geocode-fallback
- Affected code:
  - Modified: src-tauri/src/land_registry/pull.rs, src-tauri/src/land_registry/easymap_r02.rs, src-tauri/src/land_registry/saas_sync.rs, src-tauri/src/db/registry_query_runs.rs, src/lib/land-registry-api.ts, src/app/(dashboard)/cases/new/page.tsx
  - New: src-tauri/src/db/address_lookup_cache.rs, src-tauri/src/land_registry/hybrid_resolver.rs, src-tauri/src/land_registry/cross_validation.rs, src-tauri/migrations/015_address_lookup_cache.sql
  - SaaS: packages/api/modules/address-lookup/router.ts (or equivalent)
  - Tests: src-tauri/tests/address_lookup_hybrid_*.rs, e2e/address-lookup-hybrid.spec.ts
