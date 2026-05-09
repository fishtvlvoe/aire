## Context

AIRE 是房產文件系統，使用 Next.js 16 + Tailwind CSS 4.x。目前 admin 頁面（/admin/users、/admin/features、/admin/templates）沒有包在主 layout 裡，導致缺少 Sidebar、背景色和導航。模板設定功能過於複雜（上傳 HTML），需要簡化為配色選擇器。

現有 listings 頁面的 layout 結構：
- 外層：`min-h-screen bg-[#F5F6FA] font-['Manrope'] text-[#2D3142]`
- 內層：`flex w-full`，左側 Sidebar（w-64, bg-[#1B3A6B]），右側 `main.flex-1.p-8`
- 內容卡片：`rounded-lg bg-white p-6 shadow-[0_8px_24px_rgba(45,49,66,0.08)]`

## Goals / Non-Goals

**Goals:**
- 所有 admin 頁面視覺風格與 listings 頁面一致
- 客戶能用最簡單的方式設定文件產出樣式（選底色 + 上傳 Logo）
- 頁面間有清楚的導航路徑

**Non-Goals:**
- 不做 HTML 模板編輯器
- 不做 dark mode
- 不改 Sidebar 元件本身

## Decisions

### D1: Admin Layout 架構

建立 `src/app/admin/layout.tsx` 作為所有 /admin/* 路由的共用 layout。

結構：
```tsx
<div className="min-h-screen bg-[#F5F6FA] font-['Manrope'] text-[#2D3142]">
  <div className="flex w-full">
    <Sidebar />
    <main className="flex-1 p-8 min-w-0">
      <section className="rounded-lg bg-white p-6 shadow-[0_8px_24px_rgba(45,49,66,0.08)]">
        {children}
      </section>
    </main>
  </div>
</div>
```

理由：Next.js 的嵌套 layout 機制讓所有 /admin/* 頁面自動共享此結構，不需在每個頁面重複。

### D2: 返回導航元件

建立 `src/components/AdminBreadcrumb.tsx`，放在每個 admin 頁面頂部（section 內部第一行）。

規格：
- 顯示文字：「← 返回物件列表」
- 連結目標：/listings
- 樣式：`text-sm text-slate-500 hover:text-[#1B3A6B] transition mb-4 inline-flex items-center gap-1`
- 圖示：Lucide 的 ChevronLeft（16x16）
- 不使用 browser back，固定連結到 /listings

### D3: 配色方案選擇器

建立 `src/components/ColorSchemeSelector.tsx`。

資料結構：
```ts
interface ColorScheme {
  id: string;          // 'navy' | 'slate' | 'warm' | 'forest' | 'white' | 'burgundy'
  name: string;        // 顯示名稱
  headerBg: string;    // 文件頁首背景色（hex）
  headerText: string;  // 文件頁首文字色（hex）
  accentColor: string; // 裝飾線/邊框色（hex）
}
```

預設 6 種配色方案（硬編碼在元件內）：
1. **深藍經典**：headerBg=#1B3A6B, headerText=#FFFFFF, accentColor=#2563EB
2. **石板灰**：headerBg=#334155, headerText=#FFFFFF, accentColor=#64748B
3. **暖棕**：headerBg=#78350F, headerText=#FFFFFF, accentColor=#D97706
4. **森林綠**：headerBg=#14532D, headerText=#FFFFFF, accentColor=#16A34A
5. **純白簡約**：headerBg=#FFFFFF, headerText=#1E293B, accentColor=#3B82F6
6. **酒紅**：headerBg=#7F1D1D, headerText=#FFFFFF, accentColor=#DC2626

UI 呈現：6 個色塊卡片排成 2 行 3 列（grid grid-cols-3 gap-4），每個卡片高度 80px，上半部顯示 headerBg 顏色，下方顯示方案名稱。選中的卡片加粗邊框（ring-2 ring-[#1B3A6B]）。

### D4: Logo 上傳

建立 `src/components/LogoUploader.tsx`。

規格：
- 接受格式：PNG、JPG、SVG（透過 input accept 屬性限制）
- 大小上限：1MB
- 上傳後顯示預覽（object-fit: contain，最大 120x60px）
- 儲存位置：data/branding/logo.{ext}（覆寫舊檔案）
- 提供「移除 Logo」按鈕
- 無 Logo 時顯示虛線框 + 上傳提示

### D5: 文件樣式儲存機制

在 DB 的 feature_flags 表中新增兩筆紀錄：
- key='doc_color_scheme', value='{scheme_id}'（預設 'navy'）
- key='doc_logo_path', value='{file_path_or_empty}'

API 路由：
- GET /api/admin/templates → 回傳 { colorScheme: string, logoPath: string }
- PATCH /api/admin/templates → 接受 { colorScheme?: string }，更新 feature_flags
- POST /api/admin/templates/logo → multipart/form-data 上傳 Logo 檔案
- DELETE /api/admin/templates/logo → 刪除 Logo 檔案 + 清空 DB 紀錄

### D6: 模板管理頁面新 UI

重寫 `src/app/admin/templates/page.tsx`：

頁面結構（上下排列）：
1. AdminBreadcrumb
2. 頁面標題「文件樣式設定」+ 說明文字
3. 配色方案區塊：標題「選擇配色方案」+ ColorSchemeSelector
4. Logo 區塊：標題「公司 Logo」+ LogoUploader
5. 儲存按鈕（置底，bg-[#1B3A6B]）

載入時：GET /api/admin/templates 取得現有設定，預填選項。
儲存時：PATCH /api/admin/templates 更新配色，Logo 獨立上傳。

### D7: 既有頁面調整

users/page.tsx 和 features/page.tsx：
- 移除外層的 `max-w-4xl mx-auto p-6`（或 `p-8 max-w-4xl`）容器 div
- 內容直接渲染，由 admin layout 的白色卡片容器包裹
- 頂部加入 `<AdminBreadcrumb />`

### D8: 移除項目

- 刪除 src/lib/template-engine.ts（Handlebars 引擎不再使用）
- 刪除 src/components/TemplatePreview.tsx（iframe 預覽不再使用）
- 移除 package.json 中的 handlebars 依賴
- data/templates/ 目錄不再使用（可保留不刪）
