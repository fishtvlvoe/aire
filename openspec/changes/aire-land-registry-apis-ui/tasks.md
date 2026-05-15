## 1. Rust API endpoint trait + address lookup

- [x] 1.1 定義 `LandRegistryEndpoint` trait（`endpoint_path()`, `parse_response()`, `field_mappings()`）在 `src-tauri/src/land_registry/apis/mod.rs`（對應 D1: API endpoint 實作架構 — 每支 API 獨立 module + 共用 trait）。含 Address normalization 函數（全形轉半形、trim、collapse spaces）。驗證：unit test — 全形 "１００號" → "100號"；多空格 " 台北  市 " → "台北 市"；滿足 spec Address normalization 的 Full-width input normalized scenario。[Tool: Codex]
- [x] 1.2 實作 `src-tauri/src/land_registry/apis/address_to_parcel.rs`：impl LandRegistryEndpoint，呼叫協作平台 address-to-parcel API，回傳 Vec<ParcelInfo>（滿足 spec Address-to-parcel lookup）。含 Cache integration（composite key = normalized_address + query_date，滿足 spec Cache integration 的 Cache hit avoids duplicate API call scenario）。含 API key guard：未設定 API key → ApiKeyNotConfigured（滿足 spec API key guard 的 Missing API key blocks lookup scenario）。驗證：wiremock integration test — mock 回傳 2 筆結果 → Vec 長度 2 且按 parcel_id 排序；查不到 → 空 Vec（滿足 No match found scenario）；第二次查同地址 → cache hit 無 HTTP 請求。[Tool: Codex]

## 2. 七支 parcel data endpoints

- [x] [P] 2.1 實作 `building_registry.rs`：impl LandRegistryEndpoint，解析建物登記回應，mapping 至 building_area/building_purpose/construction_date。滿足 spec Seven parcel data API endpoints 的 Building registry data retrieval scenario。含 Billing integration per call：成功記 billing_log cost_cents（滿足 Successful call recorded with cost scenario）；失敗記 cost=0（滿足 Failed call recorded with zero cost scenario）。驗證：wiremock test — mock 回應 → 正確解析 3 個欄位 + billing_log 有紀錄。[Tool: Codex]
- [x] [P] 2.2 實作 `land_registry.rs`：impl LandRegistryEndpoint，解析土地登記回應。滿足 spec Seven parcel data API endpoints 的 Land registry data retrieval scenario + Billing integration per call。驗證：wiremock test。[Tool: Codex]
- [x] [P] 2.3 實作 `co_owners.rs`：impl LandRegistryEndpoint，解析共有人清冊。滿足 spec Seven parcel data API endpoints。驗證：wiremock test — 多筆共有人 → Vec 長度正確。[Tool: Codex]
- [x] [P] 2.4 實作 `land_value.rs`：impl LandRegistryEndpoint，解析地價資料。滿足 spec Seven parcel data API endpoints。驗證：wiremock test。[Tool: Codex]
- [x] [P] 2.5 實作 `mortgages.rs`：impl LandRegistryEndpoint，解析抵押權。滿足 spec Seven parcel data API endpoints。驗證：wiremock test。[Tool: Codex]
- [x] [P] 2.6 實作 `building_ownership.rs`：impl LandRegistryEndpoint，解析建物權狀。滿足 spec Seven parcel data API endpoints。驗證：wiremock test。[Tool: Codex]
- [x] [P] 2.7 實作 `zoning.rs`：impl LandRegistryEndpoint，解析都市計畫使用分區。滿足 spec Seven parcel data API endpoints 的 All 7 endpoints callable scenario。驗證：wiremock test。[Tool: Codex]

## 3. API key 儲存 + 餘額查詢（Rust）

- [x] [P] 3.1 實作 `src-tauri/src/land_registry/api_key_storage.rs`（對應 D2: API key 儲存 — OS keychain（keyring crate，foundation 已有）: API key 儲存）：用 keyring crate 存取 API key（JSON {client_id, client_secret}），滿足 spec OS keychain storage + API key settings page + Clear credentials。IPC commands: `land_registry_set_api_key`, `land_registry_get_api_key`（回傳 masked，滿足 Credentials persist across app restart scenario）, `land_registry_test_connection`（嘗試取 token，滿足 Save and test API key scenario，成功回 "連線成功"、失敗回 "認證失敗：請確認 Client ID 與安全碼"）, `land_registry_clear_api_key`（滿足 Clear removes keychain entry scenario）。驗證：unit test — set → get 回 masked（末 4 碼可見）；clear → get 回 None；test_connection mock 成功/失敗。[Tool: Codex]
- [x] [P] 3.2 實作 `src-tauri/src/land_registry/balance.rs`（對應 D3: 餘額監控 — 本地 billing_log 聚合 + 可選遠端查詢: 餘額監控）：從 billing_log 聚合當月 query_count + total_cost（滿足 spec Balance display from local billing log 的 Balance shows monthly totals scenario，5 筆 × 10 cents → "本月查詢 5 次，費用 NT$50"），計算 Low balance warning（剩餘 < 10，滿足 spec Low balance warning 的 Low balance warning shown scenario）。IPC command: `land_registry_get_balance` → BalanceInfo。驗證：unit test — 插入 5 筆 billing_log → count=5, cost=50；插入 95 筆 → low_balance_warning=true。[Tool: Codex]

## 4. 屋主授權 + 二次確認（Rust）

- [x] 4.1 新增 SQLite migration：`owner_consent_log` table（id, case_id, timestamp, user_email）（對應 D4: 屋主授權 — 前端強制 checkbox + 後端時戳紀錄: 屋主授權）。滿足 spec Consent logging 的 Consent recorded in database scenario（寫入 case_id + 當前 time-synced timestamp + user email）。驗證：migration up/down 可逆。[Tool: Codex]
- [x] 4.2 實作 consent 記錄 + Backend enforcement 邏輯：IPC `land_registry_record_consent(case_id)` 寫入 owner_consent_log（滿足 spec Mandatory consent before data pull）；`land_registry_pull_data` 執行前 check consent 存在，不存在 → ConsentRequired error（滿足 spec Backend enforcement 的 IPC rejects without consent scenario）。驗證：test — 無 consent record 呼叫 pull_data → ConsentRequired；有 record → 通過。[Tool: Codex]

## 5. 主 pull_data IPC command

- [x] 5.1 實作 `land_registry_pull_data(parcel_id, api_ids)` IPC（對應 design observable behavior 第 2 點 + interface / data shape + failure modes + acceptance criteria）：檢查 API key（Failure Mode: ApiKeyNotConfigured → 前端導向設定頁）→ 檢查 consent（Failure Mode: ConsentRequired）→ 遍歷 api_ids 呼叫各 endpoint（含 Batch support，滿足 spec Batch support 的 Large batch split into chunks scenario）→ 記 billing_log → 回傳 PullResult（results map + total_cost）。失敗的 endpoint 在 results 中標 error，不中斷其他（Failure Mode: 網路斷線 → cache hit 回快取資料標示 cached，cache miss → 手填 fallback）。驗證：integration test — 3 支 API 中 1 支 mock 503 → PullResult 有 2 success + 1 error，billing_log 3 筆。[Tool: Codex]
- [x] 5.2 在 `src-tauri/src/main.rs` 註冊所有新 IPC commands（對應 design scope boundaries in-scope 項目）。驗證：cargo check 通過。[Tool: Codex]

## 6. 前端 IPC wrapper + mock backend

- [x] 6.1 新增 `src/lib/land-registry-api.ts`（對應 D7: 前端 IPC wrapper — src/lib/land-registry-api.ts）：TypeScript wrapper 封裝所有 Tauri IPC calls（address_lookup, pull_data, set_api_key, get_api_key, test_connection, clear_api_key, get_balance, record_consent）。含 error mapping 到中文訊息（ApiKeyNotConfigured → "請先設定地政 API 金鑰"、ConsentRequired → "請先勾選屋主授權"、InsufficientBalance → "餘額不足"）。驗證：type check 通過。[Tool: Codex]
- [x] 6.2 擴充 `src/lib/mock-backend.ts`：新增所有 land-registry IPC commands 的 mock 實作（address_lookup 回 seed 資料、pull_data 回 mock 欄位、balance 回 mock 數值）。驗證：既有 mock-backend test 通過 + 新增 commands 有對應 test。[Tool: Codex]

## 7. 前端 UI 元件

- [x] [P] 7.1 新增 `src/components/ApiKeySettings.tsx`（對應 D2: API key 儲存 — OS keychain（keyring crate，foundation 已有） + D8: UI/UX 統一 — 與 OPCOS 共用視覺 token: UI/UX 統一）：滿足 spec API key settings page 的 Save and test API key scenario — 輸入表單（client_id + client_secret）+ "測試連線" 按鈕（成功 → 綠色 "連線成功"；失敗 → 紅色 "認證失敗"）+ "清除" 按鈕（滿足 Clear credentials spec）+ 狀態顯示 loading。使用 shadcn Card + Input + Button。驗證：mock 模式下可輸入 → 測試 → 顯示成功。[Tool: Codex]
- [x] [P] 7.2 新增 `src/components/BalanceMonitor.tsx`（對應 D3: 餘額監控 — 本地 billing_log 聚合 + 可選遠端查詢 + D8: UI/UX 統一 — 與 OPCOS 共用視覺 token）：滿足 spec Balance display from local billing log — 顯示「本月查詢 N 次，費用 NT$X」+ Low balance warning 黃色警告。使用 shadcn Card。驗證：mock 模式下渲染正確數值。[Tool: Codex]
- [x] [P] 7.3 新增 `src/components/BalanceBanner.tsx`（對應 D3: 餘額監控 — 本地 billing_log 聚合 + 可選遠端查詢 + D8: UI/UX 統一 — 與 OPCOS 共用視覺 token）：滿足 spec Balance banner on case page + Balance warning banner on case page — 黃色 banner "查詢餘額不足，請至設定頁確認" + 連結到 settings。驗證：low_balance=true 時顯示，false 時隱藏。[Tool: Codex]
- [x] [P] 7.4 新增 `src/components/OwnerAuthorizationDialog.tsx`（對應 D4: 屋主授權 — 前端強制 checkbox + 後端時戳紀錄 + D8: UI/UX 統一 — 與 OPCOS 共用視覺 token）：滿足 spec Mandatory consent before data pull 的 Consent required to proceed scenario — Dialog 含 checkbox "客戶已書面授權查詢不動產資料" + 確認/取消。確認 disabled 直到 checked（滿足 Consent flow example）。驗證：未勾選 → 確認不可按；勾選 → 確認可按。[Tool: Codex]
- [x] [P] 7.5 新增 `src/components/PreChargeConfirmDialog.tsx`（對應 D5: 二次確認 — PreChargeConfirmDialog + D8: UI/UX 統一 — 與 OPCOS 共用視覺 token）：滿足 spec Pre-charge confirmation dialog — 顯示 "本次預計查詢 N 支 API，預估費用 NT$X，確定要拉嗎？"（滿足 Cost calculation example table）。Cancel aborts pull：取消回傳 false → 不呼叫 API、billing_log 無新增。Confirm proceeds to pull：確認回傳 true → 執行。驗證：顯示正確數字 + 取消/確認行為正確。[Tool: Codex]
- [x] [P] 7.6 新增 `src/components/ManualFallbackInput.tsx`（對應 D6: 手填 fallback — ManualFallbackInput 元件 + D8: UI/UX 統一 — 與 OPCOS 共用視覺 token）：滿足 spec Manual fallback input UI + Source tagging + Mixed sources per case — 動態表單根據 api_id 顯示對應欄位，source 標記為 "manual"（API 成功的標 "api"，滿足 Partial manual entry scenario）。驗證：渲染 building_registry 欄位 → 3 個 input 可填，source = "manual"。[Tool: Codex]
- [x] [P] 7.7 新增 `src/components/PullParcelDataButton.tsx`（對應 D4: 屋主授權 — 前端強制 checkbox + 後端時戳紀錄+D5: 二次確認 — PreChargeConfirmDialog+D6: 手填 fallback — ManualFallbackInput 元件+D8: UI/UX 統一 — 與 OPCOS 共用視覺 token + design observable behavior 第 2 點）：整合按鈕 "拉謄本"，串接 OwnerAuthorizationDialog → PreChargeConfirmDialog → pull_data → 結果填入 form context。失敗 endpoint 自動切 ManualFallbackInput（滿足 spec Pull failure shows manual fallback scenario）。驗證：mock 模式端到端流程通過。[Tool: Codex]

## 8. 頁面整合

- [ ] 8.1 新增 `src/app/(dashboard)/settings/api-key/page.tsx`：設定頁路由，包含 ApiKeySettings + BalanceMonitor。驗證：路由可訪問 + 元件渲染。[Tool: Codex]
- [ ] [P] 8.2 修改 `src/components/disclosure-form-residential.tsx`：在地址欄位旁加 PullParcelDataButton，滿足 spec Pull parcel data button integration（residential）的 Pull button fills form fields scenario + Pull failure shows manual fallback scenario。驗證：mock 模式下點拉謄本 → 欄位被填入。[Tool: Codex]
- [ ] [P] 8.3 修改 `src/components/disclosure-form-land.tsx`：在地號欄位旁加 PullParcelDataButton，滿足 spec Pull parcel data button integration（land）。驗證同上。[Tool: Codex]
- [ ] [P] 8.4 修改 `src/app/(dashboard)/cases/[id]/page.tsx`：加入 Parcel data pull status display（未查詢/查詢中/已完成/部分手動，滿足 spec Parcel data pull status display 的 Status shows after successful pull + Status shows partial manual scenario）+ BalanceBanner（滿足 spec Balance warning banner on case page 的 Banner appears when balance is low scenario）。驗證：mock 模式下狀態正確顯示。[Tool: Codex]

## 9. Scope 驗證 + 全量測試

- [ ] 9.1 scope 驗證（對應 design scope boundaries）：`git diff --name-only` 確認所有變更在 in-scope 路徑內。驗證：無 out-of-scope 檔案被修改。[Tool: Codex]
- [ ] 9.2 全量測試（對應 design acceptance criteria）：`cargo test --workspace` 通過（排除已知 crypto/db 3 個 pre-existing failures）+ `npm run build` 通過。驗證：除已知 3 個失敗外無新失敗。[Tool: Codex]
