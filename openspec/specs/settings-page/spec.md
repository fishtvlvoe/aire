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