# tax-fee-pages Specification

## Purpose

TBD - created by archiving change 'disclosure-smart-draft'. Update Purpose after archive.

## Requirements

### Requirement: Render land value increment tax estimate page

The system SHALL render a "增值稅概算表" page in the PDF following the client format (不動產說明書9.pdf). The page SHALL display: 前次移轉現值, 本次公告現值, 漲價總數額, 一般稅率計算, 自用住宅優惠稅率計算.

#### Scenario: Tax estimate page with calculated values

- **WHEN** CaseDossierData contains taxCalculation with non-zero values
- **THEN** the PDF SHALL render the estimate table with all computed fields filled

#### Scenario: Tax estimate page in draft mode

- **WHEN** taxCalculation is null (no total price provided yet)
- **THEN** the PDF SHALL render the page structure with all value cells blank

---
### Requirement: Render fee summary page

The system SHALL render a "費用一覽表" page following the client format (不動產說明書8.pdf). The page SHALL have two sections: 賣方費用 (8 items) and 買方費用 (6 items), each with item name and amount columns.

#### Scenario: Fee summary with computed values

- **WHEN** taxCalculation is populated
- **THEN** the PDF SHALL display seller costs (土地增值稅, 代書費, etc.) and buyer costs (契稅, 印花稅, 登記規費, 代書費, etc.) with amounts

#### Scenario: Fee summary in draft mode

- **WHEN** taxCalculation is null
- **THEN** all amount cells SHALL be blank; row structure SHALL still render

---
### Requirement: tax-fee-pages renders complete Pages 7 and 8 with auto-calculated taxes

The system SHALL implement Page 7 (buyer/seller fee table) and Page 8 (LVT notes) as fully functional React components integrated with `src/lib/tax-calculator.ts`.

#### Scenario: Pages 7-8 appear in DisclosureHtmlPreview with calculated values

- **WHEN** `DisclosureHtmlPreview` renders with `taxInputs` prop containing `contractPrice=1000000, officialLandValue=800000, shareRatio=1.0, buildingCurrentValue=200000, usage="residential"`
- **THEN** Page 7 fee table is visible with `data-testid="fee-stamp-tax"` showing 1800 and Page 8 notes appear in sequence after Page 7

<!-- @trace
source: dossier-missing-pages
updated: 2026-05-20
code:
  - docs/cop-scrape/03-依類別分類/API/MOI_API_021地籍圖重測註記查詢服務.json
  - src/app/(dashboard)/cases/[id]/page.tsx
  - docs/cop-scrape/03-依類別分類/API/MOI_API_014公告地價與公告土地現值資料服務.json
  - docs/cop-scrape/03-依類別分類/WMS/MOI_WMS_008特定水土保持區範圍.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_013地段資料服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_019興建農舍註記資料服務.html
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - src/components/DisclosureHtmlPreview.tsx
  - src/components/case-wizard/CaseWizardStep3Disclosure.tsx
  - docs/cop-scrape/03-依類別分類/WFS/MOI_WFS_002地籍圖WFS_SHP檔_.json
  - docs/cop-scrape/05-服務說明文件/MOI_WMS_004自來水水質水量保護區.html
  - docs/cop-scrape/03-依類別分類/API/MOI_API_024地籍圖詮釋資料.json
  - docs/cop-scrape/02-服務列表/service_list.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_011新舊地建號轉換服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_WFS_004區段徵收範圍WFS.html
  - src-tauri/src/db/drafts.rs
  - src/app/(dashboard)/settings/sync-status/page.tsx
  - docs/cop-scrape/05-服務說明文件/MOI_WMS_009山坡地範圍.html
  - docs/cop-scrape/02-服務列表/pricing.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_010公有土地登記資料服務.html
  - src/components/DossierSurroundingMap.tsx
  - src/components/StatusBadge.tsx
  - docs/cop-scrape/03-依類別分類/API/API_all.json
  - src-tauri/src/db/mod.rs
  - docs/cop-scrape/03-依類別分類/API/MOI_API_004地籍建物標示部資料服務.json
  - src/app/api/aerial-photo/route.ts
  - src/lib/pdf-engine/react-pdf-init.ts
  - docs/cop-scrape/03-依類別分類_篩選/API/API_all.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_007地號資料服務.json
  - src-tauri/src/commands/floor_plan_approval.rs
  - src/lib/ipc-error.ts
  - docs/cop-scrape/05-服務說明文件/MOI_API_001地籍土地標示部資料服務.html
  - docs/cop-scrape/.scrape_state.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_028建物權利種類及其登記狀態查詢服務.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_032坡度分析服務.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_045三維地籍建物標示部資料服務.json
  - docs/cop-scrape/02-服務列表/merged_services.json
  - docs/cop-scrape/01-入口資訊/portal.json
  - docs/cop-scrape/05-服務說明文件/MOI_WMS_003圖幅接合地籍圖WMS.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_041帳務查詢API.html
  - src-tauri/src/commands/floor_plan_extraction.rs
  - docs/cop-scrape/03-依類別分類/WMS/MOI_WMS_005都市計畫土地使用分區.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_023土地位置概圖服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_006地籍建物他項權利部資料服務.html
  - src/lib/storage/MockStorageAdapter.ts
  - docs/cop-scrape/05-服務說明文件/MOI_API_040分割合併前後地建號資料服務.html
  - docs/cop-scrape/02-服務列表/usage_stats.json
  - docs/cop-scrape/03-依類別分類/WMS/MOI_WMS_010國家公園區內之特別景觀區_生態保護區_史蹟保存區.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_035縱橫斷面分析服務.html
  - docs/cop-scrape/03-依類別分類/API/MOI_API_031等高線分析服務.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_042土地遭棄置廢棄物資訊註記服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_008土地標示部異動索引服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_017土地權利種類及登記事項查詢服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_046三維地籍建號定位點資料服務.html
  - src/app/api/land-api/test-connection/route.ts
  - docs/cop-scrape/05-服務說明文件/MOI_API_024地籍圖詮釋資料.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_026建物標示及權利範圍查詢服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_002地籍土地所有權部資料服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_030高程陰影分析服務.html
  - docs/cop-scrape/03-依類別分類/WMS/WMS_all.json
  - src/components/RealtorLicenseField.tsx
  - docs/cop-scrape/05-服務說明文件/MOI_WFS_001地籍圖WFS.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_032坡度分析服務.html
  - docs/cop-scrape/03-依類別分類/WFS/MOI_WFS_006市地重劃與農村社區重劃範圍WFS.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_027建物遭受放射性污染之虞註記查詢服務.json
  - docs/cop-scrape/03-依類別分類/WMS/MOI_WMS_011飲用水水源水質保護區或飲用水取水口一定距離內之地區.json
  - src/app/api/location-map/route.ts
  - docs/cop-scrape/05-服務說明文件/MOI_API_012全國土地基本資料庫代碼資料服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_038車位查詢服務.html
  - src/lib/pdf-blocks/exterior-photo-page.tsx
  - docs/cop-scrape/03-依類別分類/API/MOI_API_018非都市土地使用管制註記查詢服務.json
  - docs/cop-scrape/03-依類別分類/WFS/MOI_WFS_004區段徵收範圍WFS.json
  - docs/cop-scrape/01-入口資訊/qa.json
  - src-tauri/Cargo.toml
  - docs/cop-scrape/03-依類別分類/API/MOI_API_039公有土地開放資料服務.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_030高程陰影分析服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_027建物遭受放射性污染之虞註記查詢服務.html
  - src/components/DossierPage8TaxNotes.tsx
  - src/components/FieldSketchFloorPlanPanel.tsx
  - docs/cop-scrape/05-服務說明文件/MOI_API_003地籍土地他項權利部資料服務.html
  - docs/cop-scrape/03-依類別分類/API/MOI_API_036門牌查建號服務.json
  - src-tauri/migrations/007_case_status_keyin.sql
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - docs/cop-scrape/03-依類別分類/API/MOI_API_006地籍建物他項權利部資料服務.json
  - public/pdf-fonts/NotoSansTC-Regular.otf
  - docs/cop-scrape/05-服務說明文件/MOI_API_042土地遭棄置廢棄物資訊註記服務.html
  - src/app/(dashboard)/cases/page.tsx
  - docs/cop-scrape/04-技術文件連結/document_links.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_008土地標示部異動索引服務.json
  - docs/cop-scrape/03-依類別分類/WFS/WFS_all.json
  - docs/cop-scrape/03-依類別分類/WMS/MOI_WMS_007活動斷層圖.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_015建號資料服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_WFS_005公有土地開放資料WFS服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_039公有土地開放資料服務.html
  - docs/cop-scrape/03-依類別分類/WMS/MOI_WMS_003圖幅接合地籍圖WMS.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_021地籍圖重測註記查詢服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_WFS_006市地重劃與農村社區重劃範圍WFS.html
  - docs/cop-scrape/03-依類別分類/WFS/MOI_WFS_001地籍圖WFS.json
  - src-tauri/migrations/009_floor_plan_sketches.sql
  - src/components/disclosure-form-residential.tsx
  - src/lib/nlsc-aerial-map.ts
  - src/components/DossierPage6Notices.tsx
  - docs/cop-scrape/05-服務說明文件/MOI_WMS_007活動斷層圖.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_009所有權人比對服務.html
  - docs/cop-scrape/03-依類別分類/API/MOI_API_043新舊地段查詢服務.json
  - src/lib/pdf-engine/html-renderer.tsx
  - docs/cop-scrape/03-依類別分類/WFS/MOI_WFS_005公有土地開放資料WFS服務.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_009所有權人比對服務.json
  - src-tauri/src/commands/floor_plan_rendering.rs
  - docs/cop-scrape/03-依類別分類/API/MOI_API_011新舊地建號轉換服務.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_033坡向分析服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_WMS_001地籍圖WMS_SHP檔_.html
  - src-tauri/src/paths.rs
  - docs/cop-scrape/05-服務說明文件/MOI_API_015建號資料服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_033坡向分析服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_045三維地籍建物標示部資料服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_014公告地價與公告土地現值資料服務.html
  - src-tauri/src/commands/floor_plan.rs
  - src/app/(dashboard)/layout.tsx
  - src/lib/cases-api.ts
  - src/lib/tax-calculator.ts
  - src/lib/map-api.ts
  - docs/cop-scrape/03-依類別分類/WMS/MOI_WMS_001地籍圖WMS_SHP檔_.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_005地籍建物所有權部資料服務.html
  - docs/cop-scrape/03-依類別分類/API/MOI_API_037門牌模糊檢索建號服務.json
  - docs/cop-scrape/03-依類別分類/WMS/MOI_WMS_004自來水水質水量保護區.json
  - src/app/api/street-view/route.ts
  - src/app/api/v1/licenses/activate/route.ts
  - docs/cop-scrape/03-依類別分類/API/MOI_API_034路線剖面分析服務.json
  - src/lib/disclosure-schema-residential.ts
  - src/lib/storage/index.ts
  - docs/cop-scrape/03-依類別分類/API/MOI_API_002地籍土地所有權部資料服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_WMS_013公有土地開放資料WMS服務.html
  - docs/cop-scrape/03-依類別分類/API/MOI_API_035縱橫斷面分析服務.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_023土地位置概圖服務.json
  - src/lib/pdf-engine/html-blocks/location-and-exterior.tsx
  - docs/cop-scrape/05-服務說明文件/MOI_API_034路線剖面分析服務.html
  - src-tauri/src/db/cases.rs
  - src-tauri/src/db/floor_plan_sketches.rs
  - docs/cop-scrape/05-服務說明文件/MOI_API_013地段資料服務.html
  - src/components/KeyinSplitPage.tsx
  - docs/cop-scrape/03-依類別分類/WMS/MOI_WMS_013公有土地開放資料WMS服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_WMS_002地籍圖WMS.html
  - docs/cop-scrape/05-服務說明文件/MOI_WFS_003圖幅接合地籍圖WFS.html
  - src/hooks/useIpcErrorToast.ts
  - docs/cop-scrape/03-依類別分類/WFS/MOI_WFS_003圖幅接合地籍圖WFS.json
  - docs/cop-scrape/05-服務說明文件/MOI_WMS_010國家公園區內之特別景觀區_生態保護區_史蹟保存區.html
  - docs/cop-scrape/03-依類別分類_篩選/API/MOI_API_001地籍土地標示部資料服務.json
  - src/lib/pdf-engine/document.tsx
  - docs/cop-scrape/03-依類別分類/API/MOI_API_041帳務查詢API.json
  - docs/cop-scrape/scrape_cop.py
  - docs/cop-scrape/01-入口資訊/news.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_017土地權利種類及登記事項查詢服務.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_012全國土地基本資料庫代碼資料服務.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_020土壤或地下水污染場址註記查詢服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_036門牌查建號服務.html
  - src-tauri/src/lib.rs
  - src/components/OwnerAuthorizationDialog.tsx
  - docs/cop-scrape/03-依類別分類/API/MOI_API_022公告徵收註記查詢服務.json
  - docs/cop-scrape/03-依類別分類/WMS/MOI_WMS_009山坡地範圍.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_004地籍建物標示部資料服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_043新舊地段查詢服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_018非都市土地使用管制註記查詢服務.html
  - docs/cop-scrape/03-依類別分類/API/MOI_API_003地籍土地他項權利部資料服務.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_025罕用字查詢.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_031等高線分析服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_API_025罕用字查詢.html
  - src/components/DossierPage7FeeTable.tsx
  - src/components/case-wizard/CaseWizardStep5.tsx
  - src/components/settings/LicenseSection.tsx
  - src/lib/pdf-blocks/logo-upload.ts
  - docs/cop-scrape/03-依類別分類/WMS/MOI_WMS_002地籍圖WMS.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_007地號資料服務.html
  - src-tauri/src/rendering/mod.rs
  - src/components/case-wizard/CaseWizard.tsx
  - src/lib/storage/StorageAdapter.ts
  - src/components/settings/LandApiSection.tsx
  - docs/cop-scrape/05-服務說明文件/MOI_API_020土壤或地下水污染場址註記查詢服務.html
  - src/lib/mock-backend.ts
  - src/lib/use-draft-autosave.ts
  - src/app/login/page.tsx
  - src/lib/pdf-blocks/location-map.tsx
  - docs/cop-scrape/04-技術文件連結/document_links_selected.json
  - src-tauri/migrations/008_land_lots.sql
  - src-tauri/src/commands/cases.rs
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - docs/cop-scrape/05-服務說明文件/MOI_WFS_002地籍圖WFS_SHP檔_.html
  - docs/cop-scrape/03-依類別分類/API/MOI_API_019興建農舍註記資料服務.json
  - src/components/disclosure-form-land.tsx
  - src/lib/pdf-blocks/aerial-photo-page.tsx
  - docs/cop-scrape/03-依類別分類/API/MOI_API_040分割合併前後地建號資料服務.json
  - bug-report.md
  - docs/cop-scrape/03-依類別分類/API/MOI_API_046三維地籍建號定位點資料服務.json
  - src-tauri/src/commands/mod.rs
  - docs/cop-scrape/03-依類別分類/API/MOI_API_044宗地中心點坐標資料服務.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_026建物標示及權利範圍查詢服務.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_010公有土地登記資料服務.json
  - package.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_028建物權利種類及其登記狀態查詢服務.html
  - src-tauri/src/rendering/floor_plan_renderer.rs
  - src/app/(dashboard)/cases/new/page.tsx
  - src/components/FloorPlanReviewPanel.tsx
  - docs/cop-scrape/05-服務說明文件/MOI_API_037門牌模糊檢索建號服務.html
  - docs/cop-scrape/06-服務說明文件Markdown/MOI_API_001地籍土地標示部資料服務.md
  - docs/cop-scrape/00-網站架構圖解.md
  - src/lib/pdf-blocks/image-data-url.ts
  - docs/cop-scrape/05-服務說明文件/MOI_API_044宗地中心點坐標資料服務.html
  - docs/cop-scrape/03-依類別分類/API/MOI_API_038車位查詢服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_API_016土地標示及權利範圍查詢服務.html
  - docs/cop-scrape/05-服務說明文件/MOI_WMS_008特定水土保持區範圍.html
  - docs/cop-scrape/05-服務說明文件/MOI_WMS_012以段為單位地籍圖.html
  - src/lib/export-pdf.ts
  - src/lib/pdf-blocks/field-sketch-floor-plan-page.tsx
  - docs/cop-scrape/03-依類別分類/API/MOI_API_005地籍建物所有權部資料服務.json
  - docs/cop-scrape/03-依類別分類/API/MOI_API_001地籍土地標示部資料服務.json
  - docs/cop-scrape/05-服務說明文件/MOI_WMS_005都市計畫土地使用分區.html
  - docs/cop-scrape/03-依類別分類/WMS/MOI_WMS_012以段為單位地籍圖.json
  - src/components/CaseLotInput.tsx
  - docs/cop-scrape/05-服務說明文件/MOI_API_022公告徵收註記查詢服務.html
  - src/lib/pdf-blocks/floor-plan-photo-page.tsx
  - docs/cop-scrape/05-服務說明文件/MOI_WMS_011飲用水水源水質保護區或飲用水取水口一定距離內之地區.html
  - docs/cop-scrape/03-依類別分類/API/MOI_API_016土地標示及權利範圍查詢服務.json
tests:
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/lib/pdf-blocks/__tests__/field-sketch-floor-plan-page.test.tsx
  - src/components/__tests__/CaseLotInput.test.tsx
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/components/__tests__/DossierPage6Notices.test.tsx
  - src/components/settings/__tests__/LandApiSection-toast.test.tsx
  - src/lib/__tests__/map-api.test.ts
  - src/lib/__tests__/mock-backend.test.ts
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/components/__tests__/FieldSketchFloorPlanPanel.test.tsx
  - src/lib/__tests__/tax-calculator.test.ts
  - src/components/__tests__/StatusBadge.test.tsx
  - src/lib/pdf-blocks/__tests__/floor-plan-photo-page.test.tsx
  - src/lib/__tests__/use-draft-autosave.test.ts
  - src/lib/pdf-blocks/__tests__/uint8-to-data-url.test.ts
  - src/lib/pdf-blocks/__tests__/dynamic-composition.test.tsx
  - src/components/__tests__/DossierSurroundingMap.test.tsx
  - src/lib/pdf-engine/__tests__/document-land-government-format.test.tsx
  - src/components/case-wizard/__tests__/CaseWizardStep3Disclosure-storage.test.tsx
  - src/components/__tests__/KeyinSplitPage.taxinputs.test.tsx
  - src/components/__tests__/CaseWizardStep1.test.tsx
  - src/components/settings/__tests__/LicenseSection.test.tsx
  - src/components/__tests__/FloorPlanReviewPanel.test.tsx
  - src/components/settings/__tests__/LicenseSection-api.test.tsx
  - src/components/__tests__/FieldSketchFloorPlanPanel.autosave.test.tsx
  - src/components/__tests__/KeyinSplitPage.preview.test.tsx
  - src/components/__tests__/DisclosureHtmlPreview.integration.test.tsx
  - src-tauri/tests/e2e_smoke.rs
  - src/lib/__tests__/ipc-error.test.ts
  - src/lib/pdf-engine/__tests__/html-renderer-floor-plan-photo.test.tsx
  - src/components/__tests__/DossierPage8TaxNotes.test.tsx
  - src/app/(dashboard)/cases/__tests__/page.test.tsx
  - src/lib/pdf-blocks/__tests__/logo-anchors.test.tsx
  - src/components/__tests__/OwnerAuthorizationDialog-redborder.test.tsx
  - src/components/__tests__/DossierPage7FeeTable.test.tsx
  - src/components/__tests__/KeyinSplitPage.test.tsx
  - src/components/case-wizard/__tests__/CaseWizardStep3Disclosure.test.tsx
  - src/lib/storage/__tests__/MockStorageAdapter.test.ts
  - src/components/__tests__/RealtorLicenseField.test.tsx
  - src/lib/pdf-engine/__tests__/floor-plan-fallback.test.ts
  - src/app/(dashboard)/settings/branding/__tests__/branding-storage.test.tsx
  - src/components/__tests__/CaseWizard.test.tsx
  - src/components/case-wizard/__tests__/step3-photo-upload.test.tsx
  - src/app/(dashboard)/settings/sync-status/__tests__/page.test.tsx
  - src/components/__tests__/KeyinSplitPage.markkeyin.test.tsx
-->