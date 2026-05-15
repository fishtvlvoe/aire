## MODIFIED Requirements

### Requirement: mock-localstorage-persistence

Cases created in browser dev mode SHALL be serialized to localStorage under the key `aire-mock-store` alongside other persisted state (license, sessionUser, appSettings, featureFlags).

When the Next.js dev server restarts, the mock backend SHALL deserialize cases from localStorage so previously created cases remain available.

#### Scenario: Case survives dev server restart

WHEN a user creates a case with id="CASE-001" and address="台南市東區裕農路288巷17號8樓之1" in browser dev mode
AND the Next.js dev server is restarted
THEN the case SHALL appear in the cases list with the same id and address

##### Example:
- Before restart: cases = [CASE-001 "台南市東區裕農路288巷17號8樓之1"]
- After restart: cases list still contains CASE-001

#### Scenario: Empty localStorage on first load

WHEN localStorage key `aire-mock-store` does not exist or contains no cases field
THEN the mock backend SHALL load `SEED_CASES` as initial state (existing behavior preserved)

##### Example:
- Input: fresh browser session, no localStorage entry
- Output: cases list shows 2 default seed cases (台北市大安區, 新北市板橋區)

#### Scenario: Corrupted localStorage gracefully handled

WHEN localStorage value for `aire-mock-store` is not valid JSON (e.g., value is the string "CORRUPTED")
THEN the mock backend SHALL fall back to SEED_CASES
AND log `[mock-backend] localStorage parse error, using SEED_CASES` to browser console

##### Example:
- Input: localStorage["aire-mock-store"] = "CORRUPTED"
- Output: cases list = 2 seed cases; console.warn includes "[mock-backend] localStorage parse error"

## ADDED Requirements

### Requirement: dashboard-toast-provider

The dashboard layout SHALL mount a `<Toaster />` component (from `sonner`) so that all `toast.success()`, `toast.error()`, and `toast.warning()` calls are rendered visibly to the user.

#### Scenario: Save action shows success feedback

WHEN a user clicks 儲存 on any dashboard settings page (e.g., 地政 API 設定)
THEN a green success toast reading "儲存成功" SHALL appear within 500ms in the top-right corner

##### Example:
- Action: click 儲存 on 地政 API 設定
- Output: toast notification with text "儲存成功" visible for ~3 seconds

#### Scenario: Error action shows failure feedback

WHEN a save API call fails with an error
THEN a red error toast SHALL appear with a message describing the failure

##### Example:
- Action: save fails with error "API key invalid"
- Output: toast notification with text "儲存失敗：API key invalid"
