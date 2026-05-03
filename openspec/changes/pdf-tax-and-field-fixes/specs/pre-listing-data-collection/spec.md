## ADDED Requirements

### Requirement: announced-land-price-parsing

The system SHALL extract the current declared land price (申報地價) per square metre from the OCR transcript text and store it as a structured numeric field `announced_land_price`.

The parser MUST recognise the following text patterns:
- 「當期申報地價：\<year\>年\<month\>月\<value\>元／平方公尺」
- 「申報地價：\<value\>元」

The value SHALL be normalised to a plain number (e.g., "10,188.0" → 10188).

If the pattern is absent or unparseable, `announced_land_price` SHALL remain `undefined` (no error thrown).

#### Scenario: parse 申報地價 from full-format text

- **WHEN** OCR text contains「當期申報地價：115年01月10,188.0元／平方公尺」
- **THEN** `announced_land_price` equals 10188

#### Scenario: absent 申報地價

- **WHEN** OCR text does not contain any 申報地價 keyword
- **THEN** `announced_land_price` is undefined
