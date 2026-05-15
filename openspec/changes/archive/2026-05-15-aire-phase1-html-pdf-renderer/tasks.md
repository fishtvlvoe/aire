## 1. Backend：branding SQLite 持久層 + IPC commands

- [x] [P] 1.1 寫 `src-tauri/migrations/002_branding.sql` 建 branding 表（id PRIMARY KEY CHECK = 1, logo_blob BLOB, logo_mime TEXT, logo_uploaded_at TEXT, theme_id TEXT NOT NULL DEFAULT 'theme-a-minimal', updated_at TEXT）符合 Decision 6: Logo 儲存採 SQLite BLOB（非檔案系統 + 路徑）。行為：migration 跑完後預設 row 自動寫入（id=1, theme_id='theme-a-minimal', logo_blob=NULL）。驗證：`cargo test branding::migration::tests::default_row_created` 通過。
- [x] [P] 1.2 在 `src-tauri/src/branding/mod.rs` 實作 4 個 IPC commands：`save_logo(bytes, mime)` / `load_logo()` / `delete_logo()` / `set_theme(theme_id)` / `get_theme()`。對應 Requirement: Logo SHALL persist as SQLite BLOB in the branding table + Backend SHALL re-validate logo bytes are a valid PNG or JPG + delete_logo SHALL clear the BLOB without removing the row + Theme switch SHALL persist via Tauri IPC and re-render preview。`save_logo` 內部呼叫 `image::load_from_memory` 二次驗證合法 PNG/JPG，失敗回 `LogoUploadError::CorruptedImage`；`set_theme` 寫入後 emit `branding-changed` event。驗證：`cargo test branding::commands::tests` 全綠（含 save/load/delete/set_theme/get_theme/corrupted_image_rejected 共 6 case）。

## 2. PDF 引擎核心 + 字型註冊

- [x] 2.1 在 `src/lib/pdf-engine/index.ts` 初始化 `@react-pdf/renderer` 引擎 + 註冊 NotoSansTC subset 字型（Decision 1: PDF 引擎採 @react-pdf/renderer（非 Puppeteer / pdf-lib / jsPDF））。行為：`Font.register({ family: 'NotoSansTC', src: '/resources/fonts/NotoSansTC-Subset.ttf' })`，regular + bold 都指向同一 subset，並設為全域 default font family。對應 Requirement: System SHALL register NotoSansTC subset font with @react-pdf/font + Embedded Traditional Chinese font。驗證：`npm test src/lib/pdf-engine/__tests__/font.test.ts` 通過（含 NotoSansTC family registered + 中文字 sample 無 tofu 二 case）。
- [x] 2.2 在 `src/lib/pdf-engine/index.ts` 實作 `renderDisclosurePdf(caseData, theme, logo) -> Promise<Blob>` entry。對應 Requirement: Engine SHALL expose a single render entry returning a Blob + Engine SHALL output PDF version 1.4 compatible files + Empty case data SHALL produce a typed validation error。行為：先驗 caseData 含 caseId/caseType/propertyName，缺一回 `PdfRenderError::EngineFailure`；通過後組裝 `<PDFDocument>` 用 ThemeProvider 包住 + 傳 logo binary → 回 Blob (`type: 'application/pdf'`)，不寫任何檔案到 disk。驗證：`npm test src/lib/pdf-engine/__tests__/render-entry.test.tsx` 全綠（含 returns Blob / no-disk-write / typed-error-on-empty-data / pdf-1.4-header 共 4 case）。
- [x] 2.3 在 `src/lib/pdf-engine/index.ts` 加 `PdfRenderError` typed error class + 包裝內部 @react-pdf 例外。對應 Requirement: Engine SHALL surface a typed error when rendering fails + Failure modes during export（modified）。驗證：mock @react-pdf throw → 取得 `PdfRenderError::EngineFailure` 且 cause 含原訊息。

## 3. 主題系統 + 雙主題實作

- [x] [P] 3.1 在 `src/lib/pdf-themes/types.ts` 定義 `PdfTheme` 介面（id / displayName / description / Cover / Header / Footer / Section / Table / tokens）含 version 欄位（'1' 預留 Phase 2 補充包向後相容）+ 在 `src/lib/pdf-themes/registry.ts` 實作 `registerTheme(theme)` / `getTheme(id)` / `listThemes()` 純函式（module-scope 狀態，無 React context）。對應 Decision 2: 主題系統採「Theme Provider + 註冊表」可插拔架構（非寫死 if/else） + Requirement: System SHALL expose registerTheme / getTheme / listThemes APIs。驗證：`npm test src/lib/pdf-themes/__tests__/registry.test.ts` 通過（含 register / get / list / re-register-replaces 共 4 case）。
- [x] [P] 3.2 在 `src/lib/pdf-themes/theme-provider.tsx` 實作 `<ThemeProvider theme>` + `useTheme()` hook。對應 Requirement: ThemeProvider SHALL inject theme into PDF Document tree + Decision 11: UX 互動模式 — 與 OPCOS 共用行為規則（unknown theme fallback 文案統一）。`useTheme` 在 provider 外呼叫拋 `ThemeError::ProviderMissing`。驗證：`npm test src/lib/pdf-themes/__tests__/theme-provider.test.tsx` 全綠（含 useTheme outside throws / Cover reads theme.tokens.colors.primary 二 case）。
- [x] 3.3 在 `src/lib/pdf-themes/theme-a-minimal/index.tsx` 實作 A 淡雅主題包：Cover / Header / Footer / Section / Table 五個元件 + tokens（白底 / 灰邊 / 黑灰文字 / 藍強調）。對應 Decision 3: 雙主題出貨採 A 淡雅 + C 科技優雅（不出 B 商務） + Requirement: Theme components SHALL replace PNG template background。視覺對齊 `mockups/pdf-themes/theme-a-minimal/`。驗證：手動產 PDF + Playwright 截圖 vs `mockups/pdf-themes/theme-a-*.png` pixel diff < 5% + 確認 A 主題渲染含 thin top border View 但無背景圖檔載入。
- [x] 3.4 在 `src/lib/pdf-themes/theme-c-tech-elegant/index.tsx` 實作 C 科技優雅主題包：五元件 + tokens（深藍 / 粉漸層 / 金邊裝飾）。對應 Theme C draws tech-elegant background components scenario。視覺對齊 `mockups/pdf-themes/theme-c-tech-elegant/`。驗證：截圖 vs mockup pixel diff < 5%。
- [x] 3.5 在 `src/lib/pdf-themes/registry.ts` 模組載入時呼叫 `registerTheme(themeA)` + `registerTheme(themeC)` 註冊雙主題。對應 Requirement: System SHALL ship two built-in themes (A minimal + C tech-elegant)。驗證：`listThemes()` 載入後回兩個 theme，id 為 theme-a-minimal / theme-c-tech-elegant。
- [x] 3.6 實作 unknown theme fallback：當 `branding.theme_id` 不在 registry 時，PDF 引擎使用 theme-a-minimal 渲染 + UI 顯示「主題已不存在，已切換至預設主題」+ console.warn。對應 Requirement: Unknown theme id SHALL fall back to theme-a-minimal with warning。驗證：mock branding 表寫入 `theme_id = 'theme-uninstalled'` → 預覽渲染用 A + UI 顯示警示 banner。

## 4. AI 標誌（每主題必含）

- [x] [P] 4.1 在 `src/lib/pdf-blocks/ai-badge.tsx` 實作 `<AiBadge>` 元件，從 `useTheme()` 取得 badge 樣式（A 藍實心、C 綠藍漸層）+ 固定文字 "AI" + 固定位置右上角。對應 Decision 9: AI 標誌右上保留為 AIRE 產品識別 + Requirement: AI badge SHALL be drawn by every theme as a fixed identity mark。主題包不能 opt out（badge 元件由共用 PageHeader 統一插入）。驗證：`npm test src/lib/pdf-blocks/__tests__/ai-badge.test.tsx` 通過（A 主題渲染 → 找到 "AI" text in circular View at top-right；C 主題同）。

## 5. Logo 上傳元件 + 兩個錨點

- [x] [P] 5.1 在 `src/components/LogoUploader.tsx` 實作 Logo 上傳 UI：`<input type="file" accept="image/png,image/jpeg">` + onChange 即時驗 `file.size > 2097152` 跳錯 + 驗 `file.type` 非 PNG/JPG 跳錯（Decision 5: Logo 客戶端 size 驗證 + reject（非自動壓縮））。對應 Requirement: Client SHALL reject logo files larger than 2 MiB before IPC + Client SHALL reject non-PNG / non-JPG files before IPC。錯誤文案採 OPCOS 統一（Decision 11: UX 互動模式 — 與 OPCOS 共用行為規則）。通過驗證才呼叫 IPC `save_logo`。驗證：Playwright `e2e/logo-upload.spec.ts` 跑「3 MiB 拒、SVG 拒、1.9 MiB 通過」三 case。
- [x] 5.2 在 `src/lib/pdf-blocks/page-header.tsx` + `src/lib/pdf-blocks/cover.tsx` 渲染 logo 於兩個錨點（封面 80×30mm View / 頁眉 25×15mm View），使用 `objectFit: 'contain'` 等效（@react-pdf 用 width/height + Image 配合）保證等比縮放 + 留白不裁切（Decision 4: Logo 兩個固定錨點（封面 80×30mm + 頁眉 25×15mm））。對應 Requirement: Logo SHALL render at fixed cover anchor 80×30mm with proportional scaling + Logo SHALL render at fixed header anchor 25×15mm on every page + Customer logo SHALL coexist with theme background without overlap。驗證：`npm test src/lib/pdf-blocks/__tests__/logo-anchor.test.tsx` 全綠（1080×1080 PNG 渲染於 80×30 框內 + 12 頁 PDF 每頁 header 都有 logo + 主題背景不重疊 logo 錨點 三 case）。
- [x] 5.3 在 `src/lib/pdf-blocks/cover.tsx` + `src/lib/pdf-blocks/page-header.tsx` 加未設 logo 的 placeholder 渲染：兩個錨點若 `logo` 為 null 顯示 Text「（未設定 LOGO）」灰色字。對應 Requirement: Missing logo SHALL render placeholder text in anchor。驗證：null logo 渲染 → 兩錨點都有「（未設定 LOGO）」Text。

## 6. PDF 區塊元件 + 動態頁數

- [x] [P] 6.1 在 `src/lib/pdf-blocks/cover.tsx` 實作封面區塊：標題 / 副標 / 物件編號 / 物件名稱 / 摘要 10 點 list / 經紀人 4 欄表格 / 公司資訊 / 客戶 logo / AI 標誌。從 `useTheme()` 取樣式。驗證：`npm test src/lib/pdf-blocks/__tests__/cover.test.tsx` 全綠。
- [x] [P] 6.2 在 `src/lib/pdf-blocks/basic-info.tsx` + `src/lib/pdf-blocks/location-map.tsx` 實作兩個固定頁。對應 Requirement: System SHALL compose 4 fixed pages plus 1-15 dynamic pages（fixed pages 部分）。驗證：兩元件單元測試通過。
- [x] [P] 6.3 在 `src/lib/pdf-blocks/photo-gallery.tsx` 實作現況照片頁，每頁 4 張 2×2 grid，自動分頁（Decision 7: 動態頁數採「依資料條件渲染 + 自動分頁」（非固定模板插值））。對應 Requirement: PhotoGallery SHALL paginate at 4 photos per page。驗證：`npm test src/lib/pdf-blocks/__tests__/photo-gallery.test.tsx` 全綠（5 張 → 2 頁、8 張 → 2 頁全滿 二 case）。
- [x] 6.4 在 `src/lib/pdf-blocks/condition-survey.tsx` 實作房屋現況調查表 5 頁 + 土地版本對應，依 `caseData.caseType` 自動選擇。對應 Requirement: Condition Survey SHALL select residential or land variant by case type + Section breaks SHALL respect React PDF wrap and break props。內部使用 `wrap={true}` 讓 30+ row 長表格自動分頁、`break={true}` 強制起新頁。驗證：`npm test src/lib/pdf-blocks/__tests__/condition-survey.test.tsx` 全綠（residential 含 "建物用途" 不含 "土地使用分區"、land 反之、長表格 wrap 二 case）。
- [x] [P] 6.5 在 `src/lib/pdf-blocks/life-amenities.tsx` 實作生活機能頁（地圖 + POI 標籤）+ 在 `src/lib/pdf-blocks/conditional-section.tsx` 實作 `<ConditionalSection condition>` wrapper（condition 為 false 不產生任何 PDF node）。對應 Requirement: ConditionalSection SHALL skip rendering when condition is false。驗證：`npm test src/lib/pdf-blocks/__tests__/conditional-section.test.tsx` 全綠（false 條件 0 個 PDF node、true 條件正常渲染 二 case）。
- [x] 6.6 在 `src/lib/pdf-blocks/page-footer.tsx` 實作頁尾：用 @react-pdf `<Text render={({ pageNumber, totalPages }) => \`第 ${pageNumber} 頁 / 共 ${totalPages} 頁\`}>` 顯示頁碼 + 公司資訊一行。對應 Requirement: Page numbering SHALL be auto-computed and shown in footer。驗證：12 頁 PDF 渲染 → page 1 含「第 1 頁 / 共 12 頁」、page 12 含「第 12 頁 / 共 12 頁」。
- [x] 6.7 在 `src/lib/pdf-engine/document.tsx` 組裝 `<PDFDocument>` 根元件依 caseData 動態插入 fixed pages（Cover / Basic Info / Location Map）+ ConditionalSection 包裹 dynamic pages。對應 Requirement: System SHALL compose 4 fixed pages plus 1-15 dynamic pages + Section breaks SHALL respect React PDF wrap and break props。驗證：`npm test src/lib/pdf-engine/__tests__/document.test.tsx` 全綠（minimum residential = 5 頁、maximum land = 19 頁 二 case）。

## 7. PDF 預覽 + 下載 UI

- [x] [P] 7.1 在 `src/components/PdfPreviewer.tsx` 實作預覽元件：呼叫 `renderDisclosurePdf` → `URL.createObjectURL(blob)` → 內嵌 React PDF Viewer 顯示（Decision 8: PDF 預覽採記憶體渲染 + React PDF Viewer（非預存檔再開））。對應 Requirement: Preview SHALL render to Blob in memory without temp files + Preview SHALL show first page within 3 seconds for typical cases。loading 階段顯示「PDF 產生中…」OPCOS 三態 UI；元件 unmount 時 `URL.revokeObjectURL` 釋放。驗證：Playwright `e2e/pdf-preview.spec.ts` 跑「10 頁案件預覽 < 3 秒 + 無 tmp 檔殘留 + unmount 後 URL revoked」三 case。
- [x] 7.2 在 `src/components/PdfPreviewer.tsx` 加「下載 PDF」按鈕：點擊呼叫 Tauri `dialog.save` 限副檔名 .pdf → 寫入 blob bytes 到使用者選的路徑。對應 Requirement: Preview SHALL provide download button writing to user-chosen path。驗證：Playwright `e2e/pdf-download.spec.ts` 跑「選 ~/Downloads/test.pdf 寫成功 + 取消對話框不寫檔 二 case」。
- [x] 7.3 在 `src/components/PdfPreviewer.tsx` 訂閱 Tauri event `branding-changed`，主題或 logo 改變時自動重渲染預覽。對應 Requirement: Preview SHALL re-render on branding-changed event。驗證：Playwright `e2e/preview-live-reload.spec.ts` 跑「A 主題開預覽 → 另 tab set_theme C → 預覽 < 3 秒切到 C」。
- [x] 7.4 在 `src/components/PdfPreviewer.tsx` 加 typed error UI：捕 `PdfRenderError` → 顯示 error block（code / 訊息 / 「重試」按鈕）+ console.error 原 error。對應 Requirement: Preview SHALL display typed error UI when rendering fails。驗證：mock 引擎拋 EngineFailure → UI 顯示「PDF 產生失敗，請聯繫客服」+ 重試按鈕；點重試重新 invoke render。

## 8. UI 整合（branding 設定頁 + 案件預覽路由）

- [x] [P] 8.1 在 `src/components/ThemeSelector.tsx` 實作主題選擇 UI：listThemes() 取得所有主題 → 卡片橫排（每張顯示 displayName + thumbnail + description）→ 點選呼叫 IPC `set_theme(theme_id)`。對應 Decision 3: 雙主題出貨採 A 淡雅 + C 科技優雅 + Decision 11: UX 互動模式 — 與 OPCOS 共用行為規則（卡片選擇 hover / selected / disabled 三態）。驗證：Playwright `e2e/theme-selector.spec.ts` 跑「兩張卡片顯示 + 點 C 卡 → branding.theme_id = 'theme-c-tech-elegant'」。
- [x] 8.2 在 `src/app/(dashboard)/settings/branding/page.tsx` 組合 `<LogoUploader>` + `<ThemeSelector>` 為設定頁。驗證：手動測試 → 上傳 logo + 選主題後返回案件詳情頁產 PDF 兩設定都套用。
- [x] 8.3 在 `src/app/(dashboard)/cases/[id]/preview/page.tsx` 建 PDF 預覽路由，從案件詳情頁「產生 PDF」按鈕導向。驗證：點按鈕 → 跳到預覽路由 + PdfPreviewer 顯示完整 PDF。
- [x] 8.4 在 `src/components/disclosure-form-residential.tsx` + `src/components/disclosure-form-land.tsx` 把舊「產生 PDF」按鈕改為 navigate 到 `/cases/[id]/preview`（既有 IPC 改 thin wrapper 轉派新引擎）。對應 Requirement: disclosure-pdf-render SHALL delegate to react-pdf-render-engine。驗證：grep 確認新版兩元件不再直接 import pdf-lib（`grep "pdf-lib" src/components/disclosure-form-*` 結果為空）。

## 9. UI / UX 統一（OPCOS 共用）

- [x] [P] 9.1 LogoUploader / ThemeSelector / PdfPreviewer 三元件採用 OPCOS 共用 design tokens（色彩、間距、字級）+ lucide-react icon + Noto Sans TC + Inter 字型（Decision 10: UI 設計系統 — 與 OPCOS 共用視覺 token）。驗證：grep 確認新元件無 hardcoded hex 色碼（`grep -rn "#[0-9a-fA-F]\{3,6\}" src/components/LogoUploader.tsx src/components/ThemeSelector.tsx src/components/PdfPreviewer.tsx` 結果為空）+ Playwright 截圖比對 OPCOS 既有元件視覺一致（pixel diff < 5%）。
- [x] 9.2 OPCOS UX 互動驗收 + 更新 `docs/ux-patterns.md`：Logo 過大錯誤文案「Logo 檔案過大，請壓縮後再上傳（限 2 MiB 以下）」、主題選擇卡片三態、PDF 預覽 loading/empty/error 三態 UI、下載成功 toast 一致行為（Decision 11: UX 互動模式 — 與 OPCOS 共用行為規則）。驗證：人工 checklist `docs/ux-patterns.md` 章節「OPCOS html-pdf-renderer 驗收 v1」逐項對照 + PR 描述貼勾選結果（✅/❌ + 截圖路徑）。

## 10. 補充包文件（Phase 2 開發指引）

- [x] 10.1 撰寫 `docs/pdf-theme-pack-spec.md` 補充包開發規格。內容契約：(a) PdfTheme 介面完整定義（含 version 欄位 '1' 與向後相容承諾）、(b) 五個必要元件（Cover / Header / Footer / Section / Table）各自 props 契約、(c) tokens 物件 schema（colors / spacing / fontSize）、(d) 註冊範例完整 code snippet、(e) 版本相容性章節說明後續 v2 介面變更時 default + optional 規則。對應 Requirement: Theme pack documentation SHALL define the public contract。驗證：`grep -c "^## " docs/pdf-theme-pack-spec.md` >= 5（五個段落）+ 主對話 Read 整份文件確認五段內容齊全。

## 11. 廢檔 + Cargo / package 依賴更新

- [x] [P] 11.1 在 `package.json` 加 `@react-pdf/renderer` ^4.x + `@react-pdf/font` ^4.x；在 `src-tauri/Cargo.toml` 加 `image = "0.25"`（後端驗 PNG/JPG）；`npm install` + `cargo build` 通過無錯。驗證：`npm list @react-pdf/renderer` 顯示版本 + `cargo build` 0 錯。
- [x] 11.2 刪除 `src/resources/templates/residential.pdf` + `src/resources/templates/land.pdf` + `src/lib/pdf-layout.ts`；改 `src/lib/pdf-renderer.ts` 為 thin wrapper 轉派 `src/lib/pdf-engine/index.ts`，內部不 import pdf-lib。同時保留 legacy `exportPdfToPath(path)` 簽名作為 thin wrapper 內部 chain `renderDisclosurePdf` + `writeBlobToPath`（對應 REMOVED Requirement: Output file path and post-export behavior 的 migration），舊呼叫端零改動。對應 REMOVED Requirement: PDF template overlay rendering（migration）+ REMOVED: Admin uploads and manages disclosure template background images（migration）+ REMOVED: Failure modes during export（migration，舊 FontMissingOnDisk / TemplateMissingOnDisk / WritePermissionDenied 失敗變體映射到新 PdfRenderError / LogoUploadError / BrandingError）。驗證：`grep -rn "pdf-lib" src/lib/pdf-renderer.ts` 結果為空 + `ls src/resources/templates/` 顯示目錄空（或不存在）+ `grep -rn "FontMissingOnDisk\|TemplateMissingOnDisk\|WritePermissionDenied" src/` 結果為空。

## 12. E2E 整合測試

- [x] [P] 12.1 寫 `e2e/pdf-render.spec.ts` 完整流程：上傳 logo → 選 A 主題 → 預覽 → 下載 → 重開後 logo 與主題仍套用。驗證：Playwright 跑通 + 寫結果到 `e2e/results/pdf-render.json`。
- [x] 12.2 寫 `e2e/pdf-page-count.spec.ts` 動態頁數：minimum residential (0 照片 / 無生活機能) → < 10 頁 + 半動態正確隱藏；maximum land (12 照片 / 全資料) → 15-19 頁 + 土地版調查表生效。對應 Requirement: System SHALL compose 4 fixed pages plus 1-15 dynamic pages。驗證：Playwright 跑通兩 case。
- [x] 12.3 寫 `e2e/theme-pack-pluggable.spec.ts` 補充包可插拔驗證：手動 import stub `theme-test` registerTheme → ThemeSelector 即時多一張卡 + 0 改主程式檔案。對應 Decision 2: 主題系統採「Theme Provider + 註冊表」可插拔架構。驗證：`git diff --name-only` 後 stub 之外無其他主程式檔案改動。
- [x] [P] 12.4 視覺驗收（pixel diff）：A / C 兩主題的封面 + 內頁 PDF 渲染 vs `mockups/pdf-themes/theme-{a,c}-{cover,content}.png` pixel diff < 5%。驗證：`npm run test:visual-parity -- --themes a,c` 全綠 + 截圖路徑寫進 PR 描述。
