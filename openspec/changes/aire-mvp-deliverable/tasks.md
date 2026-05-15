## 1. 舊 Change 收尾封存

- [x] 1.1 執行 `cargo test` 驗證 Rust 後端所有測試通過，確認 data-portability、legal-clauses、pdf-assets 三個 Change 的後端實作無回歸。驗證：cargo test 零失敗。 [Tool: copilot]
- [x] 1.2 在 Tauri dev 模式下執行真機 smoke test：建立測試案件 → 填入欄位 → 匯出 PDF → 確認 PDF 檔案產出且可開啟。驗證：PDF 檔案存在且大小 > 0。對應 spec: pdf-assets 3.2 真機 smoke test。 [Tool: copilot]
- [x] 1.3 執行 legal-clauses-autofill 視覺驗收：啟動 Tauri dev → 開啟 PDF 預覽 → 截圖確認 legal notice block 正確渲染（位置、字體、邊框）。驗證：截圖中 legal notice block 可見且格式正確。對應 spec: legal-clauses 11.3 視覺驗收。 [Tool: sonnet]
- [x] 1.4 三個舊 Change 全部封存：`spectra archive aire-phase1-data-portability`、`spectra archive aire-phase1-legal-clauses-autofill`、`spectra archive aire-phase1-pdf-assets`。驗證：`spectra list` 不再顯示這三個 Change。 [Tool: copilot]

## 2. ST 元件引入

- [x] [P] 2.1 從 ST @repo/ui 複製必要元件（button、input、select、form、label、card、dialog、sheet、table、badge、toast、tabs、textarea、skeleton、spinner）到 src/components/ui/ 目錄，保留 shadcn/ui 命名慣例。驗證：每個元件檔案存在且 TypeScript 編譯無錯誤。對應 design D4: ST 元件引入 — 直接複製到 AIRE。 [Tool: copilot]
- [x] [P] 2.2 更新 tailwind.config.ts 的 content 掃描路徑包含 src/components/ui/，確認 ST 元件的 utility class 正確生效。安裝 ST 元件的 peer dependencies（class-variance-authority、clsx、tailwind-merge、lucide-react）。驗證：`pnpm build` 零錯誤。對應 design D4: ST 元件引入 — 直接複製到 AIRE。 [Tool: copilot]

## 3. App Shell（sidebar + topbar + layout）

- [x] 3.1 建立 src/components/AppSidebar.tsx：用 ST Button + lucide-react icons 渲染導航項（案件管理 /cases、品牌設定 /settings/branding、日誌 /settings/logs），desktop 固定左側 240px 寬，當前路由 active 狀態高亮。驗證：元件 TypeScript 編譯通過，導航項渲染三個連結。對應 spec: sidebar-navigation，design D1: App Shell 架構 — Next.js nested layout + 自建 sidebar 元件。 [Tool: copilot]
- [x] 3.2 建立 src/components/AppTopbar.tsx：顯示當前頁面標題，viewport ≤ 768px 時顯示漢堡按鈕（觸發 sidebar Sheet 開啟）。驗證：元件 TypeScript 編譯通過。對應 spec: topbar-display，design D1: App Shell 架構。 [Tool: copilot]
- [x] 3.3 建立 src/app/(dashboard)/layout.tsx：組合 AppSidebar + AppTopbar + children content area，mobile 用 ST Sheet 包裹 sidebar。驗證：`pnpm build` 零錯誤，/cases 路由渲染時左側有 sidebar、頂部有 topbar。對應 spec: layout-wrapper，design D1: App Shell 架構。Behavior: 已授權使用者進入 dashboard 時看到 sidebar + topbar。Interface / Data Shape: Sidebar 導航項硬編碼陣列。Failure Modes: Tauri IPC 不可用時不阻擋 layout 渲染。Acceptance Criteria: pnpm build 零錯誤 + sidebar 在 desktop > 768px 固定顯示。Scope Boundaries: 不修改 Rust 後端。 [Tool: copilot]

## 4. 授權啟動流程

- [x] 4.1 建立 src/hooks/useLicenseStatus.ts：custom hook 封裝 get_license_status Tauri IPC 呼叫，回傳 `{ status: 'valid' | 'expired' | 'none', isLoading: boolean }`。Tauri IPC 不可用時 fallback 回傳 status: 'none'。驗證：TypeScript 編譯通過，hook export 存在。對應 spec: license-guard，design D2: 授權啟動流程 — layout guard + Tauri IPC。Interface / Data Shape: useLicenseStatus() 回傳 { status, isLoading }。 [Tool: copilot]
- [x] 4.2 建立 src/app/(auth)/activation/page.tsx：授權啟動頁 UI，ST Form + Input（序號輸入）+ Button（提交），空值提交顯示 "請輸入授權序號" 驗證錯誤，成功後 redirect /cases，失敗顯示 error Toast。Tauri IPC 不可用時顯示 "請在 AIRE 桌面 App 中開啟"。驗證：頁面渲染無錯誤，空值提交顯示驗證訊息。對應 spec: activation-page-form，design D2: 授權啟動流程 — layout guard + Tauri IPC。Failure Modes: IPC 不可用時顯示提示訊息而非表單。 [Tool: copilot]
- [x] 4.3 在 src/app/(dashboard)/layout.tsx 加入 license guard：mount 時呼叫 useLicenseStatus，status 非 valid 時 redirect 到 /activation。驗證：未授權時訪問 /cases 被 redirect 到 /activation。對應 spec: license-guard，design D2: 授權啟動流程 — layout guard + Tauri IPC。 [Tool: copilot]

## 5. 案件 UI 升級

- [x] [P] 5.1 升級 src/app/(dashboard)/cases/page.tsx：案件列表改用 ST Table + Badge（狀態標籤）+ Button（新增案件），空列表顯示 ST Card 空狀態 "尚無案件"。保留現有 list_cases IPC 呼叫邏輯。驗證：`pnpm build` 零錯誤，頁面渲染 ST Table 元件。對應 spec: case-list-display，design D3: 案件 UI 升級 — 漸進替換保留頁面結構。 [Tool: copilot]
- [x] [P] 5.2 升級 src/app/(dashboard)/cases/[id]/page.tsx：表單改用 ST Form + Input + Select + Label + Textarea + Tabs（成屋/土地切換），儲存按鈕呼叫 update_case IPC + 成功 Toast "案件已儲存"，必填欄位空值顯示 ST Form 錯誤樣式。保留現有 IPC 邏輯。驗證：`pnpm build` 零錯誤，表單渲染 ST 元件。對應 spec: case-form-ui，design D3: 案件 UI 升級 — 漸進替換保留頁面結構。 [Tool: copilot]
- [x] [P] 5.3 升級 src/app/(dashboard)/cases/[id]/preview/page.tsx：加「匯出 PDF」ST Button 呼叫 export_pdf IPC，按鈕在匯出中顯示 spinner + disabled，成功 Toast "PDF 已匯出" 含檔案路徑，失敗 Toast 顯示錯誤。驗證：`pnpm build` 零錯誤。對應 spec: pdf-export-button，design D3: 案件 UI 升級 — 漸進替換保留頁面結構。 [Tool: copilot]

## 6. 整合驗證

- [x] 6.1 執行 `pnpm build` 確認全專案零 TypeScript 錯誤、零 prerender 失敗。驗證：build output 顯示所有頁面成功。 [Tool: copilot]
- [x] 6.2 啟動 Tauri dev 模式，走通完整流程截圖驗證：啟動 App → /activation 頁 → 填序號 → /cases 列表 → 新增案件 → 填表 → 預覽 → 匯出 PDF。每個步驟截圖存到 /tmp/aire-mvp-screenshots/。驗證：截圖覆蓋全流程 8 個步驟。 [Tool: sonnet]
- [x] 6.3 git add + commit 所有變更（conventional commit: feat: AIRE MVP deliverable — app shell + license UI + case UI upgrade）+ push。驗證：`git status` 乾淨、`git log --oneline -1` 顯示正確 commit。 [Tool: copilot]
