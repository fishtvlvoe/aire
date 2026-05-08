# Property Domain

Use this guide for property type registry, dynamic field sets, validation rules, fee/tax calculations, and commission lookup.

## Primary Code

- `src/lib/property-types/`
- `src/app/api/pre-commission/`
- Shared field/schema modules under `src/lib/schemas/`

## Specs to Open as Needed

- `openspec/specs/property-type-registry/spec.md`
- `openspec/specs/pre-commission-lookup/spec.md`
- `openspec/specs/tax-fee-auto-calculation/spec.md`

## Rules

- Keep property-type behavior centralized in the registry instead of duplicating branches across UI and API code.
- Field validation should follow schema definitions and property-type rules.
- External/cloud commission lookup calls must use the project rate-limiting and error-handling pattern when available.
- Update related docs/specs when adding a property type or changing required fields.

## Verification

- Test representative property types affected by the change.
- Include validation edge cases for missing, optional, and property-specific fields.
