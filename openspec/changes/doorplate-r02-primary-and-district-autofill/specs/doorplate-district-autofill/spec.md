# doorplate-district-autofill Specification

## ADDED Requirements

### Requirement: Missing district doorplate inputs SHALL attempt unique district autofill

When a doorplate address includes city, road, and house number but omits district/town, the system SHALL attempt district autofill before returning manual failure.

#### Scenario: Unique district autofill

- **WHEN** the input omits district but matches exactly one district candidate for the same city, road, and house number
- **THEN** the system SHALL autofill the district and continue the normal doorplate lookup flow

##### Example: `台南市永華路580號5樓之3` 唯一補成 `永康區`

- **GIVEN** input `台南市永華路580號5樓之3`
- **WHEN** the city, road, and house number map to exactly one district candidate
- **THEN** the system SHALL autofill the district and continue lookup as `台南市永康區永華路580號5樓之3`

#### Scenario: Ambiguous district candidates

- **WHEN** the input omits district and matches more than one district candidate
- **THEN** the system SHALL return district candidates for manual selection
- **THEN** the system SHALL NOT silently pick the first district

##### Example: 同市同路名跨兩區

- **GIVEN** an input whose city, road, and house number match both `A區` and `B區`
- **WHEN** district autofill returns more than one candidate
- **THEN** the system SHALL present both district candidates for selection
- **THEN** it SHALL NOT silently pick either district

#### Scenario: No district candidate found

- **WHEN** the input omits district and no district candidate is found
- **THEN** the system SHALL return `address_incomplete_missing_district`
- **THEN** the UI SHALL explain that district information is missing rather than saying no data exists
