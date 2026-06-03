# Browser Device ID

## R1: Device Identification

Each browser instance MUST generate a stable device identifier for license binding.

#### R1-S1: Device ID generation

WHEN a user opens AIRE in a browser for the first time
THEN the application MUST generate a `device_uuid` using `crypto.randomUUID()`
AND store it in LocalStorage under key `aire_device_uuid`
AND collect browser fingerprint components: canvas hash, installed fonts, WebGL renderer, timezone, screen resolution, color depth
AND compute `device_id = SHA-256(device_uuid + "|" + browser_fingerprint)`
AND store `device_id` in LocalStorage under key `aire_device_id`

#### R1-S2: Device ID stability

WHEN a user returns to AIRE in the same browser profile on the same device
THEN the application MUST read the existing `device_uuid` and `device_id` from LocalStorage
AND regenerate the same `device_id` (same UUID + same fingerprint = same hash)
AND the license verification MUST recognize this as the same device

#### R1-S3: New device detection

WHEN a user opens AIRE in a different browser, or clears LocalStorage, or uses incognito mode
THEN the application MUST generate a new `device_uuid`
AND produce a different `device_id`
AND the license system MUST treat this as a new device
AND the user MUST NOT be able to use the same license key without transferring it from the previous device

## R2: License Binding — Strict Single Device

The device identifier MUST be used for strict single-device license activation.

#### R2-S1: Activation with device ID

WHEN a user enters a license key for the first time on a device
THEN the application MUST send `POST /api/license/activate`
WITH body `{ "license_key": "...", "device_id": "...", "device_name": "...", "os_version": "..." }`
AND the server MUST bind the license to this device_id exclusively
AND the server MUST reject any subsequent activation request for the same license key from a different device_id

#### R2-S2: License transfer — self-service deactivation

WHEN a user clicks "解除裝置綁定" on an activated device
AND the user enters their master password for verification
THEN the application MUST send `POST /api/license/deactivate`
WITH body `{ "license_key": "...", "device_id": "..." }`
AND the server MUST remove the device_id binding for this license key
AND the application MUST enter trial mode after successful deactivation

#### R2-S3: License transfer — admin override

WHEN a user contacts customer support because their previous device is inaccessible (damaged, lost, reinstalled)
AND the support agent verifies the user's identity and license ownership
THEN the support agent MUST be able to manually release the device_id binding from the OPCOS admin dashboard
AND the user MUST be able to activate the license on their new device within 5 minutes

#### R2-S4: Verification on startup

WHEN the application initializes
THEN it MUST call `POST /api/license/verify`
WITH body `{ "license_key": "...", "device_id": "..." }`
AND if the response status is "active" AND the device_id matches, the application MUST allow full functionality
AND if the response status is "active" BUT the device_id does not match, the application MUST show "此序號已綁定其他裝置，請聯絡客服或申請授權轉移"
AND if the response status is not "active", the application MUST show the license activation screen

#### R2-S5: Device lock enforcement

WHEN a license is bound to a device_id
THEN the application MUST store the license_key locally
AND on every startup, it MUST verify that the current device's device_id matches the bound device_id
AND if they do not match, the application MUST restrict functionality to trial mode (max 3 cases, no PDF export)
AND it MUST NOT allow any operation that could leak case data

## R3: Device Information

The browser application MUST provide meaningful device information for support and auditing.

#### R3-S1: Device name

WHEN sending device information to the license server
THEN `device_name` MUST be derived from `navigator.userAgent` in a human-readable format
EXAMPLE: "Chrome 125 on Windows 10" instead of the full user agent string

#### R3-S2: OS version

WHEN sending device information
THEN `os_version` MUST be derived from the user agent or `navigator.platform`
AND it MUST distinguish between Windows, macOS, Linux, iOS, and Android at minimum

## R4: better-auth Integration

The application MUST use better-auth for user authentication, integrated with the OPCOS license system.

#### R4-S1: Two-phase authentication and authorization

WHEN a user accesses AIRE for the first time
THEN they MUST complete Phase 1: Authentication — register or log in with email and password via better-auth
AND after successful authentication, they MUST complete Phase 2: Authorization — enter their OPCOS license key
AND only after both phases are complete MUST the application grant full functionality

#### R4-S2: Session management

WHEN a user successfully authenticates via better-auth
THEN a session cookie MUST be established with the following properties:
- `httpOnly: true`
- `secure: true` (in production)
- `sameSite: lax`
- Max-age: 30 days
AND the session data MUST be stored in the browser SQLite database (wa-sqlite)

#### R4-S3: Password reset

WHEN a user clicks "忘記密碼"
THEN the application MUST send a password reset email via better-auth's built-in mechanism
AND the reset token MUST expire after 1 hour
AND the reset link MUST be sent to the email address associated with the account

#### R4-S4: Trial mode for unlicensed users

WHEN a user has completed authentication (Phase 1) but has not activated a license (Phase 2)
THEN the application MUST allow trial mode with the following restrictions:
- Maximum 3 cases can be created
- PDF export is disabled
- Watermark "試用版" MUST appear on all previews
- A prominent "升級正式版" CTA MUST be displayed

#### R4-S5: Account deletion

WHEN a user requests account deletion
THEN the application MUST delete all better-auth session and user data from the browser
AND the application MUST NOT delete case data or the OPCOS license binding
AND the user MUST be warned that case data will remain on the device unless manually exported
