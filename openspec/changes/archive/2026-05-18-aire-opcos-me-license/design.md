## Context

AIRE 桌面 app 的 `src-tauri/src/opcos.rs` 已有完整的 `activate_license` 和 `verify_license` HTTP 呼叫端，但目標伺服器 `OPCOS_API_BASE_URL` 仍指向佔位 URL `https://opcos.example.com`。現在需要建立真正的授權服務，讓 AIRE 可以完成完整的序號啟用流程。

Cloudflare Workers + KV 已選定為後端平台（無需管理伺服器，邊緣部署延遲低，KV 適合 read-heavy 的授權驗證）。`wrangler` 4.83.0 已安裝在 `/opt/homebrew/bin/wrangler`。

Worker 源碼放在 AIRE repo 的 `cloudflare-worker/` 目錄，獨立部署不影響 Tauri build。

## Goals / Non-Goals

**Goals:**
- 在 `https://aire.opcos.me` 提供 `POST /api/license/activate` 和 `POST /api/license/verify`
- 以 KV 實作 device_id 鎖定（一個序號只能綁定一台機器）
- 更新 AIRE 生產設定，讓 `OPCOS_API_BASE_URL` 在 release build 時指向 `https://aire.opcos.me`

**Non-Goals:**
- 不做 JWT 簽發（`token` 欄位暫時回傳 license_key 本身，MVP 可用）
- 不建管理後台（序號由 `wrangler kv:key put` 預載）
- 不改動 `opcos.rs` 的呼叫邏輯

## Decisions

### Cloudflare Workers TypeScript Worker（不用 Hono）

直接用 Workers native fetch handler + `itty-router`（輕量，無額外依賴）。避免引入 Hono 等 framework 增加冷啟動開銷。

Alternative: Hono → 過重，KV 操作 2 個路由不需 framework。

### KV Schema：`license:{license_key}`

```ts
interface LicenseRecord {
  status: "inactive" | "active" | "revoked";
  device_id?: string;       // 啟用後綁定
  device_name?: string;
  os_version?: string;
  activated_at?: string;    // ISO 8601
  valid_until?: string;     // ISO 8601，null = 永久
}
```

預載未使用序號：`{ status: "inactive" }`

### activate 端點邏輯

```
GET KV[license:{key}]
→ 不存在 / status=revoked → 404 {"error":"invalid_license"}
→ status=active AND device_id≠請求 device_id → 409 {"error":"device_locked"}
→ status=active AND device_id=請求 device_id → 200 (冪等重啟動)
→ status=inactive → 寫入 device_id, device_name, os_version, activated_at, status=active → 200
```

回傳（成功）：
```json
{ "status": "active", "token": "<license_key>", "valid_until": null }
```

### verify 端點邏輯

```
GET KV[license:{key}]
→ 不存在 / status≠active → 404 {"error":"invalid_license"}
→ device_id≠請求 device_id → 403 {"error":"device_mismatch"}
→ 吻合 → 200
```

回傳（成功）：
```json
{ "status": "active", "valid_until": null, "last_verified_at": "<now ISO>" }
```

### OPCOS_API_BASE_URL 生產設定

`tauri.conf.json` 的 `env` 區塊目前不支援 build-time 環境變數注入；改用 `src-tauri/build.rs` 在 release build 時把 `OPCOS_API_BASE_URL` 設為 `https://aire.opcos.me`，dev build 維持 `.env` 覆寫（空 = opcos.rs 的 DEFAULT_BASE_URL）。

Alternative: 改 DEFAULT_BASE_URL 常數 → 讓測試更難隔離，放棄。

## Implementation Contract

### Worker 行為合約

**activate（`POST /api/license/activate`）**

Input: `{ "license_key": string, "device_id": string, "device_name": string, "os_version": string }`

Observable outcomes:
- 序號不存在或已撤銷 → HTTP 404 `{"error":"invalid_license"}`
- 序號已被不同 device_id 佔用 → HTTP 409 `{"error":"device_locked"}`
- 序號未使用 → HTTP 200 `{"status":"active","token":"<license_key>","valid_until":null}`，KV 寫入 device_id + status=active
- 同一 device_id 重複啟動 → HTTP 200（冪等），KV 不重複寫

**verify（`POST /api/license/verify`）**

Input: `{ "license_key": string, "device_id": string }`

Observable outcomes:
- 序號不存在或 status≠active → HTTP 404 `{"error":"invalid_license"}`
- device_id 不吻合 → HTTP 403 `{"error":"device_mismatch"}`
- 吻合 → HTTP 200 `{"status":"active","valid_until":null,"last_verified_at":"<ISO timestamp>"}`

**驗收測試**（`wrangler dev` 本地跑）：
```bash
# 預載測試序號
wrangler kv key put --binding LICENSES "license:TEST-KEY-001" '{"status":"inactive"}'

# 啟用
curl -s -X POST http://localhost:8787/api/license/activate \
  -H 'Content-Type: application/json' \
  -d '{"license_key":"TEST-KEY-001","device_id":"dev-001","device_name":"MacBook","os_version":"14.0"}' \
  | jq .  # 預期 {"status":"active","token":"TEST-KEY-001","valid_until":null}

# 驗證
curl -s -X POST http://localhost:8787/api/license/verify \
  -H 'Content-Type: application/json' \
  -d '{"license_key":"TEST-KEY-001","device_id":"dev-001"}' \
  | jq .  # 預期 {"status":"active","valid_until":null,"last_verified_at":"..."}

# 重複 device 409
curl -s -X POST http://localhost:8787/api/license/activate \
  -H 'Content-Type: application/json' \
  -d '{"license_key":"TEST-KEY-001","device_id":"other-device","device_name":"X","os_version":"14"}' \
  | jq .  # 預期 {"error":"device_locked"}
```

### AIRE 生產 URL 合約

`src-tauri/build.rs` 在 `AIRE_RELEASE_BUILD=1` 或 `CARGO_PROFILE_RELEASE` 環境下，呼叫 `println!("cargo:rustc-env=OPCOS_API_BASE_URL=https://aire.opcos.me")`，使 `opcos.rs` 的 `std::env::var("OPCOS_API_BASE_URL")` 在 release build 時解到 `https://aire.opcos.me`。

驗收：`cargo build --release` 後 `strings target/release/aire | grep opcos.me` 應有輸出。

## Risks / Trade-offs

- [Risk] KV eventual consistency（~1s 延遲）→ 首次啟動後立即 verify 可能暫時 404 → Mitigation: AIRE 在 activate 成功後先顯示成功畫面，verify 失敗時做 retry（3 次，500ms 間隔，已在 opcos.rs 有 timeout 設定）
- [Risk] Wrangler 需要 Cloudflare 帳號登入 → Mitigation: Fish 手動執行 `wrangler login` + `wrangler deploy`，CI/CD 留待後續
- [Risk] `aire.opcos.me` DNS 需要 Fish 在 Cloudflare 設定 CNAME → Mitigation: wrangler.toml 設定 `routes`，部署後提醒 Fish 加 DNS 記錄

## Migration Plan

1. `wrangler login`（Fish 手動）
2. `wrangler kv:namespace create LICENSES` → 取得 namespace id
3. 填入 wrangler.toml
4. `wrangler dev` 本地測試（驗收測試通過）
5. `wrangler deploy`
6. Fish 設定 `aire.opcos.me` DNS CNAME 指向 workers.dev 網域
7. `cargo build --release` 驗證 URL 注入正確
8. AIRE 裝在測試機，走完啟用流程

Rollback：Wrangler 支援 `wrangler rollback`，5 分鐘內可還原。

## Open Questions

- `valid_until`：MVP 回傳 `null`（永久授權）。未來若要加期限，改 KV schema 即可，不影響合約。
- 序號格式驗證：Worker 層不做格式強制（任意字串均可），讓上層（license serial generator）負責。
