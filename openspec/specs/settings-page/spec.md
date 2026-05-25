# settings-page Specification

## Purpose

TBD - created by archiving change 'app-auth-settings-redesign'. Update Purpose after archive.

## Requirements

### Requirement: settings-license-section

The settings page SHALL display a "序號管理" card section with license status display and a serial key input form. When the license is not activated, the section SHALL show an input field and an activate button. When activated, the section SHALL show the masked serial key and a deactivate button.

#### Scenario: license not activated

- **WHEN** the user views the settings page with license status "none"
- **THEN** the section SHALL display a serial key input field with placeholder "AIRE-XXXX-XXXX-XXXX"
- **THEN** the section SHALL display an "啟動授權" button

##### Example: activate license from settings

- **GIVEN** the user is on /settings with license status "none"
- **WHEN** the user enters "AIRE-TEST-VALID-001" and clicks "啟動授權"
- **THEN** safeInvoke("activate_license", { serial_key: "AIRE-TEST-VALID-001" }) is called
- **THEN** on success, the section updates to show activated status with masked key "AIRE-****-****-001"

#### Scenario: license already activated

- **WHEN** the user views the settings page with an active license
- **THEN** the section SHALL display the masked serial key
- **THEN** the section SHALL display a green status indicator with text "已啟動"
- **THEN** the section SHALL display a "解除授權" button

##### Example: deactivate license

- **GIVEN** the user is on /settings with an active license showing "AIRE-****-****-001"
- **WHEN** the user clicks "解除授權"
- **THEN** safeInvoke("deactivate_license") is called
- **THEN** on success, the section reverts to the input form state

#### Scenario: license activation error

- **WHEN** the user enters an invalid serial key and clicks activate
- **THEN** the section SHALL display a red error message corresponding to the error code

##### Example: invalid key error

- **GIVEN** the user is on /settings with license status "none"
- **WHEN** the user enters "invalid-key" and clicks "啟動授權"
- **THEN** safeInvoke throws Error with message "INVALID_KEY"
- **THEN** the section displays error "序號無效，請確認輸入是否正確"


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
### Requirement: settings-land-api-section

The settings page SHALL display a "地政 API 設定" card section with Client ID and secret input fields, a save button, an external help link, and a YouTube tutorial embed area.

#### Scenario: land api fields display

- **WHEN** the user views the settings page
- **THEN** the land API section SHALL display a Client ID text input
- **THEN** the section SHALL display a secret input with type=password
- **THEN** the section SHALL display a "儲存" button
- **THEN** the section SHALL display a help link labeled "如何申請地政 API？" that opens an external URL
- **THEN** the section SHALL display a YouTube embed area (iframe placeholder)

##### Example: save land api settings

- **GIVEN** the user is on /settings
- **WHEN** the user enters Client ID "test-client-123" and secret "test-secret-456" and clicks "儲存"
- **THEN** safeInvoke("save_app_settings", { landApi: { clientId: "test-client-123", secret: "test-secret-456" } }) is called
- **THEN** on success, a green toast displays "設定已儲存"

#### Scenario: land api fields pre-populated

- **WHEN** the user views the settings page with previously saved API settings
- **THEN** the Client ID input SHALL be pre-filled with the saved value
- **THEN** the secret input SHALL show masked dots (not the actual value)

##### Example: pre-populated fields

- **GIVEN** get_app_settings returns { landApi: { clientId: "existing-client", secret: "existing-secret" } }
- **WHEN** the user navigates to /settings
- **THEN** the Client ID input displays "existing-client"
- **THEN** the secret input displays masked dots


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
### Requirement: settings-premium-section

The settings page SHALL display a "進階功能" card section showing the premium feature status with a locked indicator and an external link button to OPCOS for subscription.

#### Scenario: premium feature locked

- **WHEN** the user views the settings page with premiumUnlocked = false
- **THEN** the section SHALL display a lock icon
- **THEN** the section SHALL display text "實價登錄 MCP Hub — 月費訂閱"
- **THEN** the section SHALL display a button "前往 OPCOS 開通" that opens an external URL

##### Example: click premium unlock

- **GIVEN** the user is on /settings with premiumUnlocked = false
- **WHEN** the user clicks "前往 OPCOS 開通"
- **THEN** the browser opens the OPCOS subscription URL in a new tab

#### Scenario: premium feature unlocked

- **WHEN** the user views the settings page with premiumUnlocked = true
- **THEN** the section SHALL display a green checkmark icon
- **THEN** the section SHALL display text "實價登錄 MCP Hub — 已開通"
- **THEN** the unlock button SHALL be hidden

##### Example: premium already unlocked

- **GIVEN** get_app_settings returns { premiumUnlocked: true }
- **WHEN** the user navigates to /settings
- **THEN** the section shows green checkmark with "已開通" text

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
### Requirement: Settings page tab navigation
The settings page SHALL render a `SettingsTabs` component at the top with three tabs: "一般設定" (active when on `/settings`), "品牌設定" (active when on `/settings/branding`), and "操作日誌" (active when on `/settings/logs`). Clicking a tab SHALL navigate to the corresponding sub-route.

#### Scenario: Tab switching
- **WHEN** user is on `/settings` and clicks the "品牌設定" tab
- **THEN** the browser navigates to `/settings/branding` and the "品牌設定" tab shows as active

#### Scenario: Direct URL access
- **WHEN** user navigates directly to `/settings/logs`
- **THEN** the settings page renders with the "操作日誌" tab active


<!-- @trace
source: aire-settings-polish
updated: 2026-05-16
code:
  - src/components/ThemeSelector.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/pdf-engine/document.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/lib/pdf-themes/theme-e-warm/index.tsx
  - src/app/(dashboard)/settings/page.tsx
  - src/lib/mock-backend.ts
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - src/lib/pdf-themes/theme-d-fresh/index.tsx
  - src/components/CaseSupplementDialog.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/lib/land-registry-api.ts
  - src/components/AppSidebar.tsx
  - src/lib/pdf-themes/registry.ts
  - src/components/settings/LandApiSection.tsx
  - src/app/(dashboard)/settings/branding/page.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src/lib/cases-api.ts
  - src/components/OwnerAuthorizationDialog.tsx
  - src/components/SettingsTabs.tsx
  - src/components/ComingSoonCard.tsx
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src/lib/pdf-themes/index.ts
  - src/components/case-wizard/CaseWizard.tsx
  - src/components/CaseListActions.tsx
  - src/app/(dashboard)/cases/page.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/components/case-wizard/CaseWizardStep2.tsx
tests:
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/components/__tests__/AppSidebar.test.tsx
  - src/app/(dashboard)/settings/logs/__tests__/page.test.tsx
  - src/components/__tests__/ComingSoonCard.test.tsx
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/page.test.tsx
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - src/components/__tests__/ThemeSelector.test.tsx
-->

---
### Requirement: Coming soon placeholder cards
The settings page SHALL render a `ComingSoonCard` component for the "申請說明" section and the "教學影片" section. Each card SHALL display a clock or info icon and the text "敬請期待". The card SHALL NOT display "申請說明" content or "教學影片即將上線" text.

#### Scenario: API help section
- **WHEN** user views the land registry API settings area
- **THEN** the "申請說明" section displays a `ComingSoonCard` with text "敬請期待"

#### Scenario: Tutorial video section
- **WHEN** user views the settings page
- **THEN** the "教學影片" section displays a `ComingSoonCard` with text "敬請期待"


<!-- @trace
source: aire-settings-polish
updated: 2026-05-16
code:
  - src/components/ThemeSelector.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/pdf-engine/document.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/lib/pdf-themes/theme-e-warm/index.tsx
  - src/app/(dashboard)/settings/page.tsx
  - src/lib/mock-backend.ts
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - src/lib/pdf-themes/theme-d-fresh/index.tsx
  - src/components/CaseSupplementDialog.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/lib/land-registry-api.ts
  - src/components/AppSidebar.tsx
  - src/lib/pdf-themes/registry.ts
  - src/components/settings/LandApiSection.tsx
  - src/app/(dashboard)/settings/branding/page.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src/lib/cases-api.ts
  - src/components/OwnerAuthorizationDialog.tsx
  - src/components/SettingsTabs.tsx
  - src/components/ComingSoonCard.tsx
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src/lib/pdf-themes/index.ts
  - src/components/case-wizard/CaseWizard.tsx
  - src/components/CaseListActions.tsx
  - src/app/(dashboard)/cases/page.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/components/case-wizard/CaseWizardStep2.tsx
tests:
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/components/__tests__/AppSidebar.test.tsx
  - src/app/(dashboard)/settings/logs/__tests__/page.test.tsx
  - src/components/__tests__/ComingSoonCard.test.tsx
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/page.test.tsx
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - src/components/__tests__/ThemeSelector.test.tsx
-->

---
### Requirement: Test connection button tooltip
The "測試連線" button SHALL display a tooltip "請先填入 Client ID 和安全碼" when disabled (Client ID or security code is empty). The button SHALL become enabled when both fields have non-empty values.

#### Scenario: Fields empty
- **WHEN** the Client ID and security code fields are both empty and user hovers over the "測試連線" button
- **THEN** a tooltip reading "請先填入 Client ID 和安全碼" appears

#### Scenario: Fields filled
- **WHEN** both Client ID and security code fields have values
- **THEN** the "測試連線" button is enabled and clickable without tooltip

<!-- @trace
source: aire-settings-polish
updated: 2026-05-16
code:
  - src/components/ThemeSelector.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/pdf-engine/document.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/lib/pdf-themes/theme-e-warm/index.tsx
  - src/app/(dashboard)/settings/page.tsx
  - src/lib/mock-backend.ts
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - src/lib/pdf-themes/theme-d-fresh/index.tsx
  - src/components/CaseSupplementDialog.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/lib/land-registry-api.ts
  - src/components/AppSidebar.tsx
  - src/lib/pdf-themes/registry.ts
  - src/components/settings/LandApiSection.tsx
  - src/app/(dashboard)/settings/branding/page.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src/lib/cases-api.ts
  - src/components/OwnerAuthorizationDialog.tsx
  - src/components/SettingsTabs.tsx
  - src/components/ComingSoonCard.tsx
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src/lib/pdf-themes/index.ts
  - src/components/case-wizard/CaseWizard.tsx
  - src/components/CaseListActions.tsx
  - src/app/(dashboard)/cases/page.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/components/case-wizard/CaseWizardStep2.tsx
tests:
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/components/__tests__/AppSidebar.test.tsx
  - src/app/(dashboard)/settings/logs/__tests__/page.test.tsx
  - src/components/__tests__/ComingSoonCard.test.tsx
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/page.test.tsx
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - src/components/__tests__/ThemeSelector.test.tsx
-->

---
### Requirement: case-form-optional-land-lot

The new case form field "地號" (land lot number) SHALL be optional. The field SHALL remain visible but SHALL NOT block form submission when empty.

The placeholder text SHALL read: "可選填，例如：0001-0000（不確定可留空）"

#### Scenario: Case created without land lot number

WHEN a user submits the new case form with 地址="台南市東區裕農路288巷17號8樓之1", 物件類型="住宅", 案件編號="TEST-001", 地號=""
THEN case creation SHALL succeed
AND the created case SHALL have `land_lot_no = null`

##### Example:
- Input: { address: "台南市東區裕農路288巷17號8樓之1", type: "住宅", case_number: "TEST-001", land_lot_no: "" }
- Output: case created with id=TEST-001; land_lot_no=null

#### Scenario: Case created with land lot number

WHEN a user submits the new case form with 地號="0291-0000"
THEN case creation SHALL succeed with land_lot_no="0291-0000" stored

##### Example:
- Input: { land_lot_no: "0291-0000", address: "台南市東區", type: "住宅", case_number: "TEST-002" }
- Output: case created with land_lot_no="0291-0000"


<!-- @trace
source: aire-ux-bugfix-wave1
updated: 2026-05-16
code:
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src/components/RealPricePanel.tsx
  - src/components/case-wizard/CaseWizard.tsx
  - src/lib/pdf-themes/registry.ts
  - next.config.ts
  - src/lib/pdf-engine/document.tsx
  - src-tauri/src/lib.rs
  - src/app/login/page.tsx
  - src/components/LogoUploader.tsx
  - src/lib/cases-api.ts
  - src/app/(dashboard)/layout.tsx
  - src/components/settings/PremiumUnlockSection.tsx
  - src/lib/pdf-themes/theme-d-fresh/index.tsx
  - src/components/settings/LandApiSection.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src-tauri/src/commands/mod.rs
  - src/lib/pdf-themes/theme-e-warm/index.tsx
  - src/app/(dashboard)/settings/page.tsx
  - src/lib/land-registry-api.ts
  - src/components/PdfPreviewer.tsx
  - src-tauri/src/mcp_client.rs
  - src/app/(dashboard)/dev/page.tsx
  - vitest.config.ts
  - src/components/CaseSupplementDialog.tsx
  - src/lib/pdf-engine/react-pdf-init.ts
  - src/lib/pdf-engine/index.ts
  - src/lib/mock-backend.ts
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/components/ComingSoonCard.tsx
  - src/lib/safe-invoke.ts
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/lib/pdf-themes/index.ts
  - src/components/AppSidebar.tsx
  - src/resources/fonts/NotoSansTC-Regular.otf
  - src/lib/pdf-engine/engine.ts
  - src/lib/pdf-engine/react-pdf-components.tsx
  - src/components/case-wizard/CaseWizardStep2.tsx
  - vitest.setup.ts
  - src/components/SettingsTabs.tsx
  - src/lib/address-parser.ts
  - src/components/CaseListActions.tsx
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - src/components/OwnerAuthorizationDialog.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/ThemeSelector.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src-tauri/src/commands/real_price.rs
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src-tauri/src/land_registry/batch/mod.rs
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/app/(dashboard)/settings/branding/page.tsx
  - src/app/(dashboard)/cases/page.tsx
  - src/app/(dashboard)/cases/new/page.tsx
tests:
  - src/lib/__tests__/address-parser.test.ts
  - src/components/__tests__/ThemeSelector.test.tsx
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/logs/__tests__/page.test.tsx
  - src/lib/pdf-engine/__tests__/render-with-legal.test.tsx
  - src/lib/pdf-engine/__tests__/document.test.tsx
  - src/lib/pdf-engine/__tests__/react-pdf-components.test.tsx
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/lib/pdf-engine/__tests__/engine.test.ts
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/components/__tests__/ComingSoonCard.test.tsx
  - src/components/__tests__/AppSidebar.test.tsx
  - src/components/__tests__/RealPricePanel.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - src/components/settings/__tests__/PremiumUnlockSection.test.tsx
-->

---
### Requirement: case-form-optional-owner-name

The new case form field "屋主姓名" (owner name) SHALL be optional.

The minimum required fields for case creation SHALL be: 地址 (address), 物件類型 (property type), and 案件編號 (case number).

#### Scenario: Case created without owner name

WHEN a user submits the new case form with 屋主姓名 empty and the three required fields filled
THEN case creation SHALL succeed

##### Example:
- Input: { address: "台南市東區裕農路288巷", type: "住宅", case_number: "TEST-003", owner_name: "" }
- Output: case created successfully; owner_name=null

#### Scenario: Case created without both optional fields

WHEN a user submits the new case form with only 地址="台南市東區裕農路288巷", 物件類型="住宅", 案件編號="TEST-004" (地號 and 屋主姓名 both empty)
THEN case creation SHALL succeed

##### Example:
- Input: { address: "台南市東區裕農路288巷", type: "住宅", case_number: "TEST-004" }
- Output: case created; land_lot_no=null; owner_name=null


<!-- @trace
source: aire-ux-bugfix-wave1
updated: 2026-05-16
code:
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src/components/RealPricePanel.tsx
  - src/components/case-wizard/CaseWizard.tsx
  - src/lib/pdf-themes/registry.ts
  - next.config.ts
  - src/lib/pdf-engine/document.tsx
  - src-tauri/src/lib.rs
  - src/app/login/page.tsx
  - src/components/LogoUploader.tsx
  - src/lib/cases-api.ts
  - src/app/(dashboard)/layout.tsx
  - src/components/settings/PremiumUnlockSection.tsx
  - src/lib/pdf-themes/theme-d-fresh/index.tsx
  - src/components/settings/LandApiSection.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src-tauri/src/commands/mod.rs
  - src/lib/pdf-themes/theme-e-warm/index.tsx
  - src/app/(dashboard)/settings/page.tsx
  - src/lib/land-registry-api.ts
  - src/components/PdfPreviewer.tsx
  - src-tauri/src/mcp_client.rs
  - src/app/(dashboard)/dev/page.tsx
  - vitest.config.ts
  - src/components/CaseSupplementDialog.tsx
  - src/lib/pdf-engine/react-pdf-init.ts
  - src/lib/pdf-engine/index.ts
  - src/lib/mock-backend.ts
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/components/ComingSoonCard.tsx
  - src/lib/safe-invoke.ts
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/lib/pdf-themes/index.ts
  - src/components/AppSidebar.tsx
  - src/resources/fonts/NotoSansTC-Regular.otf
  - src/lib/pdf-engine/engine.ts
  - src/lib/pdf-engine/react-pdf-components.tsx
  - src/components/case-wizard/CaseWizardStep2.tsx
  - vitest.setup.ts
  - src/components/SettingsTabs.tsx
  - src/lib/address-parser.ts
  - src/components/CaseListActions.tsx
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - src/components/OwnerAuthorizationDialog.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/ThemeSelector.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src-tauri/src/commands/real_price.rs
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src-tauri/src/land_registry/batch/mod.rs
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/app/(dashboard)/settings/branding/page.tsx
  - src/app/(dashboard)/cases/page.tsx
  - src/app/(dashboard)/cases/new/page.tsx
tests:
  - src/lib/__tests__/address-parser.test.ts
  - src/components/__tests__/ThemeSelector.test.tsx
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/logs/__tests__/page.test.tsx
  - src/lib/pdf-engine/__tests__/render-with-legal.test.tsx
  - src/lib/pdf-engine/__tests__/document.test.tsx
  - src/lib/pdf-engine/__tests__/react-pdf-components.test.tsx
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/lib/pdf-engine/__tests__/engine.test.ts
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/components/__tests__/ComingSoonCard.test.tsx
  - src/components/__tests__/AppSidebar.test.tsx
  - src/components/__tests__/RealPricePanel.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - src/components/settings/__tests__/PremiumUnlockSection.test.tsx
-->

---
### Requirement: pull-parcel-data-visible

The case detail page (`/cases/:id`) SHALL display a "拉謄本" (pull parcel data) action entry point within the "地政資料" (land registry data) section.

The entry point SHALL be the `PullParcelDataButton` component which already exists in `src/components/PullParcelDataButton.tsx`.

#### Scenario: Parcel data button visible on case detail page

WHEN a user navigates to `/cases/TEST-001` (case detail page)
THEN a button with text "拉謄本" SHALL be present in the 地政資料 card section

##### Example:
- URL: http://localhost:3000/cases/TEST-001
- Expected: DOM contains a button element with text "拉謄本" inside the 地政資料 section

#### Scenario: Parcel data button is clickable

WHEN a user clicks "拉謄本" on the case detail page in browser dev mode
THEN the button SHALL trigger the land registry API query (or safeInvoke mock response)
AND SHALL NOT throw an uncaught error

##### Example:
- Action: click 拉謄本 on /cases/TEST-001 in browser dev mode
- Output: loading state shown; mock land registry data returned or mock response displayed


<!-- @trace
source: aire-ux-bugfix-wave1
updated: 2026-05-16
code:
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src/components/RealPricePanel.tsx
  - src/components/case-wizard/CaseWizard.tsx
  - src/lib/pdf-themes/registry.ts
  - next.config.ts
  - src/lib/pdf-engine/document.tsx
  - src-tauri/src/lib.rs
  - src/app/login/page.tsx
  - src/components/LogoUploader.tsx
  - src/lib/cases-api.ts
  - src/app/(dashboard)/layout.tsx
  - src/components/settings/PremiumUnlockSection.tsx
  - src/lib/pdf-themes/theme-d-fresh/index.tsx
  - src/components/settings/LandApiSection.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src-tauri/src/commands/mod.rs
  - src/lib/pdf-themes/theme-e-warm/index.tsx
  - src/app/(dashboard)/settings/page.tsx
  - src/lib/land-registry-api.ts
  - src/components/PdfPreviewer.tsx
  - src-tauri/src/mcp_client.rs
  - src/app/(dashboard)/dev/page.tsx
  - vitest.config.ts
  - src/components/CaseSupplementDialog.tsx
  - src/lib/pdf-engine/react-pdf-init.ts
  - src/lib/pdf-engine/index.ts
  - src/lib/mock-backend.ts
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/components/ComingSoonCard.tsx
  - src/lib/safe-invoke.ts
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/lib/pdf-themes/index.ts
  - src/components/AppSidebar.tsx
  - src/resources/fonts/NotoSansTC-Regular.otf
  - src/lib/pdf-engine/engine.ts
  - src/lib/pdf-engine/react-pdf-components.tsx
  - src/components/case-wizard/CaseWizardStep2.tsx
  - vitest.setup.ts
  - src/components/SettingsTabs.tsx
  - src/lib/address-parser.ts
  - src/components/CaseListActions.tsx
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - src/components/OwnerAuthorizationDialog.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/ThemeSelector.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src-tauri/src/commands/real_price.rs
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src-tauri/src/land_registry/batch/mod.rs
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/app/(dashboard)/settings/branding/page.tsx
  - src/app/(dashboard)/cases/page.tsx
  - src/app/(dashboard)/cases/new/page.tsx
tests:
  - src/lib/__tests__/address-parser.test.ts
  - src/components/__tests__/ThemeSelector.test.tsx
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/logs/__tests__/page.test.tsx
  - src/lib/pdf-engine/__tests__/render-with-legal.test.tsx
  - src/lib/pdf-engine/__tests__/document.test.tsx
  - src/lib/pdf-engine/__tests__/react-pdf-components.test.tsx
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/lib/pdf-engine/__tests__/engine.test.ts
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/components/__tests__/ComingSoonCard.test.tsx
  - src/components/__tests__/AppSidebar.test.tsx
  - src/components/__tests__/RealPricePanel.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - src/components/settings/__tests__/PremiumUnlockSection.test.tsx
-->

---
### Requirement: theme-card-color-preview

Each theme selection card (淡雅/科技優雅) SHALL display a color swatch preview consisting of the theme's primary color, secondary color, and background color as colored blocks.

The swatch SHALL replace the current empty gray placeholder area.

#### Scenario: Theme card shows color swatches

WHEN a user views the theme selection section in 設定 > 品牌外觀
THEN the 淡雅 card SHALL display 3 colored rectangles (primary, secondary, background)
AND the 科技優雅 card SHALL display 3 colored rectangles

##### Example:
- 淡雅 swatches: primary=#2D5A8E, secondary=#4A7EB5, background=#F5F7FA (representative values)
- 科技優雅 swatches: primary=#1A1A2E, secondary=#16213E, background=#0F3460


<!-- @trace
source: aire-ux-bugfix-wave1
updated: 2026-05-16
code:
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src/components/RealPricePanel.tsx
  - src/components/case-wizard/CaseWizard.tsx
  - src/lib/pdf-themes/registry.ts
  - next.config.ts
  - src/lib/pdf-engine/document.tsx
  - src-tauri/src/lib.rs
  - src/app/login/page.tsx
  - src/components/LogoUploader.tsx
  - src/lib/cases-api.ts
  - src/app/(dashboard)/layout.tsx
  - src/components/settings/PremiumUnlockSection.tsx
  - src/lib/pdf-themes/theme-d-fresh/index.tsx
  - src/components/settings/LandApiSection.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src-tauri/src/commands/mod.rs
  - src/lib/pdf-themes/theme-e-warm/index.tsx
  - src/app/(dashboard)/settings/page.tsx
  - src/lib/land-registry-api.ts
  - src/components/PdfPreviewer.tsx
  - src-tauri/src/mcp_client.rs
  - src/app/(dashboard)/dev/page.tsx
  - vitest.config.ts
  - src/components/CaseSupplementDialog.tsx
  - src/lib/pdf-engine/react-pdf-init.ts
  - src/lib/pdf-engine/index.ts
  - src/lib/mock-backend.ts
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/components/ComingSoonCard.tsx
  - src/lib/safe-invoke.ts
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/lib/pdf-themes/index.ts
  - src/components/AppSidebar.tsx
  - src/resources/fonts/NotoSansTC-Regular.otf
  - src/lib/pdf-engine/engine.ts
  - src/lib/pdf-engine/react-pdf-components.tsx
  - src/components/case-wizard/CaseWizardStep2.tsx
  - vitest.setup.ts
  - src/components/SettingsTabs.tsx
  - src/lib/address-parser.ts
  - src/components/CaseListActions.tsx
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - src/components/OwnerAuthorizationDialog.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/ThemeSelector.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src-tauri/src/commands/real_price.rs
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src-tauri/src/land_registry/batch/mod.rs
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/app/(dashboard)/settings/branding/page.tsx
  - src/app/(dashboard)/cases/page.tsx
  - src/app/(dashboard)/cases/new/page.tsx
tests:
  - src/lib/__tests__/address-parser.test.ts
  - src/components/__tests__/ThemeSelector.test.tsx
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/logs/__tests__/page.test.tsx
  - src/lib/pdf-engine/__tests__/render-with-legal.test.tsx
  - src/lib/pdf-engine/__tests__/document.test.tsx
  - src/lib/pdf-engine/__tests__/react-pdf-components.test.tsx
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/lib/pdf-engine/__tests__/engine.test.ts
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/components/__tests__/ComingSoonCard.test.tsx
  - src/components/__tests__/AppSidebar.test.tsx
  - src/components/__tests__/RealPricePanel.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - src/components/settings/__tests__/PremiumUnlockSection.test.tsx
-->

---
### Requirement: theme-preview-modal

The "預覽" button on each theme card SHALL open a Modal dialog containing a miniature demo 不動產 disclosure page rendered with the theme's CSS variables.

The demo SHALL include: document title, sample property address, sample property type, and a simple two-column layout. No real case data is required.

#### Scenario: Preview modal opens

WHEN a user clicks "預覽" on the 淡雅 theme card
THEN a Modal SHALL open with title "不動產說明書（預覽）"
AND the content SHALL be styled with 淡雅 theme colors

##### Example:
- Action: click 預覽 on 淡雅 card
- Output: Modal visible with demo address "台北市信義區市府路1號", rendered in 淡雅 color scheme

#### Scenario: Preview modal can be closed

WHEN the preview Modal is open
THEN clicking the × button OR clicking the backdrop outside the Modal SHALL close it

##### Example:
- Action: click backdrop outside the Modal
- Output: Modal disappears; settings page visible again

<!-- @trace
source: aire-ux-bugfix-wave1
updated: 2026-05-16
code:
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src/components/RealPricePanel.tsx
  - src/components/case-wizard/CaseWizard.tsx
  - src/lib/pdf-themes/registry.ts
  - next.config.ts
  - src/lib/pdf-engine/document.tsx
  - src-tauri/src/lib.rs
  - src/app/login/page.tsx
  - src/components/LogoUploader.tsx
  - src/lib/cases-api.ts
  - src/app/(dashboard)/layout.tsx
  - src/components/settings/PremiumUnlockSection.tsx
  - src/lib/pdf-themes/theme-d-fresh/index.tsx
  - src/components/settings/LandApiSection.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src-tauri/src/commands/mod.rs
  - src/lib/pdf-themes/theme-e-warm/index.tsx
  - src/app/(dashboard)/settings/page.tsx
  - src/lib/land-registry-api.ts
  - src/components/PdfPreviewer.tsx
  - src-tauri/src/mcp_client.rs
  - src/app/(dashboard)/dev/page.tsx
  - vitest.config.ts
  - src/components/CaseSupplementDialog.tsx
  - src/lib/pdf-engine/react-pdf-init.ts
  - src/lib/pdf-engine/index.ts
  - src/lib/mock-backend.ts
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/components/ComingSoonCard.tsx
  - src/lib/safe-invoke.ts
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/lib/pdf-themes/index.ts
  - src/components/AppSidebar.tsx
  - src/resources/fonts/NotoSansTC-Regular.otf
  - src/lib/pdf-engine/engine.ts
  - src/lib/pdf-engine/react-pdf-components.tsx
  - src/components/case-wizard/CaseWizardStep2.tsx
  - vitest.setup.ts
  - src/components/SettingsTabs.tsx
  - src/lib/address-parser.ts
  - src/components/CaseListActions.tsx
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - src/components/OwnerAuthorizationDialog.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/ThemeSelector.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src-tauri/src/commands/real_price.rs
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src-tauri/src/land_registry/batch/mod.rs
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/app/(dashboard)/settings/branding/page.tsx
  - src/app/(dashboard)/cases/page.tsx
  - src/app/(dashboard)/cases/new/page.tsx
tests:
  - src/lib/__tests__/address-parser.test.ts
  - src/components/__tests__/ThemeSelector.test.tsx
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/logs/__tests__/page.test.tsx
  - src/lib/pdf-engine/__tests__/render-with-legal.test.tsx
  - src/lib/pdf-engine/__tests__/document.test.tsx
  - src/lib/pdf-engine/__tests__/react-pdf-components.test.tsx
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/lib/pdf-engine/__tests__/engine.test.ts
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/components/__tests__/ComingSoonCard.test.tsx
  - src/components/__tests__/AppSidebar.test.tsx
  - src/components/__tests__/RealPricePanel.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - src/components/settings/__tests__/PremiumUnlockSection.test.tsx
-->

---
### Requirement: Settings SHALL store fixed delivery profile

設定頁 SHALL 提供並持久化 PDF 交付所需的固定全域經紀與公司欄位。這些欄位 SHALL 作為所有案件共用的交付資訊，而不是每個案件重複填寫。

#### Scenario: User saves realtor profile

- **GIVEN** 使用者在設定頁輸入承辦人、經紀人、經紀人證號、不動產經紀業、經紀業證號、公司地址、公司電話
- **WHEN** 使用者儲存設定
- **THEN** 系統 SHALL 持久化所有欄位
- **AND** PDF assembly SHALL 可讀取這些欄位

#### Scenario: User finds fixed delivery profile from system settings

- **GIVEN** 使用者從側邊欄進入系統設定
- **WHEN** 使用者要設定不會隨案件改變的公司與經紀資料
- **THEN** 系統 SHALL 提供清楚的「品牌與交付資訊」或等價入口
- **AND** 欄位 label SHALL 與 PDF label 一致
- **AND** 系統 SHALL NOT 要求使用者在每個案件重複輸入這些固定資料

#### Scenario: Existing saved branding data remains usable

- **GIVEN** 使用者已經保存舊版品牌文字資料
- **WHEN** 系統升級固定交付資訊欄位
- **THEN** 舊資料 SHALL 被相容讀取或遷移
- **AND** PDF SHALL NOT 因欄位命名調整而清空公司/經紀資訊

<!-- @trace
source: fix-authorized-registry-pdf-completeness
updated: 2026-05-24
code:
  - playwright-results/opcos-live/signup-filled.png
  - playwright-results/opcos-live/negative-auth-report.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/hooks/locale-currency.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/components/NavBar.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationMembersBlock.tsx
  - 0520/supastarter-nextjs-main/apps/docs/app/icon.png
  - 0520/supastarter-nextjs-main/packages/i18n/translations/de/marketing.json
  - playwright-results/opcos-live/mobile-public-_signup.png
  - 0520/supastarter-nextjs-main/apps/saas/app/robots.ts
  - 0520/supastarter-nextjs-main/turbo.json
  - playwright-results/aire-dom-ux-sdd-preview-1440.png
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/admin/organizations/[id]/page.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/legal/[...path]/page.tsx
  - 0520/supastarter-nextjs-main/packages/api/types.ts
  - 0520/不動產說明書/999- 土地-生活機能.JPG
  - playwright-results/opcos-live/verified-account-flow-report.json
  - 0520/supastarter-nextjs-main/apps/marketing/modules/i18n/config.ts
  - 0520/不動產說明書/99-土地-現況調查表-4.JPG
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationRoleSelect.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/public/images/hero-image-dark.png
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/layout.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/components/SignupForm.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/content/legal/terms.md
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationSelect.tsx
  - 0520/supastarter-nextjs-main/packages/database/package.json
  - 0520/supastarter-nextjs-main/packages/api/modules/organizations/router.ts
  - src/lib/branding-api.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/home/components/NewsletterSection.tsx
  - 0520/supastarter-nextjs-main/packages/storage/provider/s3/index.ts
  - 0520/supastarter-nextjs-main/packages/database/drizzle/index.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/InviteMemberForm.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/vitest.config.ts
  - playwright-results/opcos-live/mobile-auth-_products_aire.png
  - 0520/supastarter-nextjs-main/packages/api/orpc/router.ts
  - 0520/spectra-app-main/releases/2.3.1/Spectra_2.3.1_x64.dmg
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/ActiveOrganizationProvider.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/lib/base-url.ts
  - 0520/supastarter-nextjs-main/apps/docs/app/[[...slug]]/page.tsx
  - 0520/spectra-app-main/.github/ISSUE_TEMPLATE/config.yml
  - 0520/supastarter-nextjs-main/apps/docs/app/global.css
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/hooks/router.ts
  - 0520/不動產說明書/99-土地-現況調查表-5-1+5.JPG
  - 0520/supastarter-nextjs-main/.editorconfig
  - playwright-results/opcos-live/signup-after-submit.png
  - 0520/supastarter-nextjs-main/packages/i18n/translations/en/shared.json
  - 0520/supastarter-nextjs-main/packages/mail/package.json
  - 0520/supastarter-nextjs-main/apps/marketing/package.json
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/contact/page.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/admin/procedures/find-organization.ts
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/(home)/page.tsx
  - 0520/supastarter-nextjs-main/packages/i18n/translations/en/mail.json
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/index.tsx
  - 0520/supastarter-nextjs-main/packages/api/orpc/handler.ts
  - 0520/不動產說明書/6.JPG
  - 0520/supastarter-nextjs-main/packages/api/modules/admin/procedures/list-organizations.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/components/ClientProviders.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/ConfirmationAlertProvider.tsx
  - 0520/supastarter-nextjs-main/packages/payments/lib/customer.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/lib/api.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/components/ChangePlan.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/components/Footer.tsx
  - 0520/supastarter-nextjs-main/packages/mail/types.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/components/LoginModeSwitch.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/UserAvatarUpload.tsx
  - 0520/supastarter-nextjs-main/apps/docs/package.json
  - 0520/supastarter-nextjs-main/packages/database/drizzle/queries/users.ts
  - 0520/不動產說明書/4.JPG
  - 0520/不動產說明書/0417-old/農地_現場必問清單.docx
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/ChangePassword.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationStart.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(organizations)/[organizationSlug]/layout.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/settings/security/page.tsx
  - 0520/supastarter-nextjs-main/apps/docs/content/docs/getting-started/meta.json
  - 0520/不動產說明書-bug/22222222-2222-4222-8222-222222222222.pdf
  - 0520/supastarter-nextjs-main/packages/ui/components/input.tsx
  - 0520/不動產說明書/2.JPG
  - 0520/supastarter-nextjs-main/packages/mail/emails/Notification.tsx
  - playwright-results/opcos-live/route-_login.png
  - 0520/supastarter-nextjs-main/apps/marketing/content/legal/privacy-policy.md
  - 0520/supastarter-nextjs-main/packages/i18n/translations/es/shared.json
  - playwright-results/opcos-live/mailtm-signup-after-submit.png
  - playwright-results/opcos-live/manual-_products_aire_intent_request_access.png
  - 0520/supastarter-nextjs-main/pnpm-workspace.yaml
  - 0520/supastarter-nextjs-main/apps/marketing/tsconfig.json
  - 0520/不動產說明書-bug/ee705444-173f-4250-9360-42b90c093e31.pdf
  - src/components/SettingsTabs.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/lib/sidebar-context.tsx
  - 0520/supastarter-nextjs-main/packages/i18n/config.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/provider/google/index.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/Footer.tsx
  - 0520/supastarter-nextjs-main/packages/ai/index.ts
  - 0520/supastarter-nextjs-main/packages/storage/package.json
  - 0520/supastarter-nextjs-main/apps/saas/tsconfig.json
  - 0520/不動產說明書/建物物調表-母版.pdf
  - 0520/supastarter-nextjs-main/apps/marketing/public/images/hero-image.png
  - 0520/supastarter-nextjs-main/tooling/tailwind/tailwind-animate.css
  - 0520/不動產說明書/0417-old/不動產說明書1.pdf
  - 0520/不動產說明書/10-房屋-現況調查表-2.JPG
  - docs/opcos-saas/02-modular-frontend-system.md
  - 0520/不動產說明書/0417-old/不動產說明書14.pdf
  - playwright-results/opcos-live/route-_signup.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/lib/cache.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/StatsTileChart.tsx
  - 0520/supastarter-nextjs-main/apps/docs/app/api/search/route.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/components/ActivePlanBadge.tsx
  - playwright-results/opcos-live/auth-flow-report.json
  - docs/opcos-saas/brand-guidelines.md
  - 0520/supastarter-nextjs-main/apps/docs/mdx-components.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/admin/component/organizations/OrganizationForm.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - playwright-results/opcos-live/verified-_devices.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/CreateOrganizationForm.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/admin/component/EmailVerified.tsx
  - 0520/supastarter-nextjs-main/packages/ui/components/button.tsx
  - 0520/supastarter-nextjs-main/packages/ui/components/toast.tsx
  - src/lib/legal-clauses-defaults.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/admin/lib/links.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/components/LocaleSwitch.tsx
  - 0520/supastarter-nextjs-main/packages/i18n/translations/es/marketing.json
  - 0520/supastarter-nextjs-main/packages/notifications/src/welcome.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/ChangeNameForm.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/provider/pirsch/index.tsx
  - 0520/不動產說明書/0417-old/店面_現場必問清單.docx
  - playwright-results/opcos-live/verified-_dashboard.png
  - 0520/supastarter-nextjs-main/packages/ui/components/badge.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/not-found.tsx
  - 0520/不動產說明書/0417-old/套房_現場必問清單.docx
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/constants/oauth-providers.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/TabGroup.tsx
  - 0520/supastarter-nextjs-main/.vscode/settings.json
  - 0520/spectra-app-main/.github/ISSUE_TEMPLATE/bug_report.yml
  - playwright-results/opcos-live/forgot-password-after-submit.png
  - 0520/supastarter-nextjs-main/packages/api/modules/ai/router.ts
  - 0520/不動產說明書-bug/S__23011334.jpg
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/layout.tsx
  - 0520/supastarter-nextjs-main/packages/database/drizzle/queries/organizations.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/lib/session-context.ts
  - playwright-results/opcos-live/mobile-smoke-report.json
  - src/lib/mock-backend.ts
  - playwright-results/opcos-live/after-email-verification.png
  - 0520/supastarter-nextjs-main/packages/api/modules/notifications/procedures/mark-notifications-read.ts
  - playwright-results/opcos-live/mobile-auth-_settings_general.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/hooks/plan-data.tsx
  - 0520/不動產說明書/建物物調表-母版.txt
  - docs/opcos-saas/01-saas-starter-kit-research.md
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/lib/query-client.ts
  - 0520/supastarter-nextjs-main/packages/payments/lib/plans.ts
  - 0520/supastarter-nextjs-main/packages/ui/components/tooltip.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/components/ColorModeToggle.tsx
  - playwright-results/opcos-live/product-manual-pages.json
  - 0520/supastarter-nextjs-main/packages/ui/components/table.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/provider/vercel/index.tsx
  - 0520/supastarter-nextjs-main/packages/i18n/translations/en/marketing.json
  - 0520/supastarter-nextjs-main/packages/mail/global.d.ts
  - docs/opcos-saas/00-overview.md
  - 0520/不動產說明書/0417-old/大樓華廈_秘書後補清單.docx
  - 0520/spectra-app-main/releases/2.3.1/Spectra_2.3.1_x64-setup.exe
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/onboarding/page.tsx
  - 0520/supastarter-nextjs-main/claude.md
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/components/ConsentProvider.tsx
  - 0520/不動產說明書/0417-old/透天別墅_秘書後補清單.docx
  - playwright-results/opcos-live/home-discovery.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/components/ActivePlan.tsx
  - src/app/api/branding-text/route.ts
  - 0520/supastarter-nextjs-main/CHANGELOG.md
  - 0520/supastarter-nextjs-main/packages/notifications/tsconfig.json
  - 0520/supastarter-nextjs-main/packages/mail/lib/templates.ts
  - 0520/supastarter-nextjs-main/packages/ui/components/input-otp.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/postcss.config.cjs
  - 0520/supastarter-nextjs-main/packages/notifications/package.json
  - 0520/不動產說明書/0417-old/店面_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/.vscode/extensions.json
  - 0520/spectra-app-main/releases/2.3.0/Spectra_2.3.0_x64-setup.exe
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/lib/server.ts
  - docs/opcos-saas/04-existing-saas-audit.md
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/UserAvatarForm.tsx
  - 0520/不動產說明書/0417-old/不動產說明書8.pdf
  - 0520/supastarter-nextjs-main/tooling/typescript/nextjs.json
  - 0520/supastarter-nextjs-main/docker-compose.yml
  - 0520/supastarter-nextjs-main/apps/saas/app/(unauthenticated)/reset-password/page.tsx
  - 0520/supastarter-nextjs-main/packages/auth/index.ts
  - 0520/supastarter-nextjs-main/packages/notifications/src/resolve-link.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx
  - 0520/supastarter-nextjs-main/packages/mail/emails/MagicLink.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/ai/procedures/stream-message.ts
  - 0520/supastarter-nextjs-main/packages/api/tsconfig.json
  - 0520/supastarter-nextjs-main/apps/saas/app/(unauthenticated)/login/page.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(unauthenticated)/layout.tsx
  - 0520/supastarter-nextjs-main/apps/docs/content/docs/index.mdx
  - 0520/supastarter-nextjs-main/apps/saas/modules/onboarding/components/OnboardingForm.tsx
  - 0520/supastarter-nextjs-main/packages/auth/package.json
  - 0520/不動產說明書/0417-old/不動產書說明書10.pdf
  - 0520/supastarter-nextjs-main/apps/marketing/next.config.ts
  - 0520/supastarter-nextjs-main/packages/ai/lib/index.ts
  - 0520/supastarter-nextjs-main/packages/storage/config.ts
  - package.json
  - 0520/不動產說明書/10-房屋-現況調查表-1.JPG
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/layout.tsx
  - 0520/supastarter-nextjs-main/packages/ui/components.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/ChangeOrganizationNameForm.tsx
  - 0520/不動產說明書/0417-old/農地_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/packages/i18n/translations/fr/saas.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/admin/component/users/UserList.tsx
  - src/lib/pdf-engine/html-blocks/property-data-sheet.tsx
  - 0520/supastarter-nextjs-main/README.md
  - playwright-results/opcos-live/verified-_settings.png
  - 0520/supastarter-nextjs-main/packages/mail/components/Wrapper.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationInvitationModal.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/provider/posthog/index.tsx
  - 0520/supastarter-nextjs-main/packages/mail/provider/console.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/SubscriptionStatusBadge.tsx
  - playwright-results/opcos-live/login-after-submit.png
  - 0520/supastarter-nextjs-main/packages/ui/components/textarea.tsx
  - 0520/supastarter-nextjs-main/packages/ui/components/accordion.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/onboarding/components/OnboardingAccountStep.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/blog/components/PostContent.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/i18n/request.ts
  - 0520/supastarter-nextjs-main/packages/i18n/tsconfig.json
  - 0520/supastarter-nextjs-main/packages/api/modules/payments/procedures/list-purchases.ts
  - 0520/supastarter-nextjs-main/apps/marketing/content/posts/first-post.de.mdx
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/ActiveSessionsBlock.tsx
  - playwright-results/opcos-live/route-_.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/ConnectedAccountsBlock.tsx
  - 0520/不動產說明書-bug/291-logo-1711991296.916.svg
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/lib/server.ts
  - 0520/supastarter-nextjs-main/packages/api/modules/notifications/procedures/update-preference.ts
  - src/lib/product-navigation-ia.ts
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/changelog/page.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(organizations)/[organizationSlug]/settings/general/page.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/notifications/procedures/unread-count.ts
  - 0520/不動產說明書-bug/不動產說明書 — AIRE-TEST-002.pdf
  - docs/opcos-saas/supastarter-inventory.md
  - 0520/supastarter-nextjs-main/apps/marketing/modules/home/components/ContactForm.tsx
  - 0520/supastarter-nextjs-main/packages/auth/plugins/invitation-only/index.ts
  - 0520/不動產說明書/0417-old/不動產說明書9.pdf
  - 0520/supastarter-nextjs-main/packages/api/modules/organizations/lib/membership.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/page.tsx
  - 0520/supastarter-nextjs-main/agents.md
  - 0520/不動產說明書/9-8+9.JPG
  - playwright-results/opcos-live/post-onboarding-_settings.png
  - 0520/supastarter-nextjs-main/apps/marketing/modules/home/components/FaqSection.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/CropImageDialog.tsx
  - 0520/supastarter-nextjs-main/packages/payments/provider/creem/index.ts
  - 0520/spectra-app-main/releases/2.3.0/Spectra_2.3.0_x64.dmg
  - docs/opcos-saas/business-analysis.md
  - 0520/supastarter-nextjs-main/tooling/scripts/package.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/SetPassword.tsx
  - src/lib/registry-provenance.ts
  - 0520/supastarter-nextjs-main/apps/docs/global.d.ts
  - 0520/不動產說明書/0417-old/不動產說明書5.pdf
  - 0520/supastarter-nextjs-main/apps/docs/app/layout.tsx
  - 0520/supastarter-nextjs-main/packages/auth/config.ts
  - playwright-results/opcos-live/route-_licenses.png
  - 0520/supastarter-nextjs-main/apps/saas/playwright.config.ts
  - 0520/supastarter-nextjs-main/packages/i18n/types.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/settings/billing/page.tsx
  - 0520/supastarter-nextjs-main/tooling/typescript/react-library.json
  - 0520/supastarter-nextjs-main/apps/marketing/modules/blog/components/PostListItem.tsx
  - 0520/不動產說明書/2-1-土地-不一定要.JPG
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/lib/orpc-client.ts
  - 0520/不動產說明書/0417-old/建地_住宅地_秘書後補清單.docx
  - 0520/不動產說明書-bug/陳世曉-謄本.pdf
  - docs/opcos-saas/supastarter-reference.md
  - 0520/supastarter-nextjs-main/packages/storage/provider/index.ts
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - playwright-results/opcos-live/verified-login-after-submit.png
  - docs/clean-deploy-source.md
  - docs/opcos-saas/client-explanation.md
  - playwright-results/opcos-live/signup.png
  - playwright-results/opcos-live/route-crawl.json
  - 0520/supastarter-nextjs-main/packages/database/prisma.config.ts
  - 0520/不動產說明書/0417-old/工業地_秘書後補清單.docx
  - playwright-results/aire-dom-ux-sdd-workbench-1728.png
  - 0520/supastarter-nextjs-main/apps/marketing/config.ts
  - 0520/supastarter-nextjs-main/packages/api/modules/payments/types.ts
  - 0520/supastarter-nextjs-main/packages/auth/client.ts
  - 0520/supastarter-nextjs-main/packages/storage/types.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/hooks/use-media-query.ts
  - 0520/不動產說明書/土地不動產說明書格式範例(1050429函頒).pdf
  - 0520/不動產說明書/0417-old/建物物調表-母版.dot
  - playwright-results/opcos-live/post-onboarding-_account.png
  - 0520/不動產說明書/0417-old/不動產說明書2.pdf
  - 0520/spectra-app-main/CHANGELOG.md
  - 0520/supastarter-nextjs-main/packages/payments/provider/lemonsqueezy/index.ts
  - 0520/supastarter-nextjs-main/packages/database/drizzle/client.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/components/OtpForm.tsx
  - 0520/supastarter-nextjs-main/packages/database/prisma/queries/purchases.ts
  - 0520/supastarter-nextjs-main/packages/database/drizzle/drizzle.config.ts
  - src/components/PullParcelDataButton.tsx
  - 0520/supastarter-nextjs-main/packages/payments/lib/provider-price-ids.ts
  - 0520/不動產說明書/0417-old/套房_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/packages/i18n/lib/get-messages.ts
  - 0520/supastarter-nextjs-main/packages/ui/components/label.tsx
  - 0520/不動產說明書/99-土地-現況調查表-3.JPG
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/hooks/router.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/provider/custom/index.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/blog/lib/posts.ts
  - 0520/supastarter-nextjs-main/apps/docs/app/llms-full.txt/route.ts
  - 0520/不動產說明書/不動產說明書底版.png
  - 0520/supastarter-nextjs-main/packages/api/modules/notifications/procedures/get-preferences.ts
  - playwright-results/opcos-live/mobile-public-_login.png
  - 0520/supastarter-nextjs-main/packages/ui/components/alert.tsx
  - 0520/supastarter-nextjs-main/packages/auth/tsconfig.json
  - 0520/不動產說明書/0417-old/不動產說明說16.pdf
  - docs/opcos-saas/06-shadcn-saas-kit-comparison.md
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/ClientProviders.tsx
  - playwright-results/opcos-live/route-_settings.png
  - 0520/supastarter-nextjs-main/apps/marketing/modules/legal/lib/pages.ts
  - AGENTS.md
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/lib/sidebar-context.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/globals.css
  - 0520/supastarter-nextjs-main/packages/database/prisma/queries/notifications.ts
  - 0520/supastarter-nextjs-main/packages/i18n/translations/es/mail.json
  - 0520/supastarter-nextjs-main/packages/database/prisma/schema.prisma
  - 0520/supastarter-nextjs-main/apps/marketing/modules/home/components/PricingSection.tsx
  - 0520/supastarter-nextjs-main/package.json
  - 0520/supastarter-nextjs-main/packages/database/drizzle/schema/postgres.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/choose-plan/page.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/i18n/lib/messages.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/hooks/use-session.ts
  - 0520/supastarter-nextjs-main/packages/i18n/translations/de/shared.json
  - 0520/supastarter-nextjs-main/apps/saas/intl.d.ts
  - 0520/supastarter-nextjs-main/apps/marketing/proxy.ts
  - 0520/不動產說明書/0417-old/鄉村區建地_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/packages/mail/emails/EmailVerification.tsx
  - 0520/supastarter-nextjs-main/packages/notifications/src/index.ts
  - 0520/不動產說明書/5.JPG
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/types.ts
  - 0520/supastarter-nextjs-main/apps/saas/postcss.config.cjs
  - 0520/supastarter-nextjs-main/packages/ui/components/tabs.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/components/SocialSigninButton.tsx
  - 0520/supastarter-nextjs-main/packages/api/index.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/hooks/member-roles.ts
  - docs/opcos-saas/08-kie-ai-api-reference.md
  - 0520/supastarter-nextjs-main/apps/marketing/app/sitemap.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/i18n/lib/update-locale.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/components/CheckoutReturnContent.tsx
  - 0520/不動產說明書/0417-old/不動產說明書13.pdf
  - 0520/不動產說明書/0417-old/公寓_現場必問清單.docx
  - 0520/supastarter-nextjs-main/apps/saas/modules/admin/component/organizations/OrganizationList.tsx
  - 0520/supastarter-nextjs-main/packages/utils/lib/password-validation.ts
  - 0520/supastarter-nextjs-main/packages/storage/tsconfig.json
  - playwright-results/opcos-live/route-_account.png
  - 0520/supastarter-nextjs-main/packages/api/orpc/procedures.ts
  - 0520/supastarter-nextjs-main/packages/mail/lib/send.ts
  - src/lib/pdf-engine/html-renderer.tsx
  - 0520/spectra-app-main/.github/ISSUE_TEMPLATE/bug_report_tw.yml
  - playwright-results/opcos-live/verified-_account.png
  - 0520/supastarter-nextjs-main/packages/api/modules/admin/procedures/list-users.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(organizations)/[organizationSlug]/settings/members/page.tsx
  - 0520/supastarter-nextjs-main/packages/ui/components/dropdown-menu.tsx
  - 0520/supastarter-nextjs-main/packages/mail/tsconfig.json
  - 0520/supastarter-nextjs-main/packages/payments/provider/dodopayments/index.ts
  - 0520/supastarter-nextjs-main/CODE_REVIEW.md
  - 0520/supastarter-nextjs-main/apps/docs/content/docs/getting-started/overview.mdx
  - playwright-results/aire-house-mvp-workbench-1440.png
  - 0520/supastarter-nextjs-main/packages/database/prisma/zod-generator.config.json
  - src/lib/pdf-blocks/exterior-photo-page.tsx
  - playwright-results/opcos-live/mobile-public-_.png
  - 0520/spectra-app-main/releases/2.3.0/Spectra_2.3.0_aarch64.dmg
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/checkout-return/page.tsx
  - 0520/不動產說明書/0417-old/公寓_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/packages/ai/client.ts
  - 0520/不動產說明書-bug/AIRE-TEST-002-說明書.pdf
  - playwright-results/opcos-live/route-_forgot_password.png
  - playwright-results/opcos-live/route-_products.png
  - playwright-results/opcos-live/negative-login-invalid-credentials.png
  - 0520/不動產說明書/2-1-房屋-不一定要.JPG.JPG
  - 0520/supastarter-nextjs-main/apps/marketing/modules/i18n/routing.ts
  - 0520/supastarter-nextjs-main/packages/payments/types.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/layout.tsx
  - 0520/supastarter-nextjs-main/packages/utils/index.ts
  - 0520/supastarter-nextjs-main/.oxfmtrc.json
  - 0520/supastarter-nextjs-main/apps/marketing/app/globals.css
  - 0520/supastarter-nextjs-main/packages/i18n/translations/fr/mail.json
  - 0520/supastarter-nextjs-main/.github/dependabot.yml
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/[...rest]/page.tsx
  - 0520/supastarter-nextjs-main/packages/ai/tsconfig.json
  - 0520/supastarter-nextjs-main/apps/docs/app/og/[...slug]/route.tsx
  - 0520/supastarter-nextjs-main/packages/ui/components/select.tsx
  - 0520/supastarter-nextjs-main/packages/i18n/translations/fr/marketing.json
  - 0520/supastarter-nextjs-main/packages/notifications/src/types.ts
  - 0520/supastarter-nextjs-main/packages/ui/lib/index.ts
  - 0520/supastarter-nextjs-main/.oxlintrc.json
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/settings/notifications/page.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/PasskeysBlock.tsx
  - 0520/supastarter-nextjs-main/packages/database/prisma/zod/index.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/hooks/cookie-consent.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/ColorModeToggle.tsx
  - playwright-results/opcos-live/mobile-auth-_account.png
  - scripts/gen-yunong-candidate-pdf.mjs
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationInvitationsList.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/content-collections.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/SettingsList.tsx
  - 0520/不動產說明書/0417-old/其他土地_現場必問清單.docx
  - 0520/不動產說明書/10-房屋-現況調查表-5-1+5.JPG
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/PasswordInput.tsx
  - 0520/supastarter-nextjs-main/packages/i18n/index.ts
  - playwright-results/opcos-live/post-onboarding-flow-report.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/AuthWrapper.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/hooks/errors-messages.ts
  - 0520/supastarter-nextjs-main/packages/api/modules/organizations/procedures/generate-organization-slug.ts
  - src/app/(dashboard)/layout.tsx
  - 0520/不動產說明書/0417-old/廠房_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/packages/database/drizzle/queries/notifications.ts
  - 0520/supastarter-nextjs-main/packages/ui/components/skeleton.tsx
  - 0520/supastarter-nextjs-main/packages/auth/types.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/AppWrapper.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/LocaleSwitch.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/hooks/locale-currency.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/SettingsMenu.tsx
  - 0520/supastarter-nextjs-main/packages/auth/lib/helper.ts
  - 0520/supastarter-nextjs-main/packages/logs/lib/logger.ts
  - 0520/不動產說明書/0417-old/工業地_現場必問清單.docx
  - 0520/supastarter-nextjs-main/apps/marketing/playwright.config.ts
  - 0520/supastarter-nextjs-main/packages/api/modules/users/router.ts
  - docs/opcos-saas/07-spectra-security-audit-report.md
  - 0520/supastarter-nextjs-main/apps/marketing/modules/home/components/FeaturesSection.tsx
  - 0520/supastarter-nextjs-main/packages/i18n/translations/fr/shared.json
  - playwright-results/aire-dom-ux-sdd-preview-1728.png
  - playwright-results/opcos-live/authenticated-link-crawl.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationMembersList.tsx
  - src/lib/pdf-blocks/aerial-photo-page.tsx
  - 0520/不動產說明書/8.JPG
  - 0520/supastarter-nextjs-main/packages/logs/index.ts
  - 0520/supastarter-nextjs-main/packages/api/modules/users/procedures/create-avatar-upload-url.ts
  - 0520/supastarter-nextjs-main/packages/mail/provider/mailgun.ts
  - playwright-results/opcos-live/login-filled.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/TwoFactorBlock.tsx
  - 0520/supastarter-nextjs-main/apps/docs/config.ts
  - 0520/supastarter-nextjs-main/packages/utils/package.json
  - e2e/results/playwright-report/index.html
  - 0520/不動產說明書/7.JPG
  - 0520/supastarter-nextjs-main/apps/saas/modules/i18n/lib/update-locale.ts
  - 0520/supastarter-nextjs-main/packages/payments/provider/index.ts
  - 0520/supastarter-nextjs-main/apps/saas/next.config.ts
  - 0520/supastarter-nextjs-main/packages/api/vitest.config.ts
  - 0520/不動產說明書/0417-old/其他土地_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/packages/api/package.json
  - 0520/supastarter-nextjs-main/apps/marketing/types.ts
  - 0520/supastarter-nextjs-main/apps/docs/components/ai/page-actions.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(unauthenticated)/signup/page.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/blog/lib/mdx-components.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/blog/page.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(organizations)/[organizationSlug]/settings/billing/page.tsx
  - docs/opcos-saas/05-monorepo-migration-plan.md
  - playwright-results/opcos-live/onboarding-before-continue.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/lib/server.ts
  - 0520/spectra-app-main/README.md
  - 0520/不動產說明書/0417-old/土地物調表-母版.docx
  - 0520/supastarter-nextjs-main/apps/docs/app/llms.txt/route.ts
  - 0520/supastarter-nextjs-main/packages/ui/components/progress.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/lib/orpc-query-utils.ts
  - 0520/不動產說明書/99-土地-現況調查表-2.JPG
  - 0520/supastarter-nextjs-main/packages/mail/emails/OrganizationInvitation.tsx
  - src/lib/cases-api.ts
  - 0520/supastarter-nextjs-main/packages/api/modules/organizations/procedures/create-logo-upload-url.ts
  - 0520/不動產說明書/0417-old/大樓華廈_現場必問清單.docx
  - docs/opcos-saas/03-wp-plugin-reverse-engineering.md
  - 0520/不動產說明書/0417-old/周遭.pdf
  - 0520/supastarter-nextjs-main/apps/docs/postcss.config.mjs
  - 0520/supastarter-nextjs-main/packages/auth/auth.ts
  - 0520/supastarter-nextjs-main/packages/notifications/src/create-notification.ts
  - 0520/不動產說明書/0417-old/商業地_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/packages/utils/lib/base-url.ts
  - src/components/AppTopbar.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/StatsTile.tsx
  - 0520/supastarter-nextjs-main/packages/database/prisma/queries/users.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/provider/mixpanel/index.tsx
  - 0520/supastarter-nextjs-main/.github/workflows/validate-prs.yml
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/hooks/purchases.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/ConsentBanner.tsx
  - 0520/supastarter-nextjs-main/packages/mail/emails/index.ts
  - 0520/supastarter-nextjs-main/apps/docs/source.config.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(organizations)/[organizationSlug]/page.tsx
  - 0520/supastarter-nextjs-main/packages/ui/components/alert-dialog.tsx
  - 0520/spectra-app-main/releases/2.2.5/Spectra_2.2.5_aarch64.dmg
  - 0520/supastarter-nextjs-main/apps/marketing/app/layout.tsx
  - 0520/supastarter-nextjs-main/apps/mail-preview/package.json
  - 0520/supastarter-nextjs-main/packages/ui/components/chart.tsx
  - playwright-results/opcos-live/verified-_products.png
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/hooks/cookie-consent.ts
  - 0520/不動產說明書/10-房屋-現況調查表-3.JPG
  - 0520/不動產說明書/0417-old/不動產說明書11.pdf
  - 0520/supastarter-nextjs-main/packages/ui/components/card.tsx
  - 0520/supastarter-nextjs-main/apps/saas/global.d.ts
  - playwright-results/opcos-live/post-onboarding-_products.png
  - 0520/不動產說明書/0417-old/不動產說明書12.pdf
  - 0520/不動產說明書/0417-old/鄉村區建地_現場必問清單.docx
  - 0520/supastarter-nextjs-main/apps/marketing/app/icon.png
  - 0520/supastarter-nextjs-main/packages/auth/lib/organization.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/home/components/HeroSection.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/NotificationCenter.tsx
  - 0520/supastarter-nextjs-main/packages/ui/components/spinner.tsx
  - 0520/不動產說明書/10-房屋-現況調查表-4.JPG
  - 0520/不動產說明書/11-房屋-生活機能.JPG
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/components/ForgotPasswordForm.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - 0520/supastarter-nextjs-main/packages/notifications/src/catalog.ts
  - playwright-results/opcos-live/negative-signup-weak-password.png
  - 0520/不動產說明書/0417-old/建地_住宅地_現場必問清單.docx
  - 0520/supastarter-nextjs-main/apps/saas/vitest.config.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/not-found.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/app/robots.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/provider/plausible/index.tsx
  - 0520/supastarter-nextjs-main/packages/database/drizzle/schema/mysql.ts
  - 0520/supastarter-nextjs-main/tooling/typescript/base.json
  - playwright-results/opcos-live/auth-pages-discovery.json
  - 0520/supastarter-nextjs-main/apps/marketing/content/legal/privacy-policy.de.md
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/components/PricingTable.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/UserAvatar.tsx
  - 0520/supastarter-nextjs-main/tooling/typescript/package.json
  - 0520/supastarter-nextjs-main/packages/ui/components/form.tsx
  - 0520/supastarter-nextjs-main/packages/mail/config.ts
  - 0520/不動產說明書/0417-old/不動產說明說15.pdf
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/lib/active-organization-context.ts
  - 0520/不動產說明書/1-封面.png
  - 0520/supastarter-nextjs-main/packages/database/prisma/queries/index.ts
  - playwright-results/opcos-live/route-_dashboard.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/DeleteAccountForm.tsx
  - 0520/supastarter-nextjs-main/packages/utils/tsconfig.json
  - e2e/results/results.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/NotificationPreferencesForm.tsx
  - 0520/supastarter-nextjs-main/packages/storage/index.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/components/LoginForm.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/ai/components/AiChat.tsx
  - 0520/supastarter-nextjs-main/apps/saas/types.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationsGrid.tsx
  - 0520/supastarter-nextjs-main/packages/ui/components/popover.tsx
  - playwright-results/opcos-live/home.png
  - 0520/supastarter-nextjs-main/packages/payments/tsconfig.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationLogo.tsx
  - playwright-results/opcos-live/mobile-auth-_products.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/PageHeader.tsx
  - 0520/supastarter-nextjs-main/apps/docs/lib/source.ts
  - 0520/supastarter-nextjs-main/packages/payments/lib/helper.ts
  - 0520/supastarter-nextjs-main/packages/api/modules/payments/procedures/create-customer-portal-link.ts
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/blog/[...path]/page.tsx
  - src/lib/product-ui-demo-alignment.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/lib/purchases-context.ts
  - 0520/supastarter-nextjs-main/packages/i18n/translations/en/saas.json
  - 0520/supastarter-nextjs-main/packages/mail/provider/index.ts
  - playwright-results/opcos-live/post-onboarding-_dashboard.png
  - 0520/supastarter-nextjs-main/packages/i18n/translations/de/mail.json
  - 0520/supastarter-nextjs-main/packages/ui/components/switch.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/settings/general/page.tsx
  - 0520/supastarter-nextjs-main/packages/ui/package.json
  - 0520/supastarter-nextjs-main/packages/api/modules/payments/router.ts
  - 0520/supastarter-nextjs-main/packages/mail/provider/nodemailer.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationLogoForm.tsx
  - playwright-results/opcos-live/mailtm-signup-filled.png
  - 0520/supastarter-nextjs-main/packages/ui/index.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/[...rest]/page.tsx
  - 0520/supastarter-nextjs-main/packages/api/orpc/middleware/locale-middleware.ts
  - 0520/supastarter-nextjs-main/packages/database/drizzle/queries/purchases.ts
  - 0520/supastarter-nextjs-main/packages/ui/components/sheet.tsx
  - 0520/supastarter-nextjs-main/packages/mail/emails/ForgotPassword.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/i18n/lib/messages.ts
  - playwright-results/aire-house-mvp-workbench-1728.png
  - 0520/supastarter-nextjs-main/apps/mail-preview/tsconfig.json
  - 0520/supastarter-nextjs-main/packages/mail/provider/postmark.ts
  - 0520/supastarter-nextjs-main/packages/payments/provider/stripe/index.ts
  - 0520/不動產說明書/0417-old/廠房_現場必問清單.docx
  - 0520/supastarter-nextjs-main/packages/ui/components/logo.tsx
  - 0520/spectra-app-main/releases/2.2.5/Spectra_2.2.5_x64-setup.exe
  - 0520/不動產說明書/0417-old/不動產書說明說7.pdf
  - 0520/supastarter-nextjs-main/apps/marketing/content/posts/second-post.mdx
  - 0520/supastarter-nextjs-main/apps/saas/package.json
  - 0520/不動產說明書/20-(105-04-29)成屋不動產說明書格式範例.pdf
  - 0520/supastarter-nextjs-main/apps/marketing/modules/changelog/components/ChangelogSection.tsx
  - playwright-results/aire-house-mvp-workbench-labels-1440.png
  - 0520/supastarter-nextjs-main/packages/mail/index.ts
  - 0520/supastarter-nextjs-main/apps/marketing/content/legal/terms.de.md
  - 0520/supastarter-nextjs-main/packages/api/modules/payments/procedures/create-checkout-link.ts
  - playwright-results/aire-dom-ux-sdd-workbench-1440.png
  - 0520/不動產說明書/99-土地-現況調查表-1.JPG
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/CustomerPortalButton.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/notifications/router.ts
  - 0520/supastarter-nextjs-main/packages/ui/tsconfig.json
  - 0520/supastarter-nextjs-main/packages/mail/lib/translations.ts
  - 0520/不動產說明書-bug/截圖 2026-05-19 下午3.11.11.png
  - 0520/supastarter-nextjs-main/tooling/tailwind/theme.css
  - 0520/supastarter-nextjs-main/packages/payments/config.ts
  - 0520/supastarter-nextjs-main/apps/docs/types.ts
  - 0520/不動產說明書/0417-old/農舍_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/packages/database/drizzle/schema/index.ts
  - 0520/supastarter-nextjs-main/packages/mail/components/PrimaryButton.tsx
  - 0520/supastarter-nextjs-main/apps/docs/app/llms.mdx/[[...slug]]/route.ts
  - playwright-results/opcos-live/route-_devices.png
  - 0520/supastarter-nextjs-main/apps/marketing/global.d.ts
  - 0520/supastarter-nextjs-main/packages/database/prisma/client.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/UserLanguageForm.tsx
  - src/lib/pdf-engine/document.tsx
  - 0520/supastarter-nextjs-main/packages/mail/lib/i18n.ts
  - 0520/不動產說明書/0417-old/不動產說明書4.pdf
  - 0520/supastarter-nextjs-main/packages/payments/index.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/organization-invitation/[invitationId]/page.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/i18n/types.ts
  - 0520/supastarter-nextjs-main/apps/saas/config.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/icon.png
  - 0520/supastarter-nextjs-main/apps/marketing/modules/blog/types.ts
  - playwright-results/opcos-live/post-onboarding-_devices.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/SettingsItem.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/notifications/procedures/list-notifications.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/ConsentProvider.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/image-proxy/[...path]/route.ts
  - 0520/supastarter-nextjs-main/packages/database/prisma/index.ts
  - 0520/supastarter-nextjs-main/packages/i18n/translations/de/saas.json
  - 0520/不動產說明書/0417-old/商業地_現場必問清單.docx
  - playwright-results/opcos-live/verified-_licenses.png
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/admin/organizations/page.tsx
  - 0520/supastarter-nextjs-main/apps/docs/tsconfig.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/ChangeEmailForm.tsx
  - 0520/supastarter-nextjs-main/packages/database/drizzle/queries/index.ts
  - 0520/spectra-app-main/releases/2.3.1/Spectra_2.3.1_aarch64.dmg
  - 0520/supastarter-nextjs-main/packages/ui/components/avatar.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(unauthenticated)/forgot-password/page.tsx
  - 0520/不動產說明書/格局圖.jpg
  - 0520/supastarter-nextjs-main/packages/api/modules/admin/router.ts
  - 0520/不動產說明書/0417-old/農舍_現場必問清單.docx
  - 0520/supastarter-nextjs-main/packages/mail/provider/resend.ts
  - 0520/supastarter-nextjs-main/tooling/tailwind/package.json
  - playwright-results/opcos-live/post-onboarding-_licenses.png
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - 0520/不動產說明書-bug/截圖 2026-05-20 凌晨12.09.28.png
  - 0520/supastarter-nextjs-main/apps/marketing/modules/home/types.ts
  - 0520/supastarter-nextjs-main/tooling/scripts/tsconfig.json
  - docs/opcos-saas/opcos-vision.md
  - src/lib/pdf-blocks/property-data-sheet.tsx
  - 0520/supastarter-nextjs-main/packages/database/tsconfig.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/NavBar.tsx
  - 0520/不動產說明書/3-2+3.JPG
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/chatbot/page.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/admin/users/page.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(unauthenticated)/verify/page.tsx
  - 0520/supastarter-nextjs-main/apps/docs/next.config.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/ApiClientProvider.tsx
  - 0520/supastarter-nextjs-main/packages/database/index.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/hooks/use-active-organization.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/new-organization/page.tsx
  - 0520/supastarter-nextjs-main/packages/i18n/translations/es/saas.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/lib/api.ts
  - 0520/supastarter-nextjs-main/tsconfig.json
  - playwright-results/opcos-live/login.png
  - 0520/supastarter-nextjs-main/apps/marketing/intl.d.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/provider/umami/index.tsx
  - 0520/supastarter-nextjs-main/packages/logs/package.json
  - 0520/supastarter-nextjs-main/packages/ai/package.json
  - 0520/spectra-app-main/.github/ISSUE_TEMPLATE/feature_request_tw.yml
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/Pagination.tsx
  - 0520/supastarter-nextjs-main/tooling/scripts/src/create-user.ts
  - 0520/supastarter-nextjs-main/packages/ai/lib/prompts.ts
  - playwright-results/opcos-live/manual-_products_aire_devices.png
  - docs/handoff/2026-05-23-aire-presurvey-property-sheet-handoff.md
  - 0520/supastarter-nextjs-main/packages/api/modules/notifications/procedures/mark-all-read.ts
  - 0520/supastarter-nextjs-main/packages/database/drizzle/zod.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/UserMenu.tsx
  - 0520/supastarter-nextjs-main/packages/payments/provider/polar/index.ts
  - 0520/supastarter-nextjs-main/packages/i18n/package.json
  - 0520/supastarter-nextjs-main/apps/marketing/content/posts/first-post.mdx
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/DeleteOrganizationForm.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/i18n/request.ts
  - playwright-results/opcos-live/verified-login-filled.png
  - 0520/supastarter-nextjs-main/apps/docs/content/docs/meta.json
  - 0520/supastarter-nextjs-main/packages/ui/components/dialog.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/lib/content.ts
  - 0520/不動產說明書/0417-old/不動產說明書3.pdf
  - 0520/supastarter-nextjs-main/apps/saas/app/layout.tsx
  - 0520/不動產說明書-bug/html-pdf-demo.pdf
  - playwright-results/opcos-live/onboarding-after-continue.png
  - 0520/spectra-app-main/.github/ISSUE_TEMPLATE/feature_request.yml
  - 0520/不動產說明書/0417-old/不動產說明書6.pdf
  - 0520/不動產說明書/0417-old/透明房價一覽表成交行情.pdf
  - 0520/supastarter-nextjs-main/packages/api/config.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/components/SessionProvider.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/api/[[...rest]]/route.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/components/ResetPasswordForm.tsx
  - docs/land-registry-nlsc-cad-probe.md
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/components/ConsentBanner.tsx
  - 0520/supastarter-nextjs-main/packages/mail/provider/plunk.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationInvitationAlert.tsx
  - 0520/supastarter-nextjs-main/packages/logs/tsconfig.json
  - 0520/不動產說明書/0417-old/透天別墅_現場必問清單.docx
  - 0520/spectra-app-main/releases/2.2.5/Spectra_2.2.5_x64.dmg
  - 0520/supastarter-nextjs-main/packages/database/drizzle/schema/sqlite.ts
  - 0520/supastarter-nextjs-main/packages/payments/package.json
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/lib/base-url.ts
  - 0520/supastarter-nextjs-main/packages/database/prisma/queries/organizations.ts
  - 0520/spectra-app-main/assets/logo.png
tests:
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/app/(dashboard)/settings/branding/__tests__/page.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/branding-storage.test.tsx
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - src/app/(dashboard)/__tests__/layout.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/lib/base-url.test.ts
  - 0520/supastarter-nextjs-main/packages/api/modules/organizations/lib/membership.test.ts
  - src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx
  - src/lib/pdf-engine/__tests__/html-renderer-floor-plan-photo.test.tsx
  - 0520/supastarter-nextjs-main/apps/saas/tests/login.spec.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/lib/content.test.ts
  - src/lib/__tests__/product-ui-demo-alignment.test.ts
  - e2e/complete-presurvey-property-sheet-flow.spec.ts
  - 0520/supastarter-nextjs-main/packages/api/modules/organizations/procedures/generate-organization-slug.test.ts
  - src/components/__tests__/SettingsTabs.test.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/lib/base-url.test.ts
  - src/components/__tests__/AppSidebar.test.tsx
  - 0520/supastarter-nextjs-main/packages/api/orpc/procedures.test.ts
  - 0520/supastarter-nextjs-main/apps/marketing/tests/home.spec.ts
  - e2e/candidate-parcel-options-presurvey.spec.ts
  - src/lib/pdf-blocks/__tests__/registry-image-pages.test.tsx
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - src/lib/__tests__/registry-provenance.test.ts
-->

---
### Requirement: Settings SHALL separate personal, registry authorization, and plan upgrade

設定頁 SHALL 分離個人設定、地政授權、方案升級與開發中功能，不得在資料來源或工作頁顯示設定內容。

#### Scenario: User opens settings page

- **GIVEN** 使用者進入設定相關頁面
- **WHEN** 頁面載入
- **THEN** 個人資料、密碼、品牌色、地政授權與方案升級 SHALL 各自位於清楚分區
- **AND** 開發中功能 SHALL 顯示目前正在開發中

<!-- @trace
source: complete-presurvey-property-sheet-flow
updated: 2026-05-24
code:
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/UserMenu.tsx
  - 0520/supastarter-nextjs-main/packages/mail/provider/plunk.ts
  - 0520/supastarter-nextjs-main/packages/mail/lib/templates.ts
  - 0520/supastarter-nextjs-main/apps/docs/content/docs/getting-started/overview.mdx
  - 0520/spectra-app-main/.github/ISSUE_TEMPLATE/feature_request_tw.yml
  - 0520/supastarter-nextjs-main/apps/marketing/vitest.config.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/ActiveOrganizationProvider.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/payments/procedures/create-customer-portal-link.ts
  - 0520/不動產說明書-bug/S__23011334.jpg
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationMembersList.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/hooks/use-active-organization.ts
  - src-tauri/src/land_registry/apis/mod.rs
  - 0520/supastarter-nextjs-main/packages/database/drizzle/schema/postgres.ts
  - 0520/supastarter-nextjs-main/packages/database/drizzle/client.ts
  - 0520/不動產說明書/0417-old/不動產說明書9.pdf
  - 0520/supastarter-nextjs-main/packages/api/types.ts
  - docs/land-registry-nlsc-cad-probe.md
  - 0520/supastarter-nextjs-main/packages/payments/provider/polar/index.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/lib/api.ts
  - 0520/supastarter-nextjs-main/packages/ui/components/progress.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/ActiveSessionsBlock.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/provider/pirsch/index.tsx
  - 0520/不動產說明書/0417-old/套房_現場必問清單.docx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/UserAvatar.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(unauthenticated)/login/page.tsx
  - 0520/supastarter-nextjs-main/tooling/scripts/src/create-user.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/globals.css
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/provider/posthog/index.tsx
  - 0520/supastarter-nextjs-main/packages/mail/provider/console.ts
  - 0520/supastarter-nextjs-main/packages/ui/components/sheet.tsx
  - 0520/supastarter-nextjs-main/packages/utils/index.ts
  - 0520/supastarter-nextjs-main/packages/ui/components/tabs.tsx
  - 0520/不動產說明書/999- 土地-生活機能.JPG
  - 0520/supastarter-nextjs-main/packages/i18n/index.ts
  - 0520/不動產說明書/0417-old/不動產說明書3.pdf
  - 0520/supastarter-nextjs-main/apps/saas/modules/admin/component/organizations/OrganizationForm.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/PageHeader.tsx
  - 0520/supastarter-nextjs-main/packages/ui/components/switch.tsx
  - src/lib/registry-preview.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/ApiClientProvider.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/ConsentBanner.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/ColorModeToggle.tsx
  - 0520/supastarter-nextjs-main/apps/docs/tsconfig.json
  - 0520/supastarter-nextjs-main/docker-compose.yml
  - playwright-results/opcos-live/login-filled.png
  - 0520/supastarter-nextjs-main/packages/payments/provider/dodopayments/index.ts
  - 0520/supastarter-nextjs-main/apps/docs/config.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/hooks/use-media-query.ts
  - 0520/supastarter-nextjs-main/packages/notifications/src/resolve-link.ts
  - 0520/supastarter-nextjs-main/packages/payments/lib/plans.ts
  - 0520/不動產說明書/0417-old/其他土地_現場必問清單.docx
  - 0520/spectra-app-main/releases/2.2.5/Spectra_2.2.5_x64.dmg
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/components/SessionProvider.tsx
  - 0520/不動產說明書-bug/截圖 2026-05-19 下午3.11.11.png
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(organizations)/[organizationSlug]/layout.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/components/ActivePlanBadge.tsx
  - 0520/supastarter-nextjs-main/packages/ui/lib/index.ts
  - playwright-results/opcos-live/manual-_products_aire_intent_request_access.png
  - 0520/supastarter-nextjs-main/packages/i18n/translations/fr/marketing.json
  - 0520/supastarter-nextjs-main/packages/i18n/translations/fr/saas.json
  - 0520/supastarter-nextjs-main/apps/saas/app/(unauthenticated)/layout.tsx
  - 0520/supastarter-nextjs-main/packages/database/prisma/index.ts
  - 0520/supastarter-nextjs-main/packages/notifications/package.json
  - 0520/不動產說明書/0417-old/鄉村區建地_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/apps/marketing/content-collections.ts
  - 0520/supastarter-nextjs-main/packages/ai/tsconfig.json
  - 0520/supastarter-nextjs-main/packages/i18n/translations/de/shared.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/lib/base-url.ts
  - 0520/supastarter-nextjs-main/packages/database/drizzle/schema/mysql.ts
  - 0520/不動產說明書/99-土地-現況調查表-1.JPG
  - src/components/AppTopbar.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationMembersBlock.tsx
  - 0520/supastarter-nextjs-main/packages/i18n/translations/es/mail.json
  - 0520/supastarter-nextjs-main/packages/ai/package.json
  - playwright-results/opcos-live/home-discovery.json
  - 0520/supastarter-nextjs-main/packages/mail/tsconfig.json
  - 0520/spectra-app-main/releases/2.2.5/Spectra_2.2.5_x64-setup.exe
  - 0520/supastarter-nextjs-main/packages/api/modules/admin/router.ts
  - 0520/supastarter-nextjs-main/packages/logs/tsconfig.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/onboarding/components/OnboardingForm.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/hooks/member-roles.ts
  - 0520/不動產說明書/建物物調表-母版.pdf
  - src/app/(dashboard)/cases/new/page.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/home/components/FaqSection.tsx
  - 0520/supastarter-nextjs-main/packages/database/drizzle/drizzle.config.ts
  - 0520/不動產說明書/0417-old/不動產書說明書10.pdf
  - 0520/supastarter-nextjs-main/packages/ui/components/dialog.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/provider/plausible/index.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/ConnectedAccountsBlock.tsx
  - 0520/不動產說明書/0417-old/工業地_現場必問清單.docx
  - docs/opcos-saas/07-spectra-security-audit-report.md
  - 0520/supastarter-nextjs-main/tooling/tailwind/package.json
  - 0520/supastarter-nextjs-main/packages/storage/types.ts
  - 0520/不動產說明書/4.JPG
  - src-tauri/src/land_registry/errors/tests.rs
  - 0520/supastarter-nextjs-main/packages/ai/client.ts
  - 0520/supastarter-nextjs-main/tooling/typescript/package.json
  - 0520/supastarter-nextjs-main/apps/marketing/modules/i18n/request.ts
  - playwright-results/opcos-live/login.png
  - src/lib/pdf-blocks/aerial-photo-page.tsx
  - 0520/spectra-app-main/releases/2.3.1/Spectra_2.3.1_x64.dmg
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/hooks/locale-currency.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/SettingsItem.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/lib/purchases-context.ts
  - src/lib/pdf-blocks/property-data-sheet.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/hooks/cookie-consent.ts
  - 0520/supastarter-nextjs-main/packages/api/modules/payments/procedures/create-checkout-link.ts
  - 0520/supastarter-nextjs-main/apps/docs/app/layout.tsx
  - playwright-results/opcos-live/auth-flow-report.json
  - 0520/supastarter-nextjs-main/packages/i18n/translations/fr/mail.json
  - 0520/supastarter-nextjs-main/apps/docs/app/llms-full.txt/route.ts
  - 0520/不動產說明書/0417-old/店面_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationLogo.tsx
  - 0520/supastarter-nextjs-main/packages/api/config.ts
  - 0520/supastarter-nextjs-main/packages/ui/components/textarea.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/legal/lib/pages.ts
  - 0520/supastarter-nextjs-main/packages/database/prisma/queries/notifications.ts
  - 0520/supastarter-nextjs-main/packages/notifications/src/types.ts
  - 0520/不動產說明書/0417-old/農舍_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/chatbot/page.tsx
  - package.json
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/admin/users/page.tsx
  - 0520/supastarter-nextjs-main/packages/payments/tsconfig.json
  - 0520/不動產說明書/0417-old/周遭.pdf
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/lib/active-organization-context.ts
  - 0520/supastarter-nextjs-main/packages/storage/provider/s3/index.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/UserAvatarForm.tsx
  - 0520/supastarter-nextjs-main/packages/storage/package.json
  - 0520/supastarter-nextjs-main/apps/marketing/playwright.config.ts
  - playwright-results/opcos-live/mobile-public-_login.png
  - 0520/supastarter-nextjs-main/packages/i18n/tsconfig.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/StatsTile.tsx
  - 0520/spectra-app-main/CHANGELOG.md
  - 0520/supastarter-nextjs-main/packages/ui/components/toast.tsx
  - 0520/不動產說明書/0417-old/大樓華廈_現場必問清單.docx
  - 0520/不動產說明書/5.JPG
  - 0520/supastarter-nextjs-main/apps/marketing/app/sitemap.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/types.ts
  - 0520/supastarter-nextjs-main/packages/mail/provider/postmark.ts
  - 0520/supastarter-nextjs-main/packages/ui/components/logo.tsx
  - 0520/supastarter-nextjs-main/apps/saas/tsconfig.json
  - 0520/supastarter-nextjs-main/packages/api/modules/admin/procedures/list-users.ts
  - playwright-results/opcos-live/verified-_account.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationInvitationsList.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/components/LocaleSwitch.tsx
  - 0520/不動產說明書/0417-old/建地_住宅地_秘書後補清單.docx
  - 0520/不動產說明書/0417-old/不動產說明書5.pdf
  - 0520/supastarter-nextjs-main/packages/database/drizzle/zod.ts
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/blog/[...path]/page.tsx
  - 0520/不動產說明書/11-房屋-生活機能.JPG
  - 0520/supastarter-nextjs-main/.vscode/extensions.json
  - 0520/不動產說明書/0417-old/農舍_現場必問清單.docx
  - playwright-results/opcos-live/post-onboarding-_licenses.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationsGrid.tsx
  - docs/opcos-saas/brand-guidelines.md
  - playwright-results/opcos-live/route-_dashboard.png
  - 0520/supastarter-nextjs-main/apps/marketing/next.config.ts
  - playwright-results/opcos-live/verified-login-after-submit.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/onboarding/components/OnboardingAccountStep.tsx
  - 0520/supastarter-nextjs-main/packages/logs/package.json
  - 0520/supastarter-nextjs-main/apps/docs/app/icon.png
  - 0520/supastarter-nextjs-main/packages/database/prisma/queries/index.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/hooks/plan-data.tsx
  - playwright-results/aire-dom-ux-sdd-preview-1728.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/components/ActivePlan.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/admin/procedures/list-organizations.ts
  - 0520/supastarter-nextjs-main/packages/ui/components/select.tsx
  - src/components/SettingsTabs.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/provider/google/index.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/i18n/types.ts
  - 0520/supastarter-nextjs-main/packages/database/prisma.config.ts
  - 0520/supastarter-nextjs-main/packages/utils/tsconfig.json
  - 0520/supastarter-nextjs-main/packages/i18n/lib/get-messages.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/components/OtpForm.tsx
  - playwright-results/aire-dom-ux-sdd-workbench-1440.png
  - 0520/supastarter-nextjs-main/packages/i18n/translations/de/saas.json
  - 0520/不動產說明書/10-房屋-現況調查表-3.JPG
  - 0520/不動產說明書-bug/AIRE-TEST-002-說明書.pdf
  - 0520/supastarter-nextjs-main/packages/auth/index.ts
  - 0520/supastarter-nextjs-main/packages/database/prisma/zod-generator.config.json
  - 0520/不動產說明書/土地不動產說明書格式範例(1050429函頒).pdf
  - 0520/supastarter-nextjs-main/CODE_REVIEW.md
  - 0520/不動產說明書/20-(105-04-29)成屋不動產說明書格式範例.pdf
  - 0520/supastarter-nextjs-main/apps/saas/postcss.config.cjs
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/provider/umami/index.tsx
  - 0520/supastarter-nextjs-main/packages/mail/emails/index.ts
  - 0520/supastarter-nextjs-main/packages/notifications/src/catalog.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/settings/general/page.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/package.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/ConsentProvider.tsx
  - 0520/supastarter-nextjs-main/apps/mail-preview/tsconfig.json
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/onboarding/page.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/lib/orpc-query-utils.ts
  - 0520/supastarter-nextjs-main/packages/utils/package.json
  - 0520/不動產說明書-bug/291-logo-1711991296.916.svg
  - 0520/supastarter-nextjs-main/packages/ui/components/input.tsx
  - 0520/不動產說明書/0417-old/商業地_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/provider/mixpanel/index.tsx
  - 0520/supastarter-nextjs-main/CHANGELOG.md
  - playwright-results/opcos-live/post-onboarding-_devices.png
  - 0520/supastarter-nextjs-main/packages/api/modules/notifications/procedures/unread-count.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/DeleteOrganizationForm.tsx
  - playwright-results/opcos-live/mobile-auth-_products.png
  - 0520/supastarter-nextjs-main/apps/marketing/modules/changelog/components/ChangelogSection.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/LocaleSwitch.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/admin/component/EmailVerified.tsx
  - 0520/supastarter-nextjs-main/tooling/tailwind/tailwind-animate.css
  - playwright-results/opcos-live/post-onboarding-_account.png
  - 0520/supastarter-nextjs-main/.github/dependabot.yml
  - src-tauri/src/land_registry/apis/nlsc_cadastral.rs
  - 0520/supastarter-nextjs-main/packages/ui/components/popover.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/types.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/components/CheckoutReturnContent.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/ai/router.ts
  - src/lib/pdf-blocks/exterior-photo-page.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/AppWrapper.tsx
  - 0520/supastarter-nextjs-main/apps/docs/app/global.css
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/components/ForgotPasswordForm.tsx
  - 0520/supastarter-nextjs-main/packages/database/prisma/zod/index.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(organizations)/[organizationSlug]/settings/billing/page.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationInvitationAlert.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/ClientProviders.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/CustomerPortalButton.tsx
  - src/lib/pdf-engine/html-blocks/property-data-sheet.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/SetPassword.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/PasswordInput.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/components/ConsentProvider.tsx
  - scripts/gen-yunong-candidate-pdf.mjs
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/checkout-return/page.tsx
  - 0520/supastarter-nextjs-main/packages/i18n/translations/es/saas.json
  - 0520/supastarter-nextjs-main/packages/ui/components/tooltip.tsx
  - 0520/supastarter-nextjs-main/packages/auth/types.ts
  - 0520/supastarter-nextjs-main/apps/docs/mdx-components.tsx
  - 0520/不動產說明書/9-8+9.JPG
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/StatsTileChart.tsx
  - docs/opcos-saas/04-existing-saas-audit.md
  - 0520/不動產說明書/0417-old/公寓_秘書後補清單.docx
  - 0520/spectra-app-main/.github/ISSUE_TEMPLATE/bug_report_tw.yml
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationSelect.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/hooks/cookie-consent.ts
  - 0520/不動產說明書-bug/陳世曉-謄本.pdf
  - 0520/supastarter-nextjs-main/apps/mail-preview/package.json
  - 0520/supastarter-nextjs-main/tooling/scripts/tsconfig.json
  - docs/clean-deploy-source.md
  - 0520/不動產說明書/0417-old/公寓_現場必問清單.docx
  - 0520/supastarter-nextjs-main/apps/saas/intl.d.ts
  - 0520/不動產說明書/0417-old/鄉村區建地_現場必問清單.docx
  - 0520/不動產說明書/0417-old/建物物調表-母版.dot
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/settings/billing/page.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/api/[[...rest]]/route.ts
  - 0520/supastarter-nextjs-main/packages/i18n/translations/de/mail.json
  - 0520/supastarter-nextjs-main/packages/api/modules/admin/procedures/find-organization.ts
  - 0520/supastarter-nextjs-main/tooling/scripts/package.json
  - src/components/PullParcelDataButton.tsx
  - 0520/supastarter-nextjs-main/apps/docs/postcss.config.mjs
  - playwright-results/opcos-live/negative-auth-report.json
  - 0520/不動產說明書/0417-old/透明房價一覽表成交行情.pdf
  - src/lib/pdf-engine/html-renderer.tsx
  - 0520/supastarter-nextjs-main/apps/docs/source.config.ts
  - 0520/supastarter-nextjs-main/tooling/typescript/nextjs.json
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/components/ConsentBanner.tsx
  - e2e/results/results.json
  - 0520/不動產說明書/0417-old/建地_住宅地_現場必問清單.docx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/layout.tsx
  - docs/opcos-saas/supastarter-reference.md
  - 0520/不動產說明書/10-房屋-現況調查表-1.JPG
  - 0520/supastarter-nextjs-main/packages/i18n/translations/en/mail.json
  - playwright-results/opcos-live/home.png
  - 0520/spectra-app-main/.github/ISSUE_TEMPLATE/bug_report.yml
  - 0520/supastarter-nextjs-main/apps/saas/modules/lib/sidebar-context.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/components/ChangePlan.tsx
  - playwright-results/opcos-live/signup.png
  - 0520/supastarter-nextjs-main/packages/api/orpc/procedures.ts
  - 0520/不動產說明書/建物物調表-母版.txt
  - 0520/supastarter-nextjs-main/apps/saas/app/layout.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/ai/procedures/stream-message.ts
  - 0520/supastarter-nextjs-main/packages/mail/provider/index.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/provider/vercel/index.tsx
  - src/lib/product-ui-demo-alignment.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/lib/session-context.ts
  - 0520/supastarter-nextjs-main/packages/auth/package.json
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/not-found.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/PasskeysBlock.tsx
  - 0520/supastarter-nextjs-main/packages/ui/components/skeleton.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/legal/[...path]/page.tsx
  - 0520/supastarter-nextjs-main/packages/ui/package.json
  - playwright-results/opcos-live/post-onboarding-_settings.png
  - 0520/supastarter-nextjs-main/packages/api/index.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/lib/cache.ts
  - 0520/supastarter-nextjs-main/packages/database/drizzle/queries/notifications.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/Footer.tsx
  - 0520/supastarter-nextjs-main/packages/ui/components/alert-dialog.tsx
  - 0520/supastarter-nextjs-main/apps/docs/app/[[...slug]]/page.tsx
  - 0520/supastarter-nextjs-main/apps/saas/vitest.config.ts
  - 0520/spectra-app-main/releases/2.3.0/Spectra_2.3.0_x64-setup.exe
  - 0520/supastarter-nextjs-main/apps/saas/modules/i18n/lib/update-locale.ts
  - 0520/supastarter-nextjs-main/packages/mail/components/PrimaryButton.tsx
  - playwright-results/opcos-live/post-onboarding-flow-report.json
  - 0520/supastarter-nextjs-main/apps/marketing/intl.d.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/blog/lib/mdx-components.tsx
  - 0520/不動產說明書/0417-old/不動產說明書1.pdf
  - 0520/spectra-app-main/.github/ISSUE_TEMPLATE/feature_request.yml
  - 0520/supastarter-nextjs-main/.github/workflows/validate-prs.yml
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/SettingsMenu.tsx
  - 0520/supastarter-nextjs-main/packages/api/package.json
  - 0520/supastarter-nextjs-main/packages/i18n/translations/en/shared.json
  - 0520/supastarter-nextjs-main/apps/marketing/modules/home/components/PricingSection.tsx
  - 0520/不動產說明書/0417-old/不動產說明說15.pdf
  - 0520/supastarter-nextjs-main/packages/i18n/translations/en/saas.json
  - 0520/不動產說明書/7.JPG
  - 0520/不動產說明書-bug/截圖 2026-05-20 凌晨12.09.28.png
  - 0520/supastarter-nextjs-main/apps/marketing/modules/i18n/routing.ts
  - 0520/supastarter-nextjs-main/packages/database/drizzle/schema/sqlite.ts
  - 0520/supastarter-nextjs-main/packages/payments/config.ts
  - 0520/supastarter-nextjs-main/packages/payments/lib/customer.ts
  - src/lib/product-navigation-ia.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/components/LoginModeSwitch.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/blog/components/PostListItem.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/content/legal/terms.de.md
  - 0520/supastarter-nextjs-main/packages/auth/lib/organization.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/home/components/ContactForm.tsx
  - playwright-results/aire-house-mvp-workbench-1440.png
  - 0520/supastarter-nextjs-main/apps/marketing/global.d.ts
  - src/lib/branding-api.ts
  - playwright-results/opcos-live/negative-login-invalid-credentials.png
  - 0520/supastarter-nextjs-main/packages/api/modules/organizations/router.ts
  - 0520/supastarter-nextjs-main/apps/docs/app/api/search/route.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/components/ClientProviders.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationLogoForm.tsx
  - playwright-results/opcos-live/mailtm-signup-filled.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/CreateOrganizationForm.tsx
  - playwright-results/opcos-live/verified-_licenses.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/components/PricingTable.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/ChangeOrganizationNameForm.tsx
  - 0520/supastarter-nextjs-main/packages/logs/index.ts
  - 0520/supastarter-nextjs-main/agents.md
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/CropImageDialog.tsx
  - 0520/supastarter-nextjs-main/packages/ui/components/label.tsx
  - 0520/不動產說明書/0417-old/商業地_現場必問清單.docx
  - 0520/不動產說明書/0417-old/不動產說明書14.pdf
  - 0520/supastarter-nextjs-main/packages/database/prisma/queries/organizations.ts
  - 0520/supastarter-nextjs-main/packages/api/vitest.config.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/i18n/lib/messages.ts
  - 0520/supastarter-nextjs-main/packages/payments/provider/index.ts
  - 0520/不動產說明書/0417-old/不動產說明書11.pdf
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/NavBar.tsx
  - 0520/supastarter-nextjs-main/packages/ui/components/button.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/i18n/lib/messages.ts
  - 0520/不動產說明書/6.JPG
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/admin/organizations/page.tsx
  - 0520/supastarter-nextjs-main/packages/database/drizzle/queries/users.ts
  - playwright-results/opcos-live/verified-_products.png
  - playwright-results/opcos-live/route-_.png
  - playwright-results/opcos-live/verified-account-flow-report.json
  - 0520/supastarter-nextjs-main/packages/api/orpc/router.ts
  - playwright-results/aire-dom-ux-sdd-workbench-1728.png
  - playwright-results/opcos-live/signup-after-submit.png
  - 0520/supastarter-nextjs-main/tooling/typescript/react-library.json
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/new-organization/page.tsx
  - 0520/supastarter-nextjs-main/packages/i18n/translations/es/shared.json
  - 0520/supastarter-nextjs-main/packages/payments/types.ts
  - 0520/supastarter-nextjs-main/packages/database/prisma/queries/users.ts
  - 0520/supastarter-nextjs-main/packages/mail/types.ts
  - docs/opcos-saas/00-overview.md
  - 0520/不動產說明書/0417-old/不動產說明書12.pdf
  - 0520/supastarter-nextjs-main/packages/api/modules/notifications/procedures/list-notifications.ts
  - 0520/supastarter-nextjs-main/packages/i18n/translations/en/marketing.json
  - 0520/不動產說明書/格局圖.jpg
  - 0520/supastarter-nextjs-main/packages/i18n/translations/es/marketing.json
  - 0520/supastarter-nextjs-main/apps/marketing/content/posts/first-post.mdx
  - 0520/supastarter-nextjs-main/apps/marketing/content/posts/second-post.mdx
  - 0520/supastarter-nextjs-main/apps/saas/package.json
  - 0520/不動產說明書/10-房屋-現況調查表-5-1+5.JPG
  - src/lib/pdf-engine/document.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/hooks/locale-currency.tsx
  - AGENTS.md
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/organization-invitation/[invitationId]/page.tsx
  - 0520/supastarter-nextjs-main/apps/docs/app/llms.mdx/[[...slug]]/route.ts
  - playwright-results/opcos-live/product-manual-pages.json
  - 0520/supastarter-nextjs-main/apps/marketing/proxy.ts
  - 0520/不動產說明書/0417-old/套房_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/components/LoginForm.tsx
  - 0520/spectra-app-main/releases/2.3.1/Spectra_2.3.1_aarch64.dmg
  - 0520/supastarter-nextjs-main/apps/marketing/modules/home/components/NewsletterSection.tsx
  - 0520/不動產說明書/8.JPG
  - 0520/spectra-app-main/releases/2.3.1/Spectra_2.3.1_x64-setup.exe
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/admin/organizations/[id]/page.tsx
  - 0520/不動產說明書/0417-old/不動產說明說16.pdf
  - playwright-results/opcos-live/verified-_dashboard.png
  - playwright-results/aire-house-mvp-workbench-labels-1440.png
  - playwright-results/opcos-live/verified-_settings.png
  - 0520/supastarter-nextjs-main/packages/database/prisma/schema.prisma
  - 0520/supastarter-nextjs-main/packages/payments/index.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/components/SignupForm.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(unauthenticated)/reset-password/page.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/settings/security/page.tsx
  - 0520/supastarter-nextjs-main/.editorconfig
  - 0520/不動產說明書/0417-old/廠房_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/packages/storage/tsconfig.json
  - 0520/不動產說明書/10-房屋-現況調查表-2.JPG
  - src/lib/legal-clauses-defaults.ts
  - 0520/supastarter-nextjs-main/packages/api/modules/notifications/procedures/mark-all-read.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/lib/api.ts
  - 0520/supastarter-nextjs-main/packages/database/package.json
  - 0520/supastarter-nextjs-main/apps/saas/app/robots.ts
  - 0520/supastarter-nextjs-main/apps/docs/global.d.ts
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - 0520/supastarter-nextjs-main/packages/database/index.ts
  - playwright-results/opcos-live/signup-filled.png
  - playwright-results/opcos-live/route-_devices.png
  - playwright-results/opcos-live/route-crawl.json
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/not-found.tsx
  - 0520/supastarter-nextjs-main/packages/ui/components/spinner.tsx
  - 0520/supastarter-nextjs-main/packages/i18n/package.json
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/admin/layout.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/components/ResetPasswordForm.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/ChangeEmailForm.tsx
  - 0520/supastarter-nextjs-main/packages/utils/lib/password-validation.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/components/ColorModeToggle.tsx
  - 0520/supastarter-nextjs-main/packages/ui/index.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/NotificationCenter.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/app/robots.ts
  - 0520/supastarter-nextjs-main/packages/api/modules/notifications/procedures/update-preference.ts
  - 0520/supastarter-nextjs-main/packages/notifications/src/welcome.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/hooks/errors-messages.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/blog/components/PostContent.tsx
  - 0520/supastarter-nextjs-main/pnpm-workspace.yaml
  - 0520/spectra-app-main/releases/2.3.0/Spectra_2.3.0_x64.dmg
  - 0520/supastarter-nextjs-main/packages/api/modules/users/router.ts
  - 0520/不動產說明書/0417-old/透天別墅_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationRoleSelect.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/i18n/config.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/home/components/HeroSection.tsx
  - 0520/不動產說明書/0417-old/不動產說明書13.pdf
  - src/lib/mock-backend.ts
  - 0520/supastarter-nextjs-main/apps/marketing/content/legal/privacy-policy.md
  - 0520/supastarter-nextjs-main/packages/ai/lib/index.ts
  - 0520/不動產說明書/0417-old/大樓華廈_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/apps/marketing/content/legal/privacy-policy.de.md
  - 0520/supastarter-nextjs-main/apps/docs/components/ai/page-actions.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/organizations/procedures/create-logo-upload-url.ts
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/(home)/page.tsx
  - 0520/不動產說明書/0417-old/不動產書說明說7.pdf
  - 0520/spectra-app-main/.github/ISSUE_TEMPLATE/config.yml
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/layout.tsx
  - 0520/spectra-app-main/releases/2.3.0/Spectra_2.3.0_aarch64.dmg
  - 0520/supastarter-nextjs-main/apps/marketing/modules/blog/lib/posts.ts
  - 0520/supastarter-nextjs-main/packages/auth/lib/helper.ts
  - 0520/supastarter-nextjs-main/apps/docs/content/docs/index.mdx
  - 0520/不動產說明書/0417-old/工業地_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/packages/mail/provider/mailgun.ts
  - 0520/supastarter-nextjs-main/packages/database/drizzle/queries/purchases.ts
  - 0520/不動產說明書/0417-old/不動產說明書4.pdf
  - 0520/不動產說明書/0417-old/店面_現場必問清單.docx
  - 0520/supastarter-nextjs-main/packages/api/modules/payments/types.ts
  - 0520/supastarter-nextjs-main/packages/auth/tsconfig.json
  - 0520/supastarter-nextjs-main/apps/marketing/content/legal/terms.md
  - 0520/supastarter-nextjs-main/README.md
  - 0520/supastarter-nextjs-main/packages/api/orpc/handler.ts
  - 0520/不動產說明書/2.JPG
  - playwright-results/opcos-live/onboarding-before-continue.png
  - 0520/不動產說明書/0417-old/不動產說明書6.pdf
  - playwright-results/opcos-live/mobile-auth-_account.png
  - 0520/supastarter-nextjs-main/packages/database/drizzle/schema/index.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/admin/component/organizations/OrganizationList.tsx
  - 0520/supastarter-nextjs-main/packages/auth/auth.ts
  - 0520/supastarter-nextjs-main/packages/i18n/translations/fr/shared.json
  - playwright-results/opcos-live/mobile-public-_signup.png
  - docs/opcos-saas/02-modular-frontend-system.md
  - 0520/supastarter-nextjs-main/apps/docs/next.config.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/TwoFactorBlock.tsx
  - playwright-results/opcos-live/auth-pages-discovery.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/lib/sidebar-context.tsx
  - 0520/supastarter-nextjs-main/packages/ui/components/alert.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/[...rest]/page.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/config.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/ai/components/AiChat.tsx
  - 0520/不動產說明書/0417-old/不動產說明書8.pdf
  - 0520/不動產說明書-bug/不動產說明書 — AIRE-TEST-002.pdf
  - 0520/supastarter-nextjs-main/apps/marketing/app/globals.css
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/contact/page.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/app/layout.tsx
  - 0520/不動產說明書-bug/ee705444-173f-4250-9360-42b90c093e31.pdf
  - 0520/supastarter-nextjs-main/packages/mail/components/Wrapper.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/lib/query-client.ts
  - playwright-results/opcos-live/negative-signup-weak-password.png
  - playwright-results/opcos-live/mobile-auth-_settings_general.png
  - 0520/不動產說明書/0417-old/農地_現場必問清單.docx
  - 0520/supastarter-nextjs-main/apps/marketing/public/images/hero-image-dark.png
  - 0520/supastarter-nextjs-main/packages/mail/provider/resend.ts
  - 0520/supastarter-nextjs-main/packages/ui/components.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/hooks/purchases.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/ChangeNameForm.tsx
  - 0520/supastarter-nextjs-main/packages/payments/package.json
  - 0520/supastarter-nextjs-main/packages/api/modules/notifications/procedures/mark-notifications-read.ts
  - 0520/supastarter-nextjs-main/packages/database/tsconfig.json
  - 0520/supastarter-nextjs-main/packages/mail/index.ts
  - playwright-results/opcos-live/after-email-verification.png
  - 0520/supastarter-nextjs-main/packages/mail/emails/Notification.tsx
  - 0520/supastarter-nextjs-main/apps/saas/types.ts
  - playwright-results/opcos-live/route-_account.png
  - 0520/supastarter-nextjs-main/apps/saas/app/icon.png
  - playwright-results/opcos-live/forgot-password-after-submit.png
  - 0520/supastarter-nextjs-main/apps/saas/app/(unauthenticated)/forgot-password/page.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationInvitationModal.tsx
  - 0520/supastarter-nextjs-main/packages/ui/components/badge.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/lib/content.ts
  - docs/opcos-saas/01-saas-starter-kit-research.md
  - src/lib/registry-provenance.ts
  - 0520/supastarter-nextjs-main/packages/api/modules/payments/procedures/list-purchases.ts
  - 0520/supastarter-nextjs-main/packages/notifications/src/create-notification.ts
  - src-tauri/src/land_registry/pull.rs
  - playwright-results/opcos-live/verified-_devices.png
  - 0520/supastarter-nextjs-main/apps/marketing/postcss.config.cjs
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/lib/server.ts
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - 0520/不動產說明書/1-封面.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/DeleteAccountForm.tsx
  - 0520/supastarter-nextjs-main/packages/mail/provider/nodemailer.ts
  - 0520/supastarter-nextjs-main/packages/database/drizzle/index.ts
  - docs/opcos-saas/03-wp-plugin-reverse-engineering.md
  - 0520/supastarter-nextjs-main/packages/api/tsconfig.json
  - 0520/不動產說明書/0417-old/透天別墅_現場必問清單.docx
  - 0520/spectra-app-main/releases/2.2.5/Spectra_2.2.5_aarch64.dmg
  - 0520/不動產說明書/3-2+3.JPG
  - 0520/supastarter-nextjs-main/packages/ui/components/accordion.tsx
  - 0520/不動產說明書/10-房屋-現況調查表-4.JPG
  - 0520/不動產說明書/99-土地-現況調查表-5-1+5.JPG
  - 0520/supastarter-nextjs-main/packages/ui/components/card.tsx
  - 0520/不動產說明書/2-1-土地-不一定要.JPG
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - 0520/不動產說明書/99-土地-現況調查表-2.JPG
  - 0520/supastarter-nextjs-main/packages/mail/emails/OrganizationInvitation.tsx
  - 0520/supastarter-nextjs-main/apps/docs/content/docs/meta.json
  - 0520/supastarter-nextjs-main/packages/api/modules/organizations/lib/membership.ts
  - 0520/supastarter-nextjs-main/packages/ui/components/chart.tsx
  - 0520/supastarter-nextjs-main/apps/docs/types.ts
  - playwright-results/opcos-live/login-after-submit.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/lib/orpc-client.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/home/components/FeaturesSection.tsx
  - 0520/不動產說明書-bug/22222222-2222-4222-8222-222222222222.pdf
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/hooks/router.ts
  - 0520/supastarter-nextjs-main/packages/ui/components/avatar.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(organizations)/[organizationSlug]/page.tsx
  - playwright-results/opcos-live/onboarding-after-continue.png
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/choose-plan/page.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/admin/lib/links.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/lib/base-url.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(unauthenticated)/signup/page.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/notifications/procedures/get-preferences.ts
  - docs/opcos-saas/08-kie-ai-api-reference.md
  - e2e/results/playwright-report/index.html
  - 0520/不動產說明書/99-土地-現況調查表-3.JPG
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/SubscriptionStatusBadge.tsx
  - 0520/supastarter-nextjs-main/packages/mail/emails/EmailVerification.tsx
  - 0520/supastarter-nextjs-main/packages/payments/provider/creem/index.ts
  - src/lib/land-registry-api.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/components/SocialSigninButton.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/blog/types.ts
  - docs/opcos-saas/06-shadcn-saas-kit-comparison.md
  - playwright-results/opcos-live/authenticated-link-crawl.json
  - 0520/supastarter-nextjs-main/packages/database/drizzle/queries/index.ts
  - playwright-results/opcos-live/route-_licenses.png
  - 0520/supastarter-nextjs-main/apps/marketing/content/posts/first-post.de.mdx
  - 0520/不動產說明書/0417-old/廠房_現場必問清單.docx
  - 0520/不動產說明書/不動產說明書底版.png
  - 0520/supastarter-nextjs-main/apps/saas/playwright.config.ts
  - 0520/supastarter-nextjs-main/apps/docs/content/docs/getting-started/meta.json
  - 0520/不動產說明書/2-1-房屋-不一定要.JPG.JPG
  - 0520/supastarter-nextjs-main/packages/storage/config.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/lib/server.ts
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/[...rest]/page.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/public/images/hero-image.png
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/components/Footer.tsx
  - 0520/supastarter-nextjs-main/apps/saas/global.d.ts
  - src/lib/cases-api.ts
  - 0520/supastarter-nextjs-main/apps/docs/package.json
  - 0520/supastarter-nextjs-main/.oxfmtrc.json
  - 0520/supastarter-nextjs-main/packages/ai/lib/prompts.ts
  - 0520/不動產說明書/0417-old/農地_秘書後補清單.docx
  - 0520/不動產說明書/0417-old/其他土地_秘書後補清單.docx
  - 0520/supastarter-nextjs-main/apps/saas/next.config.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/Pagination.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/layout.tsx
  - 0520/supastarter-nextjs-main/packages/auth/config.ts
  - 0520/supastarter-nextjs-main/packages/ai/index.ts
  - src-tauri/src/land_registry/apis/address_to_parcel.rs
  - 0520/supastarter-nextjs-main/apps/docs/lib/source.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/NotificationPreferencesForm.tsx
  - 0520/supastarter-nextjs-main/apps/saas/config.ts
  - playwright-results/aire-house-mvp-workbench-1728.png
  - 0520/不動產說明書/99-土地-現況調查表-4.JPG
  - 0520/supastarter-nextjs-main/apps/marketing/modules/i18n/lib/update-locale.ts
  - 0520/supastarter-nextjs-main/packages/api/modules/users/procedures/create-avatar-upload-url.ts
  - docs/opcos-saas/opcos-vision.md
  - 0520/supastarter-nextjs-main/packages/mail/package.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/payments/lib/server.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/index.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/layout.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/notifications/router.ts
  - 0520/supastarter-nextjs-main/packages/ui/components/input-otp.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/UserAvatarUpload.tsx
  - playwright-results/opcos-live/route-_login.png
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/changelog/page.tsx
  - playwright-results/opcos-live/route-_forgot_password.png
  - 0520/supastarter-nextjs-main/apps/marketing/modules/analytics/provider/custom/index.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/ChangePassword.tsx
  - 0520/supastarter-nextjs-main/packages/ui/components/dropdown-menu.tsx
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/hooks/router.ts
  - src-tauri/src/land_registry/errors/mod.rs
  - 0520/supastarter-nextjs-main/packages/i18n/translations/de/marketing.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/i18n/request.ts
  - 0520/spectra-app-main/assets/logo.png
  - 0520/supastarter-nextjs-main/apps/saas/modules/admin/component/users/UserList.tsx
  - 0520/不動產說明書-bug/html-pdf-demo.pdf
  - 0520/不動產說明書/0417-old/不動產說明書2.pdf
  - playwright-results/opcos-live/route-_products.png
  - 0520/supastarter-nextjs-main/claude.md
  - 0520/supastarter-nextjs-main/packages/mail/lib/send.ts
  - 0520/supastarter-nextjs-main/packages/mail/emails/ForgotPassword.tsx
  - playwright-results/opcos-live/verified-login-filled.png
  - 0520/supastarter-nextjs-main/turbo.json
  - playwright-results/opcos-live/route-_signup.png
  - 0520/supastarter-nextjs-main/package.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/settings/components/UserLanguageForm.tsx
  - playwright-results/opcos-live/mobile-smoke-report.json
  - 0520/supastarter-nextjs-main/packages/database/prisma/queries/purchases.ts
  - 0520/supastarter-nextjs-main/packages/i18n/types.ts
  - 0520/supastarter-nextjs-main/packages/mail/global.d.ts
  - 0520/supastarter-nextjs-main/packages/notifications/src/index.ts
  - 0520/不動產說明書/0417-old/土地物調表-母版.docx
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/InviteMemberForm.tsx
  - 0520/supastarter-nextjs-main/apps/docs/app/og/[...slug]/route.tsx
  - 0520/supastarter-nextjs-main/packages/payments/lib/provider-price-ids.ts
  - playwright-results/opcos-live/post-onboarding-_dashboard.png
  - playwright-results/opcos-live/route-_settings.png
  - 0520/supastarter-nextjs-main/apps/marketing/app/icon.png
  - 0520/supastarter-nextjs-main/packages/i18n/config.ts
  - 0520/supastarter-nextjs-main/packages/storage/provider/index.ts
  - docs/handoff/2026-05-23-aire-presurvey-property-sheet-handoff.md
  - 0520/supastarter-nextjs-main/packages/ui/components/form.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/home/types.ts
  - src-tauri/Cargo.toml
  - 0520/supastarter-nextjs-main/tsconfig.json
  - 0520/supastarter-nextjs-main/packages/logs/lib/logger.ts
  - 0520/supastarter-nextjs-main/packages/payments/lib/helper.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/page.tsx
  - 0520/supastarter-nextjs-main/packages/mail/lib/translations.ts
  - playwright-results/opcos-live/mobile-auth-_products_aire.png
  - 0520/supastarter-nextjs-main/packages/auth/plugins/invitation-only/index.ts
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(organizations)/[organizationSlug]/settings/general/page.tsx
  - 0520/supastarter-nextjs-main/packages/mail/emails/MagicLink.tsx
  - 0520/supastarter-nextjs-main/packages/mail/lib/i18n.ts
  - 0520/supastarter-nextjs-main/packages/payments/provider/lemonsqueezy/index.ts
  - playwright-results/aire-dom-ux-sdd-preview-1440.png
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/components/NavBar.tsx
  - 0520/supastarter-nextjs-main/packages/api/orpc/middleware/locale-middleware.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/ConfirmationAlertProvider.tsx
  - 0520/supastarter-nextjs-main/.oxlintrc.json
  - docs/opcos-saas/client-explanation.md
  - 0520/supastarter-nextjs-main/packages/storage/index.ts
  - 0520/supastarter-nextjs-main/tooling/typescript/base.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/TabGroup.tsx
  - 0520/supastarter-nextjs-main/packages/mail/config.ts
  - playwright-results/opcos-live/mailtm-signup-after-submit.png
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(account)/settings/notifications/page.tsx
  - docs/opcos-saas/business-analysis.md
  - 0520/supastarter-nextjs-main/packages/notifications/tsconfig.json
  - playwright-results/opcos-live/post-onboarding-_products.png
  - 0520/supastarter-nextjs-main/.vscode/settings.json
  - docs/opcos-saas/supastarter-inventory.md
  - 0520/supastarter-nextjs-main/packages/ui/components/table.tsx
  - 0520/supastarter-nextjs-main/packages/auth/client.ts
  - src/app/(dashboard)/layout.tsx
  - 0520/supastarter-nextjs-main/apps/saas/app/(authenticated)/(main)/(organizations)/[organizationSlug]/settings/members/page.tsx
  - 0520/supastarter-nextjs-main/packages/utils/lib/base-url.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/organizations/components/OrganizationStart.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/payments/router.ts
  - 0520/supastarter-nextjs-main/apps/docs/app/llms.txt/route.ts
  - 0520/supastarter-nextjs-main/apps/marketing/tsconfig.json
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/hooks/use-session.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/auth/constants/oauth-providers.tsx
  - 0520/supastarter-nextjs-main/packages/database/drizzle/queries/organizations.ts
  - 0520/supastarter-nextjs-main/packages/ui/tsconfig.json
  - 0520/supastarter-nextjs-main/packages/api/modules/organizations/procedures/generate-organization-slug.ts
  - 0520/supastarter-nextjs-main/packages/payments/provider/stripe/index.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/AuthWrapper.tsx
  - playwright-results/opcos-live/manual-_products_aire_devices.png
  - 0520/supastarter-nextjs-main/apps/saas/app/(unauthenticated)/verify/page.tsx
  - docs/opcos-saas/05-monorepo-migration-plan.md
  - 0520/spectra-app-main/README.md
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/components/SettingsList.tsx
  - src/app/api/branding-text/route.ts
  - 0520/supastarter-nextjs-main/apps/marketing/app/[locale]/blog/page.tsx
  - playwright-results/opcos-live/mobile-public-_.png
  - 0520/supastarter-nextjs-main/apps/saas/app/image-proxy/[...path]/route.ts
  - 0520/supastarter-nextjs-main/packages/database/prisma/client.ts
  - 0520/supastarter-nextjs-main/tooling/tailwind/theme.css
tests:
  - src/lib/pdf-blocks/__tests__/registry-image-pages.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/branding-storage.test.tsx
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - src-tauri/tests/nlsc_cadastral_yunong_live.rs
  - src/lib/__tests__/registry-provenance.test.ts
  - src/lib/pdf-engine/__tests__/html-renderer-floor-plan-photo.test.tsx
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/lib/base-url.test.ts
  - e2e/complete-presurvey-property-sheet-flow.spec.ts
  - 0520/supastarter-nextjs-main/apps/marketing/modules/shared/lib/content.test.ts
  - src/app/(dashboard)/settings/branding/__tests__/page.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - 0520/supastarter-nextjs-main/packages/api/modules/organizations/procedures/generate-organization-slug.test.ts
  - 0520/supastarter-nextjs-main/apps/saas/modules/shared/lib/base-url.test.ts
  - e2e/candidate-parcel-options-presurvey.spec.ts
  - src-tauri/tests/cop_api_yunong_live.rs
  - 0520/supastarter-nextjs-main/apps/saas/tests/login.spec.ts
  - src/app/(dashboard)/__tests__/layout.test.tsx
  - src/lib/__tests__/registry-preview.test.ts
  - src/lib/__tests__/product-ui-demo-alignment.test.ts
  - 0520/supastarter-nextjs-main/apps/marketing/tests/home.spec.ts
  - src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx
  - 0520/supastarter-nextjs-main/packages/api/orpc/procedures.test.ts
  - src/components/__tests__/AppSidebar.test.tsx
  - 0520/supastarter-nextjs-main/packages/api/modules/organizations/lib/membership.test.ts
-->

---
### Requirement: Settings section scope

The settings page SHALL render the selected settings section only. The default `/settings` route SHALL render 個人設定. Customer settings sections SHALL NOT show development-only Super Admin controls or engineering labels.

#### Scenario: Default settings route renders personal settings

- **WHEN** the user opens `/settings`
- **THEN** the page heading is 個人設定
- **AND** the page shows 帳號與授權管理、更新密碼、個人名稱與 Email、品牌色、目前操作紀錄

#### Scenario: Plans section replaces feature toggles

- **WHEN** the user opens `/settings?section=plans`
- **THEN** the page heading is 方案與升級
- **AND** the page shows 基本款、進階款、高級款
- **AND** the page does not show MCP Hub

---
### Requirement: Data source page SHALL provide PDF asset supplement slots

The 資料來源 page SHALL let basic-plan users manually provide PDF image assets when automated sources are not available. It SHALL show upload slots for 地籍圖、空拍圖、格局圖、地標圖.

#### Scenario: Basic plan user sees manual upload slots

- **WHEN** the user opens `/settings?section=registry-rules`
- **THEN** the page shows PDF 圖資欄位
- **AND** it shows upload entries for 地籍圖、空拍圖、格局圖、地標圖

#### Scenario: Upgrade value is separated from manual fallback

- **WHEN** the PDF asset slots render
- **THEN** each slot explains the basic plan manual fallback
- **AND** upgrade copy describes automation as optional enhancement, not as a blocker

##### Example: cadastral map slot

- **GIVEN** the user opens 資料來源
- **WHEN** PDF 圖資欄位 renders
- **THEN** 地籍圖上傳 is visible
- **AND** 基本款可手動上傳地籍圖檔 is visible

---
### Requirement: 方案與升級頁顯示開發中功能開關

The Settings page SHALL render the 方案與升級 feature availability section as customer-facing feature rows, not as test-build entitlement copy.

- **WHEN** a user navigates to `/settings?section=plans`
- **THEN** the feature availability section SHALL list exactly these six feature names in order:
  - Google 地圖
  - 空拍圖
  - 街景參考
  - AI 格局圖整理
  - 地籍圖整理
  - 實價登錄
- **THEN** each row SHALL display status text `開發中`
- **THEN** no row SHALL display text containing `測試版已開啟` or `正式版歸在`

#### Scenario: Default customer state is off and disabled

- **GIVEN** the current session user is not an admin
- **WHEN** the user opens `/settings?section=plans`
- **THEN** all six feature switches SHALL be visually off
- **THEN** all six feature switches SHALL be disabled

##### Example: non-admin feature row

- **GIVEN** sessionUser is `{ email: "user@test.aire", role: "user" }`
- **WHEN** the plans settings page renders
- **THEN** the Google 地圖 switch has accessible name `Google 地圖開發中`
- **THEN** the switch is disabled and not pressed

#### Scenario: Super admin can toggle development feature rows

- **GIVEN** the current session user is an admin
- **WHEN** the admin opens `/settings?section=plans`
- **THEN** all six feature switches SHALL be enabled controls
- **WHEN** the admin clicks `實價登錄開發中`
- **THEN** the switch SHALL update to the enabled visual state

##### Example: admin toggles real price

- **GIVEN** sessionUser is `{ email: "admin@test.aire", role: "admin" }`
- **AND** feature flag `real-price` is disabled
- **WHEN** the admin clicks the `實價登錄開發中` switch
- **THEN** `toggle_feature_flag` is called with id `real-price`
- **THEN** the row remains labelled `實價登錄` with status `開發中`
