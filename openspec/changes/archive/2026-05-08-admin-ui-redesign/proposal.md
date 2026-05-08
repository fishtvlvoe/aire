## Summary

Admin 頁面（用戶管理、功能設定、模板設定）UI 統一重構：套用主 layout（Sidebar + 背景色 + 白色卡片容器）、加入返回導航、將模板設定從「上傳 HTML」改為「選配色方案 + 上傳 Logo」的簡化模式。

## Motivation

目前三個 admin 頁面（/admin/users、/admin/features、/admin/templates）沒有包在主 layout 裡，導致：
1. **黑色背景**：頁面沒有 bg-[#F5F6FA] 背景色，瀏覽器 dark mode 下顯示為全黑
2. **無導航**：缺少 Sidebar 和返回上一頁的機制，用戶只能手動改 URL
3. **模板功能不實用**：要求客戶上傳 HTML 模板檔案門檻太高，應改為從預設選項中挑選

## Proposed Solution

### 1. Admin Layout 統一
建立 src/app/admin/layout.tsx，包裹所有 /admin/* 頁面，結構與 listings 頁面一致：
- 外層 div：min-h-screen bg-[#F5F6FA] font-['Manrope'] text-[#2D3142]
- 內層 flex：Sidebar 元件 + main 區域（flex-1 p-8）
- 內容包在白色卡片容器：rounded-lg bg-white p-6 shadow-[0_8px_24px_rgba(45,49,66,0.08)]

### 2. 返回導航元件
建立 AdminBreadcrumb 元件，放在每個 admin 頁面內容區頂部，顯示「← 返回物件列表」連結，點擊後回到 /listings。

### 3. 模板設定重新設計
移除現有的 HTML 上傳功能，改為簡化版：
- 配色方案選擇器：提供 5-6 種預設底色方案（如深藍、淺灰、白色、暖棕、深綠），以色塊卡片方式呈現，點擊選中
- Logo 上傳：可選，接受 PNG/JPG/SVG，上傳後顯示預覽
- 即時預覽區：選擇配色 + Logo 後，右側顯示文件產出的預覽縮圖
- 儲存按鈕：將選擇寫入 DB（doc_style 表或 feature_flags 擴充）

### 4. 既有 admin 頁面微調
- users 頁面：移除自帶的 max-w-4xl mx-auto p-6，改由 admin layout 處理
- features 頁面：同上，移除自帶容器樣式
- templates 頁面：整頁重寫為配色 + Logo 選擇器

## Non-Goals

- 不做文件模板的所見即所得編輯器
- 不做多租戶配色方案管理（每個客戶只有一套）
- 不做 dark mode 切換（整個 app 統一 light mode）
- 不改動 Sidebar 元件本身的樣式或行為

## Impact

- Affected specs: template-management, feature-toggle, user-account-management
- Affected code:
  - New: src/app/admin/layout.tsx, src/components/AdminBreadcrumb.tsx, src/components/ColorSchemeSelector.tsx, src/components/LogoUploader.tsx
  - Modified: src/app/admin/users/page.tsx, src/app/admin/features/page.tsx, src/app/admin/templates/page.tsx, src/app/api/admin/templates/route.ts, src/app/api/admin/templates/[id]/route.ts
  - Removed: src/lib/template-engine.ts（Handlebars 模板引擎不再需要）
