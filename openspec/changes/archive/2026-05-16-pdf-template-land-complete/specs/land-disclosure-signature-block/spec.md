# land-disclosure-signature-block

## Purpose

Define the rendering rules for the signature block (簽章欄) at the end of the land disclosure PDF, aligned with the 105-year government-mandated format.

## ADDED Requirements

### Requirement: LandPages SHALL render a signature block page after Section Seven

The system SHALL render a PDF page (or section at the bottom of the last content page) containing a signature block with four columns:

1. 不動產經紀業 — company name, company seal placeholder, date line
2. 經紀人 — name, license number, seal placeholder, date line
3. 買方 — name, signature/seal placeholder, date line
4. 賣方 — name, signature/seal placeholder, date line

The signature block SHALL be implemented as a reusable `PdfSignatureBlock` component in `react-pdf-components.tsx` accepting `tokens: PdfTokens`.

Each column SHALL contain:
- A header label (職稱)
- A horizontal signature line (minimum 60pt wide)
- A date line labeled "日期：＿＿年＿＿月＿＿日"

The signature block is purely presentational — it does not accept data from `CaseDossierData`. All fields are blank for physical signing.

#### Scenario: Signature block renders as dedicated page

- **WHEN** `PdfDocument` renders with `propertyType: 'land'`
- **THEN** the last page of the PDF SHALL contain a signature block with four labeled columns for 不動產經紀業, 經紀人, 買方, and 賣方

#### Scenario: Signature block renders with correct visual structure

- **WHEN** the signature block page is rendered
- **THEN** each of the four columns SHALL contain a header label, a signature line, and a date line
- **AND** the layout SHALL be a 4-column horizontal arrangement fitting within A4 width
