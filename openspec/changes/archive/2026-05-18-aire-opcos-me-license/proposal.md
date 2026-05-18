## Why

AIRE 桌面 app 需要序號啟用與機器鎖定功能方可交付客戶。目前 `src-tauri/src/opcos.rs` 已有 `activate_license` / `verify_license` 兩個呼叫端，但目標伺服器 `OPCOS_API_BASE_URL` 仍指向佔位 URL `https://opcos.example.com`。需在 `aire.opcos.me` 建立正式授權服務，使 AIRE 可完成完整啟用流程（序號 → 機器 ID 鎖定 → 有效期驗證）。

## What Changes

1. 在 Cloudflare Workers 建立 `aire-opcos-me-worker`，提供兩個端點：
   - `POST /api/license/activate` — 序號首次啟用，將序號與 device_id 綁定
   - `POST /api/license/verify` — 查詢啟用狀態，驗證 device_id 是否吻合
2. 使用 Cloudflare KV 儲存序號記錄，key 為 `license:{license_key}`
3. 更新 AIRE `src-tauri/tauri.conf.json` 的 `OPCOS_API_BASE_URL` 生產設定，指向 `https://aire.opcos.me`
4. 在 Wrangler 設定中加入 DNS 與 KV namespace 綁定

## Non-Goals

- 不建管理後台（序號由 KV 手動匯入或透過 Wrangler CLI 預載）
- 不實作 JWT 簽發（`activate` 回傳 `token` 欄位暫時回傳 license_key 本身，未來再換 JWT）
- 不處理序號刪除或重置（超出 MVP 範圍）
- 不改動 AIRE 的授權驗證邏輯（opcos.rs 已實作）

## Capabilities

### New Capabilities

- `license-worker-activate`: 序號啟用端點，首次啟用將 device_id 寫入 KV；若已被其他 device_id 佔用則回 409
- `license-worker-verify`: 序號驗證端點，確認序號狀態與 device_id 吻合；不吻合回 403
- `license-worker-deploy`: Wrangler 部署設定，含 KV namespace 與自訂網域 `aire.opcos.me`

### Modified Capabilities

- `license-activation`: 更新 AIRE Tauri 生產環境 `OPCOS_API_BASE_URL`，指向真實伺服器

## Impact

- Affected specs: license-worker-activate, license-worker-verify, license-worker-deploy, license-activation
- Affected code:
  - New: cloudflare-worker/wrangler.toml
  - New: cloudflare-worker/src/index.ts
  - New: cloudflare-worker/src/handlers/activate.ts
  - New: cloudflare-worker/src/handlers/verify.ts
  - New: cloudflare-worker/src/types.ts
  - New: cloudflare-worker/package.json
  - New: cloudflare-worker/tsconfig.json
  - Modified: src-tauri/tauri.conf.json
