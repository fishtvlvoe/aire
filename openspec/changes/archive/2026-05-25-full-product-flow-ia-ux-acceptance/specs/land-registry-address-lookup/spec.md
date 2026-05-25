## ADDED Requirements

### Requirement: Address-to-property classification fallback

When live registry lookup is unavailable, fallback classification SHALL use conservative labels. The fallback SHALL classify normal building addresses as 建物, explicit land/farm-address inputs as 土地, and ambiguous inputs as 需要人工確認. It SHALL NOT infer 農地 or 農舍 unless the input or official result explicitly contains that classification.

#### Scenario: Building address remains building

- **WHEN** fallback classification receives 台南市永康區勝利街58巷4號1樓
- **THEN** the display type is 建物
- **AND** the display type is not 農地 or 農舍

#### Scenario: Explicit land input remains land

- **WHEN** fallback classification receives an address or identifier containing 土地、地號 or 農地
- **THEN** the display type is 土地

##### Example: explicit land input

- **GIVEN** live registry lookup is unavailable
- **WHEN** fallback classification receives `台南市永康區勝利段 123 地號`
- **THEN** the display type is 土地
