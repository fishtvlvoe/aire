## 1. UpdateChecker Hydration 修復

- [x] 1.1 修改 `src/components/UpdateChecker.tsx`：將 `isElectron` 改為 `useState(false)` + `useEffect(() => setIsElectron(!!window.electronAPI), [])`，確保 SSR 與 CSR 初始 render 一致（都回傳 null） [Design: D1] [Spec: update-checker] [Tool: Copilot]

## 2. Listings 全螢幕寬度

- [x] 2.1 修改 `src/app/listings/page.tsx`：移除 `max-w-[1440px]` class，保留 `w-full`，讓列表頁面填滿整個 viewport 寬度 [Design: D2] [Spec: listings-layout] [Tool: Copilot]

## 3. Sidebar Admin 區塊

- [x] 3.1 修改 `src/components/Sidebar.tsx`：在 NAV_ITEMS 底部新增 admin 區塊，包含「用戶管理」（/admin/users）和「功能設定」（/admin/features）兩個連結，僅在 user.role === 'admin' 時顯示。透過 useSession hook 或 props 取得當前用戶角色 [Design: D3] [Spec: sidebar-navigation] [Tool: Copilot]

## 4. 基本資訊欄位計數修復

- [x] 4.1 修改 `src/components/forms/FieldVisitForm.tsx`：在 usage 欄位的自訂 radio renderer（L433-480）中，當用戶選中 radio 時，除了現有的 `updateField('utility_type', opt)` 外，同步呼叫 `updateField('usage', opt)`，讓完成度計數器 `form['usage'].trim() !== ""` 能正確偵測為已填 [Design: D4] [Spec: field-visit-completion] [Tool: Copilot]

## 5. 文件產生設定權限控制

- [x] 5.1 建立 `src/app/admin/features/page.tsx`：Admin 功能設定頁面，列出 5 種文件類型（不動產說明書、物調表、銷售 DM、591 文案、社群貼文）並提供啟用/停用 toggle。頁面載入時檢查 user.role === 'admin'，非 admin 則 redirect 到 /listings [Design: D5] [Spec: document-generation-settings] [Tool: Copilot]
- [x] 5.2 建立設定 API `src/app/api/admin/features/route.ts`：GET 回傳目前 5 種文件類型的啟用狀態，PATCH 接受 `{ [docType]: boolean }` 格式更新啟用狀態。在 DB 中新增 `feature_flags` 表（key TEXT PRIMARY KEY, enabled INTEGER DEFAULT 1）存放設定 [Design: D5] [Spec: document-generation-settings] [Tool: Copilot]
- [x] 5.3 修改文件產生頁面：讀取 feature_flags 設定，只顯示 enabled 的文件類型 [Design: D5] [Spec: document-generation-settings] [Tool: Copilot]

## 6. 驗證

- [ ] 6.1 啟動 dev server + Electron App，逐一驗證 5 個修復項目：(a) 無 hydration 錯誤 (b) 全螢幕無空白 (c) admin sidebar 可見 (d) 基本資料 7/7 (e) 功能設定可存取且能切換 [Tool: 主對話]
