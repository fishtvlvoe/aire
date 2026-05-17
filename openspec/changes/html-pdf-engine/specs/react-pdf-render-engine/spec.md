## REMOVED Requirements

### Requirement: react-pdf Document 渲染

**Reason:** `@react-pdf/renderer` v4.5.1 的 CJK 字型子集化引擎有根本性缺陷，嵌入字型表損壞導致中文亂碼。已被 html-pdf-renderer 取代。

**Migration:** 所有 PDF 渲染改用 `src/lib/pdf-engine/html-renderer.tsx` 的 `renderDisclosureHtml()` 函式。資料組裝層（assemble-dossier-data.ts）不變。主題 token 系統保留，只改渲染實作。

#### Scenario: 移除後系統行為

- **WHEN** 系統需要產出 PDF
- **THEN** 使用 html-pdf-renderer + html-pdf-export 模組
- **THEN** 不再 import @react-pdf/renderer 任何 API
