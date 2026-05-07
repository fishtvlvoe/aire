## 1. 序號系統核心（D1: 序號格式與簽名 + D2: Machine Fingerprint + Ed25519 序號驗證 + Machine Fingerprint 綁定）

- [ ] 1.1 安裝 tweetnacl dependency，建立 src/lib/license/crypto.ts：實作 D1: 序號格式與簽名——Ed25519 序號驗證、Base64url 編碼解碼、RE-AI- 前綴格式 [Tool: copilot-codex]
- [ ] 1.2 建立 src/lib/license/machine-id.ts：實作 D2: Machine Fingerprint——macOS 讀 IOPlatformUUID + Windows 讀 MachineGuid，SHA-256 取前 16 字元，完成 Machine Fingerprint 綁定 [Tool: copilot-codex]
- [ ] 1.3 建立 scripts/generate-license.ts：CLI 工具接收 --company --expires --email 參數，用私鑰簽發 RE-AI- 前綴序號（依 D1: 序號格式與簽名） [Tool: copilot-codex]
- [ ] 1.4 撰寫 Ed25519 序號驗證 + Machine Fingerprint 綁定單元測試 [Tool: sonnet]

## 2. 序號激活頁面（D6: 激活頁面 UI 流程 + 序號激活頁面）

- [ ] 2.1 建立 src/app/setup/license/page.tsx：依 D6: 激活頁面 UI 流程，實作序號激活頁面——序號輸入框 + Email 輸入框 + 激活按鈕，錯誤顯示（序號已被使用、格式錯誤、網路問題） [Tool: copilot-codex]
- [ ] 2.2 建立 src/app/api/license/activate/route.ts：接收序號 + Email → 本機 Ed25519 序號驗證 → 呼叫 License Server 激活 API → 寫入 SQLite licenses 表 [Tool: copilot-codex]

## 3. Middleware 授權攔截（D3: 授權驗證層級 + Middleware 授權攔截）

- [ ] 3.1 修改 src/middleware.ts：依 D3: 授權驗證層級，實作 Middleware 授權攔截——每個請求檢查 SQLite licenses 表、60 秒快取 TTL、無有效授權重導 /setup/license [Tool: copilot-codex]
- [ ] 3.2 實作授權過期偵測（Middleware 授權攔截的過期場景）：expires 日期已過時顯示「授權已過期，請聯繫技術支援續約」 [Tool: copilot-codex]

## 4. License Server（D4: License Server 架構 + Cloudflare Workers + D1 部署 + 激活 API + 驗證 API + 更新檢查 API）

- [ ] 4.1 建立 license-server/ 目錄結構：依 D4: License Server 架構，wrangler.toml + Cloudflare Workers + D1 部署——D1 schema licenses 表（id, license_key, company, email, machine_id, ip, activated_at, expires, revoked）[Tool: copilot-codex]
- [ ] [P] 4.2 實作激活 API（POST /api/license/activate）：驗簽名 → 檢查未激活 → 寫入 D1 → 回 activation token；重複激活回 409 LICENSE_ALREADY_ACTIVATED [Tool: copilot-codex]
- [ ] [P] 4.3 實作驗證 API（POST /api/license/verify）：檢查序號 + machineId + expires → 回 valid/expired/machine_mismatch [Tool: copilot-codex]
- [ ] [P] 4.4 實作更新檢查 API（POST /api/license/check-update）：驗授權 → 比對版本 → 有更新回 R2 signed URL + SHA-256；無授權回 403 [Tool: copilot-codex]
- [ ] 4.5 License Server 激活 API + 驗證 API + 更新檢查 API 單元測試 [Tool: sonnet]

## 5. 自動更新模組（D5: 自動更新機制 + 啟動時自動檢查更新 + 一鍵下載安裝 + 手動檢查更新 + 更新檔存放）

- [ ] 5.1 建立 electron/updater.ts：依 D5: 自動更新機制，整合 electron-updater 實作啟動時自動檢查更新——呼叫 check-update API、顯示更新通知「發現新版本 v{version}」[Tool: copilot-codex]
- [ ] 5.2 實作一鍵下載安裝：下載進度條 + SHA-256 雜湊驗證 + 自動安裝重啟（更新檔存放 R2 signed URL） [Tool: copilot-codex]
- [ ] 5.3 實作手動檢查更新按鈕 + 「已是最新版本」提示 [Tool: copilot-codex]
- [ ] 5.4 實作離線容忍邏輯：啟動時自動檢查更新失敗時靜默通過，允許離線使用最多 7 天 [Tool: copilot-codex]

## 6. 遠端驗證整合（D3: 授權驗證層級的遠端驗證 + 更新檔存放防護）

- [ ] 6.1 實作 D3: 授權驗證層級的 24 小時定期遠端驗證：呼叫 License Server 驗證 API，失敗計數，超過 7 天離線則鎖定 [Tool: copilot-codex]
- [ ] 6.2 未授權下載防護（更新檔存放存取控制）：electron-updater custom provider 只從更新檢查 API 取得 signed URL，無授權則不顯示更新 [Tool: copilot-codex]

## 7. 驗收測試

- [ ] 7.1 E2E 測試序號激活頁面完整流程：首次啟動 → Middleware 授權攔截重導 → 輸入序號 + Email → 激活 API 成功 → 進入主畫面 [Tool: sonnet]
- [ ] 7.2 E2E 測試啟動時自動檢查更新 + 一鍵下載安裝：已激活用戶啟動 → 發現新版本 → 一鍵更新 → 重啟後版本正確 [Tool: sonnet]
- [ ] 7.3 邊界測試 Ed25519 序號驗證 + Machine Fingerprint 綁定 + Middleware 授權攔截：無效序號、過期序號、machineId 不匹配、網路中斷各情境 [Tool: sonnet]
