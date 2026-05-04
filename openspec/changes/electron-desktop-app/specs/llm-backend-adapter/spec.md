## ADDED Requirements

### Requirement: Environment-based adapter locking

The LLM backend adapter selector SHALL respect the NEXT_PUBLIC_APP_MODE environment variable to restrict available backends.

#### Scenario: Production mode locks to Codex

- **WHEN** NEXT_PUBLIC_APP_MODE is "production"
- **THEN** only the Codex adapter SHALL be instantiated and used
- **THEN** no backend switching UI SHALL be rendered

#### Scenario: Development mode allows all adapters

- **WHEN** NEXT_PUBLIC_APP_MODE is "development"
- **THEN** Claude, Gemini, and Codex adapters SHALL all be available for selection

##### Example: Dev mode adapter list

- **GIVEN** .env has NEXT_PUBLIC_APP_MODE=development
- **WHEN** developer opens /settings page
- **THEN** LLM dropdown SHALL show three options: "Claude"、"Gemini"、"Codex"
