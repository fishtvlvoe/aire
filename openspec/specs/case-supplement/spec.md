# case-supplement Specification

## Purpose

TBD - created by archiving change 'aire-ux-wizard-refactor'. Update Purpose after archive.

## Requirements

### Requirement: Supplement dialog

The system SHALL navigate to `/cases/[id]/keyin` when the user clicks the 補件 action button for a case, replacing the previous dialog. The `CaseSupplementDialog` component SHALL NOT be rendered.

#### Scenario: User clicks 補件 button

- **WHEN** user clicks the 補件 icon button for any case in the case list
- **THEN** the system navigates to `/cases/[id]/keyin` (where `id` is the case's ID) and no modal overlay appears

#### Scenario: No dialog appears

- **WHEN** user clicks the 補件 icon button
- **THEN** the `CaseSupplementDialog` component SHALL NOT be rendered; the browser URL changes to `/cases/<id>/keyin`

#### Scenario: CaseSupplementDialog is deleted

- **WHEN** the developer runs `grep -r "CaseSupplementDialog" src/`
- **THEN** the command returns zero results, confirming the component file is removed


<!-- @trace
source: keyin-page-redesign
updated: 2026-05-20
code:
  - docs/cop-scrape/05-服務說明文件/MOI_API_042土地遭棄置廢棄物資訊註記服務.html
  - src/lib/pdf-blocks/exterior-photo-page.tsx
  - docs/cop-scrape/05-服務說明文件/MOI_API_001地籍土地標示部資料服務.html
  - docs/cop-scrape/03-依類別分類/API/MOI_API_012全國土地基本資料庫代碼資料服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_003地籍土地他項權利部資料服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_018非都市土地使用管制註記查詢服務.html
  - docs/cop-scrape/03-依類別分類/WFS/MOI_WFS_004區段徵收範圍WFS.json
  - docs/cop-scrape/05-服務說明文件/MOI_WFS_002地籍圖WFS_SHP檔_.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_033坡向分析服務.html
  - src/lib/nlsc-aerial-map.ts
  - src-tauri/src/db/mod.rs
  - docs/cop-scrape/05-服務說明文件/MOI_API_020土壤或地下水污染場址註記查詢服務.html
  - docs/cop-scrape/03-依類別分類/API/MOI_API_013地段資料服務.json
  - src/app/(dashboard)/cases/new/page.tsx
  - src/lib/pdf-engine/html-blocks/location-and-exterior.tsx
  - docs/cop-scrape/05-服務說明文件/MOI_API_040分割合併前後地建號資料服務.html
  - docs/cop-scrape/03-依類別分類/API/MOI_API_027建物遭受放射性污染之虞註記查詢服務.json
  - src/components/case-wizard/CaseWizard.tsx
  - docs/cop-scrape/03-依類別分類_篩選/API/API_all.json
  - src-tauri/src/commands/cases.rs
  - docs/cop-scrape/03-依類別分類/API/MOI_API_016土地標示及權利範圍查詢服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_022公告徵收註記查詢服務.html
  - src/lib/storage/MockStorageAdapter.ts
  - src-tauri/migrations/009_floor_plan_sketches.sql
  - docs/cop-scrape/03-依類別分類/WMS/MOI_WMS_010國家公園區內之特別景觀區_生態保護區_史蹟保存區.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_003地籍土地他項權利部資料服務.json
  - src/lib/mock-backend.ts
  - docs/cop-scrape/03-依類別分類_篩選/API/MOI_API_001地籍土地標示部資料服務.json
  - docs/map-api-reference.md
  - docs/cop-scrape/03-依類別分類/API/MOI_API_035縱橫斷面分析服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_WFS_004區段徵收範圍WFS.html
  - src-tauri/src/db/drafts.rs
  - docs/cop-scrape/05-服務說明文件/MOI_API_017土地權利種類及登記事項查詢服務.html
  - docs/cop-scrape/02-服務列表/pricing.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_024地籍圖詮釋資料.json
  - docs/cop-scrape/05-服務說明文件/MOI_WFS_003圖幅接合地籍圖WFS.html
  - src/app/(dashboard)/cases/page.tsx
  - src/lib/pdf-themes/registry.ts
  - docs/cop-scrape/05-服務說明文件/MOI_WMS_013公有土地開放資料WMS服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_WMS_007活動斷層圖.html
  - src/lib/pdf-engine/html-renderer.tsx
  - docs/cop-scrape/03-依類別分類/WMS/MOI_WMS_001地籍圖WMS_SHP檔_.json
  - docs/cop-scrape/05-服務說明文件/MOI_WFS_005公有土地開放資料WFS服務.html
  - docs/cop-scrape/03-依類別分類/API/MOI_API_019興建農舍註記資料服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_WMS_011飲用水水源水質保護區或飲用水取水口一定距離內之地區.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_046三維地籍建號定位點資料服務.html
  - src-tauri/src/commands/floor_plan_approval.rs
  - src/app/(dashboard)/settings/sync-status/page.tsx
  - docs/cop-scrape/05-服務說明文件/MOI_WMS_010國家公園區內之特別景觀區_生態保護區_史蹟保存區.html
  - src/app/(dashboard)/layout.tsx
  - src/lib/pdf-blocks/image-data-url.ts
  - src/components/CaseListActions.tsx
  - docs/cop-scrape/03-依類別分類/API/MOI_API_033坡向分析服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_045三維地籍建物標示部資料服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_023土地位置概圖服務.html
  - docs/cop-scrape/03-依類別分類/WFS/MOI_WFS_001地籍圖WFS.json
  - src/app/api/street-view/route.ts
  - src-tauri/migrations/008_land_lots.sql
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - src/app/api/land-api/test-connection/route.ts
  - src/components/RealtorLicenseField.tsx
  - public/pdf-fonts/NotoSansTC-Regular.otf
  - src/components/settings/LicenseSection.tsx
  - src/lib/disclosure-schema-residential.ts
  - src-tauri/src/commands/floor_plan.rs
  - src/components/case-wizard/CaseWizardStep3Disclosure.tsx
  - src/lib/storage/StorageAdapter.ts
  - docs/cop-scrape/03-依類別分類/WMS/MOI_WMS_012以段為單位地籍圖.json
  - docs/cop-scrape/05-服務說明文件/MOI_WMS_002地籍圖WMS.html
  - src/components/PdfPreviewer.tsx
  - docs/cop-scrape/03-依類別分類/API/MOI_API_025罕用字查詢.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_028建物權利種類及其登記狀態查詢服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_036門牌查建號服務.html
  - docs/cop-scrape/03-依類別分類/API/MOI_API_022公告徵收註記查詢服務.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_001地籍土地標示部資料服務.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_009所有權人比對服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_WMS_009山坡地範圍.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_004地籍建物標示部資料服務.html
  - src/app/api/aerial-photo/route.ts
  - src/components/FloorPlanReviewPanel.tsx
  - docs/cop-scrape/05-服務說明文件/MOI_WMS_003圖幅接合地籍圖WMS.html
  - src/components/disclosure-form-land.tsx
  - docs/cop-scrape/02-服務列表/usage_stats.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_036門牌查建號服務.json
  - src/components/case-wizard/CaseWizardStep5.tsx
  - docs/cop-scrape/03-依類別分類/API/MOI_API_037門牌模糊檢索建號服務.json
  - src/components/OwnerAuthorizationDialog.tsx
  - docs/cop-scrape/05-服務說明文件/MOI_API_006地籍建物他項權利部資料服務.html
  - docs/cop-scrape/03-依類別分類/WMS/MOI_WMS_008特定水土保持區範圍.json
  - docs/cop-scrape/01-入口資訊/qa.json
  - src-tauri/src/commands/floor_plan_rendering.rs
  - docs/cop-scrape/03-依類別分類/API/MOI_API_040分割合併前後地建號資料服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_013地段資料服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_011新舊地建號轉換服務.html
  - src/lib/map-api.ts
  - docs/cop-scrape/05-服務說明文件/MOI_API_031等高線分析服務.html
  - src/lib/use-draft-autosave.ts
  - src-tauri/migrations/007_case_status_keyin.sql
  - docs/cop-scrape/03-依類別分類/API/MOI_API_044宗地中心點坐標資料服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_005地籍建物所有權部資料服務.html
  - src/lib/cases-api.ts
  - docs/cop-scrape/03-依類別分類/WMS/MOI_WMS_005都市計畫土地使用分區.json
  - docs/cop-scrape/05-服務說明文件/MOI_WFS_006市地重劃與農村社區重劃範圍WFS.html
  - docs/cop-scrape/03-依類別分類/API/MOI_API_032坡度分析服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_035縱橫斷面分析服務.html
  - docs/cop-scrape/03-依類別分類/WMS/MOI_WMS_007活動斷層圖.json
  - docs/cop-scrape/03-依類別分類/WMS/MOI_WMS_009山坡地範圍.json
  - docs/cop-scrape/03-依類別分類/WFS/MOI_WFS_002地籍圖WFS_SHP檔_.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_030高程陰影分析服務.html
  - src/lib/ipc-error.ts
  - docs/cop-scrape/02-服務列表/service_list.json
  - src-tauri/src/db/cases.rs
  - src/components/DossierSurroundingMap.tsx
  - docs/cop-scrape/03-依類別分類/API/MOI_API_008土地標示部異動索引服務.json
  - src/lib/pdf-engine/document.tsx
  - docs/cop-scrape/05-服務說明文件/MOI_API_038車位查詢服務.html
  - docs/cop-scrape/scrape_cop.py
  - docs/cop-scrape/03-依類別分類/API/MOI_API_004地籍建物標示部資料服務.json
  - docs/cop-scrape/03-依類別分類/WFS/MOI_WFS_003圖幅接合地籍圖WFS.json
  - package.json
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - docs/cop-scrape/03-依類別分類/API/MOI_API_015建號資料服務.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_028建物權利種類及其登記狀態查詢服務.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_042土地遭棄置廢棄物資訊註記服務.json
  - docs/cop-scrape/01-入口資訊/portal.json
  - src-tauri/Cargo.toml
  - src/components/CaseLotInput.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - docs/cop-scrape/03-依類別分類/API/MOI_API_038車位查詢服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_016土地標示及權利範圍查詢服務.html
  - src/lib/storage/index.ts
  - docs/cop-scrape/06-服務說明文件Markdown/MOI_API_001地籍土地標示部資料服務.md
  - src/components/DossierPage8TaxNotes.tsx
  - docs/cop-scrape/04-技術文件連結/document_links_selected.json
  - docs/cop-scrape/05-服務說明文件/MOI_WFS_001地籍圖WFS.html
  - src/app/login/page.tsx
  - docs/cop-scrape/03-依類別分類/API/MOI_API_034路線剖面分析服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_002地籍土地所有權部資料服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_026建物標示及權利範圍查詢服務.html
  - docs/cop-scrape/03-依類別分類/API/MOI_API_007地號資料服務.json
  - src-tauri/src/lib.rs
  - docs/cop-scrape/03-依類別分類/API/MOI_API_021地籍圖重測註記查詢服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_043新舊地段查詢服務.html
  - docs/cop-scrape/03-依類別分類/WFS/MOI_WFS_006市地重劃與農村社區重劃範圍WFS.json
  - docs/cop-scrape/05-服務說明文件/MOI_WMS_005都市計畫土地使用分區.html
  - docs/cop-scrape/03-依類別分類/API/MOI_API_018非都市土地使用管制註記查詢服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_008土地標示部異動索引服務.html
  - docs/cop-scrape/01-入口資訊/news.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_032坡度分析服務.html
  - src/components/DossierPage7FeeTable.tsx
  - src/components/StatusBadge.tsx
  - docs/cop-scrape/03-依類別分類/WMS/MOI_WMS_004自來水水質水量保護區.json
  - docs/cop-scrape/.scrape_state.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_005地籍建物所有權部資料服務.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_017土地權利種類及登記事項查詢服務.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_006地籍建物他項權利部資料服務.json
  - src/lib/pdf-blocks/aerial-photo-page.tsx
  - src/components/CaseSupplementDialog.tsx
  - src/components/DossierPage6Notices.tsx
  - docs/cop-scrape/03-依類別分類/API/MOI_API_030高程陰影分析服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_WMS_004自來水水質水量保護區.html
  - docs/cop-scrape/03-依類別分類/API/MOI_API_014公告地價與公告土地現值資料服務.json
  - src-tauri/src/rendering/floor_plan_renderer.rs
  - src/lib/tax-calculator.ts
  - docs/cop-scrape/03-依類別分類/API/MOI_API_043新舊地段查詢服務.json
  - src-tauri/src/commands/floor_plan_extraction.rs
  - docs/cop-scrape/00-網站架構圖解.md
  - docs/cop-scrape/05-服務說明文件/MOI_API_007地號資料服務.html
  - src/components/KeyinSplitPage.tsx
  - src/lib/pdf-blocks/floor-plan-photo-page.tsx
  - docs/cop-scrape/03-依類別分類/WMS/MOI_WMS_003圖幅接合地籍圖WMS.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_011新舊地建號轉換服務.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_002地籍土地所有權部資料服務.json
  - src/hooks/useIpcErrorToast.ts
  - docs/cop-scrape/05-服務說明文件/MOI_API_025罕用字查詢.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_012全國土地基本資料庫代碼資料服務.html
  - src-tauri/src/paths.rs
  - src/components/DisclosureHtmlPreview.tsx
  - bug-report.md
  - src/app/api/v1/licenses/activate/route.ts
  - docs/cop-scrape/05-服務說明文件/MOI_API_044宗地中心點坐標資料服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_037門牌模糊檢索建號服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_010公有土地登記資料服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_014公告地價與公告土地現值資料服務.html
  - src-tauri/src/rendering/mod.rs
  - docs/cop-scrape/03-依類別分類/API/MOI_API_041帳務查詢API.json
  - src/lib/pdf-blocks/logo-upload.ts
  - docs/cop-scrape/03-依類別分類/WMS/MOI_WMS_013公有土地開放資料WMS服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_009所有權人比對服務.html
  - docs/cop-scrape/03-依類別分類/API/MOI_API_046三維地籍建號定位點資料服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_034路線剖面分析服務.html
  - docs/cop-scrape/03-依類別分類/API/MOI_API_020土壤或地下水污染場址註記查詢服務.json
  - docs/cop-scrape/03-依類別分類/WMS/MOI_WMS_011飲用水水源水質保護區或飲用水取水口一定距離內之地區.json
  - src/lib/pdf-blocks/location-map.tsx
  - docs/cop-scrape/05-服務說明文件/MOI_WMS_001地籍圖WMS_SHP檔_.html
  - src-tauri/src/db/floor_plan_sketches.rs
  - docs/cop-scrape/03-依類別分類/API/MOI_API_026建物標示及權利範圍查詢服務.json
  - src/lib/pdf-blocks/field-sketch-floor-plan-page.tsx
  - docs/cop-scrape/03-依類別分類/WMS/MOI_WMS_002地籍圖WMS.json
  - src/lib/pdf-engine/react-pdf-init.ts
  - docs/cop-scrape/05-服務說明文件/MOI_API_039公有土地開放資料服務.html
  - docs/cop-scrape/03-依類別分類/API/API_all.json
  - src/app/(dashboard)/cases/[id]/keyin/page.tsx
  - docs/cop-scrape/03-依類別分類/WFS/WFS_all.json
  - docs/cop-scrape/03-依類別分類/WFS/MOI_WFS_005公有土地開放資料WFS服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_024地籍圖詮釋資料.html
  - src/components/settings/LandApiSection.tsx
  - src/app/api/location-map/route.ts
  - src/components/FieldSketchFloorPlanPanel.tsx
  - docs/cop-scrape/04-技術文件連結/document_links.json
  - docs/cop-scrape/05-服務說明文件/MOI_WMS_008特定水土保持區範圍.html
  - docs/cop-scrape/02-服務列表/merged_services.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_027建物遭受放射性污染之虞註記查詢服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_021地籍圖重測註記查詢服務.html
  - docs/cop-scrape/03-依類別分類/API/MOI_API_023土地位置概圖服務.json
  - src-tauri/src/commands/mod.rs
  - src/components/disclosure-form-residential.tsx
  - docs/cop-scrape/03-依類別分類/WMS/WMS_all.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_015建號資料服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_019興建農舍註記資料服務.html
  - docs/cop-scrape/03-依類別分類/API/MOI_API_031等高線分析服務.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_045三維地籍建物標示部資料服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_041帳務查詢API.html
  - docs/cop-scrape/05-服務說明文件/MOI_WMS_012以段為單位地籍圖.html
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - docs/cop-scrape/03-依類別分類/API/MOI_API_010公有土地登記資料服務.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_039公有土地開放資料服務.json
  - src/lib/export-pdf.ts
tests:
  - src/components/__tests__/FieldSketchFloorPlanPanel.test.tsx
  - src/components/__tests__/KeyinSplitPage.test.tsx
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/components/__tests__/DossierPage7FeeTable.test.tsx
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/components/__tests__/PdfPreviewer.test.tsx
  - src/lib/pdf-blocks/__tests__/logo-anchors.test.tsx
  - src/components/case-wizard/__tests__/step3-photo-upload.test.tsx
  - src/lib/storage/__tests__/MockStorageAdapter.test.ts
  - src/components/__tests__/PdfPreviewer.browser-compat.test.tsx
  - src/lib/__tests__/tax-calculator.test.ts
  - src/app/(dashboard)/cases/__tests__/page.test.tsx
  - src/components/settings/__tests__/LicenseSection.test.tsx
  - src/components/__tests__/StatusBadge.test.tsx
  - src/components/__tests__/FieldSketchFloorPlanPanel.autosave.test.tsx
  - src/components/__tests__/CaseSupplementDialog.disclosure.test.tsx
  - src/components/case-wizard/__tests__/CaseWizardStep3Disclosure.test.tsx
  - src/components/__tests__/CaseWizardStep4.test.tsx
  - src/components/__tests__/KeyinSplitPage.markkeyin.test.tsx
  - src/lib/pdf-blocks/__tests__/uint8-to-data-url.test.ts
  - src/components/__tests__/CaseLotInput.test.tsx
  - src/components/__tests__/DossierPage8TaxNotes.test.tsx
  - src/components/__tests__/DossierSurroundingMap.test.tsx
  - src/components/settings/__tests__/LandApiSection-toast.test.tsx
  - src/lib/pdf-blocks/__tests__/field-sketch-floor-plan-page.test.tsx
  - src/lib/__tests__/use-draft-autosave.test.ts
  - src/components/__tests__/DossierPage6Notices.test.tsx
  - src/components/case-wizard/__tests__/CaseWizardStep3Disclosure-storage.test.tsx
  - src/lib/pdf-engine/__tests__/floor-plan-fallback.test.ts
  - src/components/__tests__/OwnerAuthorizationDialog-redborder.test.tsx
  - src-tauri/tests/e2e_smoke.rs
  - src/components/__tests__/KeyinSplitPage.preview.test.tsx
  - src/lib/__tests__/map-api.test.ts
  - src/components/__tests__/CaseWizardStep1.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/components/__tests__/KeyinSplitPage.taxinputs.test.tsx
  - src/lib/pdf-engine/__tests__/document-land-government-format.test.tsx
  - src/components/__tests__/CaseWizard.test.tsx
  - src/app/(dashboard)/settings/sync-status/__tests__/page.test.tsx
  - src/components/__tests__/RealtorLicenseField.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/branding-storage.test.tsx
  - src/components/__tests__/DisclosureHtmlPreview.integration.test.tsx
  - src/components/settings/__tests__/LicenseSection-api.test.tsx
  - src/lib/pdf-engine/__tests__/html-renderer-floor-plan-photo.test.tsx
  - src/lib/__tests__/ipc-error.test.ts
  - src/lib/pdf-blocks/__tests__/floor-plan-photo-page.test.tsx
  - src/lib/pdf-blocks/__tests__/dynamic-composition.test.tsx
  - src/components/__tests__/FloorPlanReviewPanel.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
-->

---
### Requirement: File upload
The supplement dialog SHALL accept file uploads via drag-and-drop or file picker. Accepted file types SHALL be: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.doc`, `.docx`. The system SHALL store uploaded file metadata (filename, size, upload timestamp) in the case record.

#### Scenario: Upload a PDF attachment
- **WHEN** user drags a `.pdf` file into the upload area and clicks "儲存"
- **THEN** the file metadata is stored in the case record and the file appears in the attachments list

#### Scenario: Reject unsupported file type
- **WHEN** user attempts to upload a `.exe` file
- **THEN** the system rejects the file and displays an error message "不支援此檔案格式"


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
### Requirement: Supplement field completion
The dialog SHALL list all required fields that are currently empty for the case. The user SHALL be able to fill in values directly in the dialog. Clicking "儲存" SHALL update the case record with the filled values.

#### Scenario: Fill missing owner name
- **WHEN** the case is missing "所有權人" and user types "陳小美" in the field and clicks "儲存"
- **THEN** the case record is updated with owner_name = "陳小美" and the case list reflects the update

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
### Requirement: Disclosure field completeness detection

`CaseSupplementDialog` SHALL call `get_draft(caseId)` and `getRequiredFields(propertyType)` on open. It SHALL compute the set of required fields whose value in `payload_json` is empty string, null, or undefined. The "缺少必填欄位" section SHALL list all such fields with their human-readable labels and editable inputs. Fields already filled SHALL NOT appear in this list.

#### Scenario: Case with empty disclosure fields

- **WHEN** the supplement dialog opens for a case whose `disclosure_drafts` payload has empty required fields
- **THEN** each empty required field appears as an editable input in the "缺少必填欄位" section

#### Scenario: Case with all disclosure fields filled

- **WHEN** the supplement dialog opens for a case whose `disclosure_drafts` payload has all required fields filled
- **THEN** the "缺少必填欄位" section shows no disclosure-related inputs


<!-- @trace
source: disclosure-form-wiring
updated: 2026-05-19
code:
  - src/lib/disclosure-schema-residential.ts
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/components/disclosure-form-residential.tsx
  - src/components/case-wizard/CaseWizardStep3Disclosure.tsx
  - src/lib/pdf-field-coords.ts
  - src/components/case-wizard/CaseWizard.tsx
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/components/case-wizard/CaseWizardStep5.tsx
  - src/lib/disclosure-schema-land.ts
  - AGENTS.md
  - src/components/CaseSupplementDialog.tsx
  - src/components/disclosure-form-land.tsx
  - src/components/PdfPreviewer.tsx
tests:
  - src/lib/__tests__/disclosure-schema.test.ts
  - src/components/case-wizard/__tests__/CaseWizardStep3Disclosure.test.tsx
  - src/components/__tests__/CaseSupplementDialog.disclosure.test.tsx
  - src/components/__tests__/CaseWizard.test.tsx
-->

---
### Requirement: Save patched disclosure payload

When the user clicks "儲存" in the supplement dialog, the dialog SHALL merge the newly entered field values into the existing `payload_json` and call `save_draft(caseId, mergedPayload, schemaVersion)`. On success, the dialog SHALL close. On failure, a toast "儲存失敗，請重試" SHALL appear and the dialog SHALL remain open.

#### Scenario: Saving filled fields

- **WHEN** the user fills one or more empty fields and clicks "儲存"
- **THEN** `save_draft` is called with a payload that includes the new values merged with existing data, and the dialog closes

<!-- @trace
source: disclosure-form-wiring
updated: 2026-05-19
code:
  - src/lib/disclosure-schema-residential.ts
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/components/disclosure-form-residential.tsx
  - src/components/case-wizard/CaseWizardStep3Disclosure.tsx
  - src/lib/pdf-field-coords.ts
  - src/components/case-wizard/CaseWizard.tsx
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/components/case-wizard/CaseWizardStep5.tsx
  - src/lib/disclosure-schema-land.ts
  - AGENTS.md
  - src/components/CaseSupplementDialog.tsx
  - src/components/disclosure-form-land.tsx
  - src/components/PdfPreviewer.tsx
tests:
  - src/lib/__tests__/disclosure-schema.test.ts
  - src/components/case-wizard/__tests__/CaseWizardStep3Disclosure.test.tsx
  - src/components/__tests__/CaseSupplementDialog.disclosure.test.tsx
  - src/components/__tests__/CaseWizard.test.tsx
-->