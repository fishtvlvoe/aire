## Why

AIRE 桌面 App 目前缺少登入流程（直接進 dashboard）、沒有設定頁面（序號和 API 設定無入口）、側邊欄桌面端無法收合，且 UI 風格與 OPCOS/ST 平台不一致。使用者無法在瀏覽器開發環境完整測試授權和設定流程。

## What Changes

- **新增** 登入頁面：極簡設計（AIRE Logo + Email + 密碼 + 忘記密碼連結），接 OPCOS auth，dev 環境用 mock auth
- **新增** 設定頁面：序號管理（AIRE 授權碼）+ 地政 API 設定（Client ID + 安全碼 + 說明連結 + YouTube 教學影片預留）+ 實價登錄 MCP Hub 進階解鎖（月費訂閱，跳轉 OPCOS）
- **新增** 側邊欄加「設定」入口，桌面端可 collapse 成圖示模式
- **新增** mock auth 機制：固定測試帳號（admin@test.aire / user@test.aire），mock 狀態持久化到 localStorage
- **移除** 獨立 /activation 頁面，序號輸入移入設定頁
- **移除** activation/page.tsx 中「啟動後可離線使用 30 天」錯誤文案（買斷制 = 永久使用）
- **修改** useLicenseStatus hook 移除 DEV BYPASS 邏輯，統一走 safeInvoke + mock backend
- **修改** dashboard layout 的 auth guard 從檢查 license 改為檢查登入 session
- **新增** Super Admin 角色在開發環境下可看到所有設定項

## Non-Goals

- 本次不做 Google / LINE 社群登入（未來擴充）
- 本次不做 OPCOS 正式 API 串接（登入和序號驗證都用 mock）
- 本次不做角色權限系統的完整實作（只區分 Super Admin 和一般用戶的 mock 行為）
- 本次不做實價登錄 MCP Hub 的功能實作（只做 UI 殼和「進階解鎖」按鈕跳轉）
- 本次不做信用卡綁定頁面（跳轉 OPCOS 外部處理）
- 本次不做地政 API 的實際串接（只做設定欄位 UI + mock 儲存）

## Capabilities

### New Capabilities

- `auth-login-page`: 登入頁面（Email + 密碼表單 + 忘記密碼連結 + mock auth）
- `auth-session-guard`: 登入 session 管理 + dashboard auth guard
- `settings-page`: 設定頁面（序號管理 + 地政 API + 進階功能解鎖 + YouTube 教學影片預留）
- `collapsible-sidebar`: 側邊欄桌面端可收合 + 新增設定入口

### Modified Capabilities

- `app-shell`: 側邊欄加「設定」導航項，支援桌面端 collapse
- `license-activation-ui`: 移除獨立 activation 頁，序號管理移入設定頁
- `browser-dev-mock`: mock backend 新增 auth 相關 command（login / logout / get_session）+ localStorage 持久化

## Impact

- Affected specs: auth-login-page, auth-session-guard, settings-page, collapsible-sidebar, app-shell, license-activation-ui, browser-dev-mock
- Affected code:
  - New: src/app/login/page.tsx, src/app/(dashboard)/settings/page.tsx, src/app/(dashboard)/settings/general/page.tsx, src/lib/auth.ts, src/hooks/useAuth.ts, src/components/CollapsibleSidebar.tsx, src/components/SettingsLayout.tsx
  - Modified: src/components/AppSidebar.tsx, src/app/(dashboard)/layout.tsx, src/hooks/useLicenseStatus.ts, src/lib/mock-backend.ts, src/lib/tauri-bridge.ts, src/app/activation/page.tsx
  - Removed: src/app/activation/page.tsx（功能移入 settings，頁面移除）
