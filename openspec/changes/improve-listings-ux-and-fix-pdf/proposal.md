## Why

目前物件流程有四個實測出的問題影響可用性：PDF 下載 500（`__dirname` 在 Turbopack 解析為 `/ROOT/` 假路徑）、填完表單按「下一頁」按鈕灰掉卻沒說缺哪裡、產出 5 份文件後必須重跑整個流程才能回到文件頁、再次進入編輯時已填資料全部消失。這些是交付前必修的阻塞級缺陷，客戶已反映操作極不直覺。

## What Changes

- **修正** `src/lib/pdf-generator/dossier.ts:6` 的 `TEMPLATES_DIR` 解析方式：`path.join(__dirname, 'templates')` → `path.join(process.cwd(), 'src/lib/pdf-generator/templates')`，解決 Next.js 16 + Turbopack 下 `__dirname` 失效導致的 `ENOENT` 500 錯誤。
- **修改** `src/components/forms/FieldVisitForm.tsx` 的章節 badge 行為：顯示「已填總數/總欄數」（含非必填），必填未填時另加紅色小圓點警示；移除按鈕灰掉限制，改為按了才跳對應章節 + 高亮缺欄 + 頁首橫幅提示。
- **修改** `src/app/listings/[id]/fill/page.tsx` 的按鈕 `disabled` 邏輯，僅保留 `submitting` 判斷；新增驗證失敗時自動切章節與橫幅顯示。
- **新增** `src/components/Stepper.tsx` 元件：5 格進度條（選類型/現勘/補件/產生中/文件輸出），綠=已完成、藍=當前、灰=未達；已達或當前的格子可點擊跳轉。
- **修改** 4 個 `src/app/listings/[id]/*/page.tsx`（fill、supplementary、generating、documents）頂部掛載 Stepper。
- **修改** `src/app/listings/page.tsx` 列表：按 `listing.status` 決定地址與按鈕跳 `/fill`（未完成）或 `/documents`（`documents-ready`），按鈕文案同步改為「進入填寫」或「查看文件」。
- **修改** `src/components/Sidebar.tsx`：下方新增「最近物件」區塊，展示最近 5 筆（created_at desc），每筆依狀態跳對應頁（同上邏輯）。
- **修改** `src/components/forms/FieldVisitForm.tsx` 新增 `initialData?: Record<string, unknown>` prop；`src/app/listings/[id]/fill/page.tsx` 將 `listing.field_visit_data` 解析後傳入，解決再次編輯時資料消失的 Bug。

## Non-Goals

- **不重寫 `disclosure_document` PDF 版型**：本 change 只修 PDF 產出的 `ENOENT` 載入失敗，不動 `dossier.html` / `dossier.css` 的 template 內容；客戶要的「16 份範例制式表單版型」規模獨立，留給後續 change `rewrite-disclosure-pdf-to-statutory-form` 處理。
- **不動 LLM prompt 與產出內容結構**：`disclosure_document` 欄位仍維持現有 Markdown 格式，不改成結構化 JSON。
- **不引入 global state 管理**（Zustand/Redux）：Stepper 狀態與最近物件清單皆用既有 fetch pattern（直接打 `/api/listings`）。
- **不改變 `listing.status` 的狀態機**：Stepper 的可點規則直接映射既有四個狀態，不新增中間態。
- **不做表單自動儲存（autosave）**：E 議題只修「再次進入時回填」，不做「編輯時即時儲存」。
- **不改 `/listings/new` 頁面**：Stepper 第 1 格顯示狀態即可，不修改新增物件頁的 UI。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `listing-ui-flow`：新增頂部 5 格進度條 Stepper 的導航需求；新增列表頁按 listing.status 跳對應頁的路由規則；新增側邊欄顯示最近 5 筆物件的需求。
- `field-visit-form`：修改章節 badge 需求為「已填總數/總欄數 + 必填紅點」；新增初始資料回填需求（`initialData` prop）；修改「下一步」提交按鈕行為為始終可點、驗證失敗時自動切章節 + 高亮缺欄 + 橫幅提示。
- `property-dossier`：修改 PDF template 載入路徑需求，使其在 Turbopack bundling 下仍能正確解析檔案位置。

## Impact

- **Affected specs**:
  - `openspec/specs/listing-ui-flow/spec.md`（modified — 新增 Stepper、列表狀態路由、Sidebar 最近物件三個 requirement delta）
  - `openspec/specs/field-visit-form/spec.md`（modified — badge 顯示、initialData 回填、提交按鈕行為三個 requirement delta）
  - `openspec/specs/property-dossier/spec.md`（modified — PDF template 載入路徑 requirement delta）
- **Affected code**:
  - `src/lib/pdf-generator/dossier.ts`（A）
  - `src/components/Sidebar.tsx`（D3）
  - `src/components/Stepper.tsx`（D1，新檔）
  - `src/components/forms/FieldVisitForm.tsx`（C、D4、E）
  - `src/app/listings/page.tsx`（D2）
  - `src/app/listings/[id]/fill/page.tsx`（C、D1、E）
  - `src/app/listings/[id]/supplementary/page.tsx`（D1）
  - `src/app/listings/[id]/generating/page.tsx`（D1）
  - `src/app/listings/[id]/documents/page.tsx`（D1）
- **Dependencies 新增**：無（不引入新 npm 套件）
- **環境變數新增**：無
