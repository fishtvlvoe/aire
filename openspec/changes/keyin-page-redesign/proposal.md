## Why

目前補件/Key-in 流程是以 popup dialog（`CaseSupplementDialog`）呈現，畫面空間受限，無法同時顯示說明書預覽，業務助理必須來回切換才能確認填入結果。本次改為左右分割獨立頁，左側填資料、右側即時預覽，消除切換成本並加入斷電安全的自動儲存。

## What Changes

- 新增 `/cases/[id]/keyin` 獨立頁面，取代 `CaseSupplementDialog` popup 流程
- 左側：待填清單（文字欄位、勾選、照片上傳、格局圖縮圖），沿用 `DisclosureFormResidential` / `DisclosureFormLand` 的 `onChange` prop
- 右側：HTML 說明書即時預覽（React 元件），**移除** `PdfPreviewer` iframe，改用 HTML 模板渲染
- 擴充 `useDraftAutosave`：加入 15 秒 interval 存檔，保留現有 debounce 2s + 離開前 flush
- Rust 層：`save_draft` / `get_draft` 直接沿用；確認 SQLite 以 WAL 模式開啟（`PRAGMA journal_mode=WAL`）
- 重開 app 時若偵測到草稿殘存 → 顯示「還原未儲存草稿」toast
- **移除** `CaseSupplementDialog` 作為補件入口（案件列表的補件按鈕改導向 `/cases/[id]/keyin`）

## Non-Goals

- 不修改 PDF 輸出引擎
- 不改變 SQLite `disclosure_drafts` 表結構（欄位保持不動）
- 不加入格局圖 AI 辨識（由 `field-sketch-floor-plan-conversion` change 負責）
- 不做即時協作或雲端同步

## Capabilities

### New Capabilities

- `keyin-split-page`: 左右分割 Key-in 獨立頁面，含左側填寫面板與右側 HTML 即時預覽

### Modified Capabilities

- `case-supplement`: 補件入口從 CaseSupplementDialog popup 改為導向 `/cases/[id]/keyin` 獨立頁面（**BREAKING**：dialog 廢棄）
- `disclosure-html-preview`: 右側預覽改為嵌入 keyin 頁內的 HTML 即時預覽元件，不再是獨立的 preview 路由

## Impact

- Affected specs: `keyin-split-page`（新建）、`case-supplement`（修改）、`disclosure-html-preview`（修改）
- Affected code:
  - New: `src/app/(dashboard)/cases/[id]/keyin/page.tsx`
  - New: `src/components/KeyinSplitPage.tsx`
  - New: `src/components/DisclosureHtmlPreview.tsx`
  - Modified: `src/lib/use-draft-autosave.ts`
  - Modified: `src/components/CaseListActions.tsx`
  - Modified: `src-tauri/src/main.rs`（WAL pragma 確認）
  - Removed: `src/components/CaseSupplementDialog.tsx`（補件 dialog，廢棄）
  - Removed: `src/components/PdfPreviewer.tsx`（右側 iframe，廢棄）
