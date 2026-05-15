## Context

AIRE 是 Tauri 2.x 桌面 App（Rust 殼 + Next.js 16 前端 + SQLite）。後端已實作 18 個 IPC commands（license、cases CRUD、PDF export、branding、logs），前端有頁面骨架但缺少統一的 App Shell（sidebar、topbar、layout）和登入/授權流程。三個舊 SDD Change 各差 1-2 個驗收任務。

目標：套用 ST @repo/ui 元件庫建立完整 UI，讓使用者能走通「啟動 → 授權 → 導航 → 建案件 → 填表 → 產 PDF」全流程。

## Goals / Non-Goals

**Goals:**
- 建立統一 App Shell（sidebar + topbar + content area），所有 dashboard 頁面共用
- 授權啟動頁串接 Tauri IPC license commands，阻擋未授權使用者
- 案件列表/表單/PDF 預覽頁升級為 ST 元件
- 收尾封存三個舊 Change

**Non-Goals:**
- 不做地政 API 串接、角色權限、PDF 加密、自動更新
- 不重構 Rust 後端
- 不做 i18n、深色模式

## Decisions

### D1: App Shell 架構 — Next.js nested layout + 自建 sidebar 元件

`src/app/(dashboard)/layout.tsx` 包裹所有 dashboard 頁面，內含 AppSidebar + AppTopbar + main content area。Sidebar 用 ST Button + nav links 硬編碼導航項（案件管理、品牌設定、日誌），desktop 固定左側 240px，mobile 用 ST Sheet 從左滑出。

**Alternatives Considered:**
1. 用 ST Tabs 做頂部導航 — 否決：頁面多時頂部空間不夠，sidebar 更適合桌面 App
2. 第三方 sidebar 套件（react-pro-sidebar）— 否決：多一個依賴，ST 元件足夠組合

### D2: 授權啟動流程 — layout guard + Tauri IPC

App 啟動時在 dashboard layout 呼叫 `get_license_status` IPC command。未授權 → redirect 到 /activation。授權頁用 ST Form/Input/Button，輸入序號 → `activate_license` → 成功 redirect 到 /cases。

**Alternatives Considered:**
1. Next.js middleware.ts 做 redirect — 否決：middleware 在 Node 環境，無 Tauri IPC
2. React Context auth state — 否決：MVP 階段 useEffect + redirect 已足夠

### D3: 案件 UI 升級 — 漸進替換保留頁面結構

保留現有 page.tsx 和 Tauri IPC 呼叫邏輯，只替換 UI 元素為 ST 元件。列表用 ST Table + Badge，表單用 ST Form/Input/Select/Label，預覽頁加匯出 Button + Toast。

**Alternatives Considered:**
1. 全部重寫頁面 — 否決：IPC 邏輯已正確，只需換 UI 殼
2. form schema 動態渲染 — 否決：過度設計，兩種表單直接寫

### D4: ST 元件引入 — 直接複製到 AIRE

由於 AIRE 是獨立桌面 App（不在 ST monorepo 內），workspace 引用不可行。將 ST 必要元件（button、input、select、form、label、card、dialog、sheet、table、badge、toast、tabs、textarea、skeleton、spinner）複製到 src/components/ui/ 目錄，加 tailwind 相容設定。

**Alternatives Considered:**
1. pnpm workspace 引用 — 否決：AIRE 不在 ST monorepo，會 resolve 失敗
2. npm publish @repo/ui — 否決：增加 CI 複雜度，直接複製最快

## Implementation Contract

### Behavior
- 未授權使用者：看到 /activation 頁面，輸入序號後呼叫 activate_license，成功跳轉 /cases
- 已授權使用者：直接進 /cases，左側 sidebar 固定顯示導航（案件管理、品牌設定、日誌）
- 案件列表：ST Table 顯示案件清單，點擊進入編輯，右上角「新增案件」按鈕
- 案件表單：ST Form 元件，分成屋/土地兩種表單（tab 切換），每個欄位有 label + 驗證提示
- PDF 預覽：顯示 PDF 內嵌預覽 + 「匯出 PDF」按鈕，點擊呼叫 export_pdf IPC，Toast 提示成功/失敗

### Interface / Data Shape
- License hook: `useLicenseStatus()` 回傳 `{ status: 'valid' | 'expired' | 'none', isLoading: boolean }`
- Sidebar 導航項: 硬編碼陣列 `[{ label: string, href: string, icon: LucideIcon }]`
- 案件列表 IPC: 沿用 `list_cases` → `{ cases: CaseItem[] }`
- 匯出 IPC: 沿用 `export_pdf` → `{ filePath: string }` 或 error

### Failure Modes
- Tauri IPC 不可用（在瀏覽器開 localhost）：useLicenseStatus 回傳 status: 'none'，activation 頁顯示「請在 AIRE 桌面 App 中開啟」提示
- activate_license 失敗：Toast 顯示錯誤碼對應的繁中訊息
- export_pdf 失敗：Toast 顯示 error，PDF 預覽頁 button 恢復可點擊

### Acceptance Criteria
- `pnpm build` 零 TypeScript 錯誤
- Tauri dev 模式下可走通全流程：啟動 → activation → 填序號 → 案件列表 → 新增案件 → 填表 → 預覽 → 匯出 PDF
- 三個舊 Change 全部 spectra archive 成功
- Sidebar 在 desktop（> 768px）固定顯示，mobile（< 768px）用 Sheet 滑出

### Scope Boundaries
- **In scope:** App Shell UI、授權頁 UI、案件 UI 升級、PDF 匯出串接、舊 Change 收尾封存
- **Out of scope:** Rust 後端修改、地政 API、角色權限、PDF 加密、Windows 打包、自動更新

## Risks / Trade-offs

- [Risk] ST 元件複製後與 Tauri 環境不相容（SSR / window undefined）→ Mitigation: 所有 Tauri IPC 頁面用 "use client" + dynamic import ssr: false
- [Risk] 舊 Change 收尾發現新 bug → Mitigation: 只修 Critical，其他記 issue
- [Risk] ST 元件 tailwind class 與 AIRE 現有樣式衝突 → Mitigation: ST 元件用 shadcn/ui 模式（utility class），衝突機率低；有衝突時在 AIRE tailwind.config 調整
