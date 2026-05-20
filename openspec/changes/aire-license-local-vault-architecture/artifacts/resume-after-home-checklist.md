# Resume After Home Checklist

Date: 2026-05-20

Purpose: use this file after Fish shuts down / goes home to resume AIRE disclosure work without rereading the chat.

## Resume Command

Tell Codex:

```text
繼續 AIRE 不動產說明書 Spectra，先讀 resume-after-home-checklist.md
```

Primary change:

- `openspec/changes/aire-license-local-vault-architecture/`

Read first:

1. `artifacts/resume-after-home-checklist.md`
2. `artifacts/page-contract-house-property-rights.md`
3. `artifacts/page-contract-house-land-display.md`
4. `artifacts/page-contract-house-market-reference.md`
5. `artifacts/page-contract-house-ownership-notes.md`
6. `artifacts/page-contract-house-fee-responsibility.md`
7. `artifacts/page-contract-house-land-value-tax-estimate.md`
8. `artifacts/page-contract-house-tax-notes.md`
9. `artifacts/page-contract-house-condition-survey-highrise.md`
10. `artifacts/page-contract-house-living-function.md`
11. `artifacts/page-contract-house-cover.md`
12. `artifacts/source-api-gap-audit.md`
13. `tasks.md`

## Current Product Direction

Build the complete / highest-capability disclosure workflow first.

Do not spend the next session splitting Basic / Pro limitations yet.
Basic / Pro / Advanced packaging can be refined after the full 不動產說明書 flow works.

Payment/gateway discussion is intentionally deferred.

## Locked Decisions

### PDF Draft Behavior

- Use old/conservative PDF style first.
- Missing fields render blank, not `待補`.
- Draft PDF should leave enough writable space for handwriting.
- Production date defaults to export date, but Beta allows manual override.
- Draft output should not hard-code volatile `第 X 頁 / 共 Y 頁`.
- PDF export must embed/register Traditional Chinese capable fonts.
- Verify `NotoSansTC` and `initReactPdfEngine()` before trusting PDF output.

### `house.property_rights`

`交易種類`:

- Initial state: blank.
- Options: blank, `買賣`, `租賃`, `交換`, `其他`.
- If `其他`, show manual text input.
- Do not hard-code `買賣`.

`附贈設備`:

- Default: `依標的物現況說明書賣方表達內容為準`.
- Allow manual text.
- Allow blank output.

`付款方式`:

- Means real-estate transaction payment terms, not SaaS payment to AIRE.
- Default: `依買賣契約為準`.
- Allow manual text.
- Allow blank output.

`建物標示`:

- Fish prefers including `建號`, area fields, and `權利範圍`.
- Nearby formal pages were checked; no other formal page clearly owns detailed `建物標示`.
- `house.property_rights` owns expanded `建物標示`.
- MVP uses a compact, business-readable one-page layout.
- 105 official format is a checklist, not the first visible PDF layout.

`土地標示`:

- `house.land_display` Page Contract was created from `4.JPG`.
- It owns `二、【土地標示】`.
- It includes land parcel rows, land registration reason, legal/default notes, and land rights/encumbrance summary.
- API-derived values remain manually editable or blankable.

`透明房價/成交行情`:

- `house.market_reference` Page Contract was created from `5.JPG`.
- It is treated as a market/reference appendix, not core registry fact.
- It supports manual rows first and future auto query/import.
- First version should be able to output it, but it is an optional appendix, not mandatory output.
- Source/update/disclaimer text should be preserved because real-price data may lag or have sample bias.

`產權相關注意事項`:

- `house.ownership_notes` Page Contract was created from `6.JPG`.
- It owns `三、【產權相關注意事項】`.
- It is treated as controlled legal/risk notice text, not normal free-form user content.
- MVP uses fixed legal/risk templates; normal users cannot freely edit clause wording.
- MVP prints fixed legal clauses by default rather than conditionally hiding clauses.
- The current code component has only 6 generic notices and is incomplete compared with the 11 topics in the photo.

`費用負擔`:

- `house.fee_responsibility` Page Contract was created from `7.JPG`.
- It owns `貳、買賣雙方應負擔費用項目一覽表`.
- It separates responsibility wording from actual tax/fee estimates.
- MVP supports blank, manual, and auto-calculated estimate values.
- Normal users can edit amount/note fields, but not the fixed responsibility wording templates.
- Existing tax/fee code is useful but not yet aligned with the photo's buyer/seller responsibility wording.

`增值稅概算表`:

- `house.land_value_tax_estimate` Page Contract was created from `8.JPG`.
- It owns `參、增值稅概算表`.
- It separates display/export values from formula metadata.
- MVP supports blank, manual, and auto-calculated tax estimate values.
- Automatic calculation must carry source timestamp, formula version, and warnings.
- Printable tax values must be labeled as estimates, preserving wording equivalent to `概算` and `正確應納稅額以稅捐機關核發稅單金額為準`.
- Formula/source review remains required before paid launch reliability claims.

`增值稅附註`:

- `house.tax_notes` Page Contract was created from `9-8+9.JPG`.
- It owns the general/self-use estimate result summary and seven notes.
- It stays separate from `house.land_value_tax_estimate` for now to avoid over-cramped pages.
- Note wording should be controlled by admin/legal/tax template versioning.
- Normal users cannot freely edit the seven tax note templates.
- Fixed tax notes print by default even when estimate values are blank.

`房屋現況調查表`:

- `house.condition_survey_highrise` Page Contract was created from `10-房屋-現況調查表-*.JPG`.
- It covers the 5-page survey form for the first target type, 大樓華廈.
- MVP uses the photo's 38-question customer form as the primary template.
- Blank answers render as empty checkboxes plus writable space.
- Current code has a 58-question `BuildingSurveyData`; it must not be blindly reused as the primary output without explicit mapping.

`生活機能`:

- `house.living_function` Page Contract was created from `11-房屋-生活機能.JPG`.
- It owns the map image and nearby facility table.
- First MVP version must auto-generate the location/surrounding map.
- Manual map upload remains fallback/override if auto generation fails.
- Map failure should warn but not block export.
- Facility rows can be auto-fetched or manually edited, but the PDF template remains fixed.

## Next Session Priority

### 1. Continue Page Contracts

Next target after `house.living_function`:

Likely next target:

- Start implementation planning around fixed templates/data model first, right-side preview second, PDF export third.

Keep the same contract shape:

- visual source
- workflow
- fields
- storage
- preview
- PDF
- API/source mapping
- open questions

### 2. Registry Persistence Test

Before implementation relies on pulled registry data:

- run real Tauri path if possible
- click/pull registry data
- reload/reopen case
- inspect local SQLite/local vault
- confirm whether registry payload is persisted

Record result in Spectra.

Important existing concern:

```text
UI can pull registry data, but it is not yet confirmed that data is stored durably in DB/local vault.
```

### 3. PDF Font QA

When the first renderer exists, generate a sample PDF containing:

- `壹、產權調查表`
- `土地坐落`
- `附贈設備`
- `依標的物現況說明書賣方表達內容為準`
- `依買賣契約為準`

Acceptance:

- no garbled Chinese
- consistent Traditional Chinese rendering
- HTML preview and PDF both readable

## Do Not Start Yet

Do not start these until the disclosure MVP is clearer:

- SaaS payment/gateway
- Basic/Pro feature split details
- full opcOS/Gmail-like ecosystem structure
- new decorative PDF templates

## Current Validation

Last known validation:

```text
spectra validate aire-license-local-vault-architecture
✓ aire-license-local-vault-architecture — valid
```
