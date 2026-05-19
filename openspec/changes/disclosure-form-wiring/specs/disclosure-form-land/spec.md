## ADDED Requirements

### Requirement: Integration with CaseWizard Step 3

`DisclosureFormLand` SHALL accept `caseId: string`, `initialPayload: Record<string, unknown>`, and `onChange: (payload: Record<string, unknown>) => void` as props. When `initialPayload` is provided, all fields SHALL be pre-populated with its values. On any field change, `onChange` SHALL be called with the full updated payload. The component SHALL NOT manage its own persistence; persistence is handled by the parent step via `use-draft-autosave`.

#### Scenario: Pre-populated land form

- **WHEN** `DisclosureFormLand` receives a non-empty `initialPayload`
- **THEN** all matching fields are filled with the values from `initialPayload`

#### Scenario: Field change propagation

- **WHEN** the user changes any land disclosure field
- **THEN** `onChange` is called with the complete updated form payload
