## Context

「不動產 AI 系統」將以 Electron 桌面應用交付給房仲客戶。Fish 帶隨身碟到客戶辦公室安裝，每位客戶拿到一組專屬序號。安裝後系統需要：(1) 驗證序號合法性並綁定該台電腦 + Email；(2) 定期連線驗證授權仍有效；(3) 有新版本時通知客戶一鍵更新。

已有三份 spec 定義了需求框架：`license-management`、`license-server`、`auto-updater`。本 design 決定具體實作方式。

## Goals / Non-Goals

**Goals:**

- 序號激活：首次啟動 → 輸入序號 + Email → 綁定主機 fingerprint + Email → 開始使用
- 授權驗證：每次啟動 + 每 24 小時連線驗證一次，驗證失敗則限制使用
- 序號產生：Fish 用 CLI 工具為每位客戶產生序號（`--company "XX房仲" --expires 2027-12-31 --email client@example.com`）
- 自動更新：啟動時檢查 → 有新版 → 顯示更新通知 → 一鍵下載安裝 → 重啟
- 未授權用戶無法取得更新包（防盜版散播更新檔）

**Non-Goals:**

- 不做線上付款/訂閱（Fish 手動發序號）
- 不做多裝置漫遊（一序號一機器）
- 不做 License Server 獨立部署（首版用 Cloudflare Workers 或內嵌在 app 內的 API）
- 不做 app 內購買或升級方案

## Decisions

### D1: 序號格式與簽名

採用 Ed25519 非對稱簽名：

- **序號內容**（JSON）：`{ company, email, expires (ISO8601), machineId (激活後綁定), version: 1 }`
- **序號格式**：`RE-AI-` + Base64url(payload) + `.` + Base64url(signature)
- **驗證流程**：用公鑰驗簽名 → 檢查 expires → 檢查 machineId 是否匹配當前主機
- **私鑰**：只存在 Fish 的開發機，不進 git、不進 app 包
- **公鑰**：內嵌在 app 代碼中，用於本機驗證

### D2: Machine Fingerprint

用以下組合生成主機指紋（防換機使用同一序號）：

- macOS：`IOPlatformUUID`（透過 `ioreg` 命令）
- Windows：`MachineGuid`（透過 registry）
- 雜湊方式：SHA-256(platform + uuid) 取前 16 字元

### D3: 授權驗證層級

採雙層驗證（本機 + 遠端）：

- **本機驗證**（每次請求）：Next.js Middleware 檢查 SQLite `licenses` 表的序號簽名 + 過期日 + machineId，結果快取 60 秒
- **遠端驗證**（每 24 小時）：呼叫 License Server API 確認序號未被撤銷、IP 在允許範圍
- **離線容忍**：若無法連線遠端伺服器，允許離線使用最多 7 天（上次成功驗證後算起），超過則顯示「請連接網路驗證授權」

### D4: License Server 架構

首版用 **Cloudflare Workers + D1 SQLite**（免費額度足夠）：

- `POST /api/license/activate`：接收序號 + Email + machineId → 綁定 → 回傳 activation token
- `POST /api/license/verify`：接收序號 + machineId → 檢查狀態 → 回傳 valid/expired/revoked
- `POST /api/license/check-update`：接收序號 + 當前版本 → 若授權有效且有新版 → 回傳簽署的下載 URL

### D5: 自動更新機制

使用 `electron-updater` + 自訂 Provider：

- 更新檔存放：Cloudflare R2（搭配 D4 的 Workers 做授權檢查後才給 signed URL）
- 更新流程：`electron-updater` 啟動時呼叫 License Server → 確認授權 + 查有無新版 → 有則回傳 R2 signed URL → 下載 → 驗 SHA-256 → 安裝 → 重啟
- 更新檔格式：macOS `.zip`（electron-updater 標準格式）、Windows `.exe`（NSIS）

### D6: 激活頁面 UI 流程

```
啟動 app
    │
    ▼
Middleware 檢查 licenses 表
    │
    ├─ 有有效序號 → 正常使用
    │
    └─ 無序號 → 重導 /setup/license
                    │
                    ▼
              輸入序號 + Email
                    │
                    ▼
              本機驗簽名 + 呼叫 Server activate
                    │
                    ├─ 成功 → 寫入 SQLite → 重導 /login
                    └─ 失敗 → 顯示錯誤（序號無效/已被使用/網路問題）
```

## Risks / Trade-offs

| 風險 | 影響 | 對策 |
|------|------|------|
| License Server 掛掉 | 新激活無法完成 | 7 天離線容忍 + Cloudflare Workers 99.9% SLA |
| 客戶換電腦 | 舊序號綁舊機器 | Fish 在 Server 後台重置 machineId 綁定 |
| 客戶忘記 Email | 無法重新激活 | 序號產生時記錄在 Fish 的管理表，可查詢 |
| R2 費用 | 更新檔下載流量 | 免費額度 10GB/月，客戶量小足夠；大量則加 CDN |
| machineId 被偽造 | 繞過綁定限制 | Ed25519 簽名 + 遠端驗證雙重防線，偽造成本極高 |
