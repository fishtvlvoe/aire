## Group 1：Rust MCP Client（串行）

- [ ] 1.1 `src-tauri/Cargo.toml` 加入 `reqwest`（features: json, rustls-tls）和 `serde_json` 依賴；在 `src-tauri/.env` 加 `TWINKLE_HUB_API_KEY=sk-66l1A3_PPiKS2KlxMh3aew`（對應：twinkle-hub-mcp-client / mcp-http-json-rpc-call；設計決策：D2: api key 儲存 — 讀 `.env` 的 `twinkle_hub_api_key`，build time 注入 rust）[Tool: copilot]
- [ ] 1.2 新增 `src-tauri/src/mcp_client.rs`：實作 `pub async fn call_opendata_query(district: &str, keyword: &str, limit: u32) -> Result<Vec<serde_json::Value>, String>`；讀 `TWINKLE_HUB_API_KEY` → 缺則 return Err；組 where clause；用 reqwest POST `https://api.twinkleai.tw/mcp/` JSON-RPC（非 SSE）；解析 result.content[0].text 為 JSON 陣列後回傳（對應：twinkle-hub-mcp-client / mcp-http-json-rpc-call, where-clause-parameterized；設計決策：D1: mcp client 實作方式 — 用 `reqwest` 自行實作 json-rpc，不用 `rmcp`；D3: 查詢參數設計 — 從案件 address 自動拆解 where clause）[Tool: copilot]
- [ ] 1.3 新增 `src-tauri/src/commands/real_price.rs`：`#[tauri::command] pub async fn query_real_price(district: String, keyword: String, limit: u32) -> Result<Vec<serde_json::Value>, String>`，呼叫 `mcp_client::call_opendata_query`，回傳結果（對應：twinkle-hub-mcp-client / api-key-rust-only）[Tool: copilot]
- [ ] 1.4 `src-tauri/src/lib.rs`：`mod mcp_client;` + `mod commands { pub mod real_price; }`；在 `invoke_handler` 加入 `commands::real_price::query_real_price`（對應：twinkle-hub-mcp-client / mcp-http-json-rpc-call）[Tool: copilot]
- [ ] 1.5 在 `src-tauri/` 目錄執行 `cargo build` 確認 0 error 0 warning，輸出 build log（設計決策：D1: mcp client 實作方式 — 用 `reqwest` 自行實作 json-rpc，不用 `rmcp` — 驗證編譯通過）[Tool: copilot]

## Group 2：Browser Mock + Frontend（可並行）

- [ ] [P] 2.1 `src/lib/safe-invoke.ts`：加入 `query_real_price` mock handler，delay 200ms 後回傳 3 筆固定台南東區裕農路交易紀錄（對應：browser-dev-mock / mock-query-real-price）[Tool: copilot]
- [ ] [P] 2.2 新增 `src/components/RealPricePanel.tsx`：props = `{ district: string; keyword: string }`；狀態機 idle/loading/success/error；idle 顯示「查實價登錄」按鈕（點擊後才觸發 IPC，不在 mount 時自動執行）；loading 顯示 spinner；success 顯示最多 20 筆 trade card（地址、成交總價 NT$X,XXX,XXX、坪數 X.X 坪、單價 NT$X,XXX/坪、交易日期）；error 顯示「查詢失敗：{message}」；empty 顯示「查無符合條件的實價登錄資料」（對應：real-price-query / query-trigger-on-demand, result-display-card, empty-and-error-states；設計決策：D4: 前端顯示 — 獨立元件 `realpricepanel`，懶加載）[Tool: copilot]
- [ ] [P] 2.3 `src/lib/address-parser.ts` 新增函式 `parseAddressForQuery(address: string): { district: string; keyword: string }`，用 regex 拆解 district（區/鎮/市）和 keyword（路/街/大道/巷，取第一個匹配）（對應：real-price-query / address-auto-parse；設計決策：D3: 查詢參數設計 — 從案件 address 自動拆解 where clause）[Tool: copilot]

## Group 3：案件頁整合（依賴 Group 2 完成）

- [ ] 3.1 `src/app/(dashboard)/cases/[id]/page.tsx`：import `RealPricePanel` 和 `parseAddressForQuery`；在地政資料 section 之後新增「實價登錄參考」section，從 case.address 呼叫 `parseAddressForQuery` 取得 district 和 keyword，傳入 `<RealPricePanel>`（對應：case-management / real-price-section-on-case-detail；設計決策：D4: 前端顯示 — 獨立元件 `realpricepanel`，懶加載）[Tool: copilot]

## Group 4：Code Review

- [ ] 4.1 Kimi MCP 審查 Group 1-3 所有改動：確認 API key 不出現在任何 JS 檔案（設計決策：D2: api key 儲存 — 讀 `.env` 的 `twinkle_hub_api_key`，build time 注入 rust）、where clause 無 SQL injection 向量、mock 欄位結構與 Rust 回傳一致（對應：twinkle-hub-mcp-client / api-key-rust-only, where-clause-parameterized）[Tool: kimi]

## Group 5：端對端驗收

- [ ] 5.1 瀏覽器 dev mode 驗收：打開 /cases/TEST-001 → 點「查實價登錄」→ 顯示 3 筆 mock 資料 → 格式正確（NT$格式、坪數換算）（對應：real-price-query / result-display-card）[Tool: sonnet]
- [ ] 5.2 Tauri dev mode 驗收（`pnpm tauri dev`）：點「查實價登錄」→ 確認 Rust 呼叫 Twinkle Hub 成功（network log 有 POST 到 api.twinkleai.tw）→ 前端顯示真實資料（對應：twinkle-hub-mcp-client / mcp-http-json-rpc-call）[Tool: sonnet]
