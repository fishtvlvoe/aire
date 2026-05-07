## 1. 後端 API — Vercel KV Schema 擴充與新 API

- [ ] 1.1 擴充 Vercel KV schema，license 物件新增 contactName 和 company 欄位，舊資料向下相容回傳空字串（D7: Vercel KV Schema 擴充）[Tool: Copilot]
- [ ] 1.2 [P] 實作 PATCH /api/license/update-info API，支援更新 contactName/company/email，email 變更時同步更新 email-index（D2: 使用者資料 Inline Edit / Update license contact info API）[Tool: Copilot]
- [ ] 1.3 [P] 實作 POST /api/license/transfer API，原子性停用舊序號 + 核發新序號，失敗時 rollback（D3: 序號轉讓（Transfer） / Transfer API atomically revokes old and creates new license / Transfer API handles creation failure gracefully）[Tool: Copilot]
- [ ] 1.4 修改 GET /api/license/list API，回傳 contactName、company、index 欄位，支援 search query 模糊比對（D7: Vercel KV Schema 擴充 / License list API returns extended fields）[Tool: Copilot]

## 2. 後端 API — machineId 綁定

- [x] 2.1 安裝 node-machine-id 套件，建立 src/lib/machine-id.ts 工具模組，提供取得 machineId + SHA-256 hash 功能（D4: machineId 綁定 / License activation binds to machine ID）[Tool: Copilot]
- [x] 2.2 修改 POST /api/license/activate API，接受 machineId 參數，啟用時儲存 hash，已綁定時拒絕不同機器（License activation includes machine ID binding）[Tool: Copilot]
- [x] 2.3 修改 GET /api/license/verify API，驗證 machineId 是否與儲存值一致，不符回 403（License verification validates machine ID）[Tool: Copilot]

## 3. 後端 API — 首位管理員建立

- [x] 3.1 實作 POST /api/setup/create-first-admin API，僅 users 表為空時允許，建立 role=admin 帳號，密碼至少 6 字元（D5: 首位管理員建立（First Admin Setup） / First admin account creation API）[Tool: Copilot]
- [x] 3.2 修改 src/middleware.ts 重導向邏輯：License 有效 + users 表為空 → 重導 /setup/admin（Middleware redirects to admin setup when users table is empty）[Tool: Copilot]

## 4. 前端 — 序號管理後台 UI

- [x] 4.1 重構序號管理表格元件，五欄排列：編號→序號→狀態→使用者→操作，移除建立日期欄（D1: 表格欄位與排序 / License table displays five columns in fixed order / Creation date column is removed）[Tool: Copilot]
- [x] 4.2 使用者欄位三行顯示（姓名/公司/Email），未啟用顯示「—」（User column displays three-line contact info）[Tool: Copilot]
- [x] 4.3 編號欄位顯示流水號 001/002...，搜尋結果重新編號（Index column shows sequential numbering）[Tool: Copilot]
- [x] 4.4 [P] 操作按鈕加 Tooltip：複製「複製序號到剪貼簿」、停用「停用此序號」，已停用隱藏停用按鈕（Action buttons have tooltips）[Tool: Copilot]
- [x] 4.5 [P] 實作 Inline Edit 功能：點擊切換 input、Enter 儲存、Escape 取消，呼叫 PATCH /api/license/update-info（D2: 使用者資料 Inline Edit / User info supports inline editing）[Tool: Copilot]
- [x] 4.6 實作轉讓確認 Dialog：顯示舊序號資訊 + 新公司/姓名/Email/理由輸入，呼叫 POST /api/license/transfer（D3: 序號轉讓 / Transfer dialog for license reassignment）[Tool: Copilot]
- [x] 4.7 實作搜尋功能：對 index、key、contactName、company、email 全欄位模糊比對，結果帶重新編號（Search includes index and contact info）[Tool: Copilot]
- [x] 4.8 新增「解綁機器」操作按鈕，清除序號的 machineId（Admin can unbind machine ID）[Tool: Copilot]

## 5. 前端 — Setup Wizard 三步流程

- [x] 5.1 建立 /setup/admin 頁面：Email、顯示名稱、密碼三欄位表單 + 前端驗證，呼叫 POST /api/setup/create-first-admin（D5: 首位管理員建立 / First admin setup page UI / Setup wizard includes admin account creation step）[Tool: Copilot]
- [x] 5.2 修改 /setup 頁面完成後重導至 /setup/admin（取代原本直接到 /setup/codex），確保三步順序：License → Admin → Codex（Setup wizard includes admin account creation step）[Tool: Copilot]

## 6. Electron — Codex CLI 偵測

- [x] 6.1 修改 electron/launcher.ts，啟動 Next.js server 前偵測 Codex CLI（macOS: which codex / Windows: where codex），結果透過 IPC 傳給 renderer（D6: Codex CLI 偵測 / Launcher checks for Codex CLI before starting Next.js server / Electron launcher detects Codex CLI before starting）[Tool: Copilot]
- [x] 6.2 建立 Codex CLI 安裝引導畫面 HTML：安裝指令、codex login 說明、「重新偵測」按鈕、手動路徑輸入（Installation guide screen for missing Codex CLI）[Tool: Copilot]

## 7. Electron — Build 驗證

- [x] 7.1 執行 npm run electron:pack:mac 驗證 DMG 打包成功（arm64 + x64），需先跑 fix-standalone-symlinks.js 修復 Next.js standalone symlink（Electron build produces valid Mac and Windows installers / Mac DMG build succeeds）[Tool: Sonnet]
- [ ] 7.2 執行 npm run electron:pack:win 驗證 NSIS 打包成功（需 Windows 環境或 Wine）（Windows NSIS build succeeds）[Tool: Sonnet]

## 8. Code Review

- [x] 8.1 全量 Code Review：Kimi MCP 審查所有新增/修改檔案，三濾鏡（correctness / security / performance）[Tool: Kimi]

## 9. 端到端測試

- [ ] 9.1 測試完整安裝流程：Electron 啟動 → Codex CLI 偵測 → License 啟用（含 machineId）→ 建管理員 → Codex 設定 → 登入 → 存取受保護頁面 [Tool: Sonnet]
- [ ] 9.2 測試後台管理流程：序號列表 → 搜尋 → Inline Edit → 轉讓 → 解綁機器 [Tool: Sonnet]
