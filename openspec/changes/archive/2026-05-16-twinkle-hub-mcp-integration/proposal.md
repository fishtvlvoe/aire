## Why

AIRE 的案件說明書需要實價登錄資料（買賣成交價、坪數、地址）作為市場參考依據。Twinkle Hub（https://api.twinkleai.tw/mcp/）提供 MCP Server 形式的實價登錄查詢服務，Fish 已持有帳號（alias: user-5a9b6ff3），目前免費使用。串接後，仲介在案件頁面可直接查詢周邊成交行情，省去手動查內政部不動產成交資訊的步驟。

## What Changes

- 新增 Rust IPC command `query_real_price`：在 `src-tauri/src/commands/` 下建立，透過 HTTP Transport 呼叫 Twinkle Hub MCP endpoint，執行 `opendata-query_rows` tool，回傳結構化 JSON 給前端
- 新增 Rust MCP client 模組 `src-tauri/src/mcp_client.rs`：封裝 MCP HTTP transport 連線、認證（Bearer token）、tool call JSON-RPC 邏輯
- 更新 `src-tauri/Cargo.toml`：加入 `rmcp`（features: client, transport-streamable-http-client）+ `tokio` + `serde_json` 依賴
- 更新 `src-tauri/src/lib.rs`：在 `invoke_handler` 註冊 `query_real_price` command
- 新增 `src/components/RealPricePanel.tsx`：前端展示實價登錄查詢結果的卡片元件（地址、成交總價、坪數、交易日期、單價/坪）
- 更新 `src/app/(dashboard)/cases/[id]/page.tsx`：在案件頁面加入「實價登錄查詢」section，掛載 `RealPricePanel`
- 更新 `src/lib/safe-invoke.ts`：加入 `query_real_price` 的 browser mock 回傳值（固定 3 筆假資料）
- 新增環境變數 `TWINKLE_HUB_API_KEY`：在 `src-tauri/tauri.conf.json` 的 env 讀取，不寫入前端 bundle

## Non-Goals

- 不串接 `lvr-presale`（預售屋）和 `lvr-rentals`（租賃），此 change 只做 `lvr-trades`（買賣成交）
- 不實作分頁（`limit` 固定最多 20 筆，用戶端若需更多是下一個 change）
- 不做地圖視覺化（地圖是後續獨立功能）
- 不改動授權序號或付費訂閱邏輯（`aire-ux-bugfix-wave1` 已處理 admin 解鎖 UI）
- 不儲存實價登錄查詢結果到 SQLite（只是即時查詢，不做快取）

## Capabilities

### New Capabilities

- `twinkle-hub-mcp-client`: Rust MCP client 模組，負責與 Twinkle Hub HTTP MCP Server 通訊
- `real-price-query`: 從案件頁面觸發實價登錄查詢，回傳周邊成交資料並顯示在前端

### Modified Capabilities

- `browser-dev-mock`: 新增 `query_real_price` mock handler
- `case-management`: 案件頁面加入實價登錄查詢入口

## Impact

- Affected specs: twinkle-hub-mcp-client, real-price-query, browser-dev-mock, case-management
- Affected code:
  - New: `src-tauri/src/mcp_client.rs`, `src-tauri/src/commands/real_price.rs`, `src/components/RealPricePanel.tsx`
  - Modified: `src-tauri/Cargo.toml`, `src-tauri/src/lib.rs`, `src/app/(dashboard)/cases/[id]/page.tsx`, `src/lib/safe-invoke.ts`
- Dependencies added: `rmcp` (Rust crate, HTTP MCP client)
- 環境變數新增: `TWINKLE_HUB_API_KEY`（存於 `.env`，Tauri 在 Rust runtime 讀取，不暴露給前端 JS bundle）
