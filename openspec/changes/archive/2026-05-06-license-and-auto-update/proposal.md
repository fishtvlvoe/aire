## Why

客戶電腦安裝「不動產 AI 系統」後，需要序號機制防止未授權使用，以及自動更新機制讓 Fish 能遠端推送新版本而不必親赴客戶現場。首次安裝由 Fish 帶隨身碟到場，之後的所有版本升級透過 app 內一鍵更新完成。

## What Changes

- 新增序號激活頁面（`/setup/license`），首次啟動時要求輸入序號 + Email
- 新增 Ed25519 序號簽名驗證機制，綁定主機 + Email，一組序號只能激活一台電腦
- 新增 Next.js Middleware 攔截所有請求，無有效授權則重導至激活頁
- 新增序號產生 CLI 工具（`scripts/generate-license.ts`），Fish 用來為每位客戶產生專屬序號
- 新增 License Server API（`/api/license/activate`、`/api/license/verify`），處理遠端驗證
- 新增 Electron 自動更新模組，啟動時檢查新版本、顯示更新通知、一鍵下載安裝
- 新增更新檔簽署與雜湊驗證，確保下載完整性
- 未授權用戶無法取得更新下載 URL（HTTP 403）

## Non-Goals

- 不做線上付款或訂閱機制（序號由 Fish 手動產生並交付）
- 不做多裝置漫遊（一組序號綁一台電腦，換機需重新授權）
- 不做離線永久使用（需定期連線驗證授權，頻率可設定）

## Capabilities

### New Capabilities

- `license-management`: 本機端序號激活、驗證、Middleware 攔截、快取機制
- `license-server`: 遠端授權伺服器 API——激活綁定、驗證、IP CIDR 限制
- `auto-updater`: Electron 自動更新——版本檢查、下載進度、雜湊驗證、授權檢查

### Modified Capabilities

（無）

## Impact

- Affected specs: `license-management`（已有）、`license-server`（已有）、`auto-updater`（已有）
- Affected code:
  - New: `src/app/setup/license/page.tsx`, `src/lib/license/verify.ts`, `src/lib/license/keygen.ts`, `src/middleware.ts`（授權攔截邏輯）, `scripts/generate-license.ts`, `src/app/api/license/activate/route.ts`, `src/app/api/license/verify/route.ts`, `electron/updater.ts`
  - Modified: `electron/main.ts`（整合 auto-updater）, `package.json`
  - Removed: 無
- Dependencies 新增: `electron-updater`（auto-update 模組）, `tweetnacl`（Ed25519 簽名）
- 環境變數新增: `LICENSE_PUBLIC_KEY`（Ed25519 公鑰）, `UPDATE_SERVER_URL`（更新檔位置）
