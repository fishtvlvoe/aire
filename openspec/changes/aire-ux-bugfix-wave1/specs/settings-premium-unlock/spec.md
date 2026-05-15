## ADDED Requirements

### Requirement: admin-auto-unlock-mcp-hub

WHEN the currently authenticated user has role `admin`
THEN the 實價登錄 MCP Hub card on the settings page SHALL display status "已啟用（管理員）"
AND the "前往訂閱" button SHALL NOT be shown
AND no subscription check or payment API call SHALL be made

#### Scenario: Admin sees unlocked state

WHEN an admin user (role === "admin") navigates to 設定 > 進階功能
THEN the 實價登錄 MCP Hub card SHALL render with label "已啟用（管理員）"
AND the "前往訂閱" button SHALL NOT be present in the DOM

##### Example:
- Input: sessionUser = { email: "admin@test.aire", role: "admin" }
- Output: card shows "已啟用（管理員）"; no button with text "前往訂閱"

#### Scenario: Non-admin still sees subscription gate

WHEN a non-admin user (role !== "admin") navigates to 設定 > 進階功能
AND the user does not have an active subscription
THEN the MCP Hub card SHALL show the "前往訂閱" button

##### Example:
- Input: sessionUser = { email: "staff@test.aire", role: "staff" }, subscription = null
- Output: card shows "前往訂閱" button

### Requirement: tauri-invoke-browser-safe

The case preview page SHALL NOT import Tauri APIs directly. All Tauri IPC calls (export_pdf, get_theme, load_logo) on the preview page SHALL be routed through `safeInvoke` from `src/lib/safe-invoke.ts`, which provides browser-compatible mock responses when the Tauri runtime is unavailable.

#### Scenario: Preview page loads in browser dev mode

WHEN a user navigates to `/cases/CASE-001/preview` in a Chrome browser (no Tauri runtime)
THEN the page SHALL render the preview UI without throwing `Cannot read properties of undefined (reading 'invoke')`

##### Example:
- Environment: browser (window.__TAURI__ is undefined)
- URL: http://localhost:3000/cases/CASE-001/preview
- Output: page renders; no uncaught TypeError in console

#### Scenario: Export PDF in browser dev mode returns mock response

WHEN a user clicks 匯出 PDF on the preview page in browser dev mode
THEN `safeInvoke("export_pdf", { caseId: "CASE-001" })` SHALL return `{ filePath: "/mock/export/CASE-001.pdf" }`
AND the page SHALL display a notice such as "瀏覽器預覽模式，PDF 未實際產出"

##### Example:
- Input: click 匯出 PDF in browser
- Output: mock filePath returned; notice shown; no crash
