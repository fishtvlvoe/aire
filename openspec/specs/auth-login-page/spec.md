# auth-login-page Specification

## Purpose

TBD - created by archiving change 'app-auth-settings-redesign'. Update Purpose after archive.

## Requirements

### Requirement: login-form-display

The login page SHALL display a centered card containing the AIRE logo, the subtitle text, an email input field, a password input field, a login button labeled in Traditional Chinese, and a "forgot password" link.

#### Scenario: login page renders all elements

- **WHEN** the user navigates to /login
- **THEN** the page SHALL display the AIRE logo image from src/assets/icon-dark.png
- **THEN** the page SHALL display the subtitle text
- **THEN** the page SHALL display an email input with placeholder
- **THEN** the page SHALL display a password input with type=password
- **THEN** the page SHALL display a login button
- **THEN** the page SHALL display a "forgot password" link that opens an external URL

##### Example: login page initial state

- **GIVEN** the user is not authenticated
- **WHEN** the user navigates to /login
- **THEN** the email input SHALL be empty with placeholder "Email"
- **THEN** the password input SHALL be empty with type="password"
- **THEN** the login button SHALL display "登入"
- **THEN** the "forgot password" link SHALL display "忘記密碼？"


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
### Requirement: login-form-submission

The login page SHALL call safeInvoke("login", { email, password }) when the user submits the form with non-empty fields. On success, the page SHALL redirect to /cases. On failure, the page SHALL display an error message in Traditional Chinese.

#### Scenario: successful login

- **WHEN** the user enters a valid email and password and clicks the login button
- **THEN** the system SHALL call safeInvoke("login", { email, password })
- **THEN** on success response, the browser SHALL navigate to /cases

##### Example: admin login success

- **GIVEN** the user is on /login
- **WHEN** the user enters email "admin@test.aire" and password "password" and clicks "登入"
- **THEN** safeInvoke("login") returns { success: true, user: { email: "admin@test.aire", role: "admin" } }
- **THEN** the browser navigates to /cases

#### Scenario: failed login with invalid credentials

- **WHEN** the user enters an incorrect email or password and clicks the login button
- **THEN** the system SHALL display an error message "帳號或密碼錯誤，請重新輸入"

##### Example: wrong password

- **GIVEN** the user is on /login
- **WHEN** the user enters email "wrong@example.com" and password "wrong" and clicks "登入"
- **THEN** safeInvoke("login") throws Error with message "INVALID_CREDENTIALS"
- **THEN** the page displays error text "帳號或密碼錯誤，請重新輸入"

#### Scenario: failed login with expired account

- **WHEN** the user enters credentials for an expired account
- **THEN** the system SHALL display an error message "此帳號已過期，請聯繫客服"

##### Example: expired account

- **GIVEN** the user is on /login
- **WHEN** the user enters email "expired@test.aire" and password "password" and clicks "登入"
- **THEN** safeInvoke("login") throws Error with message "ACCOUNT_EXPIRED"
- **THEN** the page displays error text "此帳號已過期，請聯繫客服"

#### Scenario: empty field validation

- **WHEN** the user clicks the login button with empty email or password
- **THEN** the form SHALL display a validation error and SHALL NOT call safeInvoke

##### Example: empty email

- **GIVEN** the user is on /login with empty email field
- **WHEN** the user clicks "登入"
- **THEN** the page displays validation error "請輸入 Email"
- **THEN** safeInvoke is NOT called


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
### Requirement: login-redirect-if-authenticated

The login page SHALL redirect to /cases if the user is already authenticated when navigating to /login.

#### Scenario: already authenticated user visits login

- **WHEN** an authenticated user navigates to /login
- **THEN** the browser SHALL immediately redirect to /cases

##### Example: authenticated redirect

- **GIVEN** the user has a valid session (get_session returns authenticated: true)
- **WHEN** the user navigates to /login
- **THEN** the browser redirects to /cases without showing the login form

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