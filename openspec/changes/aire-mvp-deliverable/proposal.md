## Why

AIRE 後端 IPC commands（18 個）和前端頁面骨架已到位，但缺少統一的 App Shell（sidebar 導航、登入流程、全局 layout），導致使用者無法完整操作「啟動 → 登入 → 切換頁面 → 建案件 → 填表 → 產 PDF」。同時三個舊 SDD Change 差 1-2 個驗收任務未封存。本次將這些收尾工作與 ST 元件庫整合合併為一個可交付 MVP。

## What Changes

- **收尾** aire-phase1-data-portability（已 100%）→ 執行 spectra archive
- **收尾** aire-phase1-legal-clauses-autofill（62/63）→ 完成 11.3 視覺驗收 legal notice block → archive
- **收尾** aire-phase1-pdf-assets（10/11）→ 完成 3.2 真機 smoke test → archive
- **新增** App Shell layout：引入 ST @repo/ui 元件，建立 sidebar + 頂欄 + 全局 layout wrapper
- **新增** 登入/授權啟動頁：使用 ST form/input/button 元件，串接 Tauri activate_license + verify_license commands
- **修改** 案件列表頁 src/app/(dashboard)/cases/page.tsx：從裸 div 改為 ST table + card + badge 元件
- **修改** 案件表單頁 src/app/(dashboard)/cases/[id]/page.tsx：從裸 input 改為 ST form/input/select/label 元件
- **修改** PDF 預覽頁 src/app/(dashboard)/cases/[id]/preview/page.tsx：加匯出按鈕串接 export_pdf command
- **新增** E2E smoke test（Tauri dev 模式下：建案件 → 填表 → 匯出 PDF → 驗證檔案產出）

## Non-Goals

- 不做地政 API 串接（cop.land.moi.gov.tw / Twinkle Hub）— 需要客戶 API Key，後續 Change 處理
- 不做角色權限分層（老闆/助理/業務員）— MVP 先單一角色
- 不做 PDF 加密（密碼保護）— 後續 Change 處理
- 不做 Windows 打包測試 — 先完成 macOS 驗證
- 不做自動更新功能（Tauri updater）— 後續 Change 處理
- 不做雲端序號/IP 驗證（需 OPCOS 後端就緒）— 本地 license 流程先用 mock
- 不重寫後端 Rust commands — 18 個 IPC commands 已實作完成，本次只做前端 UI 整合

## Capabilities

### New Capabilities

- `app-shell`: 全局 layout wrapper，含 sidebar 導航 + 頂欄 + 頁面容器，使用 ST @repo/ui 元件
- `license-activation-ui`: 授權啟動頁 UI，使用 ST form 元件串接 Tauri activate_license / verify_license / get_license_status commands

### Modified Capabilities

- `case-management`: 案件列表與表單 UI 從裸 HTML 升級為 ST table/form/input/select 元件
- `disclosure-document-generation`: PDF 預覽頁增加匯出按鈕，串接 export_pdf command 完成完整產出流程

## Impact

- Affected specs: `app-shell`（新建）、`license-activation-ui`（新建）、`case-management`（修改）、`disclosure-document-generation`（修改）
- Affected code:
  - New: src/app/(dashboard)/layout.tsx, src/components/AppSidebar.tsx, src/components/AppTopbar.tsx, src/app/(auth)/layout.tsx, src/app/(auth)/activation/page.tsx
  - Modified: src/app/(dashboard)/cases/page.tsx, src/app/(dashboard)/cases/[id]/page.tsx, src/app/(dashboard)/cases/[id]/preview/page.tsx, src/app/layout.tsx
  - Removed: 無
- Dependencies 新增: @repo/ui（ST 元件庫，workspace 引用）
- 環境變數新增: 無（所有資料存本機 SQLite，license 驗證走 Tauri IPC）
