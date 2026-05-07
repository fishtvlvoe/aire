## ADDED Requirements

### Requirement: Codex setup page

The system SHALL provide a dedicated setup page at `/setup/codex` where users input their OpenAI API Key after completing the License setup step.

#### Scenario: Navigate to Codex setup after License

- **WHEN** user completes License activation on `/setup` (Step 1)
- **THEN** system SHALL redirect to `/setup/codex` (Step 2)

#### Scenario: API Key input form

- **WHEN** user lands on `/setup/codex`
- **THEN** the page SHALL display:
  - A text input field for OpenAI API Key (masked with dots, type="password")
  - A "驗證" (Verify) button
  - A "跳過" (Skip) button

#### Scenario: Skip setup

- **WHEN** user clicks "跳過" on `/setup/codex`
- **THEN** system SHALL redirect to `/` (homepage) without storing any API Key

### Requirement: API Key verification endpoint

The system SHALL provide an API endpoint `POST /api/setup/verify-openai` that validates an OpenAI API Key by calling the OpenAI `GET /v1/models` endpoint.

#### Scenario: Valid API Key

- **WHEN** client sends `POST /api/setup/verify-openai` with body `{ "apiKey": "sk-proj-abc123..." }`
- **THEN** the endpoint SHALL call `GET https://api.openai.com/v1/models` with `Authorization: Bearer sk-proj-abc123...`
- **THEN** if OpenAI returns HTTP 200, the endpoint SHALL return `{ "valid": true }` with status 200

#### Scenario: Invalid API Key

- **WHEN** client sends `POST /api/setup/verify-openai` with an invalid API Key
- **THEN** the endpoint SHALL return `{ "valid": false, "error": "API Key 無效" }` with status 200

#### Scenario: OpenAI unreachable

- **WHEN** the OpenAI API does not respond within 5 seconds
- **THEN** the endpoint SHALL return `{ "valid": false, "error": "無法連線 OpenAI，請檢查網路" }` with status 200

##### Example: verification responses

| API Key | OpenAI Response | Endpoint Response |
|---------|----------------|-------------------|
| `sk-proj-valid123` | 200 OK | `{ "valid": true }` |
| `sk-proj-invalid` | 401 Unauthorized | `{ "valid": false, "error": "API Key 無效" }` |
| (timeout) | no response in 5s | `{ "valid": false, "error": "無法連線 OpenAI，請檢查網路" }` |

### Requirement: API Key encrypted storage

The system SHALL encrypt OpenAI API Keys using AES-256-GCM before storing in the SQLite `settings` table. The encryption key SHALL be derived from machine-specific characteristics (hostname + OS username + application salt) using `crypto.scryptSync`.

#### Scenario: Store API Key

- **WHEN** user submits a valid API Key on `/setup/codex` and verification succeeds
- **THEN** system SHALL encrypt the API Key with AES-256-GCM and store the ciphertext in the `settings` table with key `openai_api_key`

#### Scenario: Retrieve API Key

- **WHEN** the application needs the OpenAI API Key for LLM calls
- **THEN** `key-store.ts` SHALL read the ciphertext from `settings` table, decrypt with the same machine-derived key, and return the plaintext API Key

#### Scenario: Decryption failure on different machine

- **WHEN** the SQLite database file is copied to a machine with different hostname or username
- **THEN** decryption SHALL fail, `key-store.ts` SHALL delete the corrupted entry and return `null`

##### Example: key derivation input

- **GIVEN** hostname = "fish-macbook", username = "fish", salt = "three-ai-v1"
- **WHEN** `scryptSync("fish-macbook:fish:three-ai-v1", "three-ai-aes", 32)` is called
- **THEN** a deterministic 32-byte key SHALL be produced for AES-256-GCM
