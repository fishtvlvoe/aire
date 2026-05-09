## MODIFIED Requirements

### Requirement: Encrypted token storage

The Electron app SHALL store the OpenAI token using encryption instead of plaintext JSON.

#### Scenario: Token save

- **WHEN** the user authenticates and receives an OpenAI token
- **THEN** the token is stored encrypted at ~/.three-ai/openai-token.json using the existing key-store encryption module

#### Scenario: Token read

- **WHEN** the app needs to read the stored token
- **THEN** the token is decrypted in memory and never written to logs or renderer process
