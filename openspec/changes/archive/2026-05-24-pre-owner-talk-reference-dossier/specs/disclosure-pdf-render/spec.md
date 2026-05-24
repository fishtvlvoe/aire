## ADDED Requirements

### Requirement: Pre-owner-talk PDF renders reference disclaimers and blanks

The PDF renderer SHALL preserve the pre-owner-talk distinction between reference values and blank formal fields. Candidate or inferred PDFs SHALL include the fixed formal-title disclaimer, and unavailable formal-rights fields SHALL remain visually blank instead of being filled with generic waiting text.

#### Scenario: Reference PDF includes formal-title disclaimer

- **WHEN** a PDF contains candidate or inferred reference values
- **THEN** the PDF text includes `地政資料，最終以正式謄本為主；本說明書不代表完整資訊。`
- **AND** source labels make candidate and inferred values distinguishable from formal registry values

#### Scenario: Blank rows remain printable for handwriting

- **WHEN** a formal-rights field has no reliable source
- **THEN** the PDF row keeps an empty value area
- **AND** the PDF text extraction does not include `尚待正式謄本或屋主權狀確認` for that field
- **AND** the row remains present so the printed form can be completed by hand
