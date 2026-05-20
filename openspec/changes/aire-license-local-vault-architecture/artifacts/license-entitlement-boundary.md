# License / Entitlement / Local Vault Boundary

日期：2026-05-20

目的：把 AIRE MVP 的授權、裝置綁定、方案權限、最小使用紀錄與本機資料邊界寫成可實作合約。後續接 `aire.opcos.me`、金流或正式 entitlement API 時，以本文件為資料欄位白名單。

## Phase 1 UI 決策

Phase 1 使用完整 Tauri App。

- UI 在 Tauri window 內執行。
- 客戶沒有可分享的公開 URL。
- 不採用 public PWA 作為第一版。
- 若未來改 localhost UI，必須只綁 `127.0.0.1`，並加短效 session token；LAN IP、手機、其他電腦不得開啟。

現有對應：

- `src-tauri/src/lib.rs` 已註冊 Tauri IPC。
- `src/components/case-wizard/*` 是本機 App 內的案件流程。
- `src/app/(dashboard)/cases/[id]/preview/page.tsx` 只作本機/開發預覽入口，不是產品公開分享頁。

## 授權啟用與驗證 Payload 白名單

### activate

客戶端可送到 AIRE Cloud / OPCOS 的欄位：

| 欄位 | 來源 | 是否允許 | 備註 |
| --- | --- | --- | --- |
| `license_key` / `serialKey` | 使用者輸入序號 | 是 | 不含案件資訊 |
| `device_id` | 本機產生 UUID 或裝置指紋 | 是 | 綁定授權座席 |
| `device_name` | OS/架構摘要 | 是 | 例如 macOS arm64，不含客戶案件 |
| `os_version` | OS/架構摘要 | 是 | 用於支援與相容性 |
| `app_version` | App 版本 | 是 | 後端可做更新政策 |

現有對應：

- Rust：`src-tauri/src/opcos.rs` 的 `ActivateReq` 只送 `license_key`、`device_id`、`device_name`、`os_version`。
- Rust：`src-tauri/src/commands/license.rs` 產生/讀取 `device_id` 並呼叫 OPCOS。
- Next dev mock：`src/app/api/v1/licenses/activate/route.ts` 只接 `serialKey`、`deviceId`。

### verify

客戶端可送到 AIRE Cloud / OPCOS 的欄位：

| 欄位 | 來源 | 是否允許 | 備註 |
| --- | --- | --- | --- |
| `license_key` | OS keychain | 是 | 不放 SQLite settings |
| `device_id` | 本機 settings | 是 | 綁定裝置 |
| `app_version` | App 版本 | 是 | 可選 |

現有對應：

- Rust：`src-tauri/src/opcos.rs` 的 `VerifyReq` 只送 `license_key`、`device_id`。
- Rust：`src-tauri/src/commands/license.rs` 從 Keychain 讀 `license_key`。

## 禁止上傳欄位

授權、驗證、最小使用紀錄都不得包含：

- 案件地址
- 地段、地號、建號
- 所有權人、共有人、權利人姓名
- 謄本 payload 或 PDF 檔
- 上傳圖片、地籍圖、格局圖、外觀照片
- 產出的不動產說明書 HTML / PDF 內容
- 現場調查答案與手寫補件內容

如果未來 log 或 telemetry 要新增欄位，必須先加到本文件的白名單。

## 本機儲存邊界

| 資料 | 儲存位置 | 雲端是否保存 | 現有對應 |
| --- | --- | --- | --- |
| `license_key` | OS Keychain | 否，雲端只保存授權記錄 | `src-tauri/src/secrets.rs` |
| `license_token` | OS Keychain | 後端簽發，客戶端本機保存 | `src-tauri/src/secrets.rs` |
| `device_id` | SQLite settings | 雲端保存 hash/識別記錄 | `commands/license.rs` |
| `license_status` | SQLite settings | 是，後端權威 | `commands/license.rs` |
| 案件資料 | 本機 SQLite | 否 | `cases` / `disclosure_drafts` |
| 謄本 payload | 本機 SQLite cases.land_registry_data | 否 | migration `012_registry_payloads.sql` |
| 圖片資產 | 本機 asset path + SQLite metadata | 否 | `case_assets` |
| PDF 輸出 | 使用者選擇本機路徑 | 否 | `export_pdf` |

## 本機加密狀態

現有基礎：

- `src-tauri/src/secrets.rs` 已用 OS Keychain 保存敏感授權資料。
- `src-tauri/src/db/settings.rs` 對 `license_key`、`license_token`、`land_registry_api_key` 做 reserved key 防寫入，避免把秘密塞進一般 settings。
- `src-tauri/src/db/mod.rs` 已有 `open_encrypted_connection`、`open_with_master_password` 與 `keystore.json` 流程。
- `src-tauri/migrations/004_master_password_rekey.rs` 已有 master password / SQLCipher rekey 遷移流程。

仍需注意：

- 目前一般 `init_db(path)` 仍是普通 SQLite 開啟流程。
- 付費上線前要確認正式 App 啟動路徑使用 encrypted DB，而不是只在測試/遷移函式中存在。

## 裝置綁定與轉移

MVP 規則：

- 一個 paid seat 綁定一台電腦。
- 多台電腦要多買 seat。
- 客戶端啟用時送 `license_key + device_id`。
- 後端若回 `409` / `ALREADY_ACTIVATED_OTHER_DEVICE`，客戶端顯示需客服或授權轉移。
- 自助轉移預設一個月一次；超過頻率改 Line / Email 客服人工審核。

現有對應：

- `commands/license.rs` 已把 409 轉成 `ALREADY_ACTIVATED_OTHER_DEVICE`。
- `app/api/v1/licenses/activate/license-activation.ts` 已在 MVP/dev route 內檢查 `serialKey + deviceId`：
  - 缺序號回 `MISSING_KEY`。
  - 缺裝置回 `MISSING_DEVICE`。
  - 同一序號只能重複啟用同一裝置。
  - 同一序號換另一台裝置回 `ALREADY_ACTIVATED_OTHER_DEVICE`。
- `components/settings/LicenseSection.tsx` 已把 `ALREADY_ACTIVATED_OTHER_DEVICE` 顯示成客服/授權轉移提示。

未完成：

- 正式 SaaS entitlement 後端仍需實作 server-side seat table 與 transfer audit。

## IP 政策

預設不綁定 IP。

- IP 只作 enterprise allowlist，可選開啟。
- 一般客戶更換 ISP、VPN、手機熱點或公司動態 IP，不應只因 IP 變動被擋。
- 標準授權靠 device binding + license revalidation。

## Entitlement Payload

正式後端回傳建議：

```json
{
  "license_status": "active",
  "account_email": "customer@example.com",
  "seat_id": "seat_123",
  "device_id": "local-device-id",
  "plan": "basic",
  "features": {
    "registry_pull": true,
    "manual_completion": true,
    "draft_pdf_export": true,
    "real_price": false,
    "nearby_market": false,
    "location_map": false,
    "cadastral_map": false,
    "aerial_photo": false,
    "street_view_reference": false,
    "floor_plan_processing": false,
    "formal_supplement": false
  },
  "offline_grace_until": "2026-05-27T00:00:00+08:00",
  "app_update_policy": "allowed"
}
```

## Plan Feature Map

| 功能 | Basic | Pro | Advanced |
| --- | --- | --- | --- |
| 地政謄本調閱 / 保存 / 預覽 | 是 | 是 | 是 |
| 手動補齊資料 | 是 | 是 | 是 |
| 草稿與 PDF 匯出 | 是 | 是 | 是 |
| 手動上傳圖片 | 是 | 是 | 是 |
| 實價登錄 | 否 | 是 | 是 |
| 周邊行情 | 否 | 是 | 是 |
| 位置圖 / 周邊圖自動產生 | 否 | 是 | 是 |
| 地籍圖 | 否 | 是 | 是 |
| 空拍圖 | 否 | 否 | 是 |
| 街景 / 外觀參考 | 否 | 否 | 是 |
| 格局圖處理 | 否 | 否 | 是 |
| 104 / 社群 / DM / 591 行銷模組 | 否 | 否 | 是，且不阻擋不動產說明書 MVP |

## 最小使用紀錄白名單

允許雲端最小紀錄：

| 欄位 | 用途 |
| --- | --- |
| `account_id` / email | 帳務與支援 |
| `license_id` | 授權查詢 |
| `seat_id` | 座席管理 |
| `device_id` 或 hash | 裝置綁定 |
| `plan` | 功能開關 |
| `last_license_check_at` | 離線寬限 |
| `app_version` | 更新相容性 |
| `feature_usage_count` | 只記功能名與次數，不記案件內容 |

禁止記錄地址、地號、所有權人、謄本內容、PDF 內容。

現有前端 log 白名單：

- `src/lib/log.ts` 只允許 `case_id`、`device_id`、`output_path`、`reason`。
- 若要上傳雲端 telemetry，需再縮小：`case_id`、`output_path` 不得上傳雲端，只能留本機 operation log。

## aire.opcos.me MVP 範圍

`aire.opcos.me` 先做 AIRE 單產品入口，不等待完整 opcOS hub。

必要頁面：

- pricing
- download
- checkout / license activation
- account email / password
- support / Line / Email
- privacy / local data statement

可延後：

- opcOS 全產品 launcher
- 多產品統一 billing hub
- 跨產品團隊管理

## 後續實作缺口

1. 正式 entitlement API：目前 Rust client 有 `/api/license/activate`、`/api/license/verify`，但 SaaS 後端尚未在本 repo 完整實作。
2. 方案權限：目前仍有 `premium-unlock`、`premium_real_price_enabled` 等 mock / dev feature flags；要改成 `plan + features` 權威來源。
3. 正式 encrypted DB 啟動路徑：需確認 production app 使用 master password / SQLCipher 開 DB。
4. device transfer：需要後端 transfer audit table 與客服流程。
