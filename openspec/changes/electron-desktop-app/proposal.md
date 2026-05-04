## Why

系統目前只能透過 Terminal 啟動，客戶是房仲業務員不懂技術操作。需要打包成桌面應用，讓客戶像用一般軟體一樣雙擊就開、一鍵更新。同時需要 License 保護防止盜用、功能權限控管支援加購模式、以及 Codex CLI 整合讓 AI 功能正常運作。

## What Changes

- 新增 Electron 外殼打包（純 Electron，不用 Docker），產出 Win .exe + Mac .app 安裝檔
- 新增首次安裝精靈（License 輸入 → OpenAI 授權 → 完成）
- 新增一鍵啟動（雙擊 icon → 自動啟動 Next.js → 開瀏覽器）
- 新增 License 驗證機制（Server 端驗證，綁定 Email + IP 段，斷網鎖住）
- 新增功能模組開關（管理員遠端控制，客戶看不到被鎖的功能）
- 新增自動更新機制（啟動時自動檢查 + 手動「檢查更新」按鈕並存）
- 新增 Codex CLI 打包進 App（客戶不需另外安裝）
- 新增程式碼混淆（build 時自動混淆防翻看）
- 修改 LLM 後端：客戶版鎖定 Codex、開發版可切換 Claude/Gemini/Codex
- 清除硬寫名稱（「老魚」等），改為可設定欄位
- 系統名稱統一為「AI 不動產說明書系統」
- 客戶需自行訂閱 ChatGPT Plus ($20/月)，AI 費用歸客戶

## Non-Goals

- 不使用 Docker（純 Electron 打包）
- 不做雲端版本（純本機安裝）
- 不代客戶付 AI 費用（客戶自付 OpenAI）
- 不做硬體指紋綁定（用 Email + IP 段代替）
- 不做離線 AI 功能（LLM 呼叫需要網路）
- 不做多用戶管理（每台機器一個帳號）

## Capabilities

### New Capabilities

- `electron-packaging`: Electron 打包配置，含 Next.js standalone 整合、Chromium 共用、multi-platform build（Win/Mac）、安裝精靈
- `desktop-launcher`: 桌面啟動器，含一鍵啟動 Next.js server、自動開瀏覽器、啟動畫面顯示
- `license-server`: License Server 端驗證 API，含啟用/驗證/過期檢查、Email + IP 段綁定、斷網鎖定策略
- `feature-toggle`: 功能模組開關系統，含管理員面板、遠端同步、客戶端功能隱藏（選單不顯示 + 路由攔截 + API 拒絕）
- `auto-updater`: 自動更新機制，含啟動時自動檢查 + 手動按鈕、GitHub Actions 打包上傳 R2、Server 驗 License 後回傳 R2 簽名下載連結
- `codex-integration`: Codex CLI 打包與首次授權流程，含 OAuth 一鍵登入 OpenAI 或手動貼 API Key、客戶版鎖定 Codex
- `developer-settings`: 開發者設定面板，含 LLM 後端切換（Claude/Gemini/Codex）、參數調整、Debug 模式、環境變數區分版本

### Modified Capabilities

- `license-management`: 現有 License 驗證改為 Server 端判定（原為本機 Ed25519 驗證），新增 IP 段檢查欄位
- `user-auth`: 登入流程新增 License 有效性前置檢查，License 無效時攔截在登入前
- `llm-backend-adapter`: 新增環境判斷邏輯，客戶版自動鎖定 Codex adapter、隱藏切換選項

## Impact

- Affected specs: license-management, user-auth, llm-backend-adapter（修改）；electron-packaging, desktop-launcher, license-server, feature-toggle, auto-updater, codex-integration, developer-settings（新建）
- Affected code:
  - New: `electron/`（Electron 主程序目錄）, `electron/main.ts`, `electron/preload.ts`, `electron/updater.ts`, `electron/launcher.ts`, `src/app/setup/page.tsx`（首次設定精靈）, `src/app/admin/features/page.tsx`（管理員功能面板）, `src/app/api/features/route.ts`, `src/middleware.ts`（功能攔截）, `.github/workflows/release.yml`（CI 打包上傳 R2）, `server/`（Vercel Server API：license + features + updates）
  - Modified: `src/lib/codex-client/adapters/`（加環境鎖定邏輯）, `next.config.ts`（output: standalone）, `package.json`（加 electron-builder 設定）
  - Removed: 無
- Dependencies 新增: electron, electron-builder, electron-updater, @aws-sdk/client-s3（R2 上傳用）, javascript-obfuscator
- 環境變數新增: `NEXT_PUBLIC_APP_MODE`（production/development）, `LICENSE_SERVER_URL`, `R2_RELEASES_PREFIX`
