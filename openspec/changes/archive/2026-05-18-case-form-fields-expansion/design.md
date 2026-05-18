## Context

AIRE is a Tauri desktop app. The frontend is Next.js (static export in production). The backend is a Rust Tauri process with SQLite via `rusqlite`. TypeScript communicates with Rust via `safeInvoke` (Tauri IPC).

The current `cases` SQLite table has only 9 columns: `id, case_no, property_type, land_lot_no, address, owner_name, status, created_at, updated_at`. The TypeScript `CaseRow` type already declares `building_lot_no`, `case_name`, and `land_registry_data` but the Rust struct and SQL schema do not implement them — those fields exist only in the mock backend. The `branding` table stores logo and theme but has no text fields for agent or company identity.

## Goals / Non-Goals

**Goals:**
- Add `asking_price` (售價), `building_lot_no` (建號), `case_name` (案件名稱) to the SQLite `cases` table and the Rust Case struct so they actually persist in production
- Expose `asking_price` input in Wizard Step 1; expose `building_lot_no` input in Wizard Step 2
- Extend the `branding` table with 7 agent/company text fields and expose them in 品牌設定 page
- Auto-populate `CaseDossierData.cover` from brand settings in `assembleDossierData()`

**Non-Goals:**
- Per-case override of brand settings
- `land_registry_data` and `current_step` persistence in Rust (separate scope)
- Any changes to land registry pull flow (Step 2 謄本 pull stays unchanged)
- PDF layout or template changes

## Decisions

### Decision 1: Migration strategy for cases fields

Add a new migration `006_case_fields.sql` that uses `ALTER TABLE cases ADD COLUMN` for each new field. SQLite's `ALTER TABLE ADD COLUMN` is non-destructive and works at runtime without data loss. Three columns to add:
- `case_name TEXT` — nullable
- `building_lot_no TEXT` — nullable
- `asking_price INTEGER` — nullable, stored as integer (10,000 NTD units, i.e., 萬元; multiply by 10000 for display)

**Rationale:** `ALTER TABLE ADD COLUMN` is the simplest safe migration. Storing 萬元 as integer avoids floating point errors.

### Decision 2: Branding table extension

Add 7 nullable TEXT columns to `branding` via `ALTER TABLE` in `006_case_fields.sql`:
- `agent_name TEXT` (業務員姓名)
- `agent_cert_no TEXT` (業務員證號)
- `company_name TEXT` (公司名稱)
- `company_license_no TEXT` (公司牌照號)
- `company_address TEXT` (公司地址)
- `company_phone TEXT` (公司電話)
- `realtor_name TEXT` (不動產經紀人姓名)

**Rationale:** Branding is a singleton table (id=1). Text fields are the minimal addition; no separate table needed.

### Decision 3: asking_price unit in UI

Wizard Step 1 shows a numeric input labelled "售價（萬元）". Value is multiplied by 10000 before storing (integer NTD) and divided by 10000 for display. If the field is empty, `asking_price` is stored as NULL.

**Rationale:** Real estate prices in Taiwan are always quoted in 萬元. Keeping integer NTD in DB makes arithmetic consistent with the tax calculation engine.

### Decision 4: Brand settings IPC

Extend `src-tauri/src/branding/mod.rs` with two new functions:
- `get_brand_text_settings(conn) -> BrandTextSettings` — returns the 7 text fields
- `save_brand_text_settings(conn, settings: BrandTextSettings) -> ()` — updates branding row

Expose as Tauri commands `get_brand_text_settings` and `save_brand_text_settings`.

Add a `brandingApi.getBrandText()` / `brandingApi.saveBrandText(settings)` wrapper in a new `src/lib/branding-api.ts`.

**Rationale:** Mirrors the existing logo/theme IPC pattern in `branding/mod.rs`. Singleton row already exists.

### Decision 5: assembleDossierData cover fill

`assembleDossierData()` in `src/lib/pdf-engine/assemble-dossier-data.ts` currently constructs a partial `cover` object with hardcoded empty strings. After this change:
1. Call `safeInvoke('get_brand_text_settings')` at the start of `assembleDossierData()`
2. If the call succeeds, populate `cover.handlingAgent`, `cover.licensedAgentName`, `cover.licensedAgentCertNo`, `cover.brokerageCompanyName`, `cover.brokerageLicenseNo`, `cover.companyAddress`, `cover.companyPhone`
3. Populate `cover.propertyName` from `caseRow.address` and `cover.caseNumber` from `caseRow.case_no ?? caseRow.id.slice(0,8)`
4. If the call fails (dev/mock), default to empty strings

**Rationale:** Single async call before assembly; no blocking on missing settings.

### Decision 6: Mock backend additions

Add `asking_price`, `brand_text_settings` support to `src/lib/mock-backend.ts` so dev mode reflects production behavior.

## File Map

| File | Change |
|---|---|
| `src-tauri/migrations/006_case_fields.sql` | New migration |
| `src-tauri/src/db/cases.rs` | Add 3 fields to Case struct + SQL |
| `src-tauri/src/commands/cases.rs` | Add 3 fields to CreateCaseInput, UpdateCaseInput, IPC handlers |
| `src-tauri/src/branding/mod.rs` | Add BrandTextSettings struct + 2 new functions + 2 IPC commands |
| `src-tauri/src/lib.rs` | Register new IPC commands |
| `src/lib/cases-api.ts` | Add `asking_price` to CaseRow, CreateCaseInput, UpdateCaseInput |
| `src/lib/branding-api.ts` | New file: BrandTextSettings TS type + IPC wrapper |
| `src/components/case-wizard/CaseWizardStep1.tsx` | Add 售價（萬元）numeric field |
| `src/components/case-wizard/CaseWizardStep2.tsx` | Add 建號 text field |
| `src/app/(dashboard)/settings/branding/branding-content.tsx` | Add 7 brand text fields with save button |
| `src/lib/pdf-engine/assemble-dossier-data.ts` | Read brand settings → populate cover |
| `src/lib/mock-backend.ts` | Add asking_price and brand_text_settings mock |
