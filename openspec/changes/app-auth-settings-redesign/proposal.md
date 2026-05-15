## Why

AIRE App 目前的登入頁和設定頁有多個 UX 問題：
1. 登入頁混合了 license 啟用邏輯，初次使用者困惑（要先輸序號還是先登入？）
2. 獨立的 activation 頁面多餘 — 序號管理應該在設定裡
3. 設定頁缺少地政 API 設定區塊（Client ID + 安全碼）
4. 設定頁缺少「進階功能解鎖」區塊（實價登錄 MCP Hub，月費訂閱跳轉 OPCOS）
5. 側邊欄在桌面端不可收合，佔用螢幕空間
6. 「30天試用期」錯誤文案存在
7. 開發環境缺少 Super Admin 視角
8. Mock 登入帳號（admin@test.aire / user@test.aire）需要文件化和測試覆蓋

本 change 統一解決以上問題，對齊 OPCOS 平台 UI 規範。

## What Changes

- 登入頁重設計：極簡風格（AIRE Logo + Email/密碼 + 忘記密碼連結），移除 license 相關 UI
- 移除獨立 activation 頁面，序號管理移入設定頁
- 設定頁重組為三個區塊：(1) 序號管理 (2) 地政 API 設定 (3) 進階功能解鎖
- 地政 API 設定：Client ID + 安全碼輸入 + 說明連結 + YouTube 教學影片預留區
- 進階功能解鎖：實價登錄 MCP Hub（月費訂閱，跳轉 OPCOS 結帳頁）
- 側邊欄桌面端可收合（寬 240px ↔ 60px）
- Mock 持久化改用 localStorage
- 修正「30天」錯誤文案
- 開發環境 Super Admin 視角（看到所有 feature flag）
- Mock 登入測試帳號完善（admin@test.aire / user@test.aire / expired@test.aire）

## Non-Goals

- OPCOS 後台整合（本 change 只處理 AIRE App 端）
- 真實 OPCOS auth（先用 mock auth，之後切換）
- 付款流程實作（只跳轉 OPCOS URL）
- 多語言（先只支援繁體中文）

## Capabilities

### New Capabilities

- `settings-license-section`: 設定頁序號管理區塊（啟用/停用/狀態顯示）
- `settings-land-api-section`: 設定頁地政 API 設定區塊（Client ID + 安全碼 + 說明連結 + YouTube 預留）
- `settings-premium-unlock`: 設定頁進階功能解鎖區塊（MCP Hub 訂閱，跳轉 OPCOS）
- `dev-super-admin`: 開發環境 Super Admin 視角（所有 feature flag 可見 + 切換）

### Modified Capabilities

- `auth-login-page`: 極簡化，移除 license UI，只留 Email/密碼/忘記密碼
- `auth-session-guard`: 支援 mock auth + 開發環境 auto-login
- `collapsible-sidebar`: 修正收合/展開動畫 + 持久化收合狀態到 localStorage
- `browser-dev-mock`: 擴充 mock commands + localStorage 持久化 + 修正「30天」文案

## Impact

- Affected specs: `auth-login-page`, `auth-session-guard`, `collapsible-sidebar`, `browser-dev-mock`, `settings-license-section`, `settings-land-api-section`, `settings-premium-unlock`, `dev-super-admin`
- Affected code:
  - New:
    - `src/components/settings/LicenseSection.tsx`
    - `src/components/settings/LandApiSection.tsx`
    - `src/components/settings/PremiumUnlockSection.tsx`
    - `src/components/settings/DevSuperAdmin.tsx`
  - Modified:
    - `src/app/(auth)/login/page.tsx`
    - `src/app/(dashboard)/settings/page.tsx`
    - `src/components/sidebar.tsx`
    - `src/lib/mock-backend.ts`
  - Removed:
    - `src/app/(auth)/activation/page.tsx`（如果存在）
