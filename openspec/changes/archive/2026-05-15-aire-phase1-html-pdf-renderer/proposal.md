## Why

AIRE Phase 1 既有的「PDF 底圖 + pdf-lib 文字壓字」方向有三個結構性問題：(1) 文字壓在 PNG 底圖座標需逐欄校準，反覆失敗已踩兩輪；(2) 不動產說明書內容是動態 5-19 頁（依案件實際資料），固定 19 頁底圖不適用；(3) 客戶完全無法客製化（logo / 公司名 / 經紀人證號全寫死）。本 change 換引擎到 `@react-pdf/renderer` 走純 HTML/React 渲染，同時開出「主題系統可插拔架構」讓 Phase 2 用補充包模式擴展更多視覺風格而不需動主程式。

## What Changes

- **BREAKING** 廢棄既有 `pdf-lib` + PNG 底圖渲染管線，全面換 `@react-pdf/renderer`（純 React 元件、CSS 子集、向量 PDF 輸出）
- 新增主題系統（A 淡雅 + C 科技優雅雙主題出貨；可插拔架構為 Phase 2 補充包預留接點）
- 新增客戶 Logo 上傳元件（PNG/JPG，<2MB，封面 80×30mm + 頁眉 25×15mm 固定錨點，自動等比縮放，留白不裁切不變形）
- 新增動態頁數渲染（依案件實際資料自動組頁，5-19 頁區間，「不一定要」型半動態區塊條件渲染）
- 新增 PDF 即時預覽（不存檔的記憶體 render → React PDF Viewer）+ 下載按鈕
- 修改既有 `disclosure-pdf-render` capability 到「依靠新引擎 + 主題系統」
- 修改既有 `disclosure-template-background` capability：移除 PNG 底圖載入要求，改為「主題 React 元件繪製背景樣式」
- 保留 AI 標誌右上角（AIRE 產品識別符號）
- 既有 `disclosure-html-preview` capability 邏輯複用（主題切換、欄位填入流程不變）

## Non-Goals

- Phase 2 補充包主題（OpenDesign 擴展的更多風格）— 本 SDD 只先出 A + C 兩套
- 客戶在 App 內調主題顏色 / 字級 / 漸層方向的客製化編輯器（Phase 2 評估）
- 客戶上傳完整底圖讓系統還原（已否決，圖像分析還原品質不穩）
- 實價登錄 / 周遭行情頁（Phase 4 LVR 雲端代理 SDD 範圍）
- PDF 加密 / 密碼保護（既有 disclosure-document-generation 已處理）
- 從 PNG 底圖架構漸進遷移（直接整套換掉，不雙軌並行）
- SVG / EPS 等其他 logo 格式（限定 PNG / JPG）
- Logo 客戶端壓縮 > 2MB 自動下調品質（直接 reject 要求重傳）
- 印表機 spool 處理（OS 範圍，本 SDD 不處理）

## Capabilities

### New Capabilities

- `react-pdf-render-engine`: `@react-pdf/renderer` 引擎初始化、字型註冊、頁面組裝、向量輸出規格
- `pdf-theme-system`: 雙主題（A 淡雅 + C 科技優雅）+ 可插拔架構（theme provider / 主題包註冊機制 / 切換 API）
- `customer-logo-upload`: Logo 上傳（PNG/JPG）+ 客戶端 size 驗證 + 自動等比縮放 + 兩個固定錨點（封面 + 頁眉）+ SQLite BLOB 儲存
- `dynamic-page-composition`: 動態頁數組裝（依案件資料 5-19 頁）+ 「不一定要」半動態區塊條件渲染 + 頁碼自動計算
- `pdf-live-preview`: 記憶體渲染 + React PDF Viewer 即時預覽 + 下載 / 列印按鈕

### Modified Capabilities

- `disclosure-pdf-render`: 既有 pdf-lib + 座標壓字 → 改用 react-pdf-render-engine，所有 SHALL 條款重寫對齊新引擎
- `disclosure-template-background`: 既有「PNG 底圖載入」要求廢棄，改為「主題 React 元件繪製背景樣式」

## Impact

- Affected specs:
  - New: `react-pdf-render-engine`, `pdf-theme-system`, `customer-logo-upload`, `dynamic-page-composition`, `pdf-live-preview`
  - Modified: `disclosure-pdf-render`, `disclosure-template-background`
- Affected code:
  - New:
    - `src/lib/pdf-engine/index.ts`（@react-pdf/renderer 入口 + 字型註冊）
    - `src/lib/pdf-engine/document.tsx`（PDF Document 根元件 + 動態頁數組裝）
    - `src/lib/pdf-themes/types.ts`（Theme 介面定義 + 註冊機制）
    - `src/lib/pdf-themes/theme-a-minimal/index.tsx`（A 淡雅主題元件包）
    - `src/lib/pdf-themes/theme-a-minimal/styles.ts`
    - `src/lib/pdf-themes/theme-c-tech-elegant/index.tsx`（C 科技優雅主題元件包）
    - `src/lib/pdf-themes/theme-c-tech-elegant/styles.ts`
    - `src/lib/pdf-themes/registry.ts`（主題註冊表 + getTheme(id) API）
    - `src/lib/pdf-blocks/cover.tsx`（封面區塊：物件編號 / 名稱 / 摘要 / 經紀人 / Logo）
    - `src/lib/pdf-blocks/basic-info.tsx`（基本資訊頁）
    - `src/lib/pdf-blocks/location-map.tsx`（位置圖頁）
    - `src/lib/pdf-blocks/photo-gallery.tsx`（現況照片頁）
    - `src/lib/pdf-blocks/condition-survey.tsx`（房屋現況調查表 5 頁 + 土地版本）
    - `src/lib/pdf-blocks/life-amenities.tsx`（生活機能頁）
    - `src/lib/pdf-blocks/conditional-section.tsx`（「不一定要」半動態區塊 wrapper）
    - `src/lib/pdf-blocks/page-header.tsx`（頁眉：左 logo / 中標題 / 右 AI 標誌）
    - `src/lib/pdf-blocks/page-footer.tsx`（頁尾：頁碼 + 公司資訊）
    - `src/lib/pdf-blocks/ai-badge.tsx`（AI 識別圓形 BADGE）
    - `src/components/LogoUploader.tsx`（Logo 上傳 UI + size 驗證 + 預覽）
    - `src/components/ThemeSelector.tsx`（主題切換 UI：A / C 卡片選擇）
    - `src/components/PdfPreviewer.tsx`（React PDF Viewer 包裝 + 下載按鈕）
    - `src/app/(dashboard)/cases/[id]/preview/page.tsx`（PDF 預覽路由）
    - `src/app/(dashboard)/settings/branding/page.tsx`（品牌設定頁：Logo + 主題）
    - `src-tauri/src/branding/mod.rs`（Logo BLOB / 主題選擇 SQLite 持久層）
    - `src-tauri/migrations/002_branding.sql`（branding 表）
    - `src/lib/pdf-engine/__tests__/document.test.tsx`（動態頁數測試）
    - `src/lib/pdf-themes/__tests__/registry.test.ts`（主題註冊測試）
    - `e2e/pdf-render.spec.ts`（端到端：填資料 → 預覽 → 下載）
    - `docs/pdf-theme-pack-spec.md`（補充包開發規格 — Phase 2 用）
  - Modified:
    - `src/lib/pdf-renderer.ts`（既有 pdf-lib 入口 → 改 thin wrapper 轉派到 pdf-engine）
    - `src/lib/pdf-renderer.test.ts`（測試 case 對齊新引擎輸出）
    - `src/components/disclosure-form-residential.tsx`（觸發預覽 + 下載按鈕接新 hook）
    - `src/components/disclosure-form-land.tsx`（同上，土地版）
    - `src-tauri/src/main.rs`（註冊新 IPC commands：load_logo / save_logo / get_theme / set_theme）
    - `src-tauri/Cargo.toml`（branding 模組新增依賴：image 用於驗 PNG/JPG）
    - `package.json`（新增 @react-pdf/renderer ^4.x、@react-pdf/font、移除 pdf-lib 對 disclosure 的呼叫）
  - Removed:
    - `src/resources/templates/residential.pdf`（PNG 底圖方向廢棄、改 React 主題）
    - `src/resources/templates/land.pdf`（同上）
    - `src/lib/pdf-layout.ts`（pdf-lib 座標表廢棄）
    - 既有 disclosure-template-background 的 PNG 底圖載入器（路徑由 spec 定義決定）
- Dependencies 新增（npm）:
  - `@react-pdf/renderer` ^4.x（核心 PDF 渲染引擎）
  - `@react-pdf/font` ^4.x（字型註冊）
- Dependencies 新增（Cargo）:
  - `image` ^0.25（後端驗證 logo 是否合法 PNG/JPG）
- 環境變數新增：無（純前端 + 本機儲存）
