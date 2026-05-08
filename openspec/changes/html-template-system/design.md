## Context

客戶要求文件產出可自訂排版樣式。目前系統用固定 HTML 模板產出不動產說明書，需要改為可替換的模板機制。系統已有 Puppeteer 基礎設施（用於現有 PDF 產出），SQLite 資料庫，Next.js API Routes。

## Goals / Non-Goals

**Goals:**

- 管理員可上傳、管理多套 HTML 模板
- 模板支援變數插值（物件欄位自動帶入）
- 業務可預覽模板 + 實際資料的渲染效果
- 一鍵匯出 PDF

**Non-Goals:**

- 不做 WYSIWYG 編輯器
- 不做模板版本控管
- 不改動 AI 生成邏輯

## Decisions

### D1: 模板儲存方式

模板 metadata 存在 SQLite `templates` 表（id, name, description, is_default, created_at, updated_at），HTML 內容存在檔案系統 `data/templates/{id}.html`。理由：HTML 檔案可能較大（含內嵌 CSS/圖片 base64），存檔案比存 BLOB 更易除錯和備份。

表結構：
```sql
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  doc_type TEXT NOT NULL DEFAULT 'disclosure',
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### D2: 模板變數語法

採用 Mustache 雙大括號語法 `{{variable_name}}`。變數名稱對應物件的欄位 key（如 `{{address}}`、`{{total_price}}`、`{{ownership_scope}}`）。用 Handlebars 套件（`handlebars`）做模板編譯和渲染，因為它支援條件判斷 `{{#if}}` 和迴圈 `{{#each}}`，比純字串替換更靈活。

可用變數來自三個來源合併：
1. `field_visit_data` JSON（現勘欄位）
2. `supplementary_data` JSON（補充資料）
3. `pre_commission_data` JSON（委託前資料）
4. listing 基本欄位（property_type, status, created_at）

### D3: 預覽 API 設計

預覽 API `POST /api/documents/preview`，接收 `{ listingId: number, templateId: number }`，回傳渲染後的完整 HTML 字串。前端用 iframe sandbox 顯示預覽結果，避免模板 CSS/JS 影響主頁面。iframe 使用 `srcdoc` 屬性直接注入 HTML，不需要額外 URL。

### D4: PDF 匯出流程

PDF 匯出 API `POST /api/documents/export-pdf`，接收 `{ listingId: number, templateId: number }`。流程：讀取模板 → 合併物件資料 → Handlebars 渲染 → Puppeteer `page.setContent(html)` → `page.pdf()` → 回傳 PDF binary（Content-Type: application/pdf）。

PDF 設定：A4 尺寸、含頁首頁尾（可在模板中用 `@page` CSS 控制）、邊距 15mm。

### D5: 模板上傳驗證

上傳時驗證：(a) 檔案副檔名為 .html 或 .htm；(b) 檔案大小上限 2MB；(c) 內容必須包含至少一個 `{{` 變數標記；(d) 用 DOMPurify 在 server 端清理惡意 script 標籤（保留 style 標籤）。

### D6: 預設模板機制

每種文件類型（doc_type）最多一個預設模板。設定新預設時，先將同 doc_type 的其他模板 `is_default = 0`，再設定目標模板 `is_default = 1`。若刪除預設模板，不自動指派新預設。產出文件時若無預設模板，使用系統內建的 fallback 模板（現有的固定模板）。

## Risks / Trade-offs

- Handlebars 模板語法對非技術用戶有門檻，但搭配範例模板和變數對照表可降低學習成本
- iframe sandbox 預覽無法完美模擬 PDF 分頁效果，但足以驗證排版和資料正確性
- 檔案系統儲存 HTML 在 Docker 部署時需要 volume mount，已有 data/ 目錄的 volume 配置可復用
