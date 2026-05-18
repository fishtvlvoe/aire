## Why

The case creation form and wizard Step 1 collect only 6 basic fields (address, owner, case number, case name, lot number, property type), leaving critical per-case data — especially asking price — with no entry point. The brand information section (agent name, company, license numbers) on the disclosure cover page also has no data source, causing the cover page to render empty for every case.

## What Changes

- Add `asking_price` (委託/售價) field to the case data model (SQLite schema, Rust IPC, TypeScript type, and wizard Step 1 form)
- Add `building_lot_no` input to wizard Step 2 form (field exists in schema but is not exposed in the UI)
- Implement 品牌設定 (brand settings) tab: persist agent name, agent cert no, brokerage company name, brokerage license no, company address, company phone via Tauri IPC
- Wire 品牌設定 values into `CaseDossierData.cover` auto-fill inside `assembleDossierData()`

## Non-Goals

- Rich-text or free-form notes fields (separate future change)
- Per-case override of brand settings (brand settings are global)
- Mandatory field validation beyond current form constraints
- Any changes to land registry data fields (those come from 謄本 API pull in Step 2)

## Capabilities

### New Capabilities

- `asking-price-field`: Wizard Step 1 exposes a numeric 售價（萬元）input; value persists in `cases.asking_price` column and flows into `propertySheet.askingPrice` in the dossier
- `building-lot-no-input`: Step 2 form renders a 建號 text input bound to `cases.building_lot_no`
- `brand-settings-persistence`: 品牌設定 tab stores 7 brand fields (agent name, cert no, company name, license no, address, phone, realtor name) via `save_brand_settings` / `get_brand_settings` Tauri IPC commands, backed by a new `brand_settings` SQLite table
- `cover-auto-fill`: `assembleDossierData()` reads brand settings from Tauri IPC and populates `CaseDossierData.cover` automatically

### Modified Capabilities

- `case-wizard-flow`: Step 1 adds 售價 field; Step 2 adds 建號 field
- `disclosure-cover-page`: Cover page fields populated from brand settings instead of empty

## Impact

- Affected specs: case-wizard-flow, disclosure-cover-page, property-data-sheet, settings-page
- Affected code:
  - New: `src-tauri/src/brand_settings.rs`
  - Modified: `src-tauri/src/cases.rs`
  - Modified: `src-tauri/src/db.rs`
  - Modified: `src-tauri/src/lib.rs`
  - Modified: `src/lib/cases-api.ts`
  - Modified: `src/components/case-wizard/CaseWizardStep1.tsx`
  - Modified: `src/components/case-wizard/CaseWizardStep2.tsx`
  - Modified: `src/lib/pdf-engine/assemble-dossier-data.ts`
  - Modified: `src/app/(dashboard)/settings/branding/page.tsx`
