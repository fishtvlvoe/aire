## ADDED Requirements

### Requirement: HTML 渲染引擎產出完整 A4 分頁 HTML

系統 SHALL 提供 `renderDisclosureHtml(data, options)` 函式，接收 `CaseDossierData` 和選項（themeId、generatedAt），回傳完整 HTML 字串。HTML 包含 `<html>`、`<head>`（含內嵌 CSS）、`<body>`（含所有頁面 div）。

#### Scenario: 土地版渲染

- **WHEN** 傳入土地版 CaseDossierData（propertyType = "land"）
- **THEN** 回傳的 HTML 包含封面、法規告知、土地標示、權利範圍、使用管制、成交行情、簽章欄等頁面 div
- **THEN** 每個頁面 div 帶有 `page-break-after: always` CSS

#### Scenario: 建物版渲染

- **WHEN** 傳入建物版 CaseDossierData（propertyType = "building"）
- **THEN** 回傳的 HTML 包含封面、法規告知、建物標示、權利範圍、成交行情、簽章欄等頁面 div

### Requirement: CSS @page 規則確保 A4 尺寸

系統 SHALL 在 HTML 的 `<style>` 中包含 `@page { size: A4; margin: 0; }` 規則，確保列印/PDF 輸出為 A4 紙張大小。

#### Scenario: PDF 輸出紙張大小

- **WHEN** HTML 被 Playwright `page.pdf({ format: "A4" })` 處理
- **THEN** 產出的 PDF 每頁尺寸為 210mm × 297mm

### Requirement: CJK 字型正確渲染

系統 SHALL 在 CSS 中設定 `font-family: "Noto Sans TC", "Microsoft JhengHei", "PingFang TC", sans-serif`，確保中文字在所有 PDF viewer 正確顯示。

#### Scenario: Chrome 開啟 PDF 顯示中文

- **WHEN** 產出的 PDF 用 Chrome 瀏覽器開啟
- **THEN** 所有中文字正確顯示（非亂碼、非空白、非方塊）

### Requirement: 主題 token 系統整合

系統 SHALL 根據傳入的 `themeId` 查詢對應的色彩 token（primary、text、textMuted、bg、bgAlt、border），並套用到 HTML 的 CSS 變數或 inline style。

#### Scenario: 主題切換

- **WHEN** themeId 為 "theme-b-professional"
- **THEN** 渲染的 HTML 使用該主題的色彩（primary = #1E3A5F、border = #C9A961 等）

#### Scenario: 不存在的主題 ID

- **WHEN** themeId 為不存在的值
- **THEN** fallback 使用 "theme-a-minimal" 的 token

### Requirement: 元件對等轉換

系統 SHALL 提供以下 HTML 元件，功能對等於現有 react-pdf 元件：HtmlCover（封面）、HtmlPageHeader（頁首）、HtmlPageFooter（頁尾）、HtmlSection（章節容器）、HtmlFieldTable（欄位表格）、HtmlSignatureBlock（簽章��）。

#### Scenario: 封面元件渲染完整欄位

- **WHEN** 傳入 cover 物件包含 propertyName、caseNumber、handlingAgent、licensedAgentName、licensedAgentCertNo、brokerageCompanyName、brokerageLicenseNo、companyAddress、companyPhone
- **THEN** HtmlCover 渲染所有欄位到 HTML 中
