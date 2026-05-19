## ADDED Requirements

### Requirement: Disclosure field completeness detection

`CaseSupplementDialog` SHALL call `get_draft(caseId)` and `getRequiredFields(propertyType)` on open. It SHALL compute the set of required fields whose value in `payload_json` is empty string, null, or undefined. The "缺少必填欄位" section SHALL list all such fields with their human-readable labels and editable inputs. Fields already filled SHALL NOT appear in this list.

#### Scenario: Case with empty disclosure fields

- **WHEN** the supplement dialog opens for a case whose `disclosure_drafts` payload has empty required fields
- **THEN** each empty required field appears as an editable input in the "缺少必填欄位" section

#### Scenario: Case with all disclosure fields filled

- **WHEN** the supplement dialog opens for a case whose `disclosure_drafts` payload has all required fields filled
- **THEN** the "缺少必填欄位" section shows no disclosure-related inputs

### Requirement: Save patched disclosure payload

When the user clicks "儲存" in the supplement dialog, the dialog SHALL merge the newly entered field values into the existing `payload_json` and call `save_draft(caseId, mergedPayload, schemaVersion)`. On success, the dialog SHALL close. On failure, a toast "儲存失敗，請重試" SHALL appear and the dialog SHALL remain open.

#### Scenario: Saving filled fields

- **WHEN** the user fills one or more empty fields and clicks "儲存"
- **THEN** `save_draft` is called with a payload that includes the new values merged with existing data, and the dialog closes
