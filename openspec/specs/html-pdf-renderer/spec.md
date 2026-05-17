# html-pdf-renderer Specification

## Purpose

TBD - created by archiving change 'html-pdf-engine'. Update Purpose after archive.

## Requirements

### Requirement: HTML 渲染引擎產出完整 A4 分頁 HTML

系統 SHALL 提供 `renderDisclosureHtml(data, options)` 函式，回傳完整不動產說明書 HTML。土地版包含 12+ 頁（封面、法規、物件資料表、土地標示、費用一覽、增值稅概算、現況調查表多頁、成交行情、生活機能、位置圖、外觀圖、簽章欄）。建物版包含 15+ 頁（含建物瑕疵/設備/管理/停車等額外調查題目）。

#### Scenario: 土地版完整渲染

- **WHEN** 傳入土地版 CaseDossierData（含完整資料）
- **THEN** 回傳 HTML 包含 12 個以上 `class="page"` div
- **THEN** 文字內容包含「物件資料」「費用一覽」「增值稅」「現況調查」「成交行情」「生活機能」關鍵字

#### Scenario: 建物版完整渲染

- **WHEN** 傳入建物版 CaseDossierData
- **THEN** 回傳 HTML 包含 15 個以上 `class="page"` div

---
### Requirement: CSS @page 規則確保 A4 尺寸

系統 SHALL 在 HTML 的 `<style>` 中包含 `@page { size: A4; margin: 0; }` 規則，確保列印/PDF 輸出為 A4 紙張大小。

#### Scenario: PDF 輸出紙張大小

- **WHEN** HTML 被 Playwright `page.pdf({ format: "A4" })` 處理
- **THEN** 產出的 PDF 每頁尺寸為 210mm × 297mm


<!-- @trace
source: html-pdf-engine
updated: 2026-05-17
code:
  - src/lib/pdf-engine/html-components.tsx
  - src/lib/pdf-engine/html-themes.ts
  - scripts/test-html-pdf.ts
  - src/lib/pdf-engine/html-export.ts
  - src/lib/pdf-engine/html-renderer.tsx
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
-->

---
### Requirement: CJK 字型正確渲染

系統 SHALL 在 CSS 中設定 `font-family: "Noto Sans TC", "Microsoft JhengHei", "PingFang TC", sans-serif`，確保中文字在所有 PDF viewer 正確顯示。

#### Scenario: Chrome 開啟 PDF 顯示中文

- **WHEN** 產出的 PDF 用 Chrome 瀏覽器開啟
- **THEN** 所有中文字正確顯示（非亂碼、非空白、非方塊）


<!-- @trace
source: html-pdf-engine
updated: 2026-05-17
code:
  - src/lib/pdf-engine/html-components.tsx
  - src/lib/pdf-engine/html-themes.ts
  - scripts/test-html-pdf.ts
  - src/lib/pdf-engine/html-export.ts
  - src/lib/pdf-engine/html-renderer.tsx
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
-->

---
### Requirement: 主題 token 系統整合

系統 SHALL 根據傳入的 `themeId` 查詢對應的色彩 token（primary、text、textMuted、bg、bgAlt、border），並套用到 HTML 的 CSS 變數或 inline style。

#### Scenario: 主題切換

- **WHEN** themeId 為 "theme-b-professional"
- **THEN** 渲染的 HTML 使用該主題的色彩（primary = #1E3A5F、border = #C9A961 等）

#### Scenario: 不存在的主題 ID

- **WHEN** themeId 為不存在的值
- **THEN** fallback 使用 "theme-a-minimal" 的 token


<!-- @trace
source: html-pdf-engine
updated: 2026-05-17
code:
  - src/lib/pdf-engine/html-components.tsx
  - src/lib/pdf-engine/html-themes.ts
  - scripts/test-html-pdf.ts
  - src/lib/pdf-engine/html-export.ts
  - src/lib/pdf-engine/html-renderer.tsx
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
-->

---
### Requirement: 元件對等轉換

系統 SHALL 提供以下 HTML 元件，功能對等於現有 react-pdf 元件：HtmlCover（封面）、HtmlPageHeader（頁首）、HtmlPageFooter（頁尾）、HtmlSection（章節容器）、HtmlFieldTable（欄位表格）、HtmlSignatureBlock（簽章��）。

#### Scenario: 封面元件渲染完整欄位

- **WHEN** 傳入 cover 物件包含 propertyName、caseNumber、handlingAgent、licensedAgentName、licensedAgentCertNo、brokerageCompanyName、brokerageLicenseNo、companyAddress、companyPhone
- **THEN** HtmlCover 渲染所有欄位到 HTML 中

<!-- @trace
source: html-pdf-engine
updated: 2026-05-17
code:
  - src/lib/pdf-engine/html-components.tsx
  - src/lib/pdf-engine/html-themes.ts
  - scripts/test-html-pdf.ts
  - src/lib/pdf-engine/html-export.ts
  - src/lib/pdf-engine/html-renderer.tsx
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
-->
