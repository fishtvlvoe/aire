## 1. Cloudflare Worker 專案初始化（Worker deployed to aire.opcos.me via Wrangler）

- [x] 1.1 在 `cloudflare-worker/` 建立 `package.json`（`@cloudflare/workers-types`、`typescript`、`wrangler` 依賴，`"type": "module"`，scripts: `dev`, `deploy`），`tsconfig.json`（target ES2022，types: `@cloudflare/workers-types`），實現 Cloudflare Workers TypeScript Worker（不用 Hono）架構決策；確保 `tsc --noEmit` 無錯誤（驗收：`cd cloudflare-worker && npm install && npx tsc --noEmit` 退出碼 0）[Tool: copilot-codex]
- [x] 1.2 建立 `cloudflare-worker/wrangler.toml`：name=`aire-opcos-me`，main=`src/index.ts`，compatibility_date 為今天，`[[kv_namespaces]]` binding=`LICENSES`（KV namespace named LICENSES is bound），id 留佔位 `REPLACE_WITH_KV_ID`，routes: `aire.opcos.me/*`（Worker deployed to aire.opcos.me via Wrangler）；確保 `wrangler dev --dry-run` 不拋出解析錯誤（驗收：dry-run 輸出顯示 Worker 名稱）[Tool: copilot-codex]

## 2. Worker KV 型別與核心邏輯（KV Schema：`license:{license_key}`）

- [x] 2.1 建立 `cloudflare-worker/src/types.ts`，定義 `LicenseRecord { status, device_id?, device_name?, os_version?, activated_at?, valid_until? }` 介面（KV Schema：`license:{license_key}`）與 `Env { LICENSES: KVNamespace }` 介面；確保後續 handler 可無 `any` 型別引用（驗收：TypeScript 編譯無 implicit any 警告）[Tool: copilot-codex]
- [x] 2.2 建立 `cloudflare-worker/src/handlers/activate.ts`，實作 `handleActivate(request, env)` 函式（activate 端點邏輯）：inactive key 首次啟動寫入 device_id+activated_at（First-time activation binds device to license）；active+同 device 冪等回 200（Re-activation by same device is idempotent）；active+不同 device 回 409（Different device returns 409）；不存在/revoked 回 404（Unknown or revoked key returns 404）（驗收：`wrangler dev` 本地對已 put inactive key 執行 activate curl，回 HTTP 200 `{"status":"active","token":"...","valid_until":null}`）[Tool: copilot-codex]
- [x] 2.3 建立 `cloudflare-worker/src/handlers/verify.ts`，實作 `handleVerify(request, env)` 函式（verify 端點邏輯）：active+device 吻合回 200（Verify returns active status for valid device）；active+不同 device 回 403（Device mismatch returns 403）；非 active 或不存在回 404（Non-active license returns 404）（驗收：`wrangler dev` 本地對已啟用 key 執行 verify curl，正確 device 回 HTTP 200）[Tool: copilot-codex]
- [x] 2.4 建立 `cloudflare-worker/src/index.ts`，fetch handler 路由 `POST /api/license/activate` → `handleActivate`、`POST /api/license/verify` → `handleVerify`，其餘路徑回 404（Worker 行為合約 routing 實作，Cloudflare Workers TypeScript Worker 入口）（驗收：`tsc --noEmit` 通過，路由在 local dev 可正常呼叫）[Tool: copilot-codex]

## 3. 本地 wrangler dev 驗收測試（Worker 行為合約驗收）

- [x] 3.1 在 `cloudflare-worker/` 執行 `wrangler dev`，依序執行 Worker 行為合約的四個驗收 curl 指令（inactive key 啟動 → 200；同 device 重啟動 → 200；不同 device → 409；verify 吻合 → 200），記錄每次輸出並確認符合合約（驗收：四個 curl 均得到預期 HTTP 狀態碼與 JSON body，無例外拋出）[Tool: 主對話執行]

## 4. AIRE 生產 URL 注入（OPCOS_API_BASE_URL 生產設定，AIRE 生產 URL 合約）

- [x] 4.1 修改 `src-tauri/build.rs`，在已有的 `fn main()` 內加入：若 `CARGO_PROFILE` 為 `release` 或 `AIRE_RELEASE_BUILD=1`，則 emit `cargo:rustc-env=OPCOS_API_BASE_URL=https://aire.opcos.me`（OPCOS_API_BASE_URL 生產設定，AIRE 生產 URL 合約，OPCOS API base URL points to production server in release build）（驗收：`cargo build --release` 無 build.rs 錯誤；`strings target/release/aire 2>/dev/null | grep aire.opcos.me` 輸出非空）[Tool: copilot-codex]
- [x] 4.2 確認 `cargo test -p aire-tauri 2>&1 | tail -5` 仍然全數通過（196 tests），build.rs 改動不影響測試路徑的 URL 解析（驗收：test 輸出 `test result: ok. N passed; 0 failed`）[Tool: 主對話執行]

## 5. 部署準備與指引（Worker deployed to aire.opcos.me via Wrangler）

- [x] 5.1 在 `cloudflare-worker/DEPLOY.md` 寫出部署 SOP（4 步：`wrangler login`、`wrangler kv:namespace create LICENSES` 取 id 填入 wrangler.toml、`wrangler deploy`、Cloudflare DNS 加 `aire.opcos.me` CNAME）；在 `wrangler.toml` 的 id 欄位旁加 comment 說明需替換（驗收：DEPLOY.md 存在且包含 4 個步驟標題，wrangler.toml 有 comment 提示）[Tool: copilot-codex]
