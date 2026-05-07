## ADDED Requirements

### Requirement: 激活 API

License Server SHALL 提供 `POST /api/license/activate` 端點，接收序號 + Email + machineId，綁定授權。

#### Scenario: 首次激活成功

- **WHEN** 收到有效序號 + Email + machineId，且該序號尚未被激活
- **THEN** 在 D1 資料庫寫入激活紀錄（序號、Email、machineId、IP、激活時間）→ 回傳 HTTP 200 + activation token

#### Scenario: 重複激活

- **WHEN** 收到已被另一台機器激活的序號
- **THEN** 回傳 HTTP 409 + `{ error: "LICENSE_ALREADY_ACTIVATED" }`

#### Scenario: 無效序號格式

- **WHEN** 收到格式不符 `RE-AI-` 前綴或簽名驗證失敗的序號
- **THEN** 回傳 HTTP 400 + `{ error: "INVALID_LICENSE_KEY" }`

### Requirement: 驗證 API

License Server SHALL 提供 `POST /api/license/verify` 端點，檢查授權狀態。

#### Scenario: 授權有效

- **WHEN** 序號未過期且 machineId 匹配
- **THEN** 回傳 HTTP 200 + `{ status: "valid", expires: "2027-12-31T23:59:59+08:00" }`

#### Scenario: 授權過期

- **WHEN** 序號的 expires 日期已過
- **THEN** 回傳 HTTP 403 + `{ error: "LICENSE_EXPIRED" }`

#### Scenario: machineId 不匹配

- **WHEN** 請求的 machineId 與激活時綁定的不同
- **THEN** 回傳 HTTP 403 + `{ error: "MACHINE_MISMATCH" }`

### Requirement: 更新檢查 API

License Server SHALL 提供 `POST /api/license/check-update` 端點，授權有效時回傳更新資訊。

#### Scenario: 有新版本且授權有效

- **WHEN** 授權有效且伺服器有比客戶端更新的版本
- **THEN** 回傳 HTTP 200 + `{ available: true, version: "1.2.0", downloadUrl: "<R2 signed URL>", sha256: "<hash>" }`

#### Scenario: 已是最新版

- **WHEN** 客戶端版本等於或大於伺服器最新版
- **THEN** 回傳 HTTP 200 + `{ available: false }`

#### Scenario: 授權無效時檢查更新

- **WHEN** 序號無效或已過期
- **THEN** 回傳 HTTP 403 + `{ error: "LICENSE_INVALID" }`

### Requirement: Cloudflare Workers + D1 部署

License Server SHALL 部署在 Cloudflare Workers，資料存放在 D1 SQLite。

#### Scenario: D1 Schema

- **WHEN** License Server 部署
- **THEN** D1 包含 `licenses` 表：`id, license_key, company, email, machine_id, ip, activated_at, expires, revoked`
