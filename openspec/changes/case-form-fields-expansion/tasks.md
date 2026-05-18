## Wave 1 — Database & Rust Backend

- [x] **Task 1.1** — Create `src-tauri/migrations/006_case_fields.sql`
  Implements Decision 1: migration strategy for cases fields and Decision 2: branding table extension.
  Add `ALTER TABLE cases ADD COLUMN case_name TEXT;`, `ALTER TABLE cases ADD COLUMN building_lot_no TEXT;`, `ALTER TABLE cases ADD COLUMN asking_price INTEGER;`. Add `ALTER TABLE branding ADD COLUMN agent_name TEXT;`, `ALTER TABLE branding ADD COLUMN agent_cert_no TEXT;`, `ALTER TABLE branding ADD COLUMN company_name TEXT;`, `ALTER TABLE branding ADD COLUMN company_license_no TEXT;`, `ALTER TABLE branding ADD COLUMN company_address TEXT;`, `ALTER TABLE branding ADD COLUMN company_phone TEXT;`, `ALTER TABLE branding ADD COLUMN realtor_name TEXT;`. Wrap all ALTER statements in `ALTER TABLE … ADD COLUMN IF NOT EXISTS` or use `BEGIN … END` guard to be idempotent.
  **Verify:** File exists. Running SQLite `.schema cases` and `.schema branding` after applying shows the new columns.

- [x] **Task 1.2** — Update `src-tauri/src/db/cases.rs`
  Covers requirement: asking_price persisted in cases table.
  (a) Add 3 fields to `Case` struct: `pub case_name: Option<String>`, `pub building_lot_no: Option<String>`, `pub asking_price: Option<i64>`. (b) Update `insert_case` SQL to include the 3 new columns with `?` params. (c) Update `get_case` and `list_cases` `SELECT` to include new columns and map them in the row closure. (d) Update `update_case` SQL `SET` clause to include new columns.
  **Verify:** `cargo check` compiles with no errors on `db/cases.rs`.

- [x] **Task 1.3** — Update `src-tauri/src/commands/cases.rs`
  (a) Add `asking_price: Option<i64>`, `case_name: Option<String>`, `building_lot_no: Option<String>` to the `CreateCaseInput` serde struct. (b) Add the same 3 fields to `UpdateCaseInput`. (c) In `create_case` handler, map `input.asking_price`, `input.case_name`, `input.building_lot_no` into the `Case` struct before `db::cases::insert_case`. (d) In `update_case` handler, update the fields from `UpdateCaseInput` into the existing `Case` before `db::cases::update_case`.
  **Verify:** `cargo check` compiles. Mock `create_case` call with `{ asking_price: 25000000, case_name: "test", building_lot_no: "123-4" }` returns a `Case` with those values set.

- [x] **Task 1.4** — Extend `src-tauri/src/branding/mod.rs` with brand text settings
  Covers requirement: Brand text fields stored and retrievable. Implements Decision 4: brand settings ipc.
  (a) Define struct `BrandTextSettings` with 7 `Option<String>` fields: `agent_name`, `agent_cert_no`, `company_name`, `company_license_no`, `company_address`, `company_phone`, `realtor_name`. Derive `serde::Serialize`, `serde::Deserialize`, `Default`. (b) Implement `pub fn get_brand_text_settings(conn: &Connection) -> Result<BrandTextSettings, DbError>` — SELECT the 7 columns from `branding WHERE id=1`; if no row, return `BrandTextSettings::default()`. (c) Implement `pub fn save_brand_text_settings(conn: &Connection, s: &BrandTextSettings) -> Result<(), DbError>` — UPDATE branding SET the 7 columns WHERE id=1. (d) Add `ensure_brand_row(conn)` call at module init or in `get_brand_text_settings` to guarantee the singleton row exists. (e) Expose two `#[tauri::command]` functions `get_brand_text_settings` and `save_brand_text_settings` in the module.
  **Verify:** `cargo check` compiles. Unit test: save `{ company_name: "大安" }`, get returns `{ company_name: Some("大安") }`.

- [x] **Task 1.5** — Register new IPC commands in `src-tauri/src/lib.rs`
  Add `commands::branding::get_brand_text_settings` and `commands::branding::save_brand_text_settings` (or the equivalent module path) to the `tauri::generate_handler![]` macro invocation.
  **Verify:** `cargo build` succeeds with no `unresolved` errors.

## Wave 2 — TypeScript API & Frontend

- [x] [P] **Task 2.1** — Update `src/lib/cases-api.ts`
  Add `asking_price?: number | null` to `CaseRow`, `CreateCaseInput`, and `UpdateCaseInput` interfaces. (Note: `case_name` and `building_lot_no` already exist in the TS types; no change needed for those.)
  **Verify:** `npx tsc --noEmit` reports no new errors in files importing `cases-api.ts`.

- [x] [P] **Task 2.2** — Create `src/lib/branding-api.ts`
  Export interface `BrandTextSettings { agent_name?: string; agent_cert_no?: string; company_name?: string; company_license_no?: string; company_address?: string; company_phone?: string; realtor_name?: string; }`. Export `brandingApi` object with: `getBrandText(): Promise<BrandTextSettings>` calling `safeInvoke('get_brand_text_settings')`; `saveBrandText(s: BrandTextSettings): Promise<void>` calling `safeInvoke('save_brand_text_settings', { settings: s })`. In dev/browser mode, `safeInvoke` fallback returns `{}` (empty settings).
  **Verify:** File compiles (`tsc --noEmit`). Importing `brandingApi.getBrandText()` resolves to `Promise<BrandTextSettings>`.

- [x] [P] **Task 2.3** — Add 售價 field to `src/components/case-wizard/CaseWizardStep1.tsx`
  Covers requirement: Step 1 includes asking price field. Implements Decision 3: asking_price unit in ui.
  Add a numeric `<Input>` labelled "售價（萬元）" below the existing 案件名稱 field. Use `react-hook-form` `register('asking_price_wan')` with `valueAsNumber`. On Step 1 save (before advancing), compute `asking_price = isNaN(value) ? null : value * 10000` and include in `UpdateCaseInput`. On Step 1 load, populate the field with `caseRow.asking_price != null ? caseRow.asking_price / 10000 : ''`.
  **Verify:** In browser dev mode, entering "3000" in the field, advancing to Step 2, then navigating back to Step 1 shows "3000" still in the field (data round-trips through mock).

- [x] [P] **Task 2.4** — Add 建號 field to `src/components/case-wizard/CaseWizardStep2.tsx`
  Covers requirements: Step 2 includes building lot number field; building_lot_no exposed in wizard Step 2.
  Add a text `<Input>` labelled "建號" at the top of the Step 2 form (above or beside the existing 地號 field). Bind to `building_lot_no` via `register('building_lot_no')`. On Step 2 save, include `building_lot_no` in `UpdateCaseInput`. On Step 2 load, pre-populate from `caseRow.building_lot_no`.
  **Verify:** Entering "556-1" in 建號 and saving persists the value (visible on re-open in dev mode).

- [x] [P] **Task 2.5** — Implement brand text form in `src/app/(dashboard)/settings/branding/branding-content.tsx`
  Covers requirement: 品牌設定 page renders brand text form.
  Add a form section below the existing logo/theme content with 7 labelled `<Input>` fields for agent_name, agent_cert_no, company_name, company_license_no, company_address, company_phone, realtor_name. Use `react-hook-form`. On mount, call `brandingApi.getBrandText()` and populate form with returned values. Add a 儲存品牌資訊 `<Button>` that calls `brandingApi.saveBrandText(formValues)` and shows a success `toast`.
  **Verify:** In browser dev mode, page renders 7 inputs without console errors. Submitting form calls `safeInvoke('save_brand_text_settings')` (visible in network or mock log).

- [x] [P] **Task 2.6** — Update `src/lib/pdf-engine/assemble-dossier-data.ts` to populate cover
  Covers requirement: assembleDossierData populates cover from brand settings. Implements Decision 5: assembledossierdata cover fill.
  At the top of `assembleDossierData()`, add: `let brandText: BrandTextSettings = {}; try { brandText = await safeInvoke('get_brand_text_settings'); } catch { /* dev fallback */ }`. Then construct `cover` object: `{ propertyName: caseRow.address, caseNumber: caseRow.case_no ?? caseRow.id.slice(0, 8), handlingAgent: brandText.agent_name ?? '', licensedAgentName: brandText.realtor_name ?? '', licensedAgentCertNo: brandText.agent_cert_no ?? '', brokerageCompanyName: brandText.company_name ?? '', brokerageLicenseNo: brandText.company_license_no ?? '', companyAddress: brandText.company_address ?? '', companyPhone: brandText.company_phone ?? '' }`. Remove any previous hardcoded empty-string `cover` construction.
  **Verify:** In browser dev mode, opening Step 4 PDF preview for a case whose mock brand returns `{ company_name: "大安不動產" }` shows "大安不動產" in the cover page brokerage name field.

- [x] **Task 2.7** — Update `src/lib/mock-backend.ts` with new fields
  Implements Decision 6: mock backend additions.
  (a) Add `asking_price: null` to each mock case row. (b) In `create_case` mock handler, read `asking_price` from input with `pickNumber`. (c) In `update_case` mock handler, handle `asking_price` update. (d) Add `get_brand_text_settings` mock command returning `{}`. (e) Add `save_brand_text_settings` mock command that stores settings in a module-level variable and `get_brand_text_settings` returns it.
  **Verify:** Dev mode: calling `mockInvoke('get_brand_text_settings')` returns `{}`. After `mockInvoke('save_brand_text_settings', { settings: { company_name: 'Test' } })`, calling `get_brand_text_settings` returns `{ company_name: 'Test' }`.

## Wave 3 — Build & Test

- [ ] **Task 3.1** — Rust + frontend build verification
  Run `cargo build` in `src-tauri/` — expect 0 errors. Run `npm run build` in project root — expect 0 errors. Fix any type or compile errors found before marking this task done.
  **Verify:** Both commands exit with code 0.

- [ ] **Task 3.2** — Add/update tests for new fields
  (a) Update or add a test in `src/components/__tests__/CaseWizardStep1.test.tsx` that renders Step 1 with a mock case having `asking_price: 30000000` and asserts the input displays "3000". (b) Add a test asserting that submitting the form with input value "2500" calls `updateCase` with `asking_price: 25000000`. (c) Add a test in `src/components/__tests__/CaseWizardStep2.test.tsx` asserting the 建號 input is present and bound to `building_lot_no`. (d) Add a unit test for `assembleDossierData` that mocks `get_brand_text_settings` to return `{ company_name: "大安" }` and asserts `result.cover.brokerageCompanyName === "大安"`.
  **Verify:** `npm run test -- --run` passes for all affected test files with no new failures.
