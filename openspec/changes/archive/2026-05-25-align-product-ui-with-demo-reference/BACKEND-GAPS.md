# align-product-ui-with-demo-reference — UI / Backend Gap Audit

## 結論

目前 UI 與後端仍有明顯落差。`align-product-ui-with-demo-reference` 已完成正式產品介面與 demo reference 對齊，但其中部分資料仍由前端 contract/mock 供應。這些不能視為完整後端串接完成。

## 差異表

| UI 區域 | 目前 UI 狀態 | 現有後端/資料來源 | 差異 | 本次處理 |
|---|---|---|---|---|
| 新增案件地址判斷 | 原本用字串規則判斷土地/建物/農舍 | `land_registry_address_lookup` 已存在，mock/tauri 都有入口 | UI 沒先打現有地址查詢 adapter | 已改為先呼叫 `addressLookup()`，失敗才 fallback 本機判斷 |
| 案件工作台欄位審核 | 多數欄位由 demo rows 顯示 | `case.land_registry_data`、`registry-preview` 已能解析部分地政欄位 | 工作台只部分讀 `land_registry_data`，尚未由完整 matrix/autofill engine 驅動 | 已保留現有 registry data 帶入；完整 matrix 交由 `disclosure-registry-autofill-system-update` |
| 費用摘要 | 工作台顯示固定 27 元/成功失敗 rows | Rust 有 `BillingLog` 與 `land_registry_get_balance`，但缺案件/服務明細查詢 IPC | UI 沒有真正讀 usage ledger 明細 | 已在設定頁接 `BalanceMonitor` 讀本月用量；明細 ledger 仍是 backend gap |
| 費用紀錄頁 | 側欄路由指到 `/settings?section=billing` | 目前只有本月 aggregate balance，沒有日期/服務/歷程編號查詢 command | 客戶仍看不到完整成功/失敗/扣款明細 | 保留為 gap，應在資料 SR 實作 usage ledger query |
| 升級 toggle | Google/空拍/AI/地籍圖 toggle 為前端 contract | mock 有 `get_feature_flags`；Tauri 目前沒有對應 command；`PremiumUnlockSection` 只處理 premium subscribe | UI 與真後端 entitlement port 未一致 | 記錄 gap，需新增 `get_entitlements`、`request_feature_upgrade` 等穩定端口 |
| PDF 圖資 slot | 設定頁顯示地籍圖/地標圖/空拍圖/格局圖位置 | `case_assets`、floor plan commands 已存在一部分 | slot 尚未跟 assets、entitlement、PDF output 真正合流 | 記錄 gap，應接 asset kind 與 PDF assembler |
| 地政 API 設定 | 後台保留 `LandApiSection` | web mock 用 `get_land_api_settings`，Tauri land registry key 用 `land_registry_get_api_key` / `set_api_key` | Web 設定與 Tauri key storage command 命名不一致 | 記錄 gap，需統一 adapter，避免設定頁存到錯端口 |

## 後續必做

這些工作不應再標成 UI 完成：

1. `disclosure-registry-autofill-system-update` 完成 matrix/catalog/outcome/usage ledger/entitlement adapter。
2. 前端工作台改讀 autofill engine output，不直接維護 demo rows。
3. 後端新增 usage ledger query IPC，支援日期、服務、成功/失敗、transaction id、return rows、amount。
4. 設定頁 land API adapter 統一 web mock 與 Tauri command 名稱。
5. entitlement ports 由後端提供穩定狀態，UI toggle 只反映後端 state。
