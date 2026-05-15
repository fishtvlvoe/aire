# license-activation-ui Specification

## Purpose

TBD - created by archiving change 'aire-mvp-deliverable'. Update Purpose after archive.

## Requirements

### Requirement: license-guard

The dashboard layout SHALL check the license status on mount and redirect unauthorized users to the activation page.

#### Scenario: no valid license on app launch

- **WHEN** the dashboard layout mounts and get_license_status returns status "none" or "expired"
- **THEN** the system SHALL redirect the user to /activation

#### Scenario: valid license on app launch

- **WHEN** the dashboard layout mounts and get_license_status returns status "valid"
- **THEN** the system SHALL render the dashboard content without redirection

#### Scenario: Tauri IPC unavailable (browser environment)

- **WHEN** the page is opened in a regular browser (not inside Tauri window) and Tauri IPC is unavailable
- **THEN** the activation page SHALL display a message "請在 AIRE 桌面 App 中開啟" instead of the license form

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
### Requirement: Async Tauri Environment Detection

The activation page SHALL use asynchronous detection to determine if it is running inside a Tauri WebView, by attempting to dynamically import @tauri-apps/api/core and checking if the invoke function is available.

#### Scenario: Tauri App Environment

- **WHEN** the activation page loads inside the Tauri desktop application
- **THEN** the serial key input form SHALL be displayed within 3 seconds

#### Scenario: Browser Environment

- **WHEN** the activation page loads in a standard web browser (no Tauri runtime)
- **THEN** the message "請在 AIRE 桌面 App 中開啟" SHALL be displayed after detection completes

#### Scenario: Detection Loading State

- **WHEN** the activation page is performing environment detection
- **THEN** a loading spinner SHALL be displayed (not the browser fallback message)

##### Example: Tauri Detection Timing

- **GIVEN** the Tauri 2.x IPC bridge is injected after page hydration
- **WHEN** the activation page calls isTauriEnv()
- **THEN** the function resolves to true within 3 seconds and the serial key form is rendered


<!-- @trace
source: aire-mvp-bugfix
updated: 2026-05-15
code:
  - src-tauri/icons/icon.ico
  - src-tauri/icons/ios/AppIcon-512@2x.png
  - src-tauri/icons/32x32.png
  - src-tauri/icons/ios/AppIcon-20x20@2x-1.png
  - src/lib/log.ts
  - src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_foreground.png
  - src-tauri/icons/Square142x142Logo.png
  - src-tauri/icons/Square150x150Logo.png
  - src-tauri/icons/Square30x30Logo.png
  - src-tauri/icons/ios/AppIcon-20x20@2x.png
  - src-tauri/icons/ios/AppIcon-29x29@1x.png
  - src-tauri/icons/ios/AppIcon-76x76@1x.png
  - src/app/(dashboard)/cases/page.tsx
  - src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_foreground.png
  - src/components/LogoUploader.tsx
  - src-tauri/icons/128x128.png
  - src-tauri/icons/ios/AppIcon-83.5x83.5@2x.png
  - src-tauri/icons/ios/AppIcon-40x40@2x-1.png
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/app/activation/page.tsx
  - src-tauri/icons/StoreLogo.png
  - .artifacts/aire-mvp-bugfix/settings_branding.png
  - src-tauri/icons/Square71x71Logo.png
  - src-tauri/icons/android/mipmap-xhdpi/ic_launcher.png
  - src-tauri/icons/android/mipmap-mdpi/ic_launcher_foreground.png
  - src-tauri/icons/android/mipmap-xhdpi/ic_launcher_foreground.png
  - src-tauri/icons/Square89x89Logo.png
  - src-tauri/icons/android/mipmap-hdpi/ic_launcher_foreground.png
  - src-tauri/icons/ios/AppIcon-60x60@3x.png
  - src-tauri/icons/ios/AppIcon-29x29@2x.png
  - src-tauri/icons/ios/AppIcon-29x29@3x.png
  - src-tauri/icons/128x128@2x.png
  - src/lib/cases-api.ts
  - src/lib/tauri-bridge.ts
  - src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher.png
  - src-tauri/icons/Square310x310Logo.png
  - src-tauri/icons/aire-source.png
  - src-tauri/icons/android/mipmap-xxhdpi/ic_launcher.png
  - src-tauri/icons/icon.icns
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - src-tauri/icons/Square44x44Logo.png
  - src-tauri/icons/ios/AppIcon-40x40@1x.png
  - src-tauri/icons/ios/AppIcon-76x76@2x.png
  - src-tauri/icons/ios/AppIcon-40x40@3x.png
  - src-tauri/icons/android/mipmap-hdpi/ic_launcher.png
  - src-tauri/icons/android/mipmap-mdpi/ic_launcher_round.png
  - src-tauri/icons/android/mipmap-hdpi/ic_launcher_round.png
  - src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_round.png
  - src-tauri/icons/ios/AppIcon-20x20@3x.png
  - src-tauri/icons/Square107x107Logo.png
  - src-tauri/icons/ios/AppIcon-40x40@2x.png
  - src-tauri/icons/ios/AppIcon-60x60@2x.png
  - src-tauri/icons/64x64.png
  - src-tauri/icons/android/mipmap-mdpi/ic_launcher.png
  - src-tauri/icons/ios/AppIcon-29x29@2x-1.png
  - .artifacts/aire-mvp-bugfix/activation.png
  - .artifacts/aire-mvp-bugfix/cases.png
  - src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_round.png
  - .artifacts/aire-mvp-bugfix/settings_logs.png
  - src-tauri/icons/icon.png
  - src-tauri/icons/android/mipmap-xhdpi/ic_launcher_round.png
  - src-tauri/icons/Square284x284Logo.png
  - src-tauri/icons/ios/AppIcon-20x20@1x.png
  - src/components/TauriRequired.tsx
tests:
  - src/lib/__tests__/log.test.ts
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/components/__tests__/TauriRequired.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/app/(dashboard)/cases/__tests__/page.test.tsx
  - src/app/activation/__tests__/page.test.tsx
  - src/lib/__tests__/cases-api.test.ts
  - src/lib/__tests__/tauri-bridge.test.ts
  - src/app/(dashboard)/settings/logs/__tests__/page.test.tsx
-->

---
### Requirement: Graceful IPC Fallback in Browser

All pages that call Tauri IPC commands SHALL use the safeInvoke wrapper from tauri-bridge.ts. When running outside Tauri, safeInvoke SHALL throw a NotInTauriError instead of a raw TypeError.

#### Scenario: Cases Page in Browser

- **WHEN** the /cases page loads in a browser without Tauri runtime
- **THEN** a friendly message "此功能需在 AIRE 桌面 App 中使用" SHALL be displayed instead of "Cannot read properties of undefined (reading 'invoke')"

#### Scenario: Branding Page in Browser

- **WHEN** the /settings/branding page loads in a browser without Tauri runtime
- **THEN** the same friendly fallback message SHALL be displayed

##### Example: Branding Page Fallback

- **GIVEN** a user opens http://localhost:3000/settings/branding in Chrome
- **WHEN** LogoUploader attempts to call safeInvoke("get_brand_settings")
- **THEN** NotInTauriError is caught and the TauriRequired component is rendered with the text "此功能需在 AIRE 桌面 App 中使用"

#### Scenario: Logs Page in Browser

- **WHEN** the /settings/logs page loads in a browser without Tauri runtime
- **THEN** the same friendly fallback message SHALL be displayed

##### Example: Error Type Check

- **GIVEN** a page component catches an error from safeInvoke
- **WHEN** the error is an instance of NotInTauriError
- **THEN** the component renders the TauriRequired component instead of the raw error message

<!-- @trace
source: aire-mvp-bugfix
updated: 2026-05-15
code:
  - src-tauri/icons/icon.ico
  - src-tauri/icons/ios/AppIcon-512@2x.png
  - src-tauri/icons/32x32.png
  - src-tauri/icons/ios/AppIcon-20x20@2x-1.png
  - src/lib/log.ts
  - src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_foreground.png
  - src-tauri/icons/Square142x142Logo.png
  - src-tauri/icons/Square150x150Logo.png
  - src-tauri/icons/Square30x30Logo.png
  - src-tauri/icons/ios/AppIcon-20x20@2x.png
  - src-tauri/icons/ios/AppIcon-29x29@1x.png
  - src-tauri/icons/ios/AppIcon-76x76@1x.png
  - src/app/(dashboard)/cases/page.tsx
  - src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_foreground.png
  - src/components/LogoUploader.tsx
  - src-tauri/icons/128x128.png
  - src-tauri/icons/ios/AppIcon-83.5x83.5@2x.png
  - src-tauri/icons/ios/AppIcon-40x40@2x-1.png
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/app/activation/page.tsx
  - src-tauri/icons/StoreLogo.png
  - .artifacts/aire-mvp-bugfix/settings_branding.png
  - src-tauri/icons/Square71x71Logo.png
  - src-tauri/icons/android/mipmap-xhdpi/ic_launcher.png
  - src-tauri/icons/android/mipmap-mdpi/ic_launcher_foreground.png
  - src-tauri/icons/android/mipmap-xhdpi/ic_launcher_foreground.png
  - src-tauri/icons/Square89x89Logo.png
  - src-tauri/icons/android/mipmap-hdpi/ic_launcher_foreground.png
  - src-tauri/icons/ios/AppIcon-60x60@3x.png
  - src-tauri/icons/ios/AppIcon-29x29@2x.png
  - src-tauri/icons/ios/AppIcon-29x29@3x.png
  - src-tauri/icons/128x128@2x.png
  - src/lib/cases-api.ts
  - src/lib/tauri-bridge.ts
  - src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher.png
  - src-tauri/icons/Square310x310Logo.png
  - src-tauri/icons/aire-source.png
  - src-tauri/icons/android/mipmap-xxhdpi/ic_launcher.png
  - src-tauri/icons/icon.icns
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - src-tauri/icons/Square44x44Logo.png
  - src-tauri/icons/ios/AppIcon-40x40@1x.png
  - src-tauri/icons/ios/AppIcon-76x76@2x.png
  - src-tauri/icons/ios/AppIcon-40x40@3x.png
  - src-tauri/icons/android/mipmap-hdpi/ic_launcher.png
  - src-tauri/icons/android/mipmap-mdpi/ic_launcher_round.png
  - src-tauri/icons/android/mipmap-hdpi/ic_launcher_round.png
  - src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_round.png
  - src-tauri/icons/ios/AppIcon-20x20@3x.png
  - src-tauri/icons/Square107x107Logo.png
  - src-tauri/icons/ios/AppIcon-40x40@2x.png
  - src-tauri/icons/ios/AppIcon-60x60@2x.png
  - src-tauri/icons/64x64.png
  - src-tauri/icons/android/mipmap-mdpi/ic_launcher.png
  - src-tauri/icons/ios/AppIcon-29x29@2x-1.png
  - .artifacts/aire-mvp-bugfix/activation.png
  - .artifacts/aire-mvp-bugfix/cases.png
  - src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_round.png
  - .artifacts/aire-mvp-bugfix/settings_logs.png
  - src-tauri/icons/icon.png
  - src-tauri/icons/android/mipmap-xhdpi/ic_launcher_round.png
  - src-tauri/icons/Square284x284Logo.png
  - src-tauri/icons/ios/AppIcon-20x20@1x.png
  - src/components/TauriRequired.tsx
tests:
  - src/lib/__tests__/log.test.ts
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/components/__tests__/TauriRequired.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/app/(dashboard)/cases/__tests__/page.test.tsx
  - src/app/activation/__tests__/page.test.tsx
  - src/lib/__tests__/cases-api.test.ts
  - src/lib/__tests__/tauri-bridge.test.ts
  - src/app/(dashboard)/settings/logs/__tests__/page.test.tsx
-->

---
### Requirement: Activation Page Mock Environment Behavior

The activation page SHALL display the serial key input form in development browser environment using mock backend instead of showing the desktop-only message. The activation page SHALL only show the desktop-only fallback message in production non-Tauri environment.

#### Scenario: Dev browser shows activation form

- **WHEN** user opens the activation page in development browser environment where isTauriEnv returns false
- **THEN** the page displays the serial key input form and submit button

##### Example: Dev activation form visibility

- **GIVEN** NODE_ENV is development and isTauriEnv returns false
- **WHEN** the activation page finishes loading
- **THEN** the serial key input field and the submit button labeled "啟動授權" are visible

#### Scenario: Dev browser activation completes via mock

- **WHEN** user enters a serial key and submits in development browser environment
- **THEN** activate_license is called via mockInvoke and on success the page redirects to dashboard

##### Example: Dev mock activation success

- **GIVEN** NODE_ENV is development and user is on activation page
- **WHEN** user types "TEST-KEY-123" and clicks submit
- **THEN** mockInvoke("activate_license") returns success and browser navigates to /cases

#### Scenario: Production browser shows fallback

- **WHEN** user opens the activation page in production non-Tauri environment
- **THEN** the page displays the message indicating AIRE desktop app is required

##### Example: Production fallback message

- **GIVEN** NODE_ENV is production and isTauriEnv returns false
- **WHEN** the activation page finishes loading
- **THEN** the text "請在 AIRE 桌面 App 中開啟" is displayed

<!-- @trace
source: browser-dev-mock
updated: 2026-05-15
code:
  - src/hooks/useLicenseStatus.ts
  - .artifacts/browser-dev-mock/01-activation-form.png
  - .artifacts/browser-dev-mock/04-branding-loaded.png
  - src/app/activation/page.tsx
  - src/lib/mock-backend.ts
  - src/lib/tauri-bridge.ts
  - src/components/TauriRequired.tsx
  - .artifacts/aire-mvp-bugfix/settings_logs.png
  - .artifacts/browser-dev-mock/05-logs-loaded.png
  - .artifacts/browser-dev-mock/02-cases-seed-list.png
  - .artifacts/aire-mvp-bugfix/activation.png
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - .artifacts/browser-dev-mock/03-create-case-success.png
  - .artifacts/aire-mvp-bugfix/settings_branding.png
  - src/app/(dashboard)/settings/logs/page.tsx
  - .artifacts/aire-mvp-bugfix/cases.png
tests:
  - src/components/__tests__/TauriRequired.test.tsx
  - src/lib/__tests__/tauri-bridge.test.ts
  - src/app/activation/__tests__/page.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
-->

---
### Requirement: activation-redirect

The /activation route SHALL redirect to /settings to maintain backward compatibility with existing deeplinks or bookmarks.

#### Scenario: activation page redirects

- **WHEN** the user navigates to /activation
- **THEN** the browser SHALL redirect to /settings

##### Example: old bookmark redirect

- **GIVEN** a user has bookmarked /activation
- **WHEN** they open the bookmark
- **THEN** the browser redirects to /settings

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