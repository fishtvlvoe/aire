# recovery-code-mechanism Specification

## Purpose

Generate a single-use recovery code from the BIP39 English wordlist when the master password is first set, force the customer to save it through three explicit actions, and let the customer reset their master password using the recovery code without exposing or recovering the original password.

## ADDED Requirements

### Requirement: System SHALL generate 12 BIP39 English words on first-time master password setup

The system SHALL draw 128 bits of entropy from a cryptographically secure random source and encode them as exactly 12 words from the BIP39 English wordlist version published by the bitcoin-core project. The system SHALL display the recovery code as 12 lowercase space-separated words in the order generated.

#### Scenario: Recovery code has 12 BIP39 English words

- **WHEN** the user completes first-time master password setup
- **THEN** the UI displays a recovery code containing exactly 12 lowercase space-separated tokens, every token appearing in the BIP39 English wordlist

### Requirement: First-time recovery code modal SHALL block close until 3 actions complete

The system SHALL present the recovery code in a modal dialog whose close button remains disabled until all three of these actions complete: the user clicks "Print" (invoking the OS print dialog), the user clicks "Download PDF copy" (writing a recovery code PDF to a user-chosen path), and the user toggles the checkbox confirming "我已將救援碼保存於實體保險箱 / 安全位置". The modal SHALL NOT be dismissible by Escape key or by clicking outside.

#### Scenario: Close button is disabled until all three actions complete

- **WHEN** the modal is displayed and the user has completed only two of the three required actions
- **THEN** the close button has the `disabled` attribute set and clicks on the close button do not dismiss the modal

#### Scenario: All three actions enable the close button

- **WHEN** the user has completed Print, Download PDF, and the checkbox confirmation
- **THEN** the close button no longer has the `disabled` attribute and clicking it dismisses the modal

#### Scenario: Escape and outside-click are blocked

- **WHEN** the modal is displayed and the user presses Escape or clicks outside the modal
- **THEN** the modal remains open

##### Example: Playwright assertions

- **GIVEN** the recovery code modal is open with 0 of 3 actions completed
- **WHEN** the test runs:
  ```javascript
  await page.keyboard.press('Escape');
  await page.locator('[data-testid="modal-backdrop"]').click({ position: { x: 5, y: 5 } });
  ```
- **THEN** `await page.locator('[data-testid="recovery-modal"]').isVisible()` returns `true` after both interactions

### Requirement: Recovery code SHALL derive a separate vault key with Argon2id

The system SHALL apply the same Argon2id parameters (`m_cost = 19456`, `t_cost = 2`, `p_cost = 1`) to the 12-word recovery code (joined with single spaces, lowercase) using a per-keystore random salt of 16 bytes distinct from the master password salt. The derived 32-byte key SHALL be used as the AES-GCM key that wraps the SQLCipher key in `vault_recovery`.

#### Scenario: Recovery vault unlocks with correct recovery code

- **WHEN** the user enters the correct 12 BIP39 words during reset
- **THEN** the system derives the wrapping key, decrypts `vault_recovery`, and recovers the same 32-byte SQLCipher key stored in `vault_master`

### Requirement: Recovery code reset SHALL rotate the recovery code and require new master password

The system SHALL accept a recovery code, recover the SQLCipher key from `vault_recovery`, and then require the user to set a new master password. On successful reset, the system SHALL generate a new 12-word recovery code, regenerate `vault_master` and `vault_recovery` with new salts and nonces, and surface the new recovery code through the same 3-action modal flow. The previous recovery code and previous master password SHALL no longer unlock the database.

#### Scenario: Reset with valid recovery code rotates both credentials

- **WHEN** the user enters the valid recovery code, sets a new master password, and completes the new recovery code modal
- **THEN** unlocking with the new master password succeeds AND unlocking with the previous master password fails AND unlocking with the previous recovery code fails

##### Example: Concrete reset sequence

- **GIVEN** initial state: master password = `OldPass2026!`, recovery code = `apple banana cherry dog elephant fox grape hat ice jacket kite lion`
- **WHEN** the user runs the reset flow with the recovery code, sets new master password = `NewPass2026!`, completes the new modal, and the system issues new recovery code = `mango nest ocean pig queen rabbit sun tree umbrella van whale yard`
- **THEN** the following assertions all hold:
  - `unlock_with_master_password("NewPass2026!")` returns `Ok(())`
  - `unlock_with_master_password("OldPass2026!")` returns `Err(WrongPassword)`
  - `unlock_with_recovery_code("apple banana cherry dog elephant fox grape hat ice jacket kite lion")` returns `Err(WrongRecoveryCode)`
  - `unlock_with_recovery_code("mango nest ocean pig queen rabbit sun tree umbrella van whale yard")` returns `Ok(())`

### Requirement: Recovery code input SHALL validate against BIP39 wordlist before deriving

The system SHALL parse the user input by lowercasing, trimming, and splitting on whitespace. The system SHALL reject the input with `UnlockError::InvalidRecoveryCodeFormat` if the result does not contain exactly 12 tokens or if any token is absent from the BIP39 English wordlist, identifying the first invalid token in the error.

#### Scenario: Recovery code with a non-BIP39 word is rejected

- **WHEN** the user submits a 12-word recovery code in which the third word is not in the BIP39 English wordlist
- **THEN** the system surfaces `UnlockError::InvalidRecoveryCodeFormat` and the UI highlights the third word with the message "此字不在救援碼字典內"

#### Scenario: Recovery code with wrong word count is rejected

- **WHEN** the user submits a recovery code containing 11 or 13 tokens after splitting on whitespace
- **THEN** the system surfaces `UnlockError::InvalidRecoveryCodeFormat` and the UI displays "救援碼必須為 12 個英文單字"

### Requirement: System SHALL never persist the recovery code

The system SHALL hold the recovery code only in process memory for the duration required to derive the wrapping key and SHALL zeroize the buffer immediately after derivation. The system SHALL NOT write the recovery code to disk, log files, telemetry, or crash dumps. The PDF generated by the "Download PDF copy" action SHALL be written to a user-chosen path outside the app's data directory and SHALL NOT be retained by the app after the file handle closes.

#### Scenario: Recovery code is not present in app data after modal closes

- **WHEN** the user dismisses the recovery code modal after completing the 3 required actions
- **THEN** no file under the app's local data directory contains the 12-word recovery code in plaintext or any reversible encoding
