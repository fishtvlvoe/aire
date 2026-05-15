## Group 1：Bug 修復（可並行）

- [x] [P] 1.1 新增 `src/app/(dashboard)/dev/page.tsx`，實作 feature flag toggle 清單，從 `mock-backend` 讀取並切換 featureFlags（對應：dev-super-admin / dev-page-route, feature-flag-toggle-ui）[Tool: copilot]
- [x] [P] 1.2 `src/lib/mock-backend.ts`：`persistState()` 加入 cases 序列化到 localStorage，`loadState()` 加入 cases 反序列化，保留 SEED_CASES 作為空值 fallback（對應：browser-dev-mock / mock-localstorage-persistence）[Tool: copilot]
- [x] [P] 1.3 `src/app/(dashboard)/layout.tsx`：引入並掛載 `<Toaster />` from `sonner`（對應：browser-dev-mock / dashboard-toast-provider）[Tool: copilot]
- [x] [P] 1.4 `src/app/(dashboard)/cases/[id]/preview/page.tsx`：移除直接 Tauri import，改用 `safeInvoke` from `src/lib/safe-invoke.ts`，為 `export_pdf`、`get_theme`、`load_logo` 三個 invoke 加入 browser mock 回傳值（對應：settings-premium-unlock / tauri-invoke-browser-safe）[Tool: copilot]
- [x] [P] 1.5 `src/app/(dashboard)/cases/[id]/page.tsx`：在「地政資料」區塊 import 並渲染 `PullParcelDataButton` 元件，補充說明文字（對應：settings-page / pull-parcel-data-visible）[Tool: copilot]

## Group 2：表單欄位調整（可並行）

- [x] [P] 2.1 新增案件表單：移除「地號」的 `required` 驗證，更新 placeholder 文字為「可選填，例如：0001-0000（不確定可留空）」（對應：settings-page / case-form-optional-land-lot）[Tool: copilot]
- [x] [P] 2.2 新增案件表單：移除「屋主姓名」的 `required` 驗證，確認最低必填欄位為地址 + 物件類型 + 案件編號（對應：settings-page / case-form-optional-owner-name）[Tool: copilot]
- [x] [P] 2.3 `src/components/LogoUploader.tsx`：擴充 `SUPPORTED_MIME` set 加入 `image/svg+xml` 和 `image/avif`，更新 `accept` 屬性，更新錯誤提示文字為「僅支援 PNG、JPEG、SVG、AVIF 格式」（對應：customer-logo-upload / Client SHALL reject non-PNG / non-JPG files before IPC）[Tool: copilot]
- [x] [P] 2.4 `src/components/settings/PremiumUnlockSection.tsx`：偵測 user role 為 `admin` 時顯示「已啟用（管理員）」label 並隱藏訂閱按鈕，不呼叫訂閱 API（對應：settings-premium-unlock / admin-auto-unlock-mcp-hub）[Tool: copilot]

## Group 3：UI 視覺強化（可並行）

- [x] [P] 3.1 主題卡片元件：在灰色預覽區渲染 3 個色塊（主色 primary、輔色 secondary、背景色 background），色值從各 theme 的 CSS variable 或常數取得（對應：settings-page / theme-card-color-preview）[Tool: copilot]
- [x] [P] 3.2 主題「預覽」按鈕：實作 Modal 元件，在 Modal 內用 theme CSS variable 渲染迷你說明書 Demo（含文件標題、示範物件地址、物件類型、簡單兩欄版面）（對應：settings-page / theme-preview-modal）[Tool: copilot]

## Group 4：Code Review

- [ ] 4.1 Kimi MCP 審查 Group 1-3 所有改動：確認 mock 序列化不破壞現有 featureFlags 結構、safeInvoke 降級邏輯正確、toast provider 不重複掛載、admin role 判斷不可繞過（對應：所有 spec 變更）[Tool: kimi]

## Group 5：驗收

- [ ] 5.1 人工驗收 checklist：(1) `/dev` 路由可訪問且 toggle 可用；(2) 重啟 dev server 案件不消失；(3) 儲存顯示 toast；(4) 瀏覽器下匯出案件不崩潰；(5) 案件頁有拉謄本按鈕；(6) SVG/AVIF Logo 可上傳；(7) 主題卡片有色塊；(8) 主題預覽 Modal 可開關；(9) 地號/屋主姓名可留空；(10) Admin 看到 MCP Hub 已啟用[Tool: sonnet]
