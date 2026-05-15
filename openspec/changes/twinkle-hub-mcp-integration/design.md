## Context

AIRE 是 Tauri 桌面 App，前端 Next.js，後端 Rust。API key 必須藏在 Rust 層，不能暴露到前端 JS bundle。Twinkle Hub 使用 MCP HTTP Transport（SSE），需要 HTTP client 支援 Server-Sent Events + JSON-RPC 2.0。

既有架構：`src-tauri/src/commands/` 下每個功能一個 `.rs` 檔，透過 `src-tauri/src/lib.rs` 的 `invoke_handler` 統一註冊 Tauri IPC。

## Goals

- Admin 在案件頁面點擊「查實價登錄」→ 觸發 Tauri IPC → Rust 呼叫 Twinkle Hub → 前端顯示結果
- API key 只在 Rust runtime 讀取，不出現在任何 JS 代碼或 network response body

## Non-Goals

- 快取、分頁、預售屋/租賃資料集（Non-goals 見 proposal）

## Decisions

### D1: MCP Client 實作方式 — 用 `reqwest` 自行實作 JSON-RPC，不用 `rmcp`

**選定方案**：自行用 `reqwest` 發 HTTP POST + JSON-RPC 2.0，不依賴 `rmcp` crate。

**理由**：Twinkle Hub 的 `.env` 設定範例顯示 endpoint 是 `https://api.twinkleai.tw/mcp/`，HTTP transport 格式是 Bearer token + JSON-RPC POST。Gemini 研究指出 `rmcp` 使用 SSE（Server-Sent Events）作為底層，而 `rmcp` 的 `transport-streamable-http-client` feature 在 Tauri 環境中尚無穩定驗證。

**被否決的方案**：
- `rmcp` crate（features: client, transport-streamable-http-client）：SSE 連線在 Tauri macOS 沙盒中不穩定，且多了 SSE event loop 的複雜度，對本 use case（一次性 tool call）完全 overkill
- `@modelcontextprotocol/sdk`（Node.js）：前端 SDK，API key 會暴露在 JS bundle，違反安全要求

**影響**：`Cargo.toml` 只加 `reqwest`（已知 Tauri 相容）+ `serde_json`，不加 `rmcp`

**具體呼叫格式**：
```
POST https://api.twinkleai.tw/mcp/
Authorization: Bearer sk-...
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "opendata-query_rows",
    "arguments": {
      "dataset_id": "lvr-trades",
      "where": "鄉鎮市區 = '東區' AND 土地區段位置建物門牌 LIKE '%裕農路%'",
      "limit": 20
    }
  }
}
```

### D2: API Key 儲存 — 讀 `.env` 的 `TWINKLE_HUB_API_KEY`，build time 注入 Rust

**選定方案**：在 `src-tauri/build.rs` 或 `tauri.conf.json` 的 `env` 讀取 `TWINKLE_HUB_API_KEY`，透過 `std::env::var("TWINKLE_HUB_API_KEY")` 在 Rust runtime 取得。

**被否決的方案**：
- Tauri store（stronghold）：過於複雜，此 key 不需要用戶設定，是 vendor key
- Next.js `NEXT_PUBLIC_` 環境變數：會暴露在 client bundle，明確禁止
- hardcode 在 Rust 原始碼：Git 會洩漏，明確禁止

**影響**：`src-tauri/.env`（Tauri 內建讀取機制）存 `TWINKLE_HUB_API_KEY=sk-66l1A3_PPiKS2KlxMh3aew`，此檔已在 `.gitignore`

### D3: 查詢參數設計 — 從案件 address 自動拆解 where clause

**選定方案**：前端傳 `{ district: "東區", keyword: "裕農路" }` 給 Rust command，Rust 組 where clause `鄉鎮市區 = '${district}' AND 土地區段位置建物門牌 LIKE '%${keyword}%'`。

**被否決的方案**：
- 讓前端傳完整 SQL where string：注入風險，前端不應控制 SQL 語法
- 只傳縣市+區，不傳路名：結果太多（一個區可能百筆），limit 20 可能不夠精準

**影響**：IPC command signature = `query_real_price(case_id: String, district: String, keyword: String, limit: u32) -> Result<Vec<RealPriceTrade>, String>`

### D4: 前端顯示 — 獨立元件 `RealPricePanel`，懶加載

**選定方案**：`RealPricePanel` 只在用戶點擊「查實價登錄」時觸發 IPC call，不在頁面 mount 時自動執行。

**被否決的方案**：
- 頁面 mount 自動查詢：消耗 Twinkle Hub API 配額，每次打開案件都查是浪費
- 內嵌在現有表單元件：coupling 太強，不易獨立測試

## Risks / Trade-offs

- [Risk] Twinkle Hub MCP endpoint 若改為 SSE-only transport → reqwest POST 會失敗。Mitigation：`mcp_client.rs` 封裝好介面，只需換 transport layer，上層 command 不動。
- [Risk] `TWINKLE_HUB_API_KEY` 未設定 → `std::env::var` 返回 Err → command 回傳 `"TWINKLE_HUB_API_KEY not configured"` 錯誤訊息，前端顯示設定提示，不 panic。
- [Risk] Twinkle Hub API 回傳欄位名稱為繁中（`鄉鎮市區`、`總價元`）→ Rust struct 需用 `#[serde(rename)]` 或 `serde_json::Value` 接。選用 `Value` 靈活接，前端根據 key 顯示，不強型別。

## Migration Plan

1. 在 `src-tauri/.env` 加 `TWINKLE_HUB_API_KEY=sk-66l1A3_PPiKS2KlxMh3aew`
2. 新增 Rust 模組，`cargo build` 確認編譯通過
3. 在 browser dev mode 用 `safeInvoke` mock 驗證前端 UI
4. 在 Tauri dev mode（`pnpm tauri dev`）端對端測試真實 API 呼叫
5. 回滾：移除 IPC command 註冊 + 前端 `RealPricePanel` 不渲染，其他代碼不受影響
