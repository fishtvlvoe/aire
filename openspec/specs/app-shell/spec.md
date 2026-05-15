# app-shell Specification

## Purpose

TBD - created by archiving change 'aire-mvp-deliverable'. Update Purpose after archive.

## Requirements

### Requirement: sidebar-navigation

The App Shell SHALL provide a sidebar containing navigation links to all primary sections: Cases (/cases), Branding Settings (/settings/branding), Logs (/settings/logs), and Settings (/settings). Each link SHALL display an icon (Lucide) and a label in Traditional Chinese. The sidebar SHALL support a collapsed state on desktop viewports where only icons are displayed.

#### Scenario: desktop sidebar always visible

- **WHEN** the viewport width is greater than 768px
- **THEN** the sidebar SHALL be permanently visible on the left side
- **THEN** the sidebar width SHALL be 240px when expanded or 60px when collapsed

#### Scenario: mobile sidebar as sheet overlay

- **WHEN** the viewport width is 768px or less
- **THEN** the sidebar SHALL be hidden by default and accessible via a hamburger button in the topbar
- **THEN** tapping the hamburger button SHALL open the sidebar as a Sheet overlay from the left

#### Scenario: active route highlighting

- **WHEN** the user is on a page matching a sidebar link's href
- **THEN** that link SHALL be visually highlighted with a distinct background color

##### Example: settings page active

- **GIVEN** the sidebar contains links: 案件管理 (/cases), 品牌設定 (/settings/branding), 日誌 (/settings/logs), 設定 (/settings)
- **WHEN** the current URL path is /settings
- **THEN** the "設定" link SHALL have blue-50 background and blue-600 text color
- **THEN** other links SHALL have default transparent background

#### Scenario: four navigation items

- **WHEN** the sidebar renders
- **THEN** it SHALL display exactly 4 navigation items in order: 案件管理, 品牌設定, 日誌, 設定

##### Example: navigation items list

- **GIVEN** the sidebar component mounts
- **WHEN** rendered
- **THEN** nav items are: { label: "案件管理", href: "/cases", icon: FileText }, { label: "品牌設定", href: "/settings/branding", icon: Palette }, { label: "日誌", href: "/settings/logs", icon: ScrollText }, { label: "設定", href: "/settings", icon: Settings }


<!-- @trace
source: app-auth-settings-redesign
updated: 2026-05-15
code:
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-舊電腦：建立-3-個案件後應顯示於案件清單-chromium-tauri/trace.zip
  - src/app/login/page.tsx
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-3：解鎖後資料完整（案件數不變）-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/theme-c-basic-info-actual.png
  - docs/ux-patterns.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-新電腦：匯入備份後案件數應與備份一致-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-82a7d-PDF-渲染-PDF-渲染應嵌入新版法規條文與版本日期-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-41aa9--渲染-同步後本地-DB-應含三條法規且版本日期為新版-chromium-tauri/error-context.md
  - src/components/AppSidebar.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-27d84-etch-→-sync-→-DB-→-PDF-全鏈一致-chromium-tauri/test-failed-1.png
  - src/app/activation/page.tsx
  - src/components/AppTopbar.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-bb38e-legal-clauses-後應回報同步成功與版本日期-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-2：新密碼解鎖應成功-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-完整救援碼重置流程：設密碼-→-取救援碼-→-忘記-→-重設-→-三斷言-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-2：使用救援碼驗證應回傳重設-token-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-2：新密碼解鎖應成功-chromium-tauri/test-failed-1.png
  - src/hooks/useLicenseStatus.ts
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-1：舊密碼解鎖應失敗（密碼已被重設）-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-1：設定主密碼後應取得救援碼-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/theme-c-photos-actual.png
  - src/components/ThemeSelector.tsx
  - src/hooks/useAuth.ts
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-舊電腦：建立-3-個案件後應顯示於案件清單-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-1：舊密碼解鎖應失敗（密碼已被重設）-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-3：解鎖後資料完整（案件數不變）-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-跨機完整流程：建立-→-匯出-→-匯入-→-比對案件數一致-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/error-context.md
  - src/lib/pdf-themes/index.ts
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-2：新密碼解鎖應成功-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-完整救援碼重置流程：設密碼-→-取救援碼-→-忘記-→-重設-→-三斷言-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-bb38e-legal-clauses-後應回報同步成功與版本日期-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-匯出備份：應產生-aire-檔案並回報案件數-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-2：使用救援碼驗證應回傳重設-token-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-3：解鎖後資料完整（案件數不變）-chromium-tauri/test-failed-1.png
  - e2e/results/playwright-report/index.html
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-匯出備份：應產生-aire-檔案並回報案件數-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-1：設定主密碼後應取得救援碼-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/theme-a-photos-actual.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-3：使用-token-設定新密碼應成功-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/.last-run.json
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-41aa9--渲染-同步後本地-DB-應含三條法規且版本日期為新版-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-27d84-etch-→-sync-→-DB-→-PDF-全鏈一致-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/theme-c-cover-actual.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-1：設定主密碼後應取得救援碼-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-82a7d-PDF-渲染-PDF-渲染應嵌入新版法規條文與版本日期-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/trace.zip
  - e2e/results/results.json
  - src/lib/mock-backend.ts
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-9921b-COS-endpoint-應回傳新版三條法規與版本日期-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-1：舊密碼解鎖應失敗（密碼已被重設）-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-舊電腦：建立-3-個案件後應顯示於案件清單-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-匯出備份：應產生-aire-檔案並回報案件數-chromium-tauri/error-context.md
  - src/lib/pdf-themes/persistence.ts
  - src/components/LogoUploader.tsx
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-跨機完整流程：建立-→-匯出-→-匯入-→-比對案件數一致-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-82a7d-PDF-渲染-PDF-渲染應嵌入新版法規條文與版本日期-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/theme-a-cover-actual.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-3：使用-token-設定新密碼應成功-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - src/lib/pdf-themes/registry.ts
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-41aa9--渲染-同步後本地-DB-應含三條法規且版本日期為新版-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-3：使用-token-設定新密碼應成功-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - src/lib/auth.ts
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-27d84-etch-→-sync-→-DB-→-PDF-全鏈一致-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-新電腦：匯入備份後案件數應與備份一致-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-完整救援碼重置流程：設密碼-→-取救援碼-→-忘記-→-重設-→-三斷言-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-跨機完整流程：建立-→-匯出-→-匯入-→-比對案件數一致-chromium-tauri/test-failed-1.png
  - src/components/PdfPreviewer.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-bb38e-legal-clauses-後應回報同步成功與版本日期-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-新電腦：匯入備份後案件數應與備份一致-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/theme-a-basic-info-actual.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-9921b-COS-endpoint-應回傳新版三條法規與版本日期-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-9921b-COS-endpoint-應回傳新版三條法規與版本日期-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - src/app/(dashboard)/layout.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-2：使用救援碼驗證應回傳重設-token-chromium-tauri/error-context.md
  - src/app/(dashboard)/settings/page.tsx
tests:
  - src/components/__tests__/LogoUploader.test.tsx
  - src/app/(dashboard)/__tests__/layout.test.tsx
  - src/app/activation/__tests__/page.test.tsx
  - src/lib/pdf-themes/__tests__/persistence.test.ts
  - src/app/login/__tests__/page.test.tsx
  - src/lib/__tests__/auth.test.ts
  - src/app/(dashboard)/__tests__/layout-sidebar.test.tsx
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/components/__tests__/ThemeSelector.test.tsx
  - e2e/theme-selector.spec.ts
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - src/lib/__tests__/mock-backend.test.ts
  - src/components/__tests__/AppSidebar.test.tsx
  - src/hooks/__tests__/useAuth.test.tsx
-->

---
### Requirement: topbar-display

The App Shell SHALL display a topbar containing the current page title and a hamburger menu button (visible only on mobile viewports).

#### Scenario: topbar shows page title

- **WHEN** any dashboard page is rendered
- **THEN** the topbar SHALL display the page title corresponding to the current route

##### Example: route to title mapping

- **GIVEN** the route-to-title mapping: /cases → "案件管理", /settings/branding → "品牌設定", /settings/logs → "操作日誌"
- **WHEN** the user navigates to /cases
- **THEN** the topbar SHALL display "案件管理"

#### Scenario: hamburger button visibility

- **WHEN** the viewport width is 768px or less
- **THEN** a hamburger menu button SHALL appear in the topbar
- **WHEN** the viewport width is greater than 768px
- **THEN** the hamburger menu button SHALL NOT be rendered


<!-- @trace
source: aire-mvp-deliverable
updated: 2026-05-15
code:
  - src/app/(dashboard)/dev/ux/page.tsx
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/theme-c-photos-actual.png
  - src/components/ui/label.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-3：解鎖後資料完整（案件數不變）-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-2：使用救援碼驗證應回傳重設-token-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-匯出備份：應產生-aire-檔案並回報案件數-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-photos-chromium-tauri-darwin.png
  - src/components/disclosure-form-land.tsx
  - src/components/ui/Card.tsx
  - src/app/cases/[id]/page.tsx
  - src/components/ui/sonner.tsx
  - src/components/ui/Dialog.tsx
  - src/app/(dashboard)/dev/components/page.tsx
  - src/app/settings/sync-status/page.tsx
  - src/components/ux/MasterPasswordPrompt.tsx
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/theme-a-photos-actual.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-41aa9--渲染-同步後本地-DB-應含三條法規且版本日期為新版-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/error-context.md
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-cover-chromium-tauri-darwin.png
  - src/components/RealtorLicenseField.tsx
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/trace.zip
  - src/components/ux/ImportConflictDialog.tsx
  - e2e/results/legal-sync.json
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-basic-info-chromium-tauri-darwin.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-舊電腦：建立-3-個案件後應顯示於案件清單-chromium-tauri/error-context.md
  - src/components/ui/input.tsx
  - src/components/ui/separator.tsx
  - src/components/ui/textarea.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-82a7d-PDF-渲染-PDF-渲染應嵌入新版法規條文與版本日期-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-82a7d-PDF-渲染-PDF-渲染應嵌入新版法規條文與版本日期-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-3：使用-token-設定新密碼應成功-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-新電腦：匯入備份後案件數應與備份一致-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-2：使用救援碼驗證應回傳重設-token-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-舊電腦：建立-3-個案件後應顯示於案件清單-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-photos-chromium-tauri-darwin.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-41aa9--渲染-同步後本地-DB-應含三條法規且版本日期為新版-chromium-tauri/trace.zip
  - e2e/results/license-verification.json
  - src-tauri/Cargo.toml
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src/app/(dashboard)/cases/page.tsx
  - src/app/activation/page.tsx
  - src/app/dev/ux/page.tsx
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/theme-c-basic-info-actual.png
  - src/app/cases/[id]/layout.tsx
  - src/components/ui/tabs.tsx
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - src/components/ux/ConfirmDialog.tsx
  - src/components/ux/ErrorState.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-1：舊密碼解鎖應失敗（密碼已被重設）-chromium-tauri/error-context.md
  - src/components/AppSidebar.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-3：解鎖後資料完整（案件數不變）-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-完整救援碼重置流程：設密碼-→-取救援碼-→-忘記-→-重設-→-三斷言-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-bb38e-legal-clauses-後應回報同步成功與版本日期-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-匯出備份：應產生-aire-檔案並回報案件數-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/theme-a-basic-info-actual.png
  - src/app/settings/logs/page.tsx
  - src/components/ui/badge.tsx
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/test-failed-1.png
  - src/components/disclosure-form-residential.tsx
  - src/components/ui/dialog.tsx
  - src/components/ui/form.tsx
  - e2e/results/test-artifacts/.last-run.json
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-82a7d-PDF-渲染-PDF-渲染應嵌入新版法規條文與版本日期-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-1：舊密碼解鎖應失敗（密碼已被重設）-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-舊電腦：建立-3-個案件後應顯示於案件清單-chromium-tauri/test-failed-1.png
  - src/app/(dashboard)/settings/sync-status/page.tsx
  - src/app/cases/new/page.tsx
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - src/components/AppTopbar.tsx
  - src/components/ux/RecoveryCodeModal.tsx
  - src/hooks/useLicenseStatus.ts
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/test-failed-1.png
  - src/components/ui/Input.tsx
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/theme-a-cover-actual.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-3：使用-token-設定新密碼應成功-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-bb38e-legal-clauses-後應回報同步成功與版本日期-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-27d84-etch-→-sync-→-DB-→-PDF-全鏈一致-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-新電腦：匯入備份後案件數應與備份一致-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-新電腦：匯入備份後案件數應與備份一致-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-完整救援碼重置流程：設密碼-→-取救援碼-→-忘記-→-重設-→-三斷言-chromium-tauri/error-context.md
  - src/app/(dashboard)/cases/[id]/layout.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-2：新密碼解鎖應成功-chromium-tauri/trace.zip
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/components/ui/card.tsx
  - src/app/cases/[id]/preview/page.tsx
  - src/components/ui/button.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-1：舊密碼解鎖應失敗（密碼已被重設）-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-9921b-COS-endpoint-應回傳新版三條法規與版本日期-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-2：使用救援碼驗證應回傳重設-token-chromium-tauri/trace.zip
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/app/(dashboard)/layout.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-27d84-etch-→-sync-→-DB-→-PDF-全鏈一致-chromium-tauri/test-failed-1.png
  - src/components/ui/sheet.tsx
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-3：解鎖後資料完整（案件數不變）-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/theme-c-cover-actual.png
  - .github/copilot-instructions.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/trace.zip
  - src/components/ui/Tabs.tsx
  - src/components/ui/select.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-1：設定主密碼後應取得救援碼-chromium-tauri/test-failed-1.png
  - src/components/ux/EmptyState.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-cover-chromium-tauri-darwin.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-完整救援碼重置流程：設密碼-→-取救援碼-→-忘記-→-重設-→-三斷言-chromium-tauri/trace.zip
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-basic-info-chromium-tauri-darwin.png
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-跨機完整流程：建立-→-匯出-→-匯入-→-比對案件數一致-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-跨機完整流程：建立-→-匯出-→-匯入-→-比對案件數一致-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-41aa9--渲染-同步後本地-DB-應含三條法規且版本日期為新版-chromium-tauri/test-failed-1.png
  - src/app/cases/page.tsx
  - src/components/ui/spinner.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-1：設定主密碼後應取得救援碼-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-bb38e-legal-clauses-後應回報同步成功與版本日期-chromium-tauri/test-failed-1.png
  - src/app/dev/components/page.tsx
  - src/components/ui/table.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-9921b-COS-endpoint-應回傳新版三條法規與版本日期-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-2：新密碼解鎖應成功-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-9921b-COS-endpoint-應回傳新版三條法規與版本日期-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-3：使用-token-設定新密碼應成功-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-27d84-etch-→-sync-→-DB-→-PDF-全鏈一致-chromium-tauri/trace.zip
  - src/components/ui/Button.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-1：設定主密碼後應取得救援碼-chromium-tauri/error-context.md
  - package.json
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-2：新密碼解鎖應成功-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - src/components/ui/skeleton.tsx
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-跨機完整流程：建立-→-匯出-→-匯入-→-比對案件數一致-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-匯出備份：應產生-aire-檔案並回報案件數-chromium-tauri/error-context.md
tests:
  - src/app/(dashboard)/settings/sync-status/__tests__/page.test.tsx
  - src-tauri/tests/e2e_smoke.rs
  - src/app/settings/sync-status/__tests__/page.test.tsx
-->

---
### Requirement: layout-wrapper

The dashboard layout SHALL wrap all child pages with the sidebar, topbar, and a scrollable main content area.

#### Scenario: layout renders children

- **WHEN** a user navigates to any /cases/* or /settings/* route
- **THEN** the page content SHALL render inside the main content area alongside the sidebar and topbar

##### Example: cases page inside layout

- **GIVEN** the user is authorized
- **WHEN** the user navigates to /cases
- **THEN** the browser SHALL render: left sidebar (240px) + topbar + cases list in the main content area

#### Scenario: layout excludes auth pages

- **WHEN** a user navigates to /activation
- **THEN** the page SHALL render without the sidebar and topbar (full-page layout)

##### Example: activation page standalone

- **GIVEN** the user has no valid license
- **WHEN** the browser loads /activation
- **THEN** the page SHALL render only the activation form centered on screen, with no sidebar or topbar visible

<!-- @trace
source: aire-mvp-deliverable
updated: 2026-05-15
code:
  - src/app/(dashboard)/dev/ux/page.tsx
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/theme-c-photos-actual.png
  - src/components/ui/label.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-3：解鎖後資料完整（案件數不變）-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-2：使用救援碼驗證應回傳重設-token-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-匯出備份：應產生-aire-檔案並回報案件數-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-photos-chromium-tauri-darwin.png
  - src/components/disclosure-form-land.tsx
  - src/components/ui/Card.tsx
  - src/app/cases/[id]/page.tsx
  - src/components/ui/sonner.tsx
  - src/components/ui/Dialog.tsx
  - src/app/(dashboard)/dev/components/page.tsx
  - src/app/settings/sync-status/page.tsx
  - src/components/ux/MasterPasswordPrompt.tsx
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/theme-a-photos-actual.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-41aa9--渲染-同步後本地-DB-應含三條法規且版本日期為新版-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/error-context.md
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-cover-chromium-tauri-darwin.png
  - src/components/RealtorLicenseField.tsx
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/trace.zip
  - src/components/ux/ImportConflictDialog.tsx
  - e2e/results/legal-sync.json
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-basic-info-chromium-tauri-darwin.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-舊電腦：建立-3-個案件後應顯示於案件清單-chromium-tauri/error-context.md
  - src/components/ui/input.tsx
  - src/components/ui/separator.tsx
  - src/components/ui/textarea.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-82a7d-PDF-渲染-PDF-渲染應嵌入新版法規條文與版本日期-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-82a7d-PDF-渲染-PDF-渲染應嵌入新版法規條文與版本日期-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-3：使用-token-設定新密碼應成功-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-新電腦：匯入備份後案件數應與備份一致-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-2：使用救援碼驗證應回傳重設-token-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-舊電腦：建立-3-個案件後應顯示於案件清單-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-photos-chromium-tauri-darwin.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-41aa9--渲染-同步後本地-DB-應含三條法規且版本日期為新版-chromium-tauri/trace.zip
  - e2e/results/license-verification.json
  - src-tauri/Cargo.toml
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src/app/(dashboard)/cases/page.tsx
  - src/app/activation/page.tsx
  - src/app/dev/ux/page.tsx
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/theme-c-basic-info-actual.png
  - src/app/cases/[id]/layout.tsx
  - src/components/ui/tabs.tsx
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - src/components/ux/ConfirmDialog.tsx
  - src/components/ux/ErrorState.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-1：舊密碼解鎖應失敗（密碼已被重設）-chromium-tauri/error-context.md
  - src/components/AppSidebar.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-3：解鎖後資料完整（案件數不變）-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-完整救援碼重置流程：設密碼-→-取救援碼-→-忘記-→-重設-→-三斷言-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-bb38e-legal-clauses-後應回報同步成功與版本日期-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-匯出備份：應產生-aire-檔案並回報案件數-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/theme-a-basic-info-actual.png
  - src/app/settings/logs/page.tsx
  - src/components/ui/badge.tsx
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/test-failed-1.png
  - src/components/disclosure-form-residential.tsx
  - src/components/ui/dialog.tsx
  - src/components/ui/form.tsx
  - e2e/results/test-artifacts/.last-run.json
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-82a7d-PDF-渲染-PDF-渲染應嵌入新版法規條文與版本日期-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-1：舊密碼解鎖應失敗（密碼已被重設）-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-舊電腦：建立-3-個案件後應顯示於案件清單-chromium-tauri/test-failed-1.png
  - src/app/(dashboard)/settings/sync-status/page.tsx
  - src/app/cases/new/page.tsx
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - src/components/AppTopbar.tsx
  - src/components/ux/RecoveryCodeModal.tsx
  - src/hooks/useLicenseStatus.ts
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/test-failed-1.png
  - src/components/ui/Input.tsx
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/theme-a-cover-actual.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-3：使用-token-設定新密碼應成功-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-bb38e-legal-clauses-後應回報同步成功與版本日期-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-27d84-etch-→-sync-→-DB-→-PDF-全鏈一致-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-新電腦：匯入備份後案件數應與備份一致-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-新電腦：匯入備份後案件數應與備份一致-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-完整救援碼重置流程：設密碼-→-取救援碼-→-忘記-→-重設-→-三斷言-chromium-tauri/error-context.md
  - src/app/(dashboard)/cases/[id]/layout.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-2：新密碼解鎖應成功-chromium-tauri/trace.zip
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/components/ui/card.tsx
  - src/app/cases/[id]/preview/page.tsx
  - src/components/ui/button.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-1：舊密碼解鎖應失敗（密碼已被重設）-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-9921b-COS-endpoint-應回傳新版三條法規與版本日期-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-2：使用救援碼驗證應回傳重設-token-chromium-tauri/trace.zip
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/app/(dashboard)/layout.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-27d84-etch-→-sync-→-DB-→-PDF-全鏈一致-chromium-tauri/test-failed-1.png
  - src/components/ui/sheet.tsx
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-3：解鎖後資料完整（案件數不變）-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/theme-c-cover-actual.png
  - .github/copilot-instructions.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/trace.zip
  - src/components/ui/Tabs.tsx
  - src/components/ui/select.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-1：設定主密碼後應取得救援碼-chromium-tauri/test-failed-1.png
  - src/components/ux/EmptyState.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-cover-chromium-tauri-darwin.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-完整救援碼重置流程：設密碼-→-取救援碼-→-忘記-→-重設-→-三斷言-chromium-tauri/trace.zip
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-basic-info-chromium-tauri-darwin.png
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-跨機完整流程：建立-→-匯出-→-匯入-→-比對案件數一致-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-跨機完整流程：建立-→-匯出-→-匯入-→-比對案件數一致-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-41aa9--渲染-同步後本地-DB-應含三條法規且版本日期為新版-chromium-tauri/test-failed-1.png
  - src/app/cases/page.tsx
  - src/components/ui/spinner.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-1：設定主密碼後應取得救援碼-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-bb38e-legal-clauses-後應回報同步成功與版本日期-chromium-tauri/test-failed-1.png
  - src/app/dev/components/page.tsx
  - src/components/ui/table.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-9921b-COS-endpoint-應回傳新版三條法規與版本日期-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-2：新密碼解鎖應成功-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-9921b-COS-endpoint-應回傳新版三條法規與版本日期-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-3：使用-token-設定新密碼應成功-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-27d84-etch-→-sync-→-DB-→-PDF-全鏈一致-chromium-tauri/trace.zip
  - src/components/ui/Button.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-1：設定主密碼後應取得救援碼-chromium-tauri/error-context.md
  - package.json
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-2：新密碼解鎖應成功-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - src/components/ui/skeleton.tsx
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-跨機完整流程：建立-→-匯出-→-匯入-→-比對案件數一致-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-匯出備份：應產生-aire-檔案並回報案件數-chromium-tauri/error-context.md
tests:
  - src/app/(dashboard)/settings/sync-status/__tests__/page.test.tsx
  - src-tauri/tests/e2e_smoke.rs
  - src/app/settings/sync-status/__tests__/page.test.tsx
-->