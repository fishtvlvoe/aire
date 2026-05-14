## 0. Phase 0 — 底盤建置（Supastarter + Zeabur）

> Design: D1: 底盤部署平台選擇 Zeabur / D3: Auth 遷移使用 Better-Auth / D4: DB 層遷移使用 Drizzle ORM / D6: 遷移順序採漸進式，不一次全搬

- [ ] 0.1 在 Zeabur 建立 AIRE 專案（D1: 底盤部署平台選擇 Zeabur），部署 Supastarter Next.js 應用，確認可透過公開 URL 存取登入頁面。驗證：`curl -s <zeabur-url>/login` 回傳 HTTP 200 [Tool: copilot] (Unified Backend Connection)
- [ ] 0.2 在 Zeabur 上建立 PostgreSQL 資料庫，設定 DATABASE_URL 環境變數，執行 Drizzle migration 建立 Supastarter 預設 schema（D4: DB 層遷移使用 Drizzle ORM）。驗證：`drizzle-kit push` 成功，透過 psql 確認 user/organization 表存在 [Tool: copilot] (Drizzle ORM Data Layer)
- [ ] 0.3 設定 Better-Auth（D3: Auth 遷移使用 Better-Auth），建立第一個管理員帳號，測試 Email + Password 登入成功。驗證：登入後能看到 Supastarter dashboard [Tool: copilot] (Better-Auth Integration)
- [ ] 0.4 設定 Cloudflare R2 bucket 連線到 Zeabur 後端（複用 AIRE 現有的 R2 設定），上傳一張測試圖片確認讀寫正常。驗證：`curl <R2_PUBLIC_URL>/test.png` 回傳 HTTP 200 [Tool: copilot] (Unified Backend Connection)
- [ ] 0.5 設定自訂域名（如 api.aire.tw）指向 Zeabur，設定 HTTPS。驗證：`curl -s https://api.aire.tw/api/health` 回傳 200 [Tool: copilot] (Unified Backend Connection)

## 1. Phase 1 — License Server 遷移

> Design: D5: License 系統整合 Supastarter 計費模組 / D6: 遷移順序採漸進式，不一次全搬

- [ ] 1.1 將現有 license-server/ 的 License 驗證邏輯（activate、verify、transfer）移植到 Supastarter 後端的 API route，使用 Drizzle ORM 操作 PostgreSQL（D5: License 系統整合 Supastarter 計費模組）。驗證：新 API `/api/license/activate` 接受序號 + machine ID，回傳 activation 成功 [Tool: sonnet] (License Verification via Unified Backend)
- [ ] 1.2 將 License 序號產生器整合到 Supastarter admin dashboard（D5: License 系統整合 Supastarter 計費模組），管理員可在後台產生新序號。驗證：登入 admin → 建立序號 → 序號存入 DB 並可用於 activate [Tool: copilot] (License Billing Integration)
- [ ] 1.3 實作 License 計費整合：Stripe webhook 收到付款成功後自動產生序號並寄 email（D5: License 系統整合 Supastarter 計費模組）。驗證：Stripe test mode 模擬付款 → webhook 觸發 → 序號 email 寄出 [Tool: sonnet] (License Billing Integration)
- [ ] 1.4 修改 AIRE 桌面版的 License 驗證 URL，從 Vercel license server 改為 Zeabur 後端。驗證：AIRE App 啟動時 License 驗證走 `https://api.aire.tw/api/license/verify`，回傳正確狀態 [Tool: copilot] (License Verification via Unified Backend)
- [ ] 1.5 驗證 License grace period：斷網狀態下 AIRE App 仍可使用 7 天（行為契約：Phase 1 完成後 AIRE App 的 License 驗證改走 Zeabur 後端）。驗證：斷網後啟動 App，確認 offline 模式正常，超過 7 天後顯示需連線提示 [Tool: sonnet] (License Verification via Unified Backend)

## 2. Phase 2 — AIRE Web 版 Auth/DB 遷移

> Design: D3: Auth 遷移使用 Better-Auth / D4: DB 層遷移使用 Drizzle ORM / D6: 遷移順序採漸進式，不一次全搬

- [ ] [P] 2.1 將 AIRE 的 NextAuth 登入邏輯替換為 Better-Auth client SDK（D3: Auth 遷移使用 Better-Auth），包含 login/logout/session 管理。驗證：Web 版透過 Better-Auth 登入成功，session 持久化正常 [Tool: sonnet] (Better-Auth Integration)
- [ ] [P] 2.2 將 AIRE 的 better-sqlite3 原始 SQL 查詢改為 Drizzle ORM（D4: DB 層遷移使用 Drizzle ORM），定義 Drizzle schema 對應現有資料表（listings、users、documents）。驗證：`npm run test` 全綠，所有 CRUD 操作透過 Drizzle 正常運作 [Tool: sonnet] (Drizzle ORM Data Layer)
- [ ] 2.3 建立 Organization（多租戶）schema（D3: Auth 遷移使用 Better-Auth）：每個房仲公司是一個 Organization，listing 歸屬 Organization。驗證：建立兩個 Organization，各自的 listing 互不可見 [Tool: sonnet] (Better-Auth Integration — Multi-tenant organization access)
- [ ] 2.4 密碼遷移邏輯（驗證方式：Phase 2 完成後 Auth 使用 Better-Auth、DB 使用 Drizzle + PostgreSQL）：現有用戶首次登入 Better-Auth 時，自動將 bcrypt hash 轉換為 Better-Auth 格式。驗證：使用舊密碼登入成功，DB 中 hash 格式已更新 [Tool: sonnet] (Better-Auth Integration)

## 3. Phase 3 — AIRE 桌面版 Electron 重構

> Design: D2: AIRE 桌面版改為 Hybrid 架構 / D6: 遷移順序採漸進式，不一次全搬 / 行為契約：Phase 3 完成後白畫面問題消失

- [ ] 3.1 移除 electron/launcher.ts 中的 launchNextServer 邏輯（D2: AIRE 桌面版改為 Hybrid 架構），改為直接連線 Zeabur 後端。electron/main.ts 的 createMainWindow 改用 loadURL 連線遠端，或 loadFile 載入靜態 shell + API 呼叫。驗證：AIRE.app 啟動後不再 spawn node server.js 子程序，BrowserWindow 正常顯示 UI [Tool: sonnet] (Hybrid Electron Architecture — Electron window loading)
- [ ] 3.2 將 PDF 產出和 OCR 邏輯從 API route 搬到 Electron main process，透過 IPC 暴露給 renderer（D2: AIRE 桌面版改為 Hybrid 架構）。驗證：離線狀態下產出 PDF 成功，OCR 功能正常 [Tool: sonnet] (Hybrid Electron Architecture — Local-only features)
- [ ] 3.3 實作離線模式 UI：無網路時顯示離線指示器，限制只能使用本機功能。驗證：斷網啟動 App → 顯示離線模式 → PDF/OCR 可用 → Auth/License 功能灰顯 [Tool: copilot] (Unified Backend Connection — Offline mode)
- [ ] 3.4 簡化 electron-builder.json（D2: AIRE 桌面版改為 Hybrid 架構）：移除 standalone 相關的 extraResources 和 files 設定，打包只含 Electron shell + 本機工具。驗證：`npm run electron:build` 成功，DMG 大小縮小，安裝後 App 正常啟動無白畫面 [Tool: copilot] (Hybrid Electron Architecture)
- [ ] 3.5 Mac arm64 + x64 雙架構 DMG 打包測試（驗證方式：Mac arm64 + x64 DMG 安裝後正常顯示 UI）。驗證：兩個 DMG 都能安裝並正常運作，artifactName 含 arch 不互相覆蓋 [Tool: copilot] (Hybrid Electron Architecture)
- [ ] 3.6 Windows x64 NSIS 安裝檔打包測試（驗證方式：Windows EXE 安裝後正常運作）。驗證：Windows 10/11 安裝後 App 正常運作 [Tool: copilot] (Hybrid Electron Architecture)

## 4. Phase 4 — CI/CD 和 auto-update 調整

> Design: D2: AIRE 桌面版改為 Hybrid 架構 / D6: 遷移順序採漸進式，不一次全搬

- [ ] 4.1 更新 .github/workflows/release.yml（D2: AIRE 桌面版改為 Hybrid 架構）：移除 next build standalone 步驟，改為打包 Electron shell + 本機工具。驗證：push tag → Actions build 成功 → DMG/EXE 上傳到 GitHub Releases [Tool: copilot] (Hybrid Electron Architecture)
- [ ] 4.2 驗證 auto-update 流程（驗證方式：舊版 App 能偵測到新版並自動更新）：舊版 AIRE App（v0.1.3）偵測到新版 → 自動下載 → 重啟安裝。驗證：electron-updater 從 GitHub Releases 拉到新版並完成更新 [Tool: sonnet] (Hybrid Electron Architecture)

## 5. Review 和驗收

> Design: D6: 遷移順序採漸進式，不一次全搬 / 行為契約：Phase 4 完成後所有產品共用統一底盤

- [ ] 5.1 全量 Code Review：diff 所有變更，檢查安全性（API key 暴露、CORS 設定）、邏輯正確性、型別安全。驗證：Kimi CLI review 無 Critical findings [Tool: kimi] (Unified Backend Connection)
- [ ] 5.2 E2E 測試（驗證方式：每個 Phase 完成後跑對應的 E2E 測試）：完整走一遍「安裝 App → 啟用 License → 登入 → 上傳謄本 → 產出文件 → 更新 App」流程。驗證：Playwright E2E 全綠 [Tool: sonnet] (Hybrid Electron Architecture)
- [ ] 5.3 舊版 Vercel License Server 下線確認（行為契約：Phase 1 完成後舊 Vercel License Server 下線）：所有流量已切到 Zeabur，Vercel 專案可安全刪除。驗證：Vercel dashboard 確認 0 流量持續 7 天 [Tool: copilot] (License Verification via Unified Backend)
