# case-management Specification

## Purpose

TBD - created by archiving change 'aire-desktop-phase1'. Update Purpose after archive.

## Requirements

### Requirement: Case list view

The system SHALL provide a `/cases` page that lists all cases ordered by `updated_at DESC`, displaying customer-facing case identity, address/owner summary, case type, status, updated time, and secondary row actions.

The `/cases` page SHALL be a second-level case selection surface. It SHALL NOT render the same second-level labels already available in the sidebar as page-level tabs.

The `/cases` page SHALL provide a single primary action per case for entering the case workbench at `/cases/:id`.

##### Example: list rendering

| Area | Display rule |
| --- | --- |
| Page heading | `案件管理` |
| Case identity | `case_name` if present, otherwise `case_no`, otherwise shortened id |
| Address/owner | Primary line: address; Secondary line: owner name or `待補件` |
| Case type | `residential` → `成屋`, `land` → `土地` |
| Status | `draft` → `草稿`, `keyin` → `填入中`, `completed` → `完成`, `exported` → `已匯出` |
| Main action | Click row or one explicit link/button to `/cases/:id`; if both exist, they SHALL perform the exact same action |

#### Scenario: List with cases

- **WHEN** the user opens `/cases` with cases in the database
- **THEN** all rows are visible, ordered with the most recently updated at the top
- **AND** each row provides exactly one primary way to enter the case workbench
- **AND** the page does NOT render page-level tabs named `案件總覽`, `說明書工作台`, `補件清單`

#### Scenario: Empty list state

- **WHEN** the user opens `/cases` with no cases in the database
- **THEN** the page displays an empty state telling the user to create a case
- **AND** the only primary action is `新增案件`
- **AND** the page does NOT display case-scoped workbench tools

---
### Requirement: Create case flow

The system SHALL provide a `/cases/new` page that asks the user to enter an address first, run registry classification, and only then create a draft case. Manual property-type selection SHALL appear only when the address is empty, lookup fails, or multiple candidates require user selection.

#### Scenario: Successful address-first creation

- **WHEN** the user enters a normal building address, clicks 判斷地政資料, and submits the form
- **THEN** the system creates a draft case with building/residential classification and navigates to `/cases/<new-id>`

#### Scenario: Missing registry decision is rejected

- **WHEN** the user enters an address and submits without clicking 判斷地政資料
- **THEN** the form displays 請先按「判斷地政資料」確認土地或建物資料，再建立案件。
- **AND** the system does not create a case

##### Example: guarded create

- **GIVEN** the user enters `台南市永康區勝利街58巷4號1樓`
- **WHEN** the user clicks `先判斷地政資料` without running 判斷地政資料
- **THEN** the form displays 請先按「判斷地政資料」確認土地或建物資料，再建立案件。
- **AND** `casesApi.create` is not called

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

---
### Requirement: Case management SHALL route each action to one clear destination

案件管理 SHALL 避免案件總覽、物調表、補件清單與 PDF 操作互相重複或導向同一個不明頁面。

#### Scenario: User opens a case action

- **GIVEN** 使用者在案件列表點擊物調表、補件或 PDF 操作
- **WHEN** 頁面切換
- **THEN** 系統 SHALL 開啟對應目的頁
- **AND** 頁面內容 SHALL 只顯示該目的所需功能

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
### Requirement: 補件入口統一到補件現場工作台

Case-level supplement actions SHALL open the current workbench supplement flow instead of the legacy key-in flow.

#### Scenario: case-row supplement shortcut

- **GIVEN** a case row is visible on `/cases`
- **WHEN** the user clicks the `補件` action
- **THEN** the app SHALL navigate to `/cases/:id?tab=supplements`
- **THEN** the `補件/現場` tab SHALL be selected for that case

---
### Requirement: 補件現場資料可持久化

The workbench supplement/field-visit form SHALL persist user-entered draft data in mock/browser mode.

#### Scenario: field-visit answers persist

- **GIVEN** the user opens a case workbench
- **WHEN** the user enters a field-visit answer and changes its status
- **THEN** the workbench SHALL save those values to the case supplement draft
- **WHEN** the workbench remounts for the same case
- **THEN** the saved answer and status SHALL still be visible

#### Scenario: upload names and supplement-list state persist

- **GIVEN** the user opens the `補件/現場` tab
- **WHEN** the user selects a file for an upload slot
- **THEN** the selected file name SHALL be saved for that case
- **WHEN** the user clicks `加入補件清單`
- **THEN** the supplement-list state SHALL be saved for that case
- **WHEN** the workbench remounts
- **THEN** the selected file name and supplement-list state SHALL still be visible

#### Scenario: PDF check uses persisted upload count

- **GIVEN** a case has persisted supplement upload file names
- **WHEN** the user opens the `PDF 檢查` tab
- **THEN** the uploaded-asset count SHALL reflect the persisted upload file names

---
### Requirement: Case row destinations SHALL preserve selected workflow scope

The cases list SHALL route a clicked case row according to the currently selected second-level workflow instead of always opening the default workbench.

#### Scenario: Supplement list opens the supplement tab

- **GIVEN** the user is on `/cases?view=supplements`
- **WHEN** the user clicks a case row
- **THEN** the app navigates to `/cases/:id?tab=supplements`

#### Scenario: PDF preview list opens preview route

- **GIVEN** the user is on `/cases?view=pdf`
- **WHEN** the user clicks a case row
- **THEN** the app navigates to `/cases/:id/preview`

#### Scenario: Export list opens preview export mode

- **GIVEN** the user is on `/cases?view=export`
- **WHEN** the user clicks a case row
- **THEN** the app navigates to `/cases/:id/preview?mode=export`

---
### Requirement: Case workbench controls SHALL be executable or clearly read-only

The case workbench SHALL not show active-looking controls that do not change state, route, or execute a tested local action.

#### Scenario: Workbench tabs switch scoped content

- **WHEN** the user clicks 資料來源, 補件, 費用, or PDF 檢查
- **THEN** the workbench shows only that tab's content
- **AND** the active tab is visually and semantically selected

##### Example: supplement tab

- **GIVEN** the workbench initially shows 欄位
- **WHEN** the user clicks 補件
- **THEN** 補件與現場確認 is visible
- **AND** 費用成功與失敗紀錄 is not visible

#### Scenario: Local supplement action gives feedback

- **WHEN** the user clicks 加入補件清單
- **THEN** the workbench displays 已加入補件清單

##### Example: visible feedback

- **GIVEN** the user is on the 補件 tab
- **WHEN** the user clicks 加入補件清單
- **THEN** 已加入補件清單 appears in the same region

#### Scenario: Backend-pending actions are read-only status

- **WHEN** backend re-query or automatic supplement generation is not implemented
- **THEN** the workbench shows them as read-only status text
- **AND** they are not rendered as primary action buttons

##### Example: pending re-query

- **GIVEN** backend re-query is not wired
- **WHEN** the user opens the workbench
- **THEN** 地政重查：後端串接中 is visible
- **AND** no button named 重新查詢 is visible

---
### Requirement: 案件列表提供 PDF 預覽與匯出動作

The case overview SHALL expose PDF output actions directly on each case row.

- **WHEN** a user opens `/cases`
- **THEN** each case row SHALL include an action named `預覽 PDF`
- **THEN** each case row SHALL include an action named `匯出 PDF`
- **THEN** each case row SHALL NOT include a separate action named `開啟工作台`
- **WHEN** the user clicks `預覽 PDF`
- **THEN** the app SHALL navigate to `/cases/:id/preview`
- **WHEN** the user clicks `匯出 PDF`
- **THEN** the app SHALL call the existing `export_pdf` path for that case

#### Scenario: row click still opens workbench

- **GIVEN** a case row is visible on `/cases`
- **WHEN** the user clicks the row body instead of a row action
- **THEN** the app SHALL navigate to `/cases/:id`

---
### Requirement: 新增案件只保留單一地政判斷入口

The new case form SHALL use one primary action for registry detection before case creation.

#### Scenario: primary button performs registry detection first

- **WHEN** a user opens `/cases/new`
- **THEN** the address field area SHALL NOT show a second inline `判斷地政資料` button
- **THEN** the form primary button SHALL be labelled `判斷地政資料` before detection
- **WHEN** the user fills an address and clicks the primary `判斷地政資料` button
- **THEN** the app SHALL execute registry detection
- **THEN** the app SHALL NOT create a case in the same click
- **WHEN** classification is visible
- **THEN** the form primary button SHALL be labelled `建立案件`

---
### Requirement: 工作台補件操作不可是無功能按鈕

The workbench SHALL keep supplement, field-visit, source review, and cost review in user-facing steps with visible outcomes.

#### Scenario: supplement actions change visible workbench state

- **WHEN** a user opens the `補件/現場` tab in the workbench
- **THEN** the user SHALL see upload controls for `地籍圖`, `空拍圖`, `格局圖`, `地標圖`, and `LINE 照片`
- **THEN** the user SHALL see editable field-visit questions in the same panel
- **THEN** the user SHALL NOT see a separate `現場必問` button
- **THEN** the user SHALL NOT see a separate `手動上傳覆蓋` button

#### Scenario: workbench has one chapter navigation system

- **WHEN** a user opens the workbench
- **THEN** the top work tabs SHALL be the only chapter switching controls
- **THEN** the sidebar SHALL NOT render a duplicate `說明書章節` button group
- **THEN** the tabs SHALL be `欄位`, `資料來源`, `補件/現場`, and `PDF 檢查`

#### Scenario: registry source and fee are visible before PDF check

- **WHEN** a user opens the `欄位` tab
- **THEN** the user SHALL see the current registry query cost
- **WHEN** the user opens the `資料來源` tab
- **THEN** the user SHALL see imported fields, source services, and status labels
- **THEN** the user SHALL be able to preview and download the source JSON

---
### Requirement: 個人設定與方案升級分工清楚

The settings pages SHALL separate personal editing from license and plan management.

#### Scenario: profile settings are editable and do not include license blocks

- **WHEN** a user opens `/settings`
- **THEN** the user SHALL see editable controls for personal name, Email, password, brand color, and brand Logo
- **THEN** the user SHALL NOT see account/license management
- **THEN** the user SHALL NOT see a generic operation-log card

#### Scenario: plan upgrade owns account/license and feature toggles

- **WHEN** a user opens `/settings?section=plans`
- **THEN** the user SHALL see account/license management
- **THEN** the user SHALL see plan cards for `基本款`, `進階款`, and `高級款`
- **THEN** feature toggles SHALL use `未啟用` and `已啟用` labels instead of `開發中`
- **THEN** the reserved feature area SHALL state `目前正在開發中。`

---
### Requirement: PDF 圖資缺稿時保留空白格局框

PDF output SHALL not insert unapproved floor-plan drafts and SHALL keep a printable blank frame when no final floor-plan asset exists.

#### Scenario: no floor-plan asset exists

- **WHEN** a building PDF is rendered without uploaded floor-plan image and without approved AI floor-plan conversion
- **THEN** the PDF SHALL include a `格局圖` page with an empty frame
- **THEN** the frame SHALL NOT contain upload placeholder text

#### Scenario: draft AI floor-plan conversion exists

- **WHEN** a floor-plan conversion exists with status `draft`
- **THEN** the PDF dossier SHALL NOT include that conversion as an approved floor-plan page

---
### Requirement: PDF 成交行情測試資料需符合案件地址

PDF preview fallback data SHALL not show fixed unrelated real-price rows for a different district.

#### Scenario: Yongkang case uses Yongkang real-price rows

- **WHEN** the system queries mock real-price data for `台南市永康區勝利街58巷4號1樓`
- **THEN** returned rows SHALL contain `台南市永康區`
- **THEN** returned rows SHALL NOT contain `育農路`

#### Scenario: PDF transaction date is preserved

- **WHEN** real-price mock data returns a `date` field
- **THEN** PDF dossier assembly SHALL map it to the transaction date shown in the PDF

---
### Requirement: Create-case flow SHALL persist registry confirmation state

The create-case flow SHALL save discovery diagnostics, candidate data, normalized address, and confirmed registry match state before allowing formal COP lookup. Building cases SHALL require section, land number, and building number confirmation before formal pull. Land-only cases SHALL require section and land number and SHALL allow building number to remain empty.

#### Scenario: Manual confirmation after discovery failure

- **GIVEN** address discovery fails or is denied
- **WHEN** the user manually enters section, land number, and building number and creates the case
- **THEN** the case SHALL store `confirmed_registry_match`
- **AND** the system SHALL be able to use that confirmed key for formal COP pull.

#### Scenario: Unconfirmed candidate cannot trigger paid lookup

- **GIVEN** a case has candidate discovery data but no confirmed registry match
- **WHEN** formal COP lookup is requested
- **THEN** the request SHALL fail with `registry_match_required`
- **AND** no paid API call SHALL be created.

#### Scenario: Multiple candidates require one confirmation

- **GIVEN** discovery returns multiple land or building candidates
- **WHEN** the user creates or updates the case without selecting exactly one candidate
- **THEN** the case SHALL remain `registry_pending` or unconfirmed
- **AND** formal COP lookup SHALL remain blocked
- **AND** the UI SHALL show that one target must be selected or manually corrected.

#### Scenario: Paid resolver candidate still requires confirmation

- **GIVEN** a paid address-to-parcel resolver has returned candidate registry targets
- **WHEN** the user creates or updates the case without confirming exactly one candidate
- **THEN** the case SHALL remain `registry_pending` or unconfirmed
- **AND** formal COP lookup SHALL remain blocked
- **AND** the paid resolver run SHALL remain evidence only.


<!-- @trace
source: desktop-local-address-to-cop-e2e
updated: 2026-05-27
code:
  - .opencode/skills/spectra-propose/SKILL.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-relaunch2-20260527.png
  - src/lib/pdf-engine/document.tsx
  - e2e/results/results.json
  - docs/gov-site-analysis/10-r01-opendata.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-confirm6s-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-fix-2s-20260527.png
  - .opencode/skills/spectra-discuss/SKILL.md
  - docs/gov-site-analysis/05-nlsc-t09-mobile.md
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810363434.json
  - src-tauri/src/lib.rs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase-20260527.png
  - .opencode/skills/spectra-ingest/SKILL.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-billing-modal-20260527.png
  - src/components/case-wizard/CaseWizardStep2.tsx
  - .opencode/skills/spectra-archive/SKILL.md
  - src/components/LogoUploader.tsx
  - artifacts/smoke/local-web-yunong-formal-import-source-after-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-open-case-20260527.png
  - docs/gov-site-analysis/06-easymap-z10.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-formal-tab-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-signed-launch-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-tauri-dev-front-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-tauri-dev-open-case-20260527.png
  - docs/gov-site-analysis/02-luz-landuse.md
  - .opencode/skills/spectra-debug/SKILL.md
  - docs/release/desktop-fullflow-acceptance-checklist.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-resume-front-20260527.png
  - artifacts/smoke/macos/aire-0.1.3-local-launch-20260525-211448.png
  - artifacts/smoke/local-web-logo-upload-persisted-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-precharge2-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779809808933.json
  - src/app/(dashboard)/cases/[id]/keyin/page.tsx
  - src/lib/tax-calculator.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-launch-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-macos-memory-keyring-parity-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase-rebuild-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-memory-keyring-app-front-20260527.png
  - src-tauri/src/commands/cases.rs
  - .opencode/skills/spectra-audit/SKILL.md
  - docs/gov-site-analysis/04-easymap-r02.md
  - src/lib/registry-preview.ts
  - artifacts/smoke/local-web-yunong-formal-import-case-20260526.json
  - artifacts/smoke/local-web-easymap-r02-autofill-20260526.png
  - artifacts/smoke/local-web-donghe-clean-source-20260526.pdf
  - .cursorrules
  - src/lib/formal-cop-api-set.ts
  - docs/gov-site-analysis/03-nsp-ngis.md
  - artifacts/smoke/desktop-local-address-to-cop-e2e-live-discovery-matrix.json
  - .opencode/commands/spectra-commit.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-filled2-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-tauri-dev-front-20260527.png
  - src-tauri/src/land_registry/easymap_r02.rs
  - docs/gov-site-analysis/07-easymap-w10.md
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779809808933.pdf
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810199037.json
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-filled-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-import-result2-20260527.png
  - src-tauri/src/land_registry/mod.rs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-active-after-rebuild-20260527.png
  - .opencode/commands/spectra-audit.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-memory-keyring-launch-20260527.png
  - package.json
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase3-20260527.png
  - artifacts/smoke/donghe-smoke-20260526.mjs
  - src/lib/product-ui-demo-alignment.ts
  - docs/sr-archive/absorbed-2026-05-26.tar.gz
  - artifacts/smoke/local-web-new-case-object-query-copy-20260526.png
  - src/components/disclosure-form-residential.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-directrun-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810407653.pdf
  - .opencode/commands/spectra-ask.md
  - .opencode/commands/spectra-ingest.md
  - .spectra.yaml
  - artifacts/smoke/local-web-donghe-formal-button-images-20260526.pdf
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-fix-6s-20260527.png
  - src/lib/land-registry-api.ts
  - docs/handoff/desktop-local-address-to-cop-e2e-handoff.md
  - .opencode/commands/spectra-debug.md
  - artifacts/smoke/local-registry-auth-debug-20260525.png
  - artifacts/smoke/logo-upload-smoke-20260526.svg
  - docs/gov-site-analysis/12-cop-platform-api.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase2-20260527.png
  - src/components/SettingsTabs.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-precharge-20260527.png
  - src/app/(dashboard)/cases/new/page.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-relaunch-20260527.png
  - docs/gov-site-analysis/08-easymap-index.md
  - docs/desktop-r02-cop-flow-map.html
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-created-20260527.png
  - src-tauri/src/db/registry_query_runs.rs
  - src/lib/cases-api.ts
  - src/app/(dashboard)/settings/page.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query3-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-directrun2-20260527.png
  - artifacts/smoke/local-web-workbench-r02-source-smoke-20260526.png
  - src/lib/server/local-address-discovery-proxy.ts
  - artifacts/smoke/macos/aire-binary-run-20260527.log
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-disappear-activate-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query4-20260527.png
  - scripts/smoke-pdf-imported-fields.mjs
  - src-tauri/src/land_registry/pull.rs
  - artifacts/smoke/local-web-donghe-formal-button-source-20260526.png
  - src-tauri/src/land_registry/discovery_contract.rs
  - docs/gov-site-analysis/README.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-confirm2s-20260527.png
  - .opencode/commands/spectra-apply.md
  - src/lib/disclosure-schema-land.ts
  - artifacts/smoke/local-web-workbench-source-values-clean-20260526.png
  - .opencode/commands/spectra-drift.md
  - src/lib/page-contracts/house-field-survey.ts
  - artifacts/smoke/local-web-multiple-candidate-selection-20260526.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810407653.txt
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-source-roc-check-20260527.png
  - src-tauri/src/land_registry/apis/address_to_parcel.rs
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-focused-20260527.png
  - artifacts/smoke/local-web-pdf-preview-r02-fields-20260526.png
  - src/lib/registry-discovery-contract.ts
  - artifacts/smoke/macos/aire-app-run-20260527.log
  - src/lib/registry-provenance.ts
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779809808933.txt
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810363434.txt
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query2-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-open-review-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-import-modal-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810199037.pdf
  - artifacts/smoke/local-web-new-case-object-query-after-lookup-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-kill-reopen-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810407653.json
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810363434.pdf
  - artifacts/smoke/logo-debug-page-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-before-auth-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-single-instance-20260527.png
  - .opencode/commands/spectra-archive.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-front-20260527.png
  - artifacts/smoke/windows-runtime-blocker-20260527.json
  - AGENTS.md
  - .opencode/commands/spectra-discuss.md
  - src/lib/mock-backend.ts
  - artifacts/smoke/local-web-logo-upload-regression-20260526.mjs
  - src/lib/product-navigation-ia.ts
  - artifacts/smoke/local-web-donghe-clean-source-20260526.txt
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-tauri-dev-launch-20260527.png
  - docs/release/desktop-fullflow-acceptance-report.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-pid-front-20260527.png
  - .opencode/skills/spectra-apply/SKILL.md
  - artifacts/smoke/local-web-yunong-pdf-export-regression-20260526.mjs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-import-result-reactivated-20260527.png
  - docs/gov-site-analysis/09-plvr-opendata.md
  - src/app/api/local/address-discovery/route.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-formal-click-20260527.png
  - GEMINI.md
  - artifacts/smoke/macos/aire-trace-20260527.log
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-confirm-monitor-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-preview-after-formal-20260526.png
  - .opencode/skills/spectra-ask/SKILL.md
  - docs/gov-site-analysis/01-plvr-main.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-restart-front-20260527.png
  - artifacts/smoke/logo-debug-after-upload-20260526.png
  - artifacts/smoke/local-web-yunong-supplement-selects-20260526.png
  - artifacts/smoke/local-web-yunong-formal-import-regression-20260526.mjs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-binaryrun-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810199037.txt
  - docs/gov-site-analysis/11-nlsc-s09-soa.md
  - src/app/(dashboard)/layout.tsx
  - e2e/results/playwright-report/index.html
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-reload-20260527.png
  - artifacts/smoke/desktop-local-address-to-cop-e2e-imported-fields.pdf
  - .opencode/commands/spectra-propose.md
  - .opencode/skills/spectra-commit/SKILL.md
  - src/components/disclosure-form-land.tsx
  - artifacts/smoke/local-web-yunong-formal-import-source-before-20260526.png
  - src/components/PullParcelDataButton.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-manual-building-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-tauri-dev-formal-click-20260527.png
  - docs/address-land-discovery-decision-flow.html
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-post-confirm-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-reopen-after-import-20260527.png
  - .opencode/skills/spectra-drift/SKILL.md
  - src-tauri/src/secrets.rs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-import-result-20260527.png
tests:
  - src-tauri/tests/donghe_moi_api_015_live.rs
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/__tests__/tax-calculator.test.ts
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/app/api/local/address-discovery/__tests__/route.test.ts
  - src/app/(dashboard)/settings/__tests__/settings-page.test.tsx
  - src/lib/__tests__/land-registry-api.test.ts
  - src/lib/pdf-engine/__tests__/document-land-government-format.test.tsx
  - src/app/(dashboard)/__tests__/layout.test.tsx
  - src/lib/server/__tests__/local-address-discovery-proxy.test.ts
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - e2e/candidate-parcel-options-presurvey.spec.ts
  - src/lib/__tests__/mock-backend.test.ts
  - src/components/__tests__/AppSidebar.test.tsx
  - e2e/product-auth-functional-flow.spec.ts
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - src/components/__tests__/KeyinSplitPage.survey-fields.test.tsx
  - e2e/product-ui-demo-alignment.spec.ts
  - e2e/complete-presurvey-property-sheet-flow.spec.ts
  - src/lib/__tests__/formal-cop-api-set.test.ts
  - src/lib/__tests__/registry-discovery-contract.test.ts
  - src/lib/__tests__/product-navigation-ia.test.ts
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - src-tauri/tests/donghe_discovery_live.rs
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - src/lib/__tests__/product-ui-demo-alignment.test.ts
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - e2e/desktop-local-address-to-cop-e2e.spec.ts
  - e2e/full-product-flow-ia-ux-acceptance.spec.ts
  - e2e/local-web-registry-pending-billing.spec.ts
-->

---
### Requirement: Duplicate property entry SHALL autofill and warn

When the user enters an address or registry key already known to the local AIRE DB, the system SHALL warn the user and autofill reusable data instead of silently creating duplicate work or repeating paid queries.

#### Scenario: Same normalized address exists

- **GIVEN** local DB contains discovery data for the same normalized address
- **WHEN** a user enters that address again
- **THEN** the UI SHALL show that existing information was found
- **AND** section, land number, building number, and candidate details SHALL be auto-filled from local DB.

#### Scenario: Same confirmed registry key exists on another case

- **GIVEN** local DB contains an existing case with the same confirmed registry key
- **WHEN** the user confirms that registry key on a new case
- **THEN** the UI SHALL show `系統中已有同樣資訊` or equivalent customer-readable warning
- **AND** the user SHALL be able to open the existing case or explicitly continue creating a new case.


<!-- @trace
source: desktop-local-address-to-cop-e2e
updated: 2026-05-27
code:
  - .opencode/skills/spectra-propose/SKILL.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-relaunch2-20260527.png
  - src/lib/pdf-engine/document.tsx
  - e2e/results/results.json
  - docs/gov-site-analysis/10-r01-opendata.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-confirm6s-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-fix-2s-20260527.png
  - .opencode/skills/spectra-discuss/SKILL.md
  - docs/gov-site-analysis/05-nlsc-t09-mobile.md
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810363434.json
  - src-tauri/src/lib.rs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase-20260527.png
  - .opencode/skills/spectra-ingest/SKILL.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-billing-modal-20260527.png
  - src/components/case-wizard/CaseWizardStep2.tsx
  - .opencode/skills/spectra-archive/SKILL.md
  - src/components/LogoUploader.tsx
  - artifacts/smoke/local-web-yunong-formal-import-source-after-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-open-case-20260527.png
  - docs/gov-site-analysis/06-easymap-z10.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-formal-tab-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-signed-launch-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-tauri-dev-front-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-tauri-dev-open-case-20260527.png
  - docs/gov-site-analysis/02-luz-landuse.md
  - .opencode/skills/spectra-debug/SKILL.md
  - docs/release/desktop-fullflow-acceptance-checklist.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-resume-front-20260527.png
  - artifacts/smoke/macos/aire-0.1.3-local-launch-20260525-211448.png
  - artifacts/smoke/local-web-logo-upload-persisted-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-precharge2-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779809808933.json
  - src/app/(dashboard)/cases/[id]/keyin/page.tsx
  - src/lib/tax-calculator.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-launch-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-macos-memory-keyring-parity-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase-rebuild-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-memory-keyring-app-front-20260527.png
  - src-tauri/src/commands/cases.rs
  - .opencode/skills/spectra-audit/SKILL.md
  - docs/gov-site-analysis/04-easymap-r02.md
  - src/lib/registry-preview.ts
  - artifacts/smoke/local-web-yunong-formal-import-case-20260526.json
  - artifacts/smoke/local-web-easymap-r02-autofill-20260526.png
  - artifacts/smoke/local-web-donghe-clean-source-20260526.pdf
  - .cursorrules
  - src/lib/formal-cop-api-set.ts
  - docs/gov-site-analysis/03-nsp-ngis.md
  - artifacts/smoke/desktop-local-address-to-cop-e2e-live-discovery-matrix.json
  - .opencode/commands/spectra-commit.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-filled2-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-tauri-dev-front-20260527.png
  - src-tauri/src/land_registry/easymap_r02.rs
  - docs/gov-site-analysis/07-easymap-w10.md
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779809808933.pdf
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810199037.json
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-filled-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-import-result2-20260527.png
  - src-tauri/src/land_registry/mod.rs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-active-after-rebuild-20260527.png
  - .opencode/commands/spectra-audit.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-memory-keyring-launch-20260527.png
  - package.json
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase3-20260527.png
  - artifacts/smoke/donghe-smoke-20260526.mjs
  - src/lib/product-ui-demo-alignment.ts
  - docs/sr-archive/absorbed-2026-05-26.tar.gz
  - artifacts/smoke/local-web-new-case-object-query-copy-20260526.png
  - src/components/disclosure-form-residential.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-directrun-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810407653.pdf
  - .opencode/commands/spectra-ask.md
  - .opencode/commands/spectra-ingest.md
  - .spectra.yaml
  - artifacts/smoke/local-web-donghe-formal-button-images-20260526.pdf
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-fix-6s-20260527.png
  - src/lib/land-registry-api.ts
  - docs/handoff/desktop-local-address-to-cop-e2e-handoff.md
  - .opencode/commands/spectra-debug.md
  - artifacts/smoke/local-registry-auth-debug-20260525.png
  - artifacts/smoke/logo-upload-smoke-20260526.svg
  - docs/gov-site-analysis/12-cop-platform-api.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase2-20260527.png
  - src/components/SettingsTabs.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-precharge-20260527.png
  - src/app/(dashboard)/cases/new/page.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-relaunch-20260527.png
  - docs/gov-site-analysis/08-easymap-index.md
  - docs/desktop-r02-cop-flow-map.html
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-created-20260527.png
  - src-tauri/src/db/registry_query_runs.rs
  - src/lib/cases-api.ts
  - src/app/(dashboard)/settings/page.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query3-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-directrun2-20260527.png
  - artifacts/smoke/local-web-workbench-r02-source-smoke-20260526.png
  - src/lib/server/local-address-discovery-proxy.ts
  - artifacts/smoke/macos/aire-binary-run-20260527.log
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-disappear-activate-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query4-20260527.png
  - scripts/smoke-pdf-imported-fields.mjs
  - src-tauri/src/land_registry/pull.rs
  - artifacts/smoke/local-web-donghe-formal-button-source-20260526.png
  - src-tauri/src/land_registry/discovery_contract.rs
  - docs/gov-site-analysis/README.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-confirm2s-20260527.png
  - .opencode/commands/spectra-apply.md
  - src/lib/disclosure-schema-land.ts
  - artifacts/smoke/local-web-workbench-source-values-clean-20260526.png
  - .opencode/commands/spectra-drift.md
  - src/lib/page-contracts/house-field-survey.ts
  - artifacts/smoke/local-web-multiple-candidate-selection-20260526.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810407653.txt
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-source-roc-check-20260527.png
  - src-tauri/src/land_registry/apis/address_to_parcel.rs
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-focused-20260527.png
  - artifacts/smoke/local-web-pdf-preview-r02-fields-20260526.png
  - src/lib/registry-discovery-contract.ts
  - artifacts/smoke/macos/aire-app-run-20260527.log
  - src/lib/registry-provenance.ts
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779809808933.txt
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810363434.txt
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query2-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-open-review-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-import-modal-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810199037.pdf
  - artifacts/smoke/local-web-new-case-object-query-after-lookup-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-kill-reopen-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810407653.json
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810363434.pdf
  - artifacts/smoke/logo-debug-page-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-before-auth-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-single-instance-20260527.png
  - .opencode/commands/spectra-archive.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-front-20260527.png
  - artifacts/smoke/windows-runtime-blocker-20260527.json
  - AGENTS.md
  - .opencode/commands/spectra-discuss.md
  - src/lib/mock-backend.ts
  - artifacts/smoke/local-web-logo-upload-regression-20260526.mjs
  - src/lib/product-navigation-ia.ts
  - artifacts/smoke/local-web-donghe-clean-source-20260526.txt
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-tauri-dev-launch-20260527.png
  - docs/release/desktop-fullflow-acceptance-report.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-pid-front-20260527.png
  - .opencode/skills/spectra-apply/SKILL.md
  - artifacts/smoke/local-web-yunong-pdf-export-regression-20260526.mjs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-import-result-reactivated-20260527.png
  - docs/gov-site-analysis/09-plvr-opendata.md
  - src/app/api/local/address-discovery/route.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-formal-click-20260527.png
  - GEMINI.md
  - artifacts/smoke/macos/aire-trace-20260527.log
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-confirm-monitor-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-preview-after-formal-20260526.png
  - .opencode/skills/spectra-ask/SKILL.md
  - docs/gov-site-analysis/01-plvr-main.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-restart-front-20260527.png
  - artifacts/smoke/logo-debug-after-upload-20260526.png
  - artifacts/smoke/local-web-yunong-supplement-selects-20260526.png
  - artifacts/smoke/local-web-yunong-formal-import-regression-20260526.mjs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-binaryrun-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810199037.txt
  - docs/gov-site-analysis/11-nlsc-s09-soa.md
  - src/app/(dashboard)/layout.tsx
  - e2e/results/playwright-report/index.html
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-reload-20260527.png
  - artifacts/smoke/desktop-local-address-to-cop-e2e-imported-fields.pdf
  - .opencode/commands/spectra-propose.md
  - .opencode/skills/spectra-commit/SKILL.md
  - src/components/disclosure-form-land.tsx
  - artifacts/smoke/local-web-yunong-formal-import-source-before-20260526.png
  - src/components/PullParcelDataButton.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-manual-building-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-tauri-dev-formal-click-20260527.png
  - docs/address-land-discovery-decision-flow.html
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-post-confirm-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-reopen-after-import-20260527.png
  - .opencode/skills/spectra-drift/SKILL.md
  - src-tauri/src/secrets.rs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-import-result-20260527.png
tests:
  - src-tauri/tests/donghe_moi_api_015_live.rs
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/__tests__/tax-calculator.test.ts
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/app/api/local/address-discovery/__tests__/route.test.ts
  - src/app/(dashboard)/settings/__tests__/settings-page.test.tsx
  - src/lib/__tests__/land-registry-api.test.ts
  - src/lib/pdf-engine/__tests__/document-land-government-format.test.tsx
  - src/app/(dashboard)/__tests__/layout.test.tsx
  - src/lib/server/__tests__/local-address-discovery-proxy.test.ts
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - e2e/candidate-parcel-options-presurvey.spec.ts
  - src/lib/__tests__/mock-backend.test.ts
  - src/components/__tests__/AppSidebar.test.tsx
  - e2e/product-auth-functional-flow.spec.ts
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - src/components/__tests__/KeyinSplitPage.survey-fields.test.tsx
  - e2e/product-ui-demo-alignment.spec.ts
  - e2e/complete-presurvey-property-sheet-flow.spec.ts
  - src/lib/__tests__/formal-cop-api-set.test.ts
  - src/lib/__tests__/registry-discovery-contract.test.ts
  - src/lib/__tests__/product-navigation-ia.test.ts
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - src-tauri/tests/donghe_discovery_live.rs
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - src/lib/__tests__/product-ui-demo-alignment.test.ts
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - e2e/desktop-local-address-to-cop-e2e.spec.ts
  - e2e/full-product-flow-ia-ux-acceptance.spec.ts
  - e2e/local-web-registry-pending-billing.spec.ts
-->

---
### Requirement: Property type SHALL be auto-filled and editable

The system SHALL auto-fill property type from discovery and formal data while allowing the user to correct it. R02 SHALL provide coarse building-or-land classification from input intent and candidate data, and COP formal data SHALL refine the property type. Doorplate, floor, lane, alley, and unit-number inputs SHALL preserve building intent even when discovery only resolves the underlying land number.

#### Scenario: Formal data refines property type

- **GIVEN** a case has confirmed registry key and COP formal data
- **WHEN** the system parses building use, floor, total floor, zoning, or land-use fields
- **THEN** the case SHALL be classified into an available property type such as farmland, townhouse, apartment, highrise, residential-land, farmhouse, studio, storefront, factory, industrial-land, commercial-land, village-land, or other-land
- **AND** the user SHALL be able to edit the classification before finalizing the case.

#### Scenario: Land descriptor creates land-classification path

- **GIVEN** the user enters a section and land number without building number
- **WHEN** discovery resolves a land candidate
- **THEN** the case SHALL use the land classification path
- **AND** the user SHALL be able to choose farmland, commercial land, residential land, industrial land, or other land before formal data refines the type.

#### Scenario: Doorplate with only land result stays building-intent pending

- **GIVEN** the user enters a doorplate or floor address
- **AND** discovery resolves section and land number but cannot resolve building number
- **WHEN** the case classification is shown
- **THEN** the case SHALL remain building-intent
- **AND** the UI SHALL ask the user to confirm or fill the building number
- **AND** the case SHALL NOT be silently converted into a land-classification path.

#### Scenario: Land descriptor may expose building candidates without changing land intent

- **GIVEN** the user enters a section and land number as a land descriptor
- **AND** zero-cost land detail returns related building candidates
- **WHEN** the case classification is shown
- **THEN** the primary case SHALL remain a land-intent path unless the user selects a building candidate
- **AND** selecting a building candidate SHALL create a building confirmation path that still requires user confirmation before formal COP.


<!-- @trace
source: desktop-local-address-to-cop-e2e
updated: 2026-05-27
code:
  - .opencode/skills/spectra-propose/SKILL.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-relaunch2-20260527.png
  - src/lib/pdf-engine/document.tsx
  - e2e/results/results.json
  - docs/gov-site-analysis/10-r01-opendata.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-confirm6s-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-fix-2s-20260527.png
  - .opencode/skills/spectra-discuss/SKILL.md
  - docs/gov-site-analysis/05-nlsc-t09-mobile.md
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810363434.json
  - src-tauri/src/lib.rs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase-20260527.png
  - .opencode/skills/spectra-ingest/SKILL.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-billing-modal-20260527.png
  - src/components/case-wizard/CaseWizardStep2.tsx
  - .opencode/skills/spectra-archive/SKILL.md
  - src/components/LogoUploader.tsx
  - artifacts/smoke/local-web-yunong-formal-import-source-after-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-open-case-20260527.png
  - docs/gov-site-analysis/06-easymap-z10.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-formal-tab-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-signed-launch-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-tauri-dev-front-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-tauri-dev-open-case-20260527.png
  - docs/gov-site-analysis/02-luz-landuse.md
  - .opencode/skills/spectra-debug/SKILL.md
  - docs/release/desktop-fullflow-acceptance-checklist.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-resume-front-20260527.png
  - artifacts/smoke/macos/aire-0.1.3-local-launch-20260525-211448.png
  - artifacts/smoke/local-web-logo-upload-persisted-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-precharge2-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779809808933.json
  - src/app/(dashboard)/cases/[id]/keyin/page.tsx
  - src/lib/tax-calculator.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-launch-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-macos-memory-keyring-parity-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase-rebuild-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-memory-keyring-app-front-20260527.png
  - src-tauri/src/commands/cases.rs
  - .opencode/skills/spectra-audit/SKILL.md
  - docs/gov-site-analysis/04-easymap-r02.md
  - src/lib/registry-preview.ts
  - artifacts/smoke/local-web-yunong-formal-import-case-20260526.json
  - artifacts/smoke/local-web-easymap-r02-autofill-20260526.png
  - artifacts/smoke/local-web-donghe-clean-source-20260526.pdf
  - .cursorrules
  - src/lib/formal-cop-api-set.ts
  - docs/gov-site-analysis/03-nsp-ngis.md
  - artifacts/smoke/desktop-local-address-to-cop-e2e-live-discovery-matrix.json
  - .opencode/commands/spectra-commit.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-filled2-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-tauri-dev-front-20260527.png
  - src-tauri/src/land_registry/easymap_r02.rs
  - docs/gov-site-analysis/07-easymap-w10.md
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779809808933.pdf
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810199037.json
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-filled-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-import-result2-20260527.png
  - src-tauri/src/land_registry/mod.rs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-active-after-rebuild-20260527.png
  - .opencode/commands/spectra-audit.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-memory-keyring-launch-20260527.png
  - package.json
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase3-20260527.png
  - artifacts/smoke/donghe-smoke-20260526.mjs
  - src/lib/product-ui-demo-alignment.ts
  - docs/sr-archive/absorbed-2026-05-26.tar.gz
  - artifacts/smoke/local-web-new-case-object-query-copy-20260526.png
  - src/components/disclosure-form-residential.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-directrun-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810407653.pdf
  - .opencode/commands/spectra-ask.md
  - .opencode/commands/spectra-ingest.md
  - .spectra.yaml
  - artifacts/smoke/local-web-donghe-formal-button-images-20260526.pdf
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-fix-6s-20260527.png
  - src/lib/land-registry-api.ts
  - docs/handoff/desktop-local-address-to-cop-e2e-handoff.md
  - .opencode/commands/spectra-debug.md
  - artifacts/smoke/local-registry-auth-debug-20260525.png
  - artifacts/smoke/logo-upload-smoke-20260526.svg
  - docs/gov-site-analysis/12-cop-platform-api.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase2-20260527.png
  - src/components/SettingsTabs.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-precharge-20260527.png
  - src/app/(dashboard)/cases/new/page.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-relaunch-20260527.png
  - docs/gov-site-analysis/08-easymap-index.md
  - docs/desktop-r02-cop-flow-map.html
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-created-20260527.png
  - src-tauri/src/db/registry_query_runs.rs
  - src/lib/cases-api.ts
  - src/app/(dashboard)/settings/page.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query3-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-directrun2-20260527.png
  - artifacts/smoke/local-web-workbench-r02-source-smoke-20260526.png
  - src/lib/server/local-address-discovery-proxy.ts
  - artifacts/smoke/macos/aire-binary-run-20260527.log
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-disappear-activate-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query4-20260527.png
  - scripts/smoke-pdf-imported-fields.mjs
  - src-tauri/src/land_registry/pull.rs
  - artifacts/smoke/local-web-donghe-formal-button-source-20260526.png
  - src-tauri/src/land_registry/discovery_contract.rs
  - docs/gov-site-analysis/README.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-confirm2s-20260527.png
  - .opencode/commands/spectra-apply.md
  - src/lib/disclosure-schema-land.ts
  - artifacts/smoke/local-web-workbench-source-values-clean-20260526.png
  - .opencode/commands/spectra-drift.md
  - src/lib/page-contracts/house-field-survey.ts
  - artifacts/smoke/local-web-multiple-candidate-selection-20260526.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810407653.txt
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-source-roc-check-20260527.png
  - src-tauri/src/land_registry/apis/address_to_parcel.rs
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-focused-20260527.png
  - artifacts/smoke/local-web-pdf-preview-r02-fields-20260526.png
  - src/lib/registry-discovery-contract.ts
  - artifacts/smoke/macos/aire-app-run-20260527.log
  - src/lib/registry-provenance.ts
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779809808933.txt
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810363434.txt
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query2-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-open-review-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-import-modal-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810199037.pdf
  - artifacts/smoke/local-web-new-case-object-query-after-lookup-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-kill-reopen-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810407653.json
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810363434.pdf
  - artifacts/smoke/logo-debug-page-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-before-auth-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-single-instance-20260527.png
  - .opencode/commands/spectra-archive.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-front-20260527.png
  - artifacts/smoke/windows-runtime-blocker-20260527.json
  - AGENTS.md
  - .opencode/commands/spectra-discuss.md
  - src/lib/mock-backend.ts
  - artifacts/smoke/local-web-logo-upload-regression-20260526.mjs
  - src/lib/product-navigation-ia.ts
  - artifacts/smoke/local-web-donghe-clean-source-20260526.txt
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-tauri-dev-launch-20260527.png
  - docs/release/desktop-fullflow-acceptance-report.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-pid-front-20260527.png
  - .opencode/skills/spectra-apply/SKILL.md
  - artifacts/smoke/local-web-yunong-pdf-export-regression-20260526.mjs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-import-result-reactivated-20260527.png
  - docs/gov-site-analysis/09-plvr-opendata.md
  - src/app/api/local/address-discovery/route.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-formal-click-20260527.png
  - GEMINI.md
  - artifacts/smoke/macos/aire-trace-20260527.log
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-confirm-monitor-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-preview-after-formal-20260526.png
  - .opencode/skills/spectra-ask/SKILL.md
  - docs/gov-site-analysis/01-plvr-main.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-restart-front-20260527.png
  - artifacts/smoke/logo-debug-after-upload-20260526.png
  - artifacts/smoke/local-web-yunong-supplement-selects-20260526.png
  - artifacts/smoke/local-web-yunong-formal-import-regression-20260526.mjs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-binaryrun-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810199037.txt
  - docs/gov-site-analysis/11-nlsc-s09-soa.md
  - src/app/(dashboard)/layout.tsx
  - e2e/results/playwright-report/index.html
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-reload-20260527.png
  - artifacts/smoke/desktop-local-address-to-cop-e2e-imported-fields.pdf
  - .opencode/commands/spectra-propose.md
  - .opencode/skills/spectra-commit/SKILL.md
  - src/components/disclosure-form-land.tsx
  - artifacts/smoke/local-web-yunong-formal-import-source-before-20260526.png
  - src/components/PullParcelDataButton.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-manual-building-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-tauri-dev-formal-click-20260527.png
  - docs/address-land-discovery-decision-flow.html
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-post-confirm-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-reopen-after-import-20260527.png
  - .opencode/skills/spectra-drift/SKILL.md
  - src-tauri/src/secrets.rs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-import-result-20260527.png
tests:
  - src-tauri/tests/donghe_moi_api_015_live.rs
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/__tests__/tax-calculator.test.ts
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/app/api/local/address-discovery/__tests__/route.test.ts
  - src/app/(dashboard)/settings/__tests__/settings-page.test.tsx
  - src/lib/__tests__/land-registry-api.test.ts
  - src/lib/pdf-engine/__tests__/document-land-government-format.test.tsx
  - src/app/(dashboard)/__tests__/layout.test.tsx
  - src/lib/server/__tests__/local-address-discovery-proxy.test.ts
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - e2e/candidate-parcel-options-presurvey.spec.ts
  - src/lib/__tests__/mock-backend.test.ts
  - src/components/__tests__/AppSidebar.test.tsx
  - e2e/product-auth-functional-flow.spec.ts
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - src/components/__tests__/KeyinSplitPage.survey-fields.test.tsx
  - e2e/product-ui-demo-alignment.spec.ts
  - e2e/complete-presurvey-property-sheet-flow.spec.ts
  - src/lib/__tests__/formal-cop-api-set.test.ts
  - src/lib/__tests__/registry-discovery-contract.test.ts
  - src/lib/__tests__/product-navigation-ia.test.ts
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - src-tauri/tests/donghe_discovery_live.rs
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - src/lib/__tests__/product-ui-demo-alignment.test.ts
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - e2e/desktop-local-address-to-cop-e2e.spec.ts
  - e2e/full-product-flow-ia-ux-acceptance.spec.ts
  - e2e/local-web-registry-pending-billing.spec.ts
-->

---
### Requirement: Registry pending cases SHALL be creatable after discovery failure

The create-case flow SHALL allow a `registry_pending` case when address discovery cannot produce section, land number, or building number. A `registry_pending` case SHALL preserve the user-entered address and discovery diagnostics, SHALL route the missing registry data to supplements or manual confirmation, and SHALL NOT permit formal COP lookup or trusted PDF output until registry confirmation is completed.

#### Scenario: Discovery failure creates a pending case

- **GIVEN** address discovery returns no trustworthy section, land number, or building number
- **WHEN** the user creates a case from the address form
- **THEN** the case SHALL be created with `registry_pending`
- **AND** the case SHALL preserve the address, discovery status, readable failure reason, and missing registry fields
- **AND** formal COP lookup SHALL remain blocked with `registry_match_required`.

#### Scenario: Pending case becomes confirmed after manual registry input

- **GIVEN** a case is in `registry_pending`
- **WHEN** the user later enters and confirms section, land number, and building number when applicable
- **THEN** the case SHALL store `confirmed_registry_match`
- **AND** formal COP lookup SHALL become available for that confirmed registry key.


<!-- @trace
source: desktop-local-address-to-cop-e2e
updated: 2026-05-27
code:
  - .opencode/skills/spectra-propose/SKILL.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-relaunch2-20260527.png
  - src/lib/pdf-engine/document.tsx
  - e2e/results/results.json
  - docs/gov-site-analysis/10-r01-opendata.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-confirm6s-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-fix-2s-20260527.png
  - .opencode/skills/spectra-discuss/SKILL.md
  - docs/gov-site-analysis/05-nlsc-t09-mobile.md
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810363434.json
  - src-tauri/src/lib.rs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase-20260527.png
  - .opencode/skills/spectra-ingest/SKILL.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-billing-modal-20260527.png
  - src/components/case-wizard/CaseWizardStep2.tsx
  - .opencode/skills/spectra-archive/SKILL.md
  - src/components/LogoUploader.tsx
  - artifacts/smoke/local-web-yunong-formal-import-source-after-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-open-case-20260527.png
  - docs/gov-site-analysis/06-easymap-z10.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-formal-tab-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-signed-launch-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-tauri-dev-front-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-tauri-dev-open-case-20260527.png
  - docs/gov-site-analysis/02-luz-landuse.md
  - .opencode/skills/spectra-debug/SKILL.md
  - docs/release/desktop-fullflow-acceptance-checklist.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-resume-front-20260527.png
  - artifacts/smoke/macos/aire-0.1.3-local-launch-20260525-211448.png
  - artifacts/smoke/local-web-logo-upload-persisted-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-precharge2-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779809808933.json
  - src/app/(dashboard)/cases/[id]/keyin/page.tsx
  - src/lib/tax-calculator.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-launch-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-macos-memory-keyring-parity-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase-rebuild-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-memory-keyring-app-front-20260527.png
  - src-tauri/src/commands/cases.rs
  - .opencode/skills/spectra-audit/SKILL.md
  - docs/gov-site-analysis/04-easymap-r02.md
  - src/lib/registry-preview.ts
  - artifacts/smoke/local-web-yunong-formal-import-case-20260526.json
  - artifacts/smoke/local-web-easymap-r02-autofill-20260526.png
  - artifacts/smoke/local-web-donghe-clean-source-20260526.pdf
  - .cursorrules
  - src/lib/formal-cop-api-set.ts
  - docs/gov-site-analysis/03-nsp-ngis.md
  - artifacts/smoke/desktop-local-address-to-cop-e2e-live-discovery-matrix.json
  - .opencode/commands/spectra-commit.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-filled2-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-tauri-dev-front-20260527.png
  - src-tauri/src/land_registry/easymap_r02.rs
  - docs/gov-site-analysis/07-easymap-w10.md
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779809808933.pdf
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810199037.json
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-filled-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-import-result2-20260527.png
  - src-tauri/src/land_registry/mod.rs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-active-after-rebuild-20260527.png
  - .opencode/commands/spectra-audit.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-memory-keyring-launch-20260527.png
  - package.json
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase3-20260527.png
  - artifacts/smoke/donghe-smoke-20260526.mjs
  - src/lib/product-ui-demo-alignment.ts
  - docs/sr-archive/absorbed-2026-05-26.tar.gz
  - artifacts/smoke/local-web-new-case-object-query-copy-20260526.png
  - src/components/disclosure-form-residential.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-directrun-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810407653.pdf
  - .opencode/commands/spectra-ask.md
  - .opencode/commands/spectra-ingest.md
  - .spectra.yaml
  - artifacts/smoke/local-web-donghe-formal-button-images-20260526.pdf
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-fix-6s-20260527.png
  - src/lib/land-registry-api.ts
  - docs/handoff/desktop-local-address-to-cop-e2e-handoff.md
  - .opencode/commands/spectra-debug.md
  - artifacts/smoke/local-registry-auth-debug-20260525.png
  - artifacts/smoke/logo-upload-smoke-20260526.svg
  - docs/gov-site-analysis/12-cop-platform-api.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase2-20260527.png
  - src/components/SettingsTabs.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-precharge-20260527.png
  - src/app/(dashboard)/cases/new/page.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-relaunch-20260527.png
  - docs/gov-site-analysis/08-easymap-index.md
  - docs/desktop-r02-cop-flow-map.html
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-created-20260527.png
  - src-tauri/src/db/registry_query_runs.rs
  - src/lib/cases-api.ts
  - src/app/(dashboard)/settings/page.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query3-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-directrun2-20260527.png
  - artifacts/smoke/local-web-workbench-r02-source-smoke-20260526.png
  - src/lib/server/local-address-discovery-proxy.ts
  - artifacts/smoke/macos/aire-binary-run-20260527.log
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-disappear-activate-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query4-20260527.png
  - scripts/smoke-pdf-imported-fields.mjs
  - src-tauri/src/land_registry/pull.rs
  - artifacts/smoke/local-web-donghe-formal-button-source-20260526.png
  - src-tauri/src/land_registry/discovery_contract.rs
  - docs/gov-site-analysis/README.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-confirm2s-20260527.png
  - .opencode/commands/spectra-apply.md
  - src/lib/disclosure-schema-land.ts
  - artifacts/smoke/local-web-workbench-source-values-clean-20260526.png
  - .opencode/commands/spectra-drift.md
  - src/lib/page-contracts/house-field-survey.ts
  - artifacts/smoke/local-web-multiple-candidate-selection-20260526.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810407653.txt
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-source-roc-check-20260527.png
  - src-tauri/src/land_registry/apis/address_to_parcel.rs
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-focused-20260527.png
  - artifacts/smoke/local-web-pdf-preview-r02-fields-20260526.png
  - src/lib/registry-discovery-contract.ts
  - artifacts/smoke/macos/aire-app-run-20260527.log
  - src/lib/registry-provenance.ts
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779809808933.txt
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810363434.txt
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query2-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-open-review-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-import-modal-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810199037.pdf
  - artifacts/smoke/local-web-new-case-object-query-after-lookup-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-kill-reopen-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810407653.json
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810363434.pdf
  - artifacts/smoke/logo-debug-page-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-before-auth-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-single-instance-20260527.png
  - .opencode/commands/spectra-archive.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-front-20260527.png
  - artifacts/smoke/windows-runtime-blocker-20260527.json
  - AGENTS.md
  - .opencode/commands/spectra-discuss.md
  - src/lib/mock-backend.ts
  - artifacts/smoke/local-web-logo-upload-regression-20260526.mjs
  - src/lib/product-navigation-ia.ts
  - artifacts/smoke/local-web-donghe-clean-source-20260526.txt
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-tauri-dev-launch-20260527.png
  - docs/release/desktop-fullflow-acceptance-report.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-pid-front-20260527.png
  - .opencode/skills/spectra-apply/SKILL.md
  - artifacts/smoke/local-web-yunong-pdf-export-regression-20260526.mjs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-import-result-reactivated-20260527.png
  - docs/gov-site-analysis/09-plvr-opendata.md
  - src/app/api/local/address-discovery/route.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-formal-click-20260527.png
  - GEMINI.md
  - artifacts/smoke/macos/aire-trace-20260527.log
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-confirm-monitor-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-preview-after-formal-20260526.png
  - .opencode/skills/spectra-ask/SKILL.md
  - docs/gov-site-analysis/01-plvr-main.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-restart-front-20260527.png
  - artifacts/smoke/logo-debug-after-upload-20260526.png
  - artifacts/smoke/local-web-yunong-supplement-selects-20260526.png
  - artifacts/smoke/local-web-yunong-formal-import-regression-20260526.mjs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-binaryrun-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810199037.txt
  - docs/gov-site-analysis/11-nlsc-s09-soa.md
  - src/app/(dashboard)/layout.tsx
  - e2e/results/playwright-report/index.html
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-reload-20260527.png
  - artifacts/smoke/desktop-local-address-to-cop-e2e-imported-fields.pdf
  - .opencode/commands/spectra-propose.md
  - .opencode/skills/spectra-commit/SKILL.md
  - src/components/disclosure-form-land.tsx
  - artifacts/smoke/local-web-yunong-formal-import-source-before-20260526.png
  - src/components/PullParcelDataButton.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-manual-building-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-tauri-dev-formal-click-20260527.png
  - docs/address-land-discovery-decision-flow.html
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-post-confirm-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-reopen-after-import-20260527.png
  - .opencode/skills/spectra-drift/SKILL.md
  - src-tauri/src/secrets.rs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-import-result-20260527.png
tests:
  - src-tauri/tests/donghe_moi_api_015_live.rs
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/__tests__/tax-calculator.test.ts
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/app/api/local/address-discovery/__tests__/route.test.ts
  - src/app/(dashboard)/settings/__tests__/settings-page.test.tsx
  - src/lib/__tests__/land-registry-api.test.ts
  - src/lib/pdf-engine/__tests__/document-land-government-format.test.tsx
  - src/app/(dashboard)/__tests__/layout.test.tsx
  - src/lib/server/__tests__/local-address-discovery-proxy.test.ts
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - e2e/candidate-parcel-options-presurvey.spec.ts
  - src/lib/__tests__/mock-backend.test.ts
  - src/components/__tests__/AppSidebar.test.tsx
  - e2e/product-auth-functional-flow.spec.ts
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - src/components/__tests__/KeyinSplitPage.survey-fields.test.tsx
  - e2e/product-ui-demo-alignment.spec.ts
  - e2e/complete-presurvey-property-sheet-flow.spec.ts
  - src/lib/__tests__/formal-cop-api-set.test.ts
  - src/lib/__tests__/registry-discovery-contract.test.ts
  - src/lib/__tests__/product-navigation-ia.test.ts
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - src-tauri/tests/donghe_discovery_live.rs
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - src/lib/__tests__/product-ui-demo-alignment.test.ts
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - e2e/desktop-local-address-to-cop-e2e.spec.ts
  - e2e/full-product-flow-ia-ux-acceptance.spec.ts
  - e2e/local-web-registry-pending-billing.spec.ts
-->

---
### Requirement: Property type SHALL expose customer-facing categories

Case creation and case editing SHALL expose customer-facing property type options, not only internal `residential` and `land` categories. The available options SHALL include highrise building, apartment, townhouse, existing house, farmhouse, land, farmland, storefront, factory, and other.

#### Scenario: User opens the property type dropdown

- **WHEN** the user opens the property type dropdown on case creation or case editing
- **THEN** the UI SHALL show customer-readable options for highrise building, apartment, townhouse, existing house, farmhouse, land, farmland, storefront, factory, and other
- **AND** existing records stored as `residential` or `land` SHALL still load through a backward-compatible mapping.


<!-- @trace
source: desktop-local-address-to-cop-e2e
updated: 2026-05-27
code:
  - .opencode/skills/spectra-propose/SKILL.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-relaunch2-20260527.png
  - src/lib/pdf-engine/document.tsx
  - e2e/results/results.json
  - docs/gov-site-analysis/10-r01-opendata.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-confirm6s-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-fix-2s-20260527.png
  - .opencode/skills/spectra-discuss/SKILL.md
  - docs/gov-site-analysis/05-nlsc-t09-mobile.md
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810363434.json
  - src-tauri/src/lib.rs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase-20260527.png
  - .opencode/skills/spectra-ingest/SKILL.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-billing-modal-20260527.png
  - src/components/case-wizard/CaseWizardStep2.tsx
  - .opencode/skills/spectra-archive/SKILL.md
  - src/components/LogoUploader.tsx
  - artifacts/smoke/local-web-yunong-formal-import-source-after-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-open-case-20260527.png
  - docs/gov-site-analysis/06-easymap-z10.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-formal-tab-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-signed-launch-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-tauri-dev-front-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-tauri-dev-open-case-20260527.png
  - docs/gov-site-analysis/02-luz-landuse.md
  - .opencode/skills/spectra-debug/SKILL.md
  - docs/release/desktop-fullflow-acceptance-checklist.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-resume-front-20260527.png
  - artifacts/smoke/macos/aire-0.1.3-local-launch-20260525-211448.png
  - artifacts/smoke/local-web-logo-upload-persisted-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-precharge2-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779809808933.json
  - src/app/(dashboard)/cases/[id]/keyin/page.tsx
  - src/lib/tax-calculator.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-launch-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-macos-memory-keyring-parity-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase-rebuild-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-memory-keyring-app-front-20260527.png
  - src-tauri/src/commands/cases.rs
  - .opencode/skills/spectra-audit/SKILL.md
  - docs/gov-site-analysis/04-easymap-r02.md
  - src/lib/registry-preview.ts
  - artifacts/smoke/local-web-yunong-formal-import-case-20260526.json
  - artifacts/smoke/local-web-easymap-r02-autofill-20260526.png
  - artifacts/smoke/local-web-donghe-clean-source-20260526.pdf
  - .cursorrules
  - src/lib/formal-cop-api-set.ts
  - docs/gov-site-analysis/03-nsp-ngis.md
  - artifacts/smoke/desktop-local-address-to-cop-e2e-live-discovery-matrix.json
  - .opencode/commands/spectra-commit.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-filled2-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-tauri-dev-front-20260527.png
  - src-tauri/src/land_registry/easymap_r02.rs
  - docs/gov-site-analysis/07-easymap-w10.md
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779809808933.pdf
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810199037.json
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-filled-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-import-result2-20260527.png
  - src-tauri/src/land_registry/mod.rs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-active-after-rebuild-20260527.png
  - .opencode/commands/spectra-audit.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-memory-keyring-launch-20260527.png
  - package.json
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase3-20260527.png
  - artifacts/smoke/donghe-smoke-20260526.mjs
  - src/lib/product-ui-demo-alignment.ts
  - docs/sr-archive/absorbed-2026-05-26.tar.gz
  - artifacts/smoke/local-web-new-case-object-query-copy-20260526.png
  - src/components/disclosure-form-residential.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-directrun-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810407653.pdf
  - .opencode/commands/spectra-ask.md
  - .opencode/commands/spectra-ingest.md
  - .spectra.yaml
  - artifacts/smoke/local-web-donghe-formal-button-images-20260526.pdf
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-fix-6s-20260527.png
  - src/lib/land-registry-api.ts
  - docs/handoff/desktop-local-address-to-cop-e2e-handoff.md
  - .opencode/commands/spectra-debug.md
  - artifacts/smoke/local-registry-auth-debug-20260525.png
  - artifacts/smoke/logo-upload-smoke-20260526.svg
  - docs/gov-site-analysis/12-cop-platform-api.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase2-20260527.png
  - src/components/SettingsTabs.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-precharge-20260527.png
  - src/app/(dashboard)/cases/new/page.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-relaunch-20260527.png
  - docs/gov-site-analysis/08-easymap-index.md
  - docs/desktop-r02-cop-flow-map.html
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-created-20260527.png
  - src-tauri/src/db/registry_query_runs.rs
  - src/lib/cases-api.ts
  - src/app/(dashboard)/settings/page.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query3-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-directrun2-20260527.png
  - artifacts/smoke/local-web-workbench-r02-source-smoke-20260526.png
  - src/lib/server/local-address-discovery-proxy.ts
  - artifacts/smoke/macos/aire-binary-run-20260527.log
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-disappear-activate-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query4-20260527.png
  - scripts/smoke-pdf-imported-fields.mjs
  - src-tauri/src/land_registry/pull.rs
  - artifacts/smoke/local-web-donghe-formal-button-source-20260526.png
  - src-tauri/src/land_registry/discovery_contract.rs
  - docs/gov-site-analysis/README.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-confirm2s-20260527.png
  - .opencode/commands/spectra-apply.md
  - src/lib/disclosure-schema-land.ts
  - artifacts/smoke/local-web-workbench-source-values-clean-20260526.png
  - .opencode/commands/spectra-drift.md
  - src/lib/page-contracts/house-field-survey.ts
  - artifacts/smoke/local-web-multiple-candidate-selection-20260526.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810407653.txt
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-source-roc-check-20260527.png
  - src-tauri/src/land_registry/apis/address_to_parcel.rs
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-focused-20260527.png
  - artifacts/smoke/local-web-pdf-preview-r02-fields-20260526.png
  - src/lib/registry-discovery-contract.ts
  - artifacts/smoke/macos/aire-app-run-20260527.log
  - src/lib/registry-provenance.ts
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779809808933.txt
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810363434.txt
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query2-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-open-review-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-import-modal-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810199037.pdf
  - artifacts/smoke/local-web-new-case-object-query-after-lookup-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-kill-reopen-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810407653.json
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810363434.pdf
  - artifacts/smoke/logo-debug-page-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-before-auth-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-single-instance-20260527.png
  - .opencode/commands/spectra-archive.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-front-20260527.png
  - artifacts/smoke/windows-runtime-blocker-20260527.json
  - AGENTS.md
  - .opencode/commands/spectra-discuss.md
  - src/lib/mock-backend.ts
  - artifacts/smoke/local-web-logo-upload-regression-20260526.mjs
  - src/lib/product-navigation-ia.ts
  - artifacts/smoke/local-web-donghe-clean-source-20260526.txt
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-tauri-dev-launch-20260527.png
  - docs/release/desktop-fullflow-acceptance-report.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-pid-front-20260527.png
  - .opencode/skills/spectra-apply/SKILL.md
  - artifacts/smoke/local-web-yunong-pdf-export-regression-20260526.mjs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-import-result-reactivated-20260527.png
  - docs/gov-site-analysis/09-plvr-opendata.md
  - src/app/api/local/address-discovery/route.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-formal-click-20260527.png
  - GEMINI.md
  - artifacts/smoke/macos/aire-trace-20260527.log
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-confirm-monitor-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-preview-after-formal-20260526.png
  - .opencode/skills/spectra-ask/SKILL.md
  - docs/gov-site-analysis/01-plvr-main.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-restart-front-20260527.png
  - artifacts/smoke/logo-debug-after-upload-20260526.png
  - artifacts/smoke/local-web-yunong-supplement-selects-20260526.png
  - artifacts/smoke/local-web-yunong-formal-import-regression-20260526.mjs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-binaryrun-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810199037.txt
  - docs/gov-site-analysis/11-nlsc-s09-soa.md
  - src/app/(dashboard)/layout.tsx
  - e2e/results/playwright-report/index.html
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-reload-20260527.png
  - artifacts/smoke/desktop-local-address-to-cop-e2e-imported-fields.pdf
  - .opencode/commands/spectra-propose.md
  - .opencode/skills/spectra-commit/SKILL.md
  - src/components/disclosure-form-land.tsx
  - artifacts/smoke/local-web-yunong-formal-import-source-before-20260526.png
  - src/components/PullParcelDataButton.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-manual-building-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-tauri-dev-formal-click-20260527.png
  - docs/address-land-discovery-decision-flow.html
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-post-confirm-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-reopen-after-import-20260527.png
  - .opencode/skills/spectra-drift/SKILL.md
  - src-tauri/src/secrets.rs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-import-result-20260527.png
tests:
  - src-tauri/tests/donghe_moi_api_015_live.rs
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/__tests__/tax-calculator.test.ts
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/app/api/local/address-discovery/__tests__/route.test.ts
  - src/app/(dashboard)/settings/__tests__/settings-page.test.tsx
  - src/lib/__tests__/land-registry-api.test.ts
  - src/lib/pdf-engine/__tests__/document-land-government-format.test.tsx
  - src/app/(dashboard)/__tests__/layout.test.tsx
  - src/lib/server/__tests__/local-address-discovery-proxy.test.ts
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - e2e/candidate-parcel-options-presurvey.spec.ts
  - src/lib/__tests__/mock-backend.test.ts
  - src/components/__tests__/AppSidebar.test.tsx
  - e2e/product-auth-functional-flow.spec.ts
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - src/components/__tests__/KeyinSplitPage.survey-fields.test.tsx
  - e2e/product-ui-demo-alignment.spec.ts
  - e2e/complete-presurvey-property-sheet-flow.spec.ts
  - src/lib/__tests__/formal-cop-api-set.test.ts
  - src/lib/__tests__/registry-discovery-contract.test.ts
  - src/lib/__tests__/product-navigation-ia.test.ts
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - src-tauri/tests/donghe_discovery_live.rs
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - src/lib/__tests__/product-ui-demo-alignment.test.ts
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - e2e/desktop-local-address-to-cop-e2e.spec.ts
  - e2e/full-product-flow-ia-ux-acceptance.spec.ts
  - e2e/local-web-registry-pending-billing.spec.ts
-->

---
### Requirement: Survey fields SHALL differ for building and land cases

The object survey form SHALL show fields appropriate to the selected registry object type. Building cases SHALL collect building-specific facts. Land cases SHALL collect land-specific facts. Shared supplement assets SHALL still be owned by the current case object.

#### Scenario: Building survey is shown

- **GIVEN** the case is classified as a building object
- **WHEN** the user opens the object survey
- **THEN** the form SHALL include building-oriented fields such as floor, total floors, layout, condition, main use, management state, floor plan, and interior photos.

#### Scenario: Land survey is shown

- **GIVEN** the case is classified as a land object
- **WHEN** the user opens the object survey
- **THEN** the form SHALL include land-oriented fields such as zoning or use category, current use, road access, frontage, depth, cadastral map, aerial map, and landmark map.

<!-- @trace
source: desktop-local-address-to-cop-e2e
updated: 2026-05-27
code:
  - .opencode/skills/spectra-propose/SKILL.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-relaunch2-20260527.png
  - src/lib/pdf-engine/document.tsx
  - e2e/results/results.json
  - docs/gov-site-analysis/10-r01-opendata.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-confirm6s-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-fix-2s-20260527.png
  - .opencode/skills/spectra-discuss/SKILL.md
  - docs/gov-site-analysis/05-nlsc-t09-mobile.md
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810363434.json
  - src-tauri/src/lib.rs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase-20260527.png
  - .opencode/skills/spectra-ingest/SKILL.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-billing-modal-20260527.png
  - src/components/case-wizard/CaseWizardStep2.tsx
  - .opencode/skills/spectra-archive/SKILL.md
  - src/components/LogoUploader.tsx
  - artifacts/smoke/local-web-yunong-formal-import-source-after-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-open-case-20260527.png
  - docs/gov-site-analysis/06-easymap-z10.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-formal-tab-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-signed-launch-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-tauri-dev-front-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-tauri-dev-open-case-20260527.png
  - docs/gov-site-analysis/02-luz-landuse.md
  - .opencode/skills/spectra-debug/SKILL.md
  - docs/release/desktop-fullflow-acceptance-checklist.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-resume-front-20260527.png
  - artifacts/smoke/macos/aire-0.1.3-local-launch-20260525-211448.png
  - artifacts/smoke/local-web-logo-upload-persisted-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-precharge2-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779809808933.json
  - src/app/(dashboard)/cases/[id]/keyin/page.tsx
  - src/lib/tax-calculator.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-launch-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-macos-memory-keyring-parity-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase-rebuild-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-memory-keyring-app-front-20260527.png
  - src-tauri/src/commands/cases.rs
  - .opencode/skills/spectra-audit/SKILL.md
  - docs/gov-site-analysis/04-easymap-r02.md
  - src/lib/registry-preview.ts
  - artifacts/smoke/local-web-yunong-formal-import-case-20260526.json
  - artifacts/smoke/local-web-easymap-r02-autofill-20260526.png
  - artifacts/smoke/local-web-donghe-clean-source-20260526.pdf
  - .cursorrules
  - src/lib/formal-cop-api-set.ts
  - docs/gov-site-analysis/03-nsp-ngis.md
  - artifacts/smoke/desktop-local-address-to-cop-e2e-live-discovery-matrix.json
  - .opencode/commands/spectra-commit.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-filled2-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-tauri-dev-front-20260527.png
  - src-tauri/src/land_registry/easymap_r02.rs
  - docs/gov-site-analysis/07-easymap-w10.md
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779809808933.pdf
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810199037.json
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-filled-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-import-result2-20260527.png
  - src-tauri/src/land_registry/mod.rs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-active-after-rebuild-20260527.png
  - .opencode/commands/spectra-audit.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-memory-keyring-launch-20260527.png
  - package.json
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase3-20260527.png
  - artifacts/smoke/donghe-smoke-20260526.mjs
  - src/lib/product-ui-demo-alignment.ts
  - docs/sr-archive/absorbed-2026-05-26.tar.gz
  - artifacts/smoke/local-web-new-case-object-query-copy-20260526.png
  - src/components/disclosure-form-residential.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-directrun-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810407653.pdf
  - .opencode/commands/spectra-ask.md
  - .opencode/commands/spectra-ingest.md
  - .spectra.yaml
  - artifacts/smoke/local-web-donghe-formal-button-images-20260526.pdf
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-fix-6s-20260527.png
  - src/lib/land-registry-api.ts
  - docs/handoff/desktop-local-address-to-cop-e2e-handoff.md
  - .opencode/commands/spectra-debug.md
  - artifacts/smoke/local-registry-auth-debug-20260525.png
  - artifacts/smoke/logo-upload-smoke-20260526.svg
  - docs/gov-site-analysis/12-cop-platform-api.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase2-20260527.png
  - src/components/SettingsTabs.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-precharge-20260527.png
  - src/app/(dashboard)/cases/new/page.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-relaunch-20260527.png
  - docs/gov-site-analysis/08-easymap-index.md
  - docs/desktop-r02-cop-flow-map.html
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-created-20260527.png
  - src-tauri/src/db/registry_query_runs.rs
  - src/lib/cases-api.ts
  - src/app/(dashboard)/settings/page.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query3-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-directrun2-20260527.png
  - artifacts/smoke/local-web-workbench-r02-source-smoke-20260526.png
  - src/lib/server/local-address-discovery-proxy.ts
  - artifacts/smoke/macos/aire-binary-run-20260527.log
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-disappear-activate-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query4-20260527.png
  - scripts/smoke-pdf-imported-fields.mjs
  - src-tauri/src/land_registry/pull.rs
  - artifacts/smoke/local-web-donghe-formal-button-source-20260526.png
  - src-tauri/src/land_registry/discovery_contract.rs
  - docs/gov-site-analysis/README.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-confirm2s-20260527.png
  - .opencode/commands/spectra-apply.md
  - src/lib/disclosure-schema-land.ts
  - artifacts/smoke/local-web-workbench-source-values-clean-20260526.png
  - .opencode/commands/spectra-drift.md
  - src/lib/page-contracts/house-field-survey.ts
  - artifacts/smoke/local-web-multiple-candidate-selection-20260526.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810407653.txt
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-source-roc-check-20260527.png
  - src-tauri/src/land_registry/apis/address_to_parcel.rs
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-focused-20260527.png
  - artifacts/smoke/local-web-pdf-preview-r02-fields-20260526.png
  - src/lib/registry-discovery-contract.ts
  - artifacts/smoke/macos/aire-app-run-20260527.log
  - src/lib/registry-provenance.ts
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779809808933.txt
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810363434.txt
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query2-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-open-review-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-import-modal-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810199037.pdf
  - artifacts/smoke/local-web-new-case-object-query-after-lookup-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-kill-reopen-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810407653.json
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810363434.pdf
  - artifacts/smoke/logo-debug-page-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-before-auth-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-single-instance-20260527.png
  - .opencode/commands/spectra-archive.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-front-20260527.png
  - artifacts/smoke/windows-runtime-blocker-20260527.json
  - AGENTS.md
  - .opencode/commands/spectra-discuss.md
  - src/lib/mock-backend.ts
  - artifacts/smoke/local-web-logo-upload-regression-20260526.mjs
  - src/lib/product-navigation-ia.ts
  - artifacts/smoke/local-web-donghe-clean-source-20260526.txt
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-tauri-dev-launch-20260527.png
  - docs/release/desktop-fullflow-acceptance-report.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-pid-front-20260527.png
  - .opencode/skills/spectra-apply/SKILL.md
  - artifacts/smoke/local-web-yunong-pdf-export-regression-20260526.mjs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-import-result-reactivated-20260527.png
  - docs/gov-site-analysis/09-plvr-opendata.md
  - src/app/api/local/address-discovery/route.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-formal-click-20260527.png
  - GEMINI.md
  - artifacts/smoke/macos/aire-trace-20260527.log
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-confirm-monitor-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-preview-after-formal-20260526.png
  - .opencode/skills/spectra-ask/SKILL.md
  - docs/gov-site-analysis/01-plvr-main.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-restart-front-20260527.png
  - artifacts/smoke/logo-debug-after-upload-20260526.png
  - artifacts/smoke/local-web-yunong-supplement-selects-20260526.png
  - artifacts/smoke/local-web-yunong-formal-import-regression-20260526.mjs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-binaryrun-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810199037.txt
  - docs/gov-site-analysis/11-nlsc-s09-soa.md
  - src/app/(dashboard)/layout.tsx
  - e2e/results/playwright-report/index.html
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-reload-20260527.png
  - artifacts/smoke/desktop-local-address-to-cop-e2e-imported-fields.pdf
  - .opencode/commands/spectra-propose.md
  - .opencode/skills/spectra-commit/SKILL.md
  - src/components/disclosure-form-land.tsx
  - artifacts/smoke/local-web-yunong-formal-import-source-before-20260526.png
  - src/components/PullParcelDataButton.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-manual-building-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-tauri-dev-formal-click-20260527.png
  - docs/address-land-discovery-decision-flow.html
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-post-confirm-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-reopen-after-import-20260527.png
  - .opencode/skills/spectra-drift/SKILL.md
  - src-tauri/src/secrets.rs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-import-result-20260527.png
tests:
  - src-tauri/tests/donghe_moi_api_015_live.rs
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/__tests__/tax-calculator.test.ts
  - src/components/__tests__/SettingsTabs.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/app/api/local/address-discovery/__tests__/route.test.ts
  - src/app/(dashboard)/settings/__tests__/settings-page.test.tsx
  - src/lib/__tests__/land-registry-api.test.ts
  - src/lib/pdf-engine/__tests__/document-land-government-format.test.tsx
  - src/app/(dashboard)/__tests__/layout.test.tsx
  - src/lib/server/__tests__/local-address-discovery-proxy.test.ts
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - e2e/candidate-parcel-options-presurvey.spec.ts
  - src/lib/__tests__/mock-backend.test.ts
  - src/components/__tests__/AppSidebar.test.tsx
  - e2e/product-auth-functional-flow.spec.ts
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - src/components/__tests__/KeyinSplitPage.survey-fields.test.tsx
  - e2e/product-ui-demo-alignment.spec.ts
  - e2e/complete-presurvey-property-sheet-flow.spec.ts
  - src/lib/__tests__/formal-cop-api-set.test.ts
  - src/lib/__tests__/registry-discovery-contract.test.ts
  - src/lib/__tests__/product-navigation-ia.test.ts
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - src-tauri/tests/donghe_discovery_live.rs
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - src/lib/__tests__/product-ui-demo-alignment.test.ts
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - e2e/desktop-local-address-to-cop-e2e.spec.ts
  - e2e/full-product-flow-ia-ux-acceptance.spec.ts
  - e2e/local-web-registry-pending-billing.spec.ts
-->

---
### Requirement: Case workbench SHALL prevent formal import data mismatch

The case workbench SHALL prevent a case address and confirmed registry target from being overwritten or visually contradicted by unrelated demo formal import data. Formal registry data shown in the workbench SHALL match the active case provenance or be blocked.

#### Scenario: Hsinchu case does not show Taipei demo data

- **WHEN** a case address is `新竹市北區四維路130號4樓之3`
- **AND** browser development formal import has no real formal source
- **THEN** the workbench SHALL NOT show `台北市大安區和平東路`
- **THEN** the workbench SHALL NOT show `建號 778-2`
- **THEN** the workbench SHALL NOT show `北松字第012345號`


<!-- @trace
source: desktop-app-release-parity-debug-and-package
updated: 2026-05-29
code:
  - e2e/results/playwright-report/trace/snapshot.v8KI4P3m.js
  - src/lib/page-contracts/house-field-survey.ts
  - src/lib/pdf-blocks/property-data-sheet.tsx
  - artifacts/smoke/macos/aire-binary-run-20260527.log
  - docs/gov-site-analysis/12-cop-platform-api.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-post-confirm-20260527.png
  - src/app/api/local/pdf/route.ts
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810363434.txt
  - src/lib/local-api/session-token.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-launch-20260527.png
  - src-tauri/src/land_registry/pull.rs
  - e2e/results/playwright-report/trace/codicon.DCmgc-ay.ttf
  - .opencode/skills/spectra-ingest/SKILL.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-formal-click-20260527.png
  - artifacts/smoke/logo-debug-page-20260526.png
  - docs/workbench-redesign-prototype/04-summary.html
  - package.json
  - src/app/api/local/cases/[id]/route.ts
  - src/lib/mock-backend.ts
  - e2e/results/playwright-report/trace/index.BCnMPevh.js
  - artifacts/smoke/local-web-easymap-r02-autofill-20260526.png
  - src-tauri/src/secrets.rs
  - artifacts/smoke/windows/github-runtime-smoke-26511089066/aire-windows-runtime-smoke.png
  - artifacts/smoke/local-web-workbench-source-values-clean-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-tauri-dev-launch-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779809808933.txt
  - src/lib/local-api/pdf-write-service.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-import-result-20260527.png
  - artifacts/smoke/windows/github-runtime-smoke-26511089066/report.json
  - artifacts/smoke/local-web-donghe-address-lookup-20260528.png
  - artifacts/smoke/macos/aire-0.1.3-local-launch-20260525-211448.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-kill-reopen-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-memory-keyring-launch-20260527.png
  - .opencode/skills/spectra-discuss/SKILL.md
  - artifacts/smoke/desktop-local-address-to-cop-e2e-imported-fields.pdf
  - src/components/settings/LandApiSection.tsx
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810199037.txt
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-source-roc-check-20260527.png
  - artifacts/smoke/windows/utm-windows11-arm64-desktop-20260527.png
  - installer/PROVENANCE.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-relaunch-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-precharge-20260527.png
  - artifacts/smoke/windows/installer/AIRE_0.1.3_x64-setup.exe
  - e2e/results/playwright-report/trace/uiMode.html
  - artifacts/smoke/local-web-donghe-formal-button-source-20260526.png
  - .opencode/commands/spectra-archive.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-binaryrun-20260527.png
  - artifacts/smoke/logo-debug-after-upload-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-tauri-dev-front-20260527.png
  - artifacts/smoke/local-web-pdf-preview-r02-fields-20260526.png
  - .cursorrules
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-confirm-monitor-20260527.png
  - docs/gov-site-analysis/04-easymap-r02.md
  - artifacts/smoke/macos/aire-app-run-20260527.log
  - artifacts/smoke/windows/utmctl-aire-probe.ps1
  - src/app/api/local/cases/route.ts
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810407653.txt
  - cloudflare-worker/tsconfig.json
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-precharge2-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-before-auth-20260527.png
  - src/components/disclosure-form-land.tsx
  - .opencode/commands/spectra-propose.md
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - src/lib/registry-provenance.ts
  - artifacts/smoke/local-web-yunong-formal-import-source-before-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase-20260527.png
  - artifacts/smoke/local-web-new-case-object-query-copy-20260526.png
  - .github/workflows/ci.yml
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-pid-front-20260527.png
  - docs/gov-site-analysis/07-easymap-w10.md
  - docs/workbench-redesign-prototype/index.html
  - src/app/layout.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query-20260527.png
  - installer/aire-installer.nsi
  - src/lib/local-api/cases-store.ts
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810407653.pdf
  - GEMINI.md
  - src/app/api/health/route.ts
  - .opencode/skills/spectra-ask/SKILL.md
  - artifacts/smoke/windows/aire-windows-installed-launch-login-20260527.png
  - docs/address-land-discovery-decision-flow.html
  - src/app/login/page.tsx
  - .opencode/commands/spectra-debug.md
  - .opencode/skills/spectra-apply/SKILL.md
  - docs/sr-archive/absorbed-2026-05-26.tar.gz
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query4-20260527.png
  - artifacts/smoke/macos/aire-trace-20260527.log
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-filled2-20260527.png
  - e2e/results/playwright-report/trace/codeMirrorModule.DYBRYzYX.css
  - e2e/results/playwright-report/trace/sw.bundle.js
  - src/app/api/config/route.ts
  - src/lib/server/local-address-discovery-proxy.ts
  - .opencode/commands/spectra-discuss.md
  - src-tauri/src/land_registry/mod.rs
  - artifacts/smoke/windows/aire-windows-installed-launch-login-20260527.json
  - src/lib/tax-calculator.ts
  - e2e/results/playwright-report/trace/manifest.webmanifest
  - src/lib/local-api/cop-credential-store.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-confirm2s-20260527.png
  - artifacts/smoke/windows/utm-windows11-arm64-desktop-20260527.json
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-tauri-dev-open-case-20260527.png
  - .spectra.yaml
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-restart-front-20260527.png
  - src/components/PullParcelDataButton.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-fix-2s-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-relaunch2-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-active-after-rebuild-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-created-20260527.png
  - artifacts/smoke/local-web-yunong-supplement-selects-20260526.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810407653.json
  - e2e/results/playwright-report/trace/assets/defaultSettingsView-D31xz8zv.js
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-focused-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-billing-modal-20260527.png
  - src/app/(dashboard)/layout.tsx
  - artifacts/smoke/windows-runtime-blocker-20260527.json
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/server/local-formal-pull-proxy.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-directrun-20260527.png
  - docs/gov-site-analysis/03-nsp-ngis.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase2-20260527.png
  - .opencode/commands/spectra-audit.md
  - e2e/results/playwright-report/trace/playwright-logo.svg
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-tauri-dev-formal-click-20260527.png
  - artifacts/smoke/local-web-new-case-object-query-after-lookup-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase3-20260527.png
  - scripts/smoke-pdf-imported-fields.mjs
  - next.config.ts
  - src/app/api/local/real-price/route.ts
  - docs/desktop-r02-cop-flow-map.html
  - .opencode/commands/spectra-ask.md
  - docs/debug-easymap-getdoorlist.md
  - artifacts/smoke/macos/aire-tauri-dev-launch-20260528.png
  - e2e/results/playwright-report/trace/xtermModule.DYP7pi_n.css
  - installer/README.md
  - src/lib/disclosure-schema-land.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-directrun2-20260527.png
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - artifacts/smoke/local-web-logo-upload-regression-20260526.mjs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query3-20260527.png
  - docs/workbench-redesign-prototype/05-pdf-check.html
  - src/app/api/local/cop-credential/route.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-filled-20260527.png
  - src/lib/tauri-bridge.ts
  - scripts/launch-aire.mjs
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810199037.json
  - .opencode/commands/spectra-commit.md
  - artifacts/smoke/local-web-yunong-pdf-export-regression-20260526.mjs
  - src/components/PreChargeConfirmDialog.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-import-result2-20260527.png
  - src/lib/local-api/client.ts
  - src/lib/local-api/data-dir.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-formal-tab-20260527.png
  - src-tauri/src/land_registry/apis/address_to_parcel.rs
  - src/lib/pdf-engine/document.tsx
  - AGENTS.md
  - artifacts/smoke/local-web-yunong-formal-import-source-after-20260526.png
  - scripts/build-local-runtime.mjs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-memory-keyring-app-front-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase-rebuild-20260527.png
  - src/app/api/local/formal-pull-data/route.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-macos-memory-keyring-parity-20260527.png
  - artifacts/smoke/windows/guest-aire-probe.ps1
  - .opencode/commands/spectra-ingest.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-tauri-dev-front-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-confirm6s-20260527.png
  - installer/launch-aire-win.vbs
  - .opencode/skills/spectra-propose/SKILL.md
  - src/middleware.ts
  - e2e/results/playwright-report/trace/index.html
  - docs/workbench-redesign-prototype/06-pricing-modal.html
  - src/lib/local-api/contract.ts
  - docs/workbench-redesign-prototype/02-supplements.html
  - artifacts/smoke/local-web-multiple-candidate-selection-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-import-result-reactivated-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-import-modal-20260527.png
  - docs/gov-site-analysis/README.md
  - artifacts/smoke/local-web-hsinchu-formal-import-blocked-20260528.png
  - artifacts/smoke/local-web-donghe-address-lookup-debug-20260528.png
  - src/lib/export-pdf.ts
  - src/app/api/init/route.ts
  - e2e/results/playwright-report/trace/index.CzXZzn5A.css
  - src-tauri/PARKED.md
  - .opencode/skills/spectra-drift/SKILL.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-signed-launch-20260527.png
  - playwright.config.ts
  - artifacts/smoke/local-web-donghe-formal-button-images-20260526.pdf
  - .opencode/skills/spectra-debug/SKILL.md
  - .github/workflows/windows-runtime-smoke.yml
  - docs/gov-site-analysis/11-nlsc-s09-soa.md
  - src/lib/server/twinkle-real-price.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-reopen-after-import-20260527.png
  - docs/gov-site-analysis/02-luz-landuse.md
  - src-tauri/src/lib.rs
  - tsconfig.json
  - .npmrc
  - docs/gov-site-analysis/05-nlsc-t09-mobile.md
  - artifacts/smoke/donghe-smoke-20260526.mjs
  - docs/gov-site-analysis/09-plvr-opendata.md
  - src/app/(dashboard)/cases/new/page.tsx
  - cloudflare-worker/src/types.ts
  - e2e/results/playwright-report/trace/snapshot.html
  - artifacts/smoke/local-web-yunong-formal-import-regression-20260526.mjs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-open-review-20260527.png
  - artifacts/smoke/local-web-logo-upload-persisted-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query2-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-single-instance-20260527.png
  - .opencode/skills/spectra-archive/SKILL.md
  - docs/gov-site-analysis/06-easymap-z10.md
  - docs/gov-site-analysis/08-easymap-index.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-front-20260527.png
  - src/components/LogoUploader.tsx
  - src/components/disclosure-form-residential.tsx
  - .opencode/commands/spectra-drift.md
  - e2e/results/playwright-report/trace/defaultSettingsView.BDKsFU3c.css
  - artifacts/smoke/windows/windows11-arm64-iso-20260527.json
  - src/app/\(dashboard\)/layout.tsx
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src-tauri/src/db/registry_query_runs.rs
  - src-tauri/src/commands/cases.rs
  - src/hooks/useIpcErrorToast.ts
  - artifacts/smoke/local-web-workbench-r02-source-smoke-20260526.png
  - .opencode/skills/spectra-commit/SKILL.md
  - installer/node-runtime/.gitkeep
  - e2e/results/playwright-report/trace/uiMode.C2Efnu2P.js
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779809808933.pdf
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810363434.json
  - artifacts/smoke/logo-upload-smoke-20260526.svg
  - src/lib/init-config.ts
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810199037.pdf
  - .github/workflows/release.yml
  - artifacts/smoke/local-web-formal-proxy-debug-20260528.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-manual-building-20260527.png
  - artifacts/smoke/windows/aire-utmctl-probe-20260527.json
  - docs/gov-site-analysis/10-r01-opendata.md
  - src/lib/land-registry-api.ts
  - artifacts/smoke/local-web-yunong-formal-import-case-20260526.json
  - src/lib/registry-discovery-contract.ts
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779809808933.json
  - artifacts/smoke/local-registry-auth-debug-20260525.png
  - docs/workbench-redesign-prototype/03-formal-import.html
  - artifacts/smoke/windows/aire-installed-search-20260527.json
  - artifacts/smoke/local-web-yunong-pdf-preview-after-formal-20260526.png
  - artifacts/smoke/windows/utm-prerequisites-20260527.json
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-reload-20260527.png
  - src-tauri/src/land_registry/easymap_r02.rs
  - e2e/results/playwright-report/trace/uiMode.Btcz36p_.css
  - artifacts/smoke/desktop-local-address-to-cop-e2e-live-discovery-matrix.json
  - src-tauri/src/land_registry/discovery_contract.rs
  - artifacts/smoke/local-web-donghe-clean-source-20260526.txt
  - e2e/results/playwright-report/trace/assets/urlMatch-BYQrIQwR.js
  - src/lib/real-price-query.ts
  - .opencode/commands/spectra-apply.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-open-case-20260527.png
  - artifacts/smoke/windows/installer-provenance-20260527.json
  - docs/gov-site-analysis/01-plvr-main.md
  - e2e/results/results.json
  - .opencode/skills/spectra-audit/SKILL.md
  - e2e/results/playwright-report/index.html
  - src/components/RealPricePanel.tsx
  - src/lib/case-routes.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-fix-6s-20260527.png
  - src/lib/auth.ts
  - e2e/results/playwright-report/trace/assets/codeMirrorModule-Ds_H_9Yq.js
  - .aire-session-token
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-resume-front-20260527.png
  - docs/workbench-redesign-prototype/01-field-review.html
  - scripts/launch-aire.cmd
  - src/app/api/local/address-discovery/route.ts
  - artifacts/smoke/local-web-donghe-clean-source-20260526.pdf
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810363434.pdf
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-disappear-activate-20260527.png
tests:
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - src-tauri/tests/donghe_discovery_live.rs
  - src/app/login/__tests__/page.test.tsx
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/lib/local-api/__tests__/cases-persistence.test.ts
  - src/lib/local-api/__tests__/cop-credential.test.ts
  - src/app/api/local/cop-credential/test/route.ts
  - src/lib/__tests__/land-registry-api.test.ts
  - e2e/candidate-parcel-options-presurvey.spec.ts
  - src/lib/server/__tests__/local-address-discovery-proxy.test.ts
  - e2e/product-ui-demo-alignment.spec.ts
  - src/components/__tests__/LogoUploader.test.tsx
  - src/lib/__tests__/registry-provenance.test.ts
  - e2e/local-web-registry-pending-billing.spec.ts
  - src/app/api/health/__tests__/route.test.ts
  - src/lib/__tests__/tax-calculator.test.ts
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/__tests__/product-navigation-ia.test.ts
  - src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx
  - src/lib/server/__tests__/twinkle-real-price.test.ts
  - src/app/(dashboard)/__tests__/layout.test.tsx
  - src/components/settings/__tests__/LandApiSection-toast.test.tsx
  - src/lib/__tests__/real-price-query.test.ts
  - e2e/full-product-flow-ia-ux-acceptance.spec.ts
  - e2e/complete-presurvey-property-sheet-flow.spec.ts
  - src/lib/__tests__/formal-cop-api-set.test.ts
  - src/app/api/local/address-discovery/__tests__/route.test.ts
  - src-tauri/tests/donghe_moi_api_015_live.rs
  - src/components/__tests__/PreChargeConfirmDialog.test.tsx
  - src/lib/__tests__/registry-discovery-contract.test.ts
  - src/lib/local-api/__tests__/middleware-integration.test.ts
  - src/app/(dashboard)/cases/__tests__/page.test.tsx
  - src/app/api/local/real-price/__tests__/route.test.ts
  - src/lib/local-api/__tests__/data-dir.test.ts
  - src/app/(dashboard)/cases/[id]/__tests__/page.test.tsx
  - src/lib/__tests__/auth.test.ts
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - src/lib/local-api/__tests__/pdf-two-phase.test.ts
  - src/lib/local-api/__tests__/session-token-middleware.test.ts
  - e2e/desktop-auth-credential-fulfillment-smoke.spec.ts
  - src/lib/__tests__/tauri-bridge.test.ts
  - src/lib/server/__tests__/local-formal-pull-proxy.test.ts
  - src/components/__tests__/KeyinSplitPage.survey-fields.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - e2e/desktop-local-address-to-cop-e2e.spec.ts
  - e2e/product-auth-functional-flow.spec.ts
  - src/components/__tests__/RealPricePanel.test.tsx
-->

---
### Requirement: Formal import review SHALL use a full-width readable layout

The case workbench SHALL render candidate confirmation, formal import, property summary, and PDF check as readable full-width work surfaces. The layout SHALL keep candidate identifiers, summaries, status, cost, and actions visually aligned for review.

#### Scenario: Candidate confirmation is readable in the main work surface

- **WHEN** the user opens formal import for a case with candidate parcels
- **THEN** the candidate list is rendered in the main content surface with distinct columns for candidate key, summary, status, and action
- **THEN** the candidate list is not constrained to a narrow right-side card

#### Scenario: PDF check remains readable with many fields

- **WHEN** the user opens PDF check with ten or more fields
- **THEN** the PDF check table is rendered in a full-width scroll-safe surface
- **THEN** field labels, values, sources, and statuses remain readable without overlapping

<!-- @trace
source: desktop-app-release-parity-debug-and-package
updated: 2026-05-29
code:
  - e2e/results/playwright-report/trace/snapshot.v8KI4P3m.js
  - src/lib/page-contracts/house-field-survey.ts
  - src/lib/pdf-blocks/property-data-sheet.tsx
  - artifacts/smoke/macos/aire-binary-run-20260527.log
  - docs/gov-site-analysis/12-cop-platform-api.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-post-confirm-20260527.png
  - src/app/api/local/pdf/route.ts
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810363434.txt
  - src/lib/local-api/session-token.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-launch-20260527.png
  - src-tauri/src/land_registry/pull.rs
  - e2e/results/playwright-report/trace/codicon.DCmgc-ay.ttf
  - .opencode/skills/spectra-ingest/SKILL.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-formal-click-20260527.png
  - artifacts/smoke/logo-debug-page-20260526.png
  - docs/workbench-redesign-prototype/04-summary.html
  - package.json
  - src/app/api/local/cases/[id]/route.ts
  - src/lib/mock-backend.ts
  - e2e/results/playwright-report/trace/index.BCnMPevh.js
  - artifacts/smoke/local-web-easymap-r02-autofill-20260526.png
  - src-tauri/src/secrets.rs
  - artifacts/smoke/windows/github-runtime-smoke-26511089066/aire-windows-runtime-smoke.png
  - artifacts/smoke/local-web-workbench-source-values-clean-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-tauri-dev-launch-20260527.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779809808933.txt
  - src/lib/local-api/pdf-write-service.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-import-result-20260527.png
  - artifacts/smoke/windows/github-runtime-smoke-26511089066/report.json
  - artifacts/smoke/local-web-donghe-address-lookup-20260528.png
  - artifacts/smoke/macos/aire-0.1.3-local-launch-20260525-211448.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-kill-reopen-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-memory-keyring-launch-20260527.png
  - .opencode/skills/spectra-discuss/SKILL.md
  - artifacts/smoke/desktop-local-address-to-cop-e2e-imported-fields.pdf
  - src/components/settings/LandApiSection.tsx
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810199037.txt
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-source-roc-check-20260527.png
  - artifacts/smoke/windows/utm-windows11-arm64-desktop-20260527.png
  - installer/PROVENANCE.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-relaunch-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-precharge-20260527.png
  - artifacts/smoke/windows/installer/AIRE_0.1.3_x64-setup.exe
  - e2e/results/playwright-report/trace/uiMode.html
  - artifacts/smoke/local-web-donghe-formal-button-source-20260526.png
  - .opencode/commands/spectra-archive.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-binaryrun-20260527.png
  - artifacts/smoke/logo-debug-after-upload-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-tauri-dev-front-20260527.png
  - artifacts/smoke/local-web-pdf-preview-r02-fields-20260526.png
  - .cursorrules
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-confirm-monitor-20260527.png
  - docs/gov-site-analysis/04-easymap-r02.md
  - artifacts/smoke/macos/aire-app-run-20260527.log
  - artifacts/smoke/windows/utmctl-aire-probe.ps1
  - src/app/api/local/cases/route.ts
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810407653.txt
  - cloudflare-worker/tsconfig.json
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-precharge2-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-before-auth-20260527.png
  - src/components/disclosure-form-land.tsx
  - .opencode/commands/spectra-propose.md
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/components/workbench/DemoAlignedWorkbench.tsx
  - src/lib/registry-provenance.ts
  - artifacts/smoke/local-web-yunong-formal-import-source-before-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase-20260527.png
  - artifacts/smoke/local-web-new-case-object-query-copy-20260526.png
  - .github/workflows/ci.yml
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-pid-front-20260527.png
  - docs/gov-site-analysis/07-easymap-w10.md
  - docs/workbench-redesign-prototype/index.html
  - src/app/layout.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query-20260527.png
  - installer/aire-installer.nsi
  - src/lib/local-api/cases-store.ts
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810407653.pdf
  - GEMINI.md
  - src/app/api/health/route.ts
  - .opencode/skills/spectra-ask/SKILL.md
  - artifacts/smoke/windows/aire-windows-installed-launch-login-20260527.png
  - docs/address-land-discovery-decision-flow.html
  - src/app/login/page.tsx
  - .opencode/commands/spectra-debug.md
  - .opencode/skills/spectra-apply/SKILL.md
  - docs/sr-archive/absorbed-2026-05-26.tar.gz
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query4-20260527.png
  - artifacts/smoke/macos/aire-trace-20260527.log
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-filled2-20260527.png
  - e2e/results/playwright-report/trace/codeMirrorModule.DYBRYzYX.css
  - e2e/results/playwright-report/trace/sw.bundle.js
  - src/app/api/config/route.ts
  - src/lib/server/local-address-discovery-proxy.ts
  - .opencode/commands/spectra-discuss.md
  - src-tauri/src/land_registry/mod.rs
  - artifacts/smoke/windows/aire-windows-installed-launch-login-20260527.json
  - src/lib/tax-calculator.ts
  - e2e/results/playwright-report/trace/manifest.webmanifest
  - src/lib/local-api/cop-credential-store.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-confirm2s-20260527.png
  - artifacts/smoke/windows/utm-windows11-arm64-desktop-20260527.json
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-tauri-dev-open-case-20260527.png
  - .spectra.yaml
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-restart-front-20260527.png
  - src/components/PullParcelDataButton.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-fix-2s-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-relaunch2-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-active-after-rebuild-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-created-20260527.png
  - artifacts/smoke/local-web-yunong-supplement-selects-20260526.png
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810407653.json
  - e2e/results/playwright-report/trace/assets/defaultSettingsView-D31xz8zv.js
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-focused-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-billing-modal-20260527.png
  - src/app/(dashboard)/layout.tsx
  - artifacts/smoke/windows-runtime-blocker-20260527.json
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/server/local-formal-pull-proxy.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-directrun-20260527.png
  - docs/gov-site-analysis/03-nsp-ngis.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase2-20260527.png
  - .opencode/commands/spectra-audit.md
  - e2e/results/playwright-report/trace/playwright-logo.svg
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-tauri-dev-formal-click-20260527.png
  - artifacts/smoke/local-web-new-case-object-query-after-lookup-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase3-20260527.png
  - scripts/smoke-pdf-imported-fields.mjs
  - next.config.ts
  - src/app/api/local/real-price/route.ts
  - docs/desktop-r02-cop-flow-map.html
  - .opencode/commands/spectra-ask.md
  - docs/debug-easymap-getdoorlist.md
  - artifacts/smoke/macos/aire-tauri-dev-launch-20260528.png
  - e2e/results/playwright-report/trace/xtermModule.DYP7pi_n.css
  - installer/README.md
  - src/lib/disclosure-schema-land.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-directrun2-20260527.png
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - artifacts/smoke/local-web-logo-upload-regression-20260526.mjs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query3-20260527.png
  - docs/workbench-redesign-prototype/05-pdf-check.html
  - src/app/api/local/cop-credential/route.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-filled-20260527.png
  - src/lib/tauri-bridge.ts
  - scripts/launch-aire.mjs
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810199037.json
  - .opencode/commands/spectra-commit.md
  - artifacts/smoke/local-web-yunong-pdf-export-regression-20260526.mjs
  - src/components/PreChargeConfirmDialog.tsx
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-import-result2-20260527.png
  - src/lib/local-api/client.ts
  - src/lib/local-api/data-dir.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-formal-tab-20260527.png
  - src-tauri/src/land_registry/apis/address_to_parcel.rs
  - src/lib/pdf-engine/document.tsx
  - AGENTS.md
  - artifacts/smoke/local-web-yunong-formal-import-source-after-20260526.png
  - scripts/build-local-runtime.mjs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-memory-keyring-app-front-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-newcase-rebuild-20260527.png
  - src/app/api/local/formal-pull-data/route.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-macos-memory-keyring-parity-20260527.png
  - artifacts/smoke/windows/guest-aire-probe.ps1
  - .opencode/commands/spectra-ingest.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-tauri-dev-front-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-confirm6s-20260527.png
  - installer/launch-aire-win.vbs
  - .opencode/skills/spectra-propose/SKILL.md
  - src/middleware.ts
  - e2e/results/playwright-report/trace/index.html
  - docs/workbench-redesign-prototype/06-pricing-modal.html
  - src/lib/local-api/contract.ts
  - docs/workbench-redesign-prototype/02-supplements.html
  - artifacts/smoke/local-web-multiple-candidate-selection-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-import-result-reactivated-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-import-modal-20260527.png
  - docs/gov-site-analysis/README.md
  - artifacts/smoke/local-web-hsinchu-formal-import-blocked-20260528.png
  - artifacts/smoke/local-web-donghe-address-lookup-debug-20260528.png
  - src/lib/export-pdf.ts
  - src/app/api/init/route.ts
  - e2e/results/playwright-report/trace/index.CzXZzn5A.css
  - src-tauri/PARKED.md
  - .opencode/skills/spectra-drift/SKILL.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-signed-launch-20260527.png
  - playwright.config.ts
  - artifacts/smoke/local-web-donghe-formal-button-images-20260526.pdf
  - .opencode/skills/spectra-debug/SKILL.md
  - .github/workflows/windows-runtime-smoke.yml
  - docs/gov-site-analysis/11-nlsc-s09-soa.md
  - src/lib/server/twinkle-real-price.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-reopen-after-import-20260527.png
  - docs/gov-site-analysis/02-luz-landuse.md
  - src-tauri/src/lib.rs
  - tsconfig.json
  - .npmrc
  - docs/gov-site-analysis/05-nlsc-t09-mobile.md
  - artifacts/smoke/donghe-smoke-20260526.mjs
  - docs/gov-site-analysis/09-plvr-opendata.md
  - src/app/(dashboard)/cases/new/page.tsx
  - cloudflare-worker/src/types.ts
  - e2e/results/playwright-report/trace/snapshot.html
  - artifacts/smoke/local-web-yunong-formal-import-regression-20260526.mjs
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-open-review-20260527.png
  - artifacts/smoke/local-web-logo-upload-persisted-20260526.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-query2-20260527.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-single-instance-20260527.png
  - .opencode/skills/spectra-archive/SKILL.md
  - docs/gov-site-analysis/06-easymap-z10.md
  - docs/gov-site-analysis/08-easymap-index.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-front-20260527.png
  - src/components/LogoUploader.tsx
  - src/components/disclosure-form-residential.tsx
  - .opencode/commands/spectra-drift.md
  - e2e/results/playwright-report/trace/defaultSettingsView.BDKsFU3c.css
  - artifacts/smoke/windows/windows11-arm64-iso-20260527.json
  - src/app/\(dashboard\)/layout.tsx
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src-tauri/src/db/registry_query_runs.rs
  - src-tauri/src/commands/cases.rs
  - src/hooks/useIpcErrorToast.ts
  - artifacts/smoke/local-web-workbench-r02-source-smoke-20260526.png
  - .opencode/skills/spectra-commit/SKILL.md
  - installer/node-runtime/.gitkeep
  - e2e/results/playwright-report/trace/uiMode.C2Efnu2P.js
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779809808933.pdf
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810363434.json
  - artifacts/smoke/logo-upload-smoke-20260526.svg
  - src/lib/init-config.ts
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810199037.pdf
  - .github/workflows/release.yml
  - artifacts/smoke/local-web-formal-proxy-debug-20260528.png
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-manual-building-20260527.png
  - artifacts/smoke/windows/aire-utmctl-probe-20260527.json
  - docs/gov-site-analysis/10-r01-opendata.md
  - src/lib/land-registry-api.ts
  - artifacts/smoke/local-web-yunong-formal-import-case-20260526.json
  - src/lib/registry-discovery-contract.ts
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779809808933.json
  - artifacts/smoke/local-registry-auth-debug-20260525.png
  - docs/workbench-redesign-prototype/03-formal-import.html
  - artifacts/smoke/windows/aire-installed-search-20260527.json
  - artifacts/smoke/local-web-yunong-pdf-preview-after-formal-20260526.png
  - artifacts/smoke/windows/utm-prerequisites-20260527.json
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-reload-20260527.png
  - src-tauri/src/land_registry/easymap_r02.rs
  - e2e/results/playwright-report/trace/uiMode.Btcz36p_.css
  - artifacts/smoke/desktop-local-address-to-cop-e2e-live-discovery-matrix.json
  - src-tauri/src/land_registry/discovery_contract.rs
  - artifacts/smoke/local-web-donghe-clean-source-20260526.txt
  - e2e/results/playwright-report/trace/assets/urlMatch-BYQrIQwR.js
  - src/lib/real-price-query.ts
  - .opencode/commands/spectra-apply.md
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-postfix-open-case-20260527.png
  - artifacts/smoke/windows/installer-provenance-20260527.json
  - docs/gov-site-analysis/01-plvr-main.md
  - e2e/results/results.json
  - .opencode/skills/spectra-audit/SKILL.md
  - e2e/results/playwright-report/index.html
  - src/components/RealPricePanel.tsx
  - src/lib/case-routes.ts
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-dev-after-fix-6s-20260527.png
  - src/lib/auth.ts
  - e2e/results/playwright-report/trace/assets/codeMirrorModule-Ds_H_9Yq.js
  - .aire-session-token
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-resume-front-20260527.png
  - docs/workbench-redesign-prototype/01-field-review.html
  - scripts/launch-aire.cmd
  - src/app/api/local/address-discovery/route.ts
  - artifacts/smoke/local-web-donghe-clean-source-20260526.pdf
  - artifacts/smoke/local-web-yunong-pdf-export-regression-1779810363434.pdf
  - artifacts/smoke/macos/desktop-local-address-to-cop-e2e-app-after-disappear-activate-20260527.png
tests:
  - src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - src/components/__tests__/PullParcelDataButton.test.tsx
  - src-tauri/tests/donghe_discovery_live.rs
  - src/app/login/__tests__/page.test.tsx
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/lib/local-api/__tests__/cases-persistence.test.ts
  - src/lib/local-api/__tests__/cop-credential.test.ts
  - src/app/api/local/cop-credential/test/route.ts
  - src/lib/__tests__/land-registry-api.test.ts
  - e2e/candidate-parcel-options-presurvey.spec.ts
  - src/lib/server/__tests__/local-address-discovery-proxy.test.ts
  - e2e/product-ui-demo-alignment.spec.ts
  - src/components/__tests__/LogoUploader.test.tsx
  - src/lib/__tests__/registry-provenance.test.ts
  - e2e/local-web-registry-pending-billing.spec.ts
  - src/app/api/health/__tests__/route.test.ts
  - src/lib/__tests__/tax-calculator.test.ts
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/lib/__tests__/product-navigation-ia.test.ts
  - src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx
  - src/lib/server/__tests__/twinkle-real-price.test.ts
  - src/app/(dashboard)/__tests__/layout.test.tsx
  - src/components/settings/__tests__/LandApiSection-toast.test.tsx
  - src/lib/__tests__/real-price-query.test.ts
  - e2e/full-product-flow-ia-ux-acceptance.spec.ts
  - e2e/complete-presurvey-property-sheet-flow.spec.ts
  - src/lib/__tests__/formal-cop-api-set.test.ts
  - src/app/api/local/address-discovery/__tests__/route.test.ts
  - src-tauri/tests/donghe_moi_api_015_live.rs
  - src/components/__tests__/PreChargeConfirmDialog.test.tsx
  - src/lib/__tests__/registry-discovery-contract.test.ts
  - src/lib/local-api/__tests__/middleware-integration.test.ts
  - src/app/(dashboard)/cases/__tests__/page.test.tsx
  - src/app/api/local/real-price/__tests__/route.test.ts
  - src/lib/local-api/__tests__/data-dir.test.ts
  - src/app/(dashboard)/cases/[id]/__tests__/page.test.tsx
  - src/lib/__tests__/auth.test.ts
  - src/components/__tests__/DemoAlignedWorkbench.test.tsx
  - src/lib/local-api/__tests__/pdf-two-phase.test.ts
  - src/lib/local-api/__tests__/session-token-middleware.test.ts
  - e2e/desktop-auth-credential-fulfillment-smoke.spec.ts
  - src/lib/__tests__/tauri-bridge.test.ts
  - src/lib/server/__tests__/local-formal-pull-proxy.test.ts
  - src/components/__tests__/KeyinSplitPage.survey-fields.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - e2e/desktop-local-address-to-cop-e2e.spec.ts
  - e2e/product-auth-functional-flow.spec.ts
  - src/components/__tests__/RealPricePanel.test.tsx
-->