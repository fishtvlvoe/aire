# case-management Specification

## Purpose

TBD - created by archiving change 'aire-desktop-phase1'. Update Purpose after archive.

## Requirements

### Requirement: Case list view

The system SHALL provide a `/cases` page that lists all cases ordered by `updated_at DESC`, displaying columns: "案件名稱" (optional user-defined name), "地址/所有權人" (address as primary text, owner_name as secondary text below), "案件類型" (display as `成屋` or `土地`), "狀態" (display as `草稿` / `已完成` / `已匯出`), "建立日期" formatted as `YYYY/MM/DD HH:mm` in Asia/Taipei timezone, and "操作" (5 SVG icon action buttons defined in `case-list-actions` spec).

##### Example: list rendering

| Column | Source | Display rule |
| --- | --- | --- |
| 案件名稱 | `case_name` | Optional field; empty → show `—` |
| 地址/所有權人 | `address` + `owner_name` | Primary line: address; Secondary line: owner_name |
| 案件類型 | `property_type` | `residential` → `成屋`, `land` → `土地` |
| 狀態 | `status` | `draft` → `草稿`, `completed` → `已完成`, `exported` → `已匯出` |
| 建立日期 | `created_at` | Unix seconds → `YYYY/MM/DD HH:mm` in Asia/Taipei |
| 操作 | — | 5 SVG icon buttons (see `case-list-actions`) |

#### Scenario: Empty list state

- **WHEN** the user opens `/cases` with no cases in the database
- **THEN** the page displays the empty state message `尚無案件，按右上角「新增案件」開始` and a button labelled `新增案件`

#### Scenario: List with cases

- **WHEN** the user opens `/cases` with three cases in the database
- **THEN** all three rows are visible, ordered with the most recently updated at the top, each row showing address as primary text and owner name as secondary text


<!-- @trace
source: aire-ux-wizard-refactor
updated: 2026-05-16
code:
  - src/components/OwnerAuthorizationDialog.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/lib/pdf-engine/document.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/components/CaseListActions.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/mock-backend.ts
  - src/app/(dashboard)/cases/page.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src/components/CaseSupplementDialog.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/cases-api.ts
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/land-registry-api.ts
  - src/components/case-wizard/CaseWizard.tsx
-->

---
### Requirement: Create case flow

The system SHALL provide a `/cases/new` page that asks the user to select `property_type` (`residential` or `land`) and enter required field `address` and optional fields `owner_name` (label: "所有權人（選填）"), `case_name` (label: "案件名稱（選填）"), and `case_no` (label: "案件編號（選填）"). On submit, the system SHALL create the row in `cases` with `status='draft'` and navigate to `/cases/<id>`.

#### Scenario: Successful creation

- **WHEN** the user submits `property_type='residential'`, `address='台南市東區大同路100號'`, `owner_name='王小明'`
- **THEN** a new row is inserted with `status='draft'` and the browser navigates to `/cases/<new-id>`

#### Scenario: Missing required field is rejected

- **WHEN** the user submits with `address` empty
- **THEN** the form displays `地址為必填` next to the field and does NOT submit

#### Scenario: Property type is required

- **WHEN** the user submits without selecting `property_type`
- **THEN** the form displays `請選擇物件類型` and does NOT submit


<!-- @trace
source: aire-ux-wizard-refactor
updated: 2026-05-16
code:
  - src/components/OwnerAuthorizationDialog.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/lib/pdf-engine/document.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/components/CaseListActions.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/mock-backend.ts
  - src/app/(dashboard)/cases/page.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src/components/CaseSupplementDialog.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/cases-api.ts
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/land-registry-api.ts
  - src/components/case-wizard/CaseWizard.tsx
-->

---
### Requirement: Edit case page

The system SHALL provide a `/cases/<id>` page that loads the case header (case_no, property_type, land_lot_no, address, owner_name) and the disclosure form matching the case's `property_type`.

#### Scenario: Load existing case with draft

- **WHEN** the user opens `/cases/<id>` for a case that has a row in `disclosure_drafts`
- **THEN** the page renders the header and populates the disclosure form fields from `disclosure_drafts.payload_json`

#### Scenario: Case not found

- **WHEN** the user opens `/cases/<id>` for an id not present in `cases`
- **THEN** the page displays `找不到此案件` and a link back to `/cases`

---
### Requirement: Delete case

The system SHALL allow deleting a case from the edit page via a `刪除` button that requires explicit confirmation through a modal dialog.

#### Scenario: Confirm deletion

- **WHEN** the user clicks `刪除` and confirms `確定刪除` in the modal
- **THEN** the row is removed from `cases`, the cascade removes the matching row from `disclosure_drafts`, an `operation_log` row is written with `action='case_delete'`, and the user is navigated to `/cases`

#### Scenario: Cancel deletion

- **WHEN** the user clicks `刪除` and then clicks `取消` in the modal
- **THEN** no database change occurs and the user remains on the edit page

---
### Requirement: Case status transitions

The system SHALL update `cases.status` based on user actions: `draft` → `completed` when the user clicks `標示為完成`, `completed` → `exported` when a PDF export succeeds, and shall reject manual transitions backwards.

##### Example: status transition matrix

| From | Action | To |
| --- | --- | --- |
| `draft` | click `標示為完成` | `completed` |
| `completed` | export PDF | `exported` |
| `exported` | export PDF again | `exported` (no change) |
| `completed` | click `回到草稿` | rejected (button hidden) |

#### Scenario: Mark draft as completed

- **WHEN** the user clicks `標示為完成` on a case with `status='draft'`
- **THEN** the row updates to `status='completed'` and `updated_at` reflects the new time

---
### Requirement: case-list-display

The case list page SHALL display all cases in an ST Table component with columns: case name, case type (成屋/土地), status (Badge component), created date, and an actions column. The "新增案件" button SHALL be positioned at the top-right of the page using an ST Button component.

#### Scenario: case list renders with ST Table

- **WHEN** the user navigates to /cases
- **THEN** the system SHALL render cases in an ST Table component with sortable columns
- **THEN** each case status SHALL be displayed as an ST Badge with color coding (draft=gray, complete=green)

##### Example: two cases with different statuses

- **GIVEN** two cases exist: "信義路成屋案" (status: draft) and "大安土地案" (status: complete)
- **WHEN** the user navigates to /cases
- **THEN** the Table SHALL show two rows; "信義路成屋案" has a gray Badge "草稿", "大安土地案" has a green Badge "完成"

#### Scenario: new case button triggers navigation

- **WHEN** the user clicks the "新增案件" ST Button
- **THEN** the system SHALL navigate to /cases/new

#### Scenario: empty case list

- **WHEN** the user navigates to /cases and no cases exist
- **THEN** the system SHALL display an empty state Card with a message "尚無案件" and a "新增第一個案件" Button


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
### Requirement: case-form-ui

The case edit form SHALL use ST Form components (Input, Select, Label, Textarea) for all fields. The form SHALL support two case types via tab switching: residential (成屋) and land (土地).

#### Scenario: form renders with ST components

- **WHEN** the user navigates to /cases/[id]
- **THEN** all form fields SHALL render using ST Input, Select, Label, and Textarea components
- **THEN** the case type selector SHALL use ST Tabs to switch between residential and land forms

##### Example: residential form fields

- **GIVEN** a case with id "abc-123" and caseType "residential"
- **WHEN** the user navigates to /cases/abc-123
- **THEN** the "成屋" Tab SHALL be active, showing fields: 物件名稱 (Input), 地址 (Input), 建物坪數 (Input type=number), 屋齡 (Input type=number), 備註 (Textarea)

#### Scenario: form save triggers IPC

- **WHEN** the user modifies any field and clicks the save button
- **THEN** the system SHALL call the update_case Tauri IPC command with the form data
- **THEN** on success, the system SHALL display a success Toast "案件已儲存"

#### Scenario: form validation on required fields

- **WHEN** the user attempts to save with empty required fields (case name, case type)
- **THEN** the form SHALL display validation errors on each empty required field using ST Form error styling

##### Example: empty case name validation

- **GIVEN** the user is on /cases/abc-123 with the case name field empty
- **WHEN** the user clicks the save button
- **THEN** the case name Input SHALL show error styling with message "請輸入物件名稱"
- **THEN** the update_case IPC SHALL NOT be called

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
### Requirement: Parcel data pull status display

The case detail page SHALL display the status of land registry data pulls: "未查詢", "查詢中", "已完成", or "部分手動填寫". Each status SHALL be visually distinct (icon + color).

#### Scenario: Status shows after successful pull

- **WHEN** all 7 API endpoints returned successfully for a case
- **THEN** case detail shows "已完成" with green checkmark

##### Example: Full success status

- **GIVEN** case "case-001" has pull results for all 7 endpoints, all source "api"
- **WHEN** case detail page renders
- **THEN** status indicator shows green checkmark icon with text "已完成"

#### Scenario: Status shows partial manual

- **WHEN** 5 endpoints succeeded and 2 were manually entered
- **THEN** case detail shows "部分手動填寫" with yellow indicator

##### Example: Partial manual status

- **GIVEN** case "case-001" has 5 fields source "api" and 2 fields source "manual"
- **WHEN** case detail page renders
- **THEN** status shows yellow icon with text "部分手動填寫"


<!-- @trace
source: aire-land-registry-apis-ui
updated: 2026-05-15
code:
  - src/lib/cases-api.ts
  - src-tauri/src/land_registry/mod.rs
  - src-tauri/src/land_registry/pull.rs
  - e2e/results/playwright-report/index.html
  - src-tauri/src/db/drafts.rs
  - src/components/AppTopbar.tsx
  - src-tauri/src/realtor_license/cache.rs
  - src/lib/pdf-themes/index.ts
  - src-tauri/icons/android/mipmap-xxhdpi/ic_launcher.png
  - src/components/settings/LandApiSection.tsx
  - src/app/(dashboard)/dev/components/page.tsx
  - src-tauri/icons/Square30x30Logo.png
  - src-tauri/src/land_registry/billing_log/tests.rs
  - src-tauri/src/startup.rs
  - docs/data-recovery-guide.md
  - src/components/AppSidebar.tsx
  - docs/pdf-theme-pack-spec.md
  - src-tauri/icons/64x64.png
  - src-tauri/src/land_registry/batch/tests.rs
  - src-tauri/icons/Square44x44Logo.png
  - src-tauri/icons/32x32.png
  - src-tauri/src/encryption/mod.rs
  - .artifacts/aire-mvp-bugfix/settings_branding.png
  - src/app/dev/components/page.tsx
  - src/lib/pdf-blocks/location-map.tsx
  - src-tauri/src/main.rs
  - src/components/ux/ImportConflictDialog.tsx
  - playwright.config.ts
  - src-tauri/icons/ios/AppIcon-40x40@2x.png
  - src/lib/pdf-engine/react-pdf-init.ts
  - src-tauri/icons/android/mipmap-mdpi/ic_launcher_round.png
  - src-tauri/src/land_registry/apis/building_registry.rs
  - src-tauri/icons/Square284x284Logo.png
  - src/lib/pdf-themes/registry.ts
  - src/components/ui/Tabs.tsx
  - src-tauri/src/legal_clauses/mod.rs
  - src-tauri/src/land_registry/time_sync/tests.rs
  - src-tauri/src/log.rs
  - src/app/cases/[id]/page.tsx
  - src/components/disclosure-form-land.tsx
  - .artifacts/browser-dev-mock/01-activation-form.png
  - src-tauri/src/land_registry/opcos_offline_grace/tests.rs
  - src-tauri/migrations/005_owner_consent_log.sql
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-cover-chromium-tauri-darwin.png
  - src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_foreground.png
  - src-tauri/icons/128x128.png
  - src-tauri/icons/android/mipmap-xhdpi/ic_launcher_round.png
  - src-tauri/icons/icon.ico
  - src-tauri/src/land_registry/errors/tests.rs
  - src-tauri/src/lib.rs
  - src-tauri/icons/ios/AppIcon-29x29@3x.png
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - src-tauri/migrations/004_land_registry.sql
  - src-tauri/src/commands/license.rs
  - .artifacts/browser-dev-mock/05-logs-loaded.png
  - src/components/ui/tabs.tsx
  - src-tauri/Cargo.toml
  - src/lib/pdf-blocks/page-footer.tsx
  - src-tauri/src/land_registry/apis/land_registry.rs
  - src-tauri/icons/StoreLogo.png
  - src-tauri/src/db/cases.rs
  - src-tauri/src/data_portability/import.rs
  - src/lib/pdf-blocks/legal-notice.tsx
  - src/components/BalanceBanner.tsx
  - src-tauri/src/data_portability/import/tests.rs
  - src-tauri/icons/Square142x142Logo.png
  - src/components/ux/RecoveryCodeModal.tsx
  - src-tauri/icons/Square71x71Logo.png
  - src/components/settings/PremiumUnlockSection.tsx
  - src/components/ui/skeleton.tsx
  - docs/legal-clauses-sync-spec.md
  - scripts/test-visual-parity.mjs
  - src-tauri/src/land_registry/consent.rs
  - src/app/(dashboard)/layout.tsx
  - src-tauri/icons/android/mipmap-mdpi/ic_launcher.png
  - src-tauri/icons/icon.png
  - src-tauri/src/db/settings.rs
  - src-tauri/src/legal_clauses/scheduler/tests.rs
  - src-tauri/icons/ios/AppIcon-29x29@2x.png
  - src/lib/pdf-blocks/logo-upload.ts
  - src/app/(dashboard)/settings/page.tsx
  - src/components/TauriRequired.tsx
  - src-tauri/src/commands/cases.rs
  - src-tauri/icons/ios/AppIcon-29x29@2x-1.png
  - src-tauri/src/commands/log.rs
  - src-tauri/icons/android/mipmap-hdpi/ic_launcher_foreground.png
  - package.json
  - src-tauri/src/land_registry/disk_resilience/mod.rs
  - docs/ux-patterns.md
  - src/components/ui/button.tsx
  - src/lib/pdf-blocks/photo-gallery.tsx
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-photos-chromium-tauri-darwin.png
  - src-tauri/icons/android/mipmap-mdpi/ic_launcher_foreground.png
  - src-tauri/src/crypto/master_password.rs
  - src/components/ui/Input.tsx
  - README.md
  - .artifacts/aire-mvp-bugfix/activation.png
  - src-tauri/icons/android/mipmap-hdpi/ic_launcher.png
  - src-tauri/migrations/003_legal_clauses.sql
  - src/assets/icon-light.png
  - src/app/settings/logs/page.tsx
  - src/components/ux/ErrorState.tsx
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/lib/pdf-themes/theme-c-tech-elegant/index.tsx
  - docs/phase4-cr-reports/aire-land-registry-foundation-kimi-cr.md
  - src-tauri/icons/ios/AppIcon-40x40@1x.png
  - src/lib/pdf-blocks/conditional-section.tsx
  - src-tauri/src/data_portability/export.rs
  - src/hooks/useAuth.ts
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-cover-chromium-tauri-darwin.png
  - src-tauri/migrations/002_branding.sql
  - src/components/ui/Dialog.tsx
  - src-tauri/src/land_registry/cache/tests.rs
  - src-tauri/src/secrets.rs
  - src-tauri/src/branding/theme.rs
  - src-tauri/icons/ios/AppIcon-29x29@1x.png
  - src-tauri/src/land_registry/apis/building_ownership.rs
  - src/lib/land-registry-api.ts
  - e2e/results/license-verification.json
  - src-tauri/src/land_registry/apis/mod.rs
  - src/lib/auth.ts
  - .artifacts/aire-mvp-bugfix/cases.png
  - docs/phase4-cr-reports/aire-phase1-data-portability-kimi-cr.md
  - src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_foreground.png
  - src-tauri/src/legal_clauses/cache.rs
  - src-tauri/src/opcos.rs
  - src/components/ui/textarea.tsx
  - src-tauri/src/commands/pdf.rs
  - src/lib/pdf-engine/document.tsx
  - .env.example
  - src-tauri/icons/ios/AppIcon-20x20@2x-1.png
  - src/lib/log.ts
  - src/app/dev/ux/page.tsx
  - e2e/.gitkeep
  - src-tauri/src/crypto/vault.rs
  - src/lib/pdf-themes/persistence.ts
  - src-tauri/src/land_registry/migration_rollback/mod.rs
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - .artifacts/aire-mvp-bugfix/settings_logs.png
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/components/ui/input.tsx
  - e2e/results/legal-sync.json
  - src/lib/pdf-themes/types.ts
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-photos-chromium-tauri-darwin.png
  - .github/copilot-instructions.md
  - src-tauri/src/legal_clauses/scheduler.rs
  - src-tauri/src/realtor_license/mod.rs
  - src/app/cases/[id]/layout.tsx
  - src-tauri/src/realtor_license/client/tests.rs
  - src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_round.png
  - src-tauri/icons/aire-source.png
  - src/styles/tokens.css
  - src-tauri/migrations/004_master_password_rekey.rs
  - src-tauri/src/land_registry/apis/co_owners.rs
  - src/app/activation/page.tsx
  - src-tauri/icons/ios/AppIcon-40x40@3x.png
  - src-tauri/src/land_registry/field_mapping/mod.rs
  - src/components/ux/MasterPasswordPrompt.tsx
  - src/components/ui/label.tsx
  - src-tauri/icons/ios/AppIcon-83.5x83.5@2x.png
  - src/lib/pdf-renderer.ts
  - src-tauri/icons/ios/AppIcon-40x40@2x-1.png
  - src-tauri/src/legal_clauses/sync.rs
  - src/lib/tauri-bridge.ts
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-basic-info-chromium-tauri-darwin.png
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-basic-info-chromium-tauri-darwin.png
  - src-tauri/src/land_registry/batch/mod.rs
  - src/components/PdfPreviewer.tsx
  - src/components/LogoUploader.tsx
  - src/components/RealtorLicenseField.tsx
  - src-tauri/icons/ios/AppIcon-76x76@1x.png
  - src-tauri/src/data_portability/aire_format.rs
  - src/components/ui/Card.tsx
  - src-tauri/src/land_registry/apis/address_to_parcel.rs
  - src-tauri/src/land_registry/field_mapping/tests.rs
  - e2e/results/results.json
  - src/components/PullParcelDataButton.tsx
  - src/components/BalanceMonitor.tsx
  - src-tauri/src/land_registry/api_key_storage.rs
  - src/components/ui/table.tsx
  - src/components/ui/sonner.tsx
  - src/app/login/page.tsx
  - src/lib/mock-backend.ts
  - src-tauri/src/branding/logo.rs
  - src-tauri/src/land_registry/apis/land_value.rs
  - src-tauri/src/land_registry/apis/mortgages.rs
  - src/components/ThemeSelector.tsx
  - src-tauri/icons/Square150x150Logo.png
  - src/lib/pdf-blocks/ai-badge.tsx
  - src-tauri/icons/icon.icns
  - scripts/phase5-smoke.sh
  - src/app/cases/new/page.tsx
  - src/components/ui/spinner.tsx
  - src-tauri/icons/ios/AppIcon-60x60@2x.png
  - src/components/ui/sheet.tsx
  - src/components/ui/select.tsx
  - src-tauri/src/data_portability/mod.rs
  - src/lib/pdf-engine/index.ts
  - src/lib/pdf-blocks/condition-survey.tsx
  - src-tauri/icons/Square310x310Logo.png
  - src/app/page.tsx
  - src/assets/icon-dark.png
  - src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher.png
  - src/app/(dashboard)/settings/sync-status/page.tsx
  - src/app/cases/page.tsx
  - src/components/PreChargeConfirmDialog.tsx
  - src-tauri/icons/Square89x89Logo.png
  - src-tauri/src/land_registry/opcos_offline_grace/mod.rs
  - src-tauri/src/legal_clauses/sync/tests.rs
  - src/app/(dashboard)/settings/api-key/page.tsx
  - src-tauri/src/db/mod.rs
  - src/lib/date-format-twn.ts
  - src/lib/pdf-blocks/life-amenities.tsx
  - src-tauri/icons/ios/AppIcon-512@2x.png
  - .artifacts/browser-dev-mock/02-cases-seed-list.png
  - src-tauri/icons/ios/AppIcon-60x60@3x.png
  - src/app/(dashboard)/dev/ux/page.tsx
  - src/lib/pdf-blocks/cover.tsx
  - src/lib/pdf-themes/theme-a-minimal/index.tsx
  - src-tauri/src/commands/drafts.rs
  - src/components/OwnerAuthorizationDialog.tsx
  - src/components/ui/separator.tsx
  - src/components/ManualFallbackInput.tsx
  - src/components/ui/badge.tsx
  - src/components/settings/LicenseSection.tsx
  - src-tauri/src/land_registry/billing_log/mod.rs
  - .artifacts/browser-dev-mock/04-branding-loaded.png
  - src-tauri/icons/ios/AppIcon-20x20@2x.png
  - src-tauri/icons/android/mipmap-hdpi/ic_launcher_round.png
  - src-tauri/src/land_registry/migration_rollback/tests.rs
  - src/components/ui/form.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/app/(dashboard)/cases/[id]/layout.tsx
  - src/components/settings/DevSuperAdmin.tsx
  - src-tauri/icons/android/mipmap-xhdpi/ic_launcher.png
  - src-tauri/src/land_registry/cache/mod.rs
  - src-tauri/src/land_registry/client/tests.rs
  - src-tauri/icons/ios/AppIcon-20x20@3x.png
  - src-tauri/icons/android/mipmap-xhdpi/ic_launcher_foreground.png
  - scripts/phase4-kimi-cr.sh
  - src-tauri/src/land_registry/client/mod.rs
  - src-tauri/icons/Square107x107Logo.png
  - src/app/(dashboard)/cases/page.tsx
  - src-tauri/src/realtor_license/cache/tests.rs
  - src/lib/pdf-blocks/dynamic-composition.tsx
  - src-tauri/icons/ios/AppIcon-20x20@1x.png
  - src/components/ux/ConfirmDialog.tsx
  - src-tauri/src/branding/mod.rs
  - src/lib/pdf-themes/theme-provider.tsx
  - src-tauri/src/land_registry/errors/mod.rs
  - src/lib/pdf-engine/engine.ts
  - src-tauri/src/legal_clauses/cache/tests.rs
  - src/lib/pdf-blocks/logo-anchors.tsx
  - src-tauri/icons/128x128@2x.png
  - src-tauri/src/land_registry/apis/zoning.rs
  - src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_round.png
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src-tauri/src/land_registry/disk_resilience/tests.rs
  - .artifacts/browser-dev-mock/03-create-case-success.png
  - src/components/disclosure-form-residential.tsx
  - src-tauri/src/realtor_license/client.rs
  - scripts/phase5-smoke-2a.sh
  - e2e/results/test-artifacts/.last-run.json
  - src-tauri/src/data_portability/conflict.rs
  - src-tauri/src/land_registry/balance.rs
  - docs/phase4-cr-reports/aire-phase1-legal-clauses-autofill-kimi-cr.md
  - src/components/ui/Button.tsx
  - src-tauri/icons/ios/AppIcon-76x76@2x.png
  - src/components/ux/EmptyState.tsx
  - src/components/ui/dialog.tsx
  - src/lib/pdf-layout.ts
  - src/lib/pdf-blocks/basic-info.tsx
  - docs/phase4-cr-reports/aire-phase1-html-pdf-renderer-kimi-cr.md
  - src-tauri/src/land_registry/time_sync/mod.rs
  - src/components/ui/card.tsx
  - src-tauri/src/crypto/recovery_code.rs
  - src-tauri/src/crypto/mod.rs
  - src/components/ApiKeySettings.tsx
  - src-tauri/src/encryption/tests.rs
  - src/app/(dashboard)/settings/branding/page.tsx
tests:
  - e2e/license-verification.spec.ts
  - docs/data-recovery-guide.test.ts
  - src/components/__tests__/LogoUploader.test.tsx
  - e2e/theme-selector.spec.ts
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/lib/__tests__/cases-api.test.ts
  - docs/__tests__/pdf-theme-pack-spec.test.ts
  - src/app/(dashboard)/settings/logs/__tests__/page.test.tsx
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - e2e/pdf-legal-notice-position.spec.ts
  - src/lib/pdf-blocks/__tests__/legal-notice.test.tsx
  - src/lib/pdf-themes/__tests__/persistence.test.ts
  - src/lib/__tests__/mock-backend.test.ts
  - src/components/__tests__/sidebar.test.tsx
  - src/components/__tests__/RealtorLicenseField.test.tsx
  - e2e/sync-status-page.spec.ts
  - src/app/(dashboard)/__tests__/layout.test.tsx
  - src-tauri/tests/e2e_smoke.rs
  - e2e/pdf-theme-a-visual.spec.ts
  - src/components/__tests__/AppSidebar.test.tsx
  - src/components/settings/__tests__/LicenseSection.test.tsx
  - src/app/activation/__tests__/page.test.tsx
  - src/lib/__tests__/auth.test.ts
  - e2e/smoke.spec.ts
  - src/app/(dashboard)/settings/sync-status/__tests__/page.test.tsx
  - src/app/(dashboard)/__tests__/layout-sidebar.test.tsx
  - e2e/pdf-theme-c-visual.spec.ts
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/lib/pdf-blocks/__tests__/legal-notice-theme.test.tsx
  - src/app/(dashboard)/cases/__tests__/page.test.tsx
  - src/lib/pdf-blocks/__tests__/legal-notice-wrap.test.tsx
  - src/components/__tests__/RecoveryCodeModal.test.tsx
  - e2e/legal-clauses-sync.spec.ts
  - src/lib/__tests__/log.test.ts
  - src/lib/__tests__/tauri-bridge.test.ts
  - e2e/data-portability.spec.ts
  - src/components/settings/__tests__/PremiumUnlockSection.test.tsx
  - src/components/settings/__tests__/DevSuperAdmin.test.tsx
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/app/login/__tests__/page.test.tsx
  - e2e/recovery-reset.spec.ts
  - src/lib/__tests__/date-format-twn.test.ts
  - src/lib/pdf-blocks/__tests__/legal-notice-empty.test.tsx
  - src/components/__tests__/ThemeSelector.test.tsx
  - src/lib/pdf-engine/__tests__/render-with-legal.test.tsx
  - src/components/__tests__/TauriRequired.test.tsx
  - src/hooks/__tests__/useAuth.test.tsx
-->

---
### Requirement: Balance warning banner on case page

When low_balance_warning is true, the case detail page SHALL display a yellow banner at the top with text "查詢餘額不足，請至設定頁確認" linking to the API key settings page.

#### Scenario: Banner appears when balance is low

- **WHEN** monthly queries are within 10 of the limit and low_balance_warning is true
- **THEN** yellow banner is visible at top of case detail page with link to /settings/api-key

##### Example: Low balance banner

- **GIVEN** monthly query count is 93 out of 100 limit (remaining = 7, low_balance_warning = true)
- **WHEN** case detail page renders
- **THEN** yellow banner displays "查詢餘額不足，請至設定頁確認" with clickable link to /settings/api-key

<!-- @trace
source: aire-land-registry-apis-ui
updated: 2026-05-15
code:
  - src/lib/cases-api.ts
  - src-tauri/src/land_registry/mod.rs
  - src-tauri/src/land_registry/pull.rs
  - e2e/results/playwright-report/index.html
  - src-tauri/src/db/drafts.rs
  - src/components/AppTopbar.tsx
  - src-tauri/src/realtor_license/cache.rs
  - src/lib/pdf-themes/index.ts
  - src-tauri/icons/android/mipmap-xxhdpi/ic_launcher.png
  - src/components/settings/LandApiSection.tsx
  - src/app/(dashboard)/dev/components/page.tsx
  - src-tauri/icons/Square30x30Logo.png
  - src-tauri/src/land_registry/billing_log/tests.rs
  - src-tauri/src/startup.rs
  - docs/data-recovery-guide.md
  - src/components/AppSidebar.tsx
  - docs/pdf-theme-pack-spec.md
  - src-tauri/icons/64x64.png
  - src-tauri/src/land_registry/batch/tests.rs
  - src-tauri/icons/Square44x44Logo.png
  - src-tauri/icons/32x32.png
  - src-tauri/src/encryption/mod.rs
  - .artifacts/aire-mvp-bugfix/settings_branding.png
  - src/app/dev/components/page.tsx
  - src/lib/pdf-blocks/location-map.tsx
  - src-tauri/src/main.rs
  - src/components/ux/ImportConflictDialog.tsx
  - playwright.config.ts
  - src-tauri/icons/ios/AppIcon-40x40@2x.png
  - src/lib/pdf-engine/react-pdf-init.ts
  - src-tauri/icons/android/mipmap-mdpi/ic_launcher_round.png
  - src-tauri/src/land_registry/apis/building_registry.rs
  - src-tauri/icons/Square284x284Logo.png
  - src/lib/pdf-themes/registry.ts
  - src/components/ui/Tabs.tsx
  - src-tauri/src/legal_clauses/mod.rs
  - src-tauri/src/land_registry/time_sync/tests.rs
  - src-tauri/src/log.rs
  - src/app/cases/[id]/page.tsx
  - src/components/disclosure-form-land.tsx
  - .artifacts/browser-dev-mock/01-activation-form.png
  - src-tauri/src/land_registry/opcos_offline_grace/tests.rs
  - src-tauri/migrations/005_owner_consent_log.sql
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-cover-chromium-tauri-darwin.png
  - src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_foreground.png
  - src-tauri/icons/128x128.png
  - src-tauri/icons/android/mipmap-xhdpi/ic_launcher_round.png
  - src-tauri/icons/icon.ico
  - src-tauri/src/land_registry/errors/tests.rs
  - src-tauri/src/lib.rs
  - src-tauri/icons/ios/AppIcon-29x29@3x.png
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - src-tauri/migrations/004_land_registry.sql
  - src-tauri/src/commands/license.rs
  - .artifacts/browser-dev-mock/05-logs-loaded.png
  - src/components/ui/tabs.tsx
  - src-tauri/Cargo.toml
  - src/lib/pdf-blocks/page-footer.tsx
  - src-tauri/src/land_registry/apis/land_registry.rs
  - src-tauri/icons/StoreLogo.png
  - src-tauri/src/db/cases.rs
  - src-tauri/src/data_portability/import.rs
  - src/lib/pdf-blocks/legal-notice.tsx
  - src/components/BalanceBanner.tsx
  - src-tauri/src/data_portability/import/tests.rs
  - src-tauri/icons/Square142x142Logo.png
  - src/components/ux/RecoveryCodeModal.tsx
  - src-tauri/icons/Square71x71Logo.png
  - src/components/settings/PremiumUnlockSection.tsx
  - src/components/ui/skeleton.tsx
  - docs/legal-clauses-sync-spec.md
  - scripts/test-visual-parity.mjs
  - src-tauri/src/land_registry/consent.rs
  - src/app/(dashboard)/layout.tsx
  - src-tauri/icons/android/mipmap-mdpi/ic_launcher.png
  - src-tauri/icons/icon.png
  - src-tauri/src/db/settings.rs
  - src-tauri/src/legal_clauses/scheduler/tests.rs
  - src-tauri/icons/ios/AppIcon-29x29@2x.png
  - src/lib/pdf-blocks/logo-upload.ts
  - src/app/(dashboard)/settings/page.tsx
  - src/components/TauriRequired.tsx
  - src-tauri/src/commands/cases.rs
  - src-tauri/icons/ios/AppIcon-29x29@2x-1.png
  - src-tauri/src/commands/log.rs
  - src-tauri/icons/android/mipmap-hdpi/ic_launcher_foreground.png
  - package.json
  - src-tauri/src/land_registry/disk_resilience/mod.rs
  - docs/ux-patterns.md
  - src/components/ui/button.tsx
  - src/lib/pdf-blocks/photo-gallery.tsx
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-photos-chromium-tauri-darwin.png
  - src-tauri/icons/android/mipmap-mdpi/ic_launcher_foreground.png
  - src-tauri/src/crypto/master_password.rs
  - src/components/ui/Input.tsx
  - README.md
  - .artifacts/aire-mvp-bugfix/activation.png
  - src-tauri/icons/android/mipmap-hdpi/ic_launcher.png
  - src-tauri/migrations/003_legal_clauses.sql
  - src/assets/icon-light.png
  - src/app/settings/logs/page.tsx
  - src/components/ux/ErrorState.tsx
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/lib/pdf-themes/theme-c-tech-elegant/index.tsx
  - docs/phase4-cr-reports/aire-land-registry-foundation-kimi-cr.md
  - src-tauri/icons/ios/AppIcon-40x40@1x.png
  - src/lib/pdf-blocks/conditional-section.tsx
  - src-tauri/src/data_portability/export.rs
  - src/hooks/useAuth.ts
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-cover-chromium-tauri-darwin.png
  - src-tauri/migrations/002_branding.sql
  - src/components/ui/Dialog.tsx
  - src-tauri/src/land_registry/cache/tests.rs
  - src-tauri/src/secrets.rs
  - src-tauri/src/branding/theme.rs
  - src-tauri/icons/ios/AppIcon-29x29@1x.png
  - src-tauri/src/land_registry/apis/building_ownership.rs
  - src/lib/land-registry-api.ts
  - e2e/results/license-verification.json
  - src-tauri/src/land_registry/apis/mod.rs
  - src/lib/auth.ts
  - .artifacts/aire-mvp-bugfix/cases.png
  - docs/phase4-cr-reports/aire-phase1-data-portability-kimi-cr.md
  - src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_foreground.png
  - src-tauri/src/legal_clauses/cache.rs
  - src-tauri/src/opcos.rs
  - src/components/ui/textarea.tsx
  - src-tauri/src/commands/pdf.rs
  - src/lib/pdf-engine/document.tsx
  - .env.example
  - src-tauri/icons/ios/AppIcon-20x20@2x-1.png
  - src/lib/log.ts
  - src/app/dev/ux/page.tsx
  - e2e/.gitkeep
  - src-tauri/src/crypto/vault.rs
  - src/lib/pdf-themes/persistence.ts
  - src-tauri/src/land_registry/migration_rollback/mod.rs
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - .artifacts/aire-mvp-bugfix/settings_logs.png
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/components/ui/input.tsx
  - e2e/results/legal-sync.json
  - src/lib/pdf-themes/types.ts
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-photos-chromium-tauri-darwin.png
  - .github/copilot-instructions.md
  - src-tauri/src/legal_clauses/scheduler.rs
  - src-tauri/src/realtor_license/mod.rs
  - src/app/cases/[id]/layout.tsx
  - src-tauri/src/realtor_license/client/tests.rs
  - src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_round.png
  - src-tauri/icons/aire-source.png
  - src/styles/tokens.css
  - src-tauri/migrations/004_master_password_rekey.rs
  - src-tauri/src/land_registry/apis/co_owners.rs
  - src/app/activation/page.tsx
  - src-tauri/icons/ios/AppIcon-40x40@3x.png
  - src-tauri/src/land_registry/field_mapping/mod.rs
  - src/components/ux/MasterPasswordPrompt.tsx
  - src/components/ui/label.tsx
  - src-tauri/icons/ios/AppIcon-83.5x83.5@2x.png
  - src/lib/pdf-renderer.ts
  - src-tauri/icons/ios/AppIcon-40x40@2x-1.png
  - src-tauri/src/legal_clauses/sync.rs
  - src/lib/tauri-bridge.ts
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-basic-info-chromium-tauri-darwin.png
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-basic-info-chromium-tauri-darwin.png
  - src-tauri/src/land_registry/batch/mod.rs
  - src/components/PdfPreviewer.tsx
  - src/components/LogoUploader.tsx
  - src/components/RealtorLicenseField.tsx
  - src-tauri/icons/ios/AppIcon-76x76@1x.png
  - src-tauri/src/data_portability/aire_format.rs
  - src/components/ui/Card.tsx
  - src-tauri/src/land_registry/apis/address_to_parcel.rs
  - src-tauri/src/land_registry/field_mapping/tests.rs
  - e2e/results/results.json
  - src/components/PullParcelDataButton.tsx
  - src/components/BalanceMonitor.tsx
  - src-tauri/src/land_registry/api_key_storage.rs
  - src/components/ui/table.tsx
  - src/components/ui/sonner.tsx
  - src/app/login/page.tsx
  - src/lib/mock-backend.ts
  - src-tauri/src/branding/logo.rs
  - src-tauri/src/land_registry/apis/land_value.rs
  - src-tauri/src/land_registry/apis/mortgages.rs
  - src/components/ThemeSelector.tsx
  - src-tauri/icons/Square150x150Logo.png
  - src/lib/pdf-blocks/ai-badge.tsx
  - src-tauri/icons/icon.icns
  - scripts/phase5-smoke.sh
  - src/app/cases/new/page.tsx
  - src/components/ui/spinner.tsx
  - src-tauri/icons/ios/AppIcon-60x60@2x.png
  - src/components/ui/sheet.tsx
  - src/components/ui/select.tsx
  - src-tauri/src/data_portability/mod.rs
  - src/lib/pdf-engine/index.ts
  - src/lib/pdf-blocks/condition-survey.tsx
  - src-tauri/icons/Square310x310Logo.png
  - src/app/page.tsx
  - src/assets/icon-dark.png
  - src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher.png
  - src/app/(dashboard)/settings/sync-status/page.tsx
  - src/app/cases/page.tsx
  - src/components/PreChargeConfirmDialog.tsx
  - src-tauri/icons/Square89x89Logo.png
  - src-tauri/src/land_registry/opcos_offline_grace/mod.rs
  - src-tauri/src/legal_clauses/sync/tests.rs
  - src/app/(dashboard)/settings/api-key/page.tsx
  - src-tauri/src/db/mod.rs
  - src/lib/date-format-twn.ts
  - src/lib/pdf-blocks/life-amenities.tsx
  - src-tauri/icons/ios/AppIcon-512@2x.png
  - .artifacts/browser-dev-mock/02-cases-seed-list.png
  - src-tauri/icons/ios/AppIcon-60x60@3x.png
  - src/app/(dashboard)/dev/ux/page.tsx
  - src/lib/pdf-blocks/cover.tsx
  - src/lib/pdf-themes/theme-a-minimal/index.tsx
  - src-tauri/src/commands/drafts.rs
  - src/components/OwnerAuthorizationDialog.tsx
  - src/components/ui/separator.tsx
  - src/components/ManualFallbackInput.tsx
  - src/components/ui/badge.tsx
  - src/components/settings/LicenseSection.tsx
  - src-tauri/src/land_registry/billing_log/mod.rs
  - .artifacts/browser-dev-mock/04-branding-loaded.png
  - src-tauri/icons/ios/AppIcon-20x20@2x.png
  - src-tauri/icons/android/mipmap-hdpi/ic_launcher_round.png
  - src-tauri/src/land_registry/migration_rollback/tests.rs
  - src/components/ui/form.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/app/(dashboard)/cases/[id]/layout.tsx
  - src/components/settings/DevSuperAdmin.tsx
  - src-tauri/icons/android/mipmap-xhdpi/ic_launcher.png
  - src-tauri/src/land_registry/cache/mod.rs
  - src-tauri/src/land_registry/client/tests.rs
  - src-tauri/icons/ios/AppIcon-20x20@3x.png
  - src-tauri/icons/android/mipmap-xhdpi/ic_launcher_foreground.png
  - scripts/phase4-kimi-cr.sh
  - src-tauri/src/land_registry/client/mod.rs
  - src-tauri/icons/Square107x107Logo.png
  - src/app/(dashboard)/cases/page.tsx
  - src-tauri/src/realtor_license/cache/tests.rs
  - src/lib/pdf-blocks/dynamic-composition.tsx
  - src-tauri/icons/ios/AppIcon-20x20@1x.png
  - src/components/ux/ConfirmDialog.tsx
  - src-tauri/src/branding/mod.rs
  - src/lib/pdf-themes/theme-provider.tsx
  - src-tauri/src/land_registry/errors/mod.rs
  - src/lib/pdf-engine/engine.ts
  - src-tauri/src/legal_clauses/cache/tests.rs
  - src/lib/pdf-blocks/logo-anchors.tsx
  - src-tauri/icons/128x128@2x.png
  - src-tauri/src/land_registry/apis/zoning.rs
  - src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_round.png
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src-tauri/src/land_registry/disk_resilience/tests.rs
  - .artifacts/browser-dev-mock/03-create-case-success.png
  - src/components/disclosure-form-residential.tsx
  - src-tauri/src/realtor_license/client.rs
  - scripts/phase5-smoke-2a.sh
  - e2e/results/test-artifacts/.last-run.json
  - src-tauri/src/data_portability/conflict.rs
  - src-tauri/src/land_registry/balance.rs
  - docs/phase4-cr-reports/aire-phase1-legal-clauses-autofill-kimi-cr.md
  - src/components/ui/Button.tsx
  - src-tauri/icons/ios/AppIcon-76x76@2x.png
  - src/components/ux/EmptyState.tsx
  - src/components/ui/dialog.tsx
  - src/lib/pdf-layout.ts
  - src/lib/pdf-blocks/basic-info.tsx
  - docs/phase4-cr-reports/aire-phase1-html-pdf-renderer-kimi-cr.md
  - src-tauri/src/land_registry/time_sync/mod.rs
  - src/components/ui/card.tsx
  - src-tauri/src/crypto/recovery_code.rs
  - src-tauri/src/crypto/mod.rs
  - src/components/ApiKeySettings.tsx
  - src-tauri/src/encryption/tests.rs
  - src/app/(dashboard)/settings/branding/page.tsx
tests:
  - e2e/license-verification.spec.ts
  - docs/data-recovery-guide.test.ts
  - src/components/__tests__/LogoUploader.test.tsx
  - e2e/theme-selector.spec.ts
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/lib/__tests__/cases-api.test.ts
  - docs/__tests__/pdf-theme-pack-spec.test.ts
  - src/app/(dashboard)/settings/logs/__tests__/page.test.tsx
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - e2e/pdf-legal-notice-position.spec.ts
  - src/lib/pdf-blocks/__tests__/legal-notice.test.tsx
  - src/lib/pdf-themes/__tests__/persistence.test.ts
  - src/lib/__tests__/mock-backend.test.ts
  - src/components/__tests__/sidebar.test.tsx
  - src/components/__tests__/RealtorLicenseField.test.tsx
  - e2e/sync-status-page.spec.ts
  - src/app/(dashboard)/__tests__/layout.test.tsx
  - src-tauri/tests/e2e_smoke.rs
  - e2e/pdf-theme-a-visual.spec.ts
  - src/components/__tests__/AppSidebar.test.tsx
  - src/components/settings/__tests__/LicenseSection.test.tsx
  - src/app/activation/__tests__/page.test.tsx
  - src/lib/__tests__/auth.test.ts
  - e2e/smoke.spec.ts
  - src/app/(dashboard)/settings/sync-status/__tests__/page.test.tsx
  - src/app/(dashboard)/__tests__/layout-sidebar.test.tsx
  - e2e/pdf-theme-c-visual.spec.ts
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/lib/pdf-blocks/__tests__/legal-notice-theme.test.tsx
  - src/app/(dashboard)/cases/__tests__/page.test.tsx
  - src/lib/pdf-blocks/__tests__/legal-notice-wrap.test.tsx
  - src/components/__tests__/RecoveryCodeModal.test.tsx
  - e2e/legal-clauses-sync.spec.ts
  - src/lib/__tests__/log.test.ts
  - src/lib/__tests__/tauri-bridge.test.ts
  - e2e/data-portability.spec.ts
  - src/components/settings/__tests__/PremiumUnlockSection.test.tsx
  - src/components/settings/__tests__/DevSuperAdmin.test.tsx
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/app/login/__tests__/page.test.tsx
  - e2e/recovery-reset.spec.ts
  - src/lib/__tests__/date-format-twn.test.ts
  - src/lib/pdf-blocks/__tests__/legal-notice-empty.test.tsx
  - src/components/__tests__/ThemeSelector.test.tsx
  - src/lib/pdf-engine/__tests__/render-with-legal.test.tsx
  - src/components/__tests__/TauriRequired.test.tsx
  - src/hooks/__tests__/useAuth.test.tsx
-->

---
### Requirement: Case data includes land registry data
The case record SHALL include a `land_registry_data` field (JSON object or null) to store the land registry query result. The `update_case` API SHALL accept `land_registry_data` as an optional parameter.

#### Scenario: Save land registry data
- **WHEN** `update_case` is called with `land_registry_data` containing query results
- **THEN** the case record stores the land registry data and subsequent reads return it


<!-- @trace
source: aire-ux-wizard-refactor
updated: 2026-05-16
code:
  - src/components/OwnerAuthorizationDialog.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/lib/pdf-engine/document.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/components/CaseListActions.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/mock-backend.ts
  - src/app/(dashboard)/cases/page.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src/components/CaseSupplementDialog.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/cases-api.ts
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/land-registry-api.ts
  - src/components/case-wizard/CaseWizard.tsx
-->

---
### Requirement: Case data includes case name
The case record SHALL include a `case_name` field (string, optional) for user-defined case names.

#### Scenario: Create case with name
- **WHEN** user creates a case with `case_name='和平東路案'`
- **THEN** the case record stores `case_name='和平東路案'` and the list displays it in the "案件名稱" column


<!-- @trace
source: aire-ux-wizard-refactor
updated: 2026-05-16
code:
  - src/components/OwnerAuthorizationDialog.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/lib/pdf-engine/document.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/components/CaseListActions.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/mock-backend.ts
  - src/app/(dashboard)/cases/page.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src/components/CaseSupplementDialog.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/cases-api.ts
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/land-registry-api.ts
  - src/components/case-wizard/CaseWizard.tsx
-->

---
### Requirement: Field label uses "所有權人"
All UI labels referring to the property owner SHALL use "所有權人" regardless of property type. The system SHALL NOT use "屋主", "地主", or "物件名稱 / 屋主".

#### Scenario: Residential case detail
- **WHEN** user views a residential case detail page
- **THEN** the owner field label reads "所有權人", not "屋主" or "物件名稱 / 屋主"

#### Scenario: Land case detail
- **WHEN** user views a land case detail page
- **THEN** the owner field label reads "所有權人", not "地主" or "物件名稱 / 地主"

<!-- @trace
source: aire-ux-wizard-refactor
updated: 2026-05-16
code:
  - src/components/OwnerAuthorizationDialog.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/lib/pdf-engine/document.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/components/CaseListActions.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/mock-backend.ts
  - src/app/(dashboard)/cases/page.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src/components/CaseSupplementDialog.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/cases-api.ts
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/land-registry-api.ts
  - src/components/case-wizard/CaseWizard.tsx
-->

---
### Requirement: real-price-section-on-case-detail

The case detail page (`/cases/:id`) SHALL include a dedicated "實價登錄" section below the existing 地政資料 section. The section SHALL mount the `RealPricePanel` component.

#### Scenario: Real price section visible on case detail page

WHEN a user navigates to any case detail page
THEN a section titled "實價登錄參考" SHALL be visible below the 地政資料 section

##### Example:
- URL: http://localhost:3000/cases/TEST-001
- Expected: page contains a section with heading "實價登錄參考" and a "查實價登錄" button

<!-- @trace
source: twinkle-hub-mcp-integration
updated: 2026-05-16
code:
  - src/app/(dashboard)/cases/page.tsx
  - src/components/CaseSupplementDialog.tsx
  - src/lib/land-registry-api.ts
  - src/lib/mock-backend.ts
  - src/lib/address-parser.ts
  - src/components/case-wizard/CaseWizardStep2.tsx
  - vitest.config.ts
  - src-tauri/src/lib.rs
  - src/components/CaseListActions.tsx
  - src/app/(dashboard)/layout.tsx
  - src/components/ComingSoonCard.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src/lib/pdf-themes/theme-e-warm/index.tsx
  - src/app/login/page.tsx
  - src/lib/pdf-engine/document.tsx
  - src/components/LogoUploader.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/components/PullParcelDataButton.tsx
  - src/lib/safe-invoke.ts
  - vitest.setup.ts
  - src/components/DeleteConfirmDialog.tsx
  - src-tauri/src/commands/real_price.rs
  - next.config.ts
  - src/app/(dashboard)/cases/new/page.tsx
  - src/components/SettingsTabs.tsx
  - src/resources/fonts/NotoSansTC-Regular.otf
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src-tauri/src/mcp_client.rs
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/pdf-engine/react-pdf-init.ts
  - src/lib/pdf-themes/theme-d-fresh/index.tsx
  - src/components/settings/PremiumUnlockSection.tsx
  - src/components/AppSidebar.tsx
  - src/lib/pdf-engine/index.ts
  - src/lib/pdf-themes/registry.ts
  - src-tauri/src/land_registry/batch/mod.rs
  - src/app/(dashboard)/settings/page.tsx
  - src/lib/pdf-engine/engine.ts
  - src/components/ThemeSelector.tsx
  - src/lib/pdf-engine/react-pdf-components.tsx
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/components/OwnerAuthorizationDialog.tsx
  - src/app/(dashboard)/dev/page.tsx
  - src-tauri/src/commands/mod.rs
  - src/lib/pdf-themes/index.ts
  - src/components/RealPricePanel.tsx
  - src/app/(dashboard)/settings/branding/page.tsx
  - src/components/settings/LandApiSection.tsx
  - src/components/PdfPreviewer.tsx
  - src/lib/cases-api.ts
  - src/components/case-wizard/CaseWizard.tsx
tests:
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/lib/pdf-engine/__tests__/engine.test.ts
  - src/lib/__tests__/address-parser.test.ts
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - src/app/(dashboard)/settings/branding/__tests__/page.test.tsx
  - src/components/__tests__/AppSidebar.test.tsx
  - src/components/__tests__/ThemeSelector.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/lib/pdf-engine/__tests__/react-pdf-components.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/components/settings/__tests__/PremiumUnlockSection.test.tsx
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/components/__tests__/ComingSoonCard.test.tsx
  - src/lib/pdf-engine/__tests__/document.test.tsx
  - src/app/(dashboard)/settings/logs/__tests__/page.test.tsx
  - src/components/__tests__/RealPricePanel.test.tsx
  - src/lib/pdf-engine/__tests__/render-with-legal.test.tsx
-->