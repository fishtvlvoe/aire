## Wave 1: Admin Layout 與導航元件

依據 D1: Admin Layout 架構 和 D2: 返回導航元件 決策。

- [x] [P] 1.1 建立 `src/app/admin/layout.tsx`：匯入 Sidebar 元件，外層 div 使用 `min-h-screen bg-[#F5F6FA] font-['Manrope'] text-[#2D3142]`，內層 `flex w-full`，左側 `<Sidebar />`，右側 `<main className="flex-1 p-8 min-w-0"><section className="rounded-lg bg-white p-6 shadow-[0_8px_24px_rgba(45,49,66,0.08)]">{children}</section></main>`。[Tool: Copilot] [Spec: admin-layout/admin-shared-layout]
- [x] [P] 1.2 建立 `src/components/AdminBreadcrumb.tsx`：使用 Next.js Link 元件，連結到 /listings，顯示 ChevronLeft 圖示（Lucide, 16x16）+ 文字「返回物件列表」。樣式：`text-sm text-slate-500 hover:text-[#1B3A6B] transition mb-4 inline-flex items-center gap-1`。[Tool: Copilot] [Spec: admin-layout/admin-shared-layout]

## Wave 2: 既有 Admin 頁面調整

依據 D7: 既有頁面調整 決策，移除自帶容器樣式。

- [x] [P] 2.1 修改 `src/app/admin/users/page.tsx`：移除外層的 `max-w-4xl mx-auto p-6`（或類似容器 div），內容直接渲染（由 admin layout 包裹）。頂部加入 `<AdminBreadcrumb />`。[Tool: Copilot] [Spec: admin-layout/admin-shared-layout]
- [x] [P] 2.2 修改 `src/app/admin/features/page.tsx`：移除外層的 `p-8 max-w-4xl`（或類似容器 div），內容直接渲染。頂部加入 `<AdminBreadcrumb />`。[Tool: Copilot] [Spec: admin-layout/admin-shared-layout]

## Wave 3: 模板設定 UI 重寫

依據 D3: 配色方案選擇器 和 D4: Logo 上傳 決策。

- [x] [P] 3.1 建立 `src/components/ColorSchemeSelector.tsx`：接受 props `{ value: string; onChange: (id: string) => void }`。內部硬編碼 6 種配色方案（navy/slate/warm/forest/white/burgundy），每種含 id、name、headerBg、headerText、accentColor。渲染 `grid grid-cols-3 gap-4`，每個卡片高 80px，上半部 div 背景色為 headerBg，下方 p 顯示 name。選中的卡片加 `ring-2 ring-[#1B3A6B]`。點擊呼叫 onChange(id)。[Tool: Copilot] [Spec: template-management/simplified-template-selection]
- [x] [P] 3.2 建立 `src/components/LogoUploader.tsx`：接受 props `{ logoPath: string | null; onUpload: (file: File) => Promise<void>; onRemove: () => Promise<void> }`。無 logo 時顯示虛線框（border-2 border-dashed border-slate-300 rounded-lg p-6 text-center）+ 上傳按鈕。有 logo 時顯示 img（max-w-[120px] max-h-[60px] object-contain）+ 移除按鈕。input 的 accept 限制為 .png,.jpg,.jpeg,.svg，前端檢查檔案大小不超過 1MB。[Tool: Copilot] [Spec: template-management/simplified-template-selection]

## Wave 4: 模板設定 API + 頁面整合

依據 D5: 文件樣式儲存機制 和 D6: 模板管理頁面新 UI 決策。

- [x] 4.1 修改 `src/app/api/admin/templates/route.ts`：GET 改為從 feature_flags 讀取 doc_color_scheme 和 doc_logo_path，回傳 `{ colorScheme: string, logoPath: string | null }`。PATCH 接受 `{ colorScheme: string }`，更新 feature_flags 中 key=doc_color_scheme 的 value（使用 INSERT OR REPLACE）。移除舊的 multipart/form-data HTML 上傳邏輯。[Tool: Copilot] [Spec: template-management/simplified-template-selection]
- [x] 4.2 建立 `src/app/api/admin/templates/logo/route.ts`：POST 接受 multipart/form-data（欄位名 file），驗證格式（png/jpg/svg）和大小（<=1MB），儲存到 data/branding/logo.{ext}（先刪除 data/branding/ 下舊檔案），更新 feature_flags 的 doc_logo_path。DELETE 刪除 data/branding/ 下的 logo 檔案，清空 feature_flags 的 doc_logo_path。[Tool: Copilot] [Spec: template-management/simplified-template-selection]
- [x] 4.3 重寫 `src/app/admin/templates/page.tsx`：頁面標題改為「文件樣式設定」，說明文字「設定文件產出的配色方案與公司 Logo」。載入時 GET /api/admin/templates 取得設定。使用 ColorSchemeSelector 和 LogoUploader 元件。儲存按鈕呼叫 PATCH /api/admin/templates。Logo 上傳/刪除分別呼叫 POST/DELETE /api/admin/templates/logo。移除 role guard redirect（由 admin layout 和 middleware 處理）。[Tool: Copilot] [Spec: template-management/simplified-template-selection]

## Wave 5: 清理與移除

依據 D8: 移除項目 決策，清除不再使用的 Handlebars 模板引擎和相關元件。

- [x] [P] 5.1 刪除 `src/lib/template-engine.ts`（Handlebars 模板引擎）。刪除 `src/components/TemplatePreview.tsx`（iframe 預覽元件）。執行 `npm uninstall handlebars`。確認 `src/app/api/admin/templates/[id]/route.ts` 是否仍需要——如果配色方案不需要 per-id 操作則刪除。[Tool: Copilot]
- [x] [P] 5.2 修改 `src/app/listings/[id]/documents/page.tsx`：移除模板 dropdown 選擇器（templates state、selectedTemplateId、loadTemplates 函式）。如果文件預覽仍使用模板 ID，改為從 feature_flags 讀取 doc_color_scheme 套用配色。[Tool: Copilot]

## Wave 6: 驗收

- [x] 6.1 執行 `npm run build` 確認零錯誤，執行 `npm run test` 確認全綠。用 Playwright 截圖驗證：(a) /admin/users 有 Sidebar + 白色背景 + 返回導航 (b) /admin/features 同上 (c) /admin/templates 顯示 6 個配色卡片 + Logo 上傳區 (d) 選擇配色後儲存成功 (e) Sidebar 管理區塊三個連結都能正常導航 [Tool: 主對話]
