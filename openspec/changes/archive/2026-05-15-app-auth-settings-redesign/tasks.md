# Tasks

## task group 1: mock backend 擴充（d5: mock 持久化 + auth command）

Implementation Contract 參照：行為（使用者可觀察的）— login 成功回傳 session、失敗拋錯誤碼；介面與資料形狀 — Session { user_id, email, role, token }、AppSettings { land_api_client_id, land_api_security_code, premium_enabled }；失敗模式 — INVALID_CREDENTIALS / ACCOUNT_EXPIRED / localStorage 不可用靜默 fallback；驗收標準 — vitest mock-backend 全綠；範圍邊界 — 只改 mock-backend.ts 和測試檔。

- [x] 1.1 [Tool: sonnet] 新增 mock auth command（login / logout / get_session）+ app settings command（get_app_settings / save_app_settings）到 MockStore。login 驗證固定測試帳號表（admin@test.aire → admin, user@test.aire → user, expired@test.aire → expired）。回傳格式符合 spec browser-dev-mock 的 mock-auth-commands 和 mock-app-settings-commands requirement。vitest 測試覆蓋：成功登入、錯誤帳密、過期帳號、登出、get_session 已登入/未登入、get_app_settings 預設值、save_app_settings 合併儲存。驗證目標：npx vitest run mock-backend 全綠。
- [x] 1.2 [Tool: sonnet] MockStore 加入 localStorage 持久化：constructor 從 localStorage key "aire-mock-store" 反序列化，每次 invoke 後 serialize 存回。localStorage 不可用時（private browsing）靜默 fallback in-memory。vitest 測試：mock localStorage → serialize/deserialize round-trip、localStorage 拋錯時不 crash。符合 spec browser-dev-mock 的 mock-localstorage-persistence requirement。驗證目標：npx vitest run mock-backend 全綠。

## task group 2: 登入頁 + auth hook（d1: 登入頁設計與 mock auth + d2: auth guard 替換 license guard）

- [x] 2.1 [Tool: sonnet] 建立 src/lib/auth.ts：export login(email, password) / logout() / getSession() / isAuthenticated()，內部呼叫 safeInvoke。建立 src/hooks/useAuth.ts：React hook 包裝 auth.ts，回傳 { user, isLoading, isAuthenticated, login, logout }。vitest 測試覆蓋 auth.ts 四個函數 + useAuth hook 的 loading/authenticated/error 狀態。符合 spec auth-session-guard 的 dashboard-auth-guard 和 logout-action requirement。驗證目標：npx vitest run auth 全綠。
- [x] 2.2 [Tool: copilot] 建立 src/app/login/page.tsx：居中卡片、AIRE Logo（src/assets/icon-dark.png）、副標「不動產說明書自動化系統」、Email input、密碼 input、登入按鈕「登入」、忘記密碼連結「忘記密碼？」（外部連結）。表單 submit 呼叫 useAuth().login，成功 redirect /cases，失敗顯示紅色錯誤訊息（INVALID_CREDENTIALS → "帳號或密碼錯誤，請重新輸入"、ACCOUNT_EXPIRED → "此帳號已過期，請聯繫客服"）。空欄位驗證。已登入 redirect /cases。符合 spec auth-login-page 的 login-form-display、login-form-submission、login-redirect-if-authenticated requirement。vitest 測試：render、成功登入、失敗登入、空欄位、已登入 redirect。驗證目標：npx vitest run login 全綠。
- [x] 2.3 [Tool: copilot] 修改 src/app/(dashboard)/layout.tsx：useAuth() 取代 useLicenseStatus()，未登入 redirect /login。移除 useLicenseStatus import。Topbar 加 logout 按鈕（呼叫 useAuth().logout，logout 後 redirect /login）。符合 spec auth-session-guard 的 dashboard-auth-guard 和 logout-action requirement。驗證目標：npx vitest run layout 全綠 + pnpm build 零錯誤。

## task group 3: 設定頁（d3: 設定頁結構）

- [x] 3.1 [P] [Tool: copilot] 建立 src/app/(dashboard)/settings/page.tsx：三個 Card 區塊。區塊 1「序號管理」：授權狀態 + 序號 input + 啟動/解除按鈕，呼叫 safeInvoke("activate_license") / safeInvoke("deactivate_license")。錯誤訊息對應 error code（INVALID_KEY / ALREADY_ACTIVATED_OTHER_DEVICE / QUOTA_EXHAUSTED）。符合 spec settings-page 的 settings-license-section requirement。vitest 測試：未啟動 render、啟動成功、啟動失敗、已啟動 render、解除。驗證目標：npx vitest run settings 全綠。
- [x] 3.2 [P] [Tool: copilot] 建立設定頁區塊 2「地政 API 設定」：Client ID input + 安全碼 input（type=password）+ 儲存按鈕 + 說明連結「如何申請地政 API？」（外部連結）+ YouTube iframe 預留（src 暫空，寬度 100%，16:9 比例）。呼叫 safeInvoke("save_app_settings") / safeInvoke("get_app_settings") 載入和儲存。符合 spec settings-page 的 settings-land-api-section requirement。vitest 測試：render、pre-populated、save 成功。驗證目標：npx vitest run settings 全綠。
- [x] 3.3 [P] [Tool: copilot] 建立設定頁區塊 3「進階功能」：鎖定/已開通狀態 + 「前往 OPCOS 開通」按鈕（window.open 外部 URL，URL 從環境變數或常數取）。符合 spec settings-page 的 settings-premium-section requirement。vitest 測試：鎖定 render + 按鈕 href、已開通 render。驗證目標：npx vitest run settings 全綠。

## task group 4: 側邊欄重構（d4: 側邊欄 collapse + 設定入口）

- [x] 4.1 [Tool: sonnet] 重構 src/components/AppSidebar.tsx：接受 collapsed prop，collapsed 時寬度 60px 只顯示 icon + tooltip。navItems 加第四項 { label: "設定", href: "/settings", icon: Settings }。底部加 collapse toggle 按鈕（ChevronLeft/ChevronRight），md+ 才顯示。修改 src/app/(dashboard)/layout.tsx：aside 寬度根據 collapse 狀態動態切換（md:w-60 / md:w-[60px]），collapse 狀態存取 localStorage key "aire-sidebar-collapsed"。符合 spec collapsible-sidebar 的 sidebar-collapse-toggle、sidebar-collapse-persistence、sidebar-settings-nav-item requirement + spec app-shell 的 modified sidebar-navigation requirement。vitest 測試：4 個 nav items render、collapse toggle、localStorage persist、mobile 不受影響。驗證目標：npx vitest run sidebar 全綠 + pnpm build 零錯誤。

## task group 5: 清理 + activation redirect（d2: auth guard 替換 license guard）

- [x] 5.1 [Tool: copilot] 修改 src/app/activation/page.tsx：移除所有表單內容（移除 activation-page-form），改為 useEffect redirect 到 /settings。移除「30 天」文案。符合 spec license-activation-ui 的 activation-redirect requirement 和 activation-page-form REMOVED。刪除 src/app/activation/__tests__/page.test.tsx 並建立新測試（只測 redirect 行為）。驗證目標：npx vitest run activation 全綠。
- [x] 5.2 [Tool: copilot] 移除 src/hooks/useLicenseStatus.ts（不再被任何元件使用）。確認 grep -r "useLicenseStatus" src/ 無結果。驗證目標：pnpm build 零錯誤。

## task group 6: 整合驗證

- [x] 6.1 [Tool: sonnet] 整合測試：npx vitest run 全部通過 + pnpm build 零錯誤。瀏覽器手動驗證：localhost:3000 → 看到登入頁 → admin@test.aire + password 登入 → dashboard（4 個側邊欄項目）→ 點設定 → 三個區塊可見 → 序號啟動 AIRE-TEST-VALID-001 → 重整頁面保持登入和序號狀態 → sidebar collapse toggle → 重整保持 collapse。截圖存 /tmp/ 供主對話驗證。
