## Design

### PDF output trust boundary

The browser-dev mock backend is useful for UI acceptance, but its hard-coded payload must not look like verified official data in a customer-facing PDF. This SR keeps mock backend behavior intact for development, and adds a PDF assembly guardrail for known placeholder values.

### Mapping rules

- `cover.propertyName` SHALL use `caseRow.case_name` when present.
- `cover.propertyName` SHALL fall back to `caseRow.address` when the case has no name.
- `buildingCertificateNo` SHALL be blank when the value is a known placeholder such as `北松字第012345號`.
- `propertySheet.floor` SHALL use the registry floor unless it is the known mock placeholder `013層` and the case address contains a specific floor like `8樓之1`.
- Address parsing SHALL be conservative: only use the address-derived floor when the text directly matches `<number>樓` or `<number>樓之<number>`.

### Preview behavior

The preview page SHALL render a loading placeholder until the generated PDF blob URL exists. The iframe SHALL only be mounted after `previewPdfUrl` is non-empty.

### Verification

Automated verification covers dossier mapping. Visible Chrome verification covers the full real-address path:

1. Delete old mock cases.
2. Create `裕農路測試案` with `台南市東區裕農路288巷17號8樓之1`.
3. Confirm registry detection returns building.
4. Confirm JSON source, supplement upload, field-visit answer, PDF check, preview, export.
5. Extract PDF text and check that no old/demo strings are present.

## Implementation Contract

- `assembleDossierData()` remains the single PDF dossier assembly entry point.
- The sanitizer only removes known placeholders; it must not remove legitimate unknown values broadly.
- The preview page must still export exactly the same generated blob used by the iframe preview.
- The app icon must be a lightweight local artifact and must not introduce network dependencies.
