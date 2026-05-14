## ADDED Requirements

### Requirement: Unified Backend Connection

The AIRE desktop application SHALL connect to the Zeabur-hosted Supastarter backend for authentication, license verification, user management, and file storage operations.

#### Scenario: Online mode — successful API connection

- WHEN the application starts with network connectivity
- THEN it SHALL connect to the configured Zeabur backend URL
- AND authenticate using Better-Auth session tokens
- AND display the main application interface

##### Example:

AIRE.app launches, sends GET to https://api.aire.tw/api/health. Response 200. App reads stored session token from Electron safeStorage, sends GET to https://api.aire.tw/api/auth/session with Authorization header. Response 200 with user profile. App renders main listing dashboard.

#### Scenario: Offline mode — no network

- WHEN the application starts without network connectivity
- THEN it SHALL display a limited offline mode
- AND allow PDF generation and OCR operations using local resources
- AND show a clear indicator that online features are unavailable

##### Example:

AIRE.app launches, GET to https://api.aire.tw/api/health times out after 5 seconds. App enters offline mode: toolbar shows orange "離線模式" badge. "產出文件" and "OCR 辨識" buttons remain active. "登入", "授權管理", "同步" buttons are grayed out with tooltip "需要網路連線".

#### Scenario: Backend URL configuration

- WHEN the application is first installed
- THEN it SHALL use the default Zeabur backend URL from build-time configuration
- AND the URL SHALL NOT be user-editable in production builds

##### Example:

electron-builder injects NEXT_PUBLIC_API_URL="https://api.aire.tw" at build time. The value is baked into the renderer bundle. No settings UI exposes this field. Dev builds use NEXT_PUBLIC_API_URL="http://localhost:3000" from .env.development.

### Requirement: Hybrid Electron Architecture

The Electron application SHALL use a hybrid architecture where online features connect to the remote backend and offline features run locally.

#### Scenario: Local-only features

- WHEN the user generates a PDF document
- THEN the generation SHALL use local Puppeteer without requiring network connectivity
- AND the generated file SHALL be saved locally first

##### Example:

User clicks "產出不動產說明書" for listing "台南市東區大學路100號". Electron main process spawns local Puppeteer, renders HTML template with listing data, outputs PDF to ~/Documents/AIRE/exports/listing-100-disclosure.pdf. No network request is made during generation.

#### Scenario: Remote-only features

- WHEN the user performs login, license verification, or user management
- THEN these operations SHALL be handled by the remote Supastarter backend
- AND SHALL NOT require a local Next.js server process

##### Example:

User clicks "登入" and enters email "agent@realty.tw" + password. Renderer sends POST to https://api.aire.tw/api/auth/sign-in with credentials. Backend returns session token. No localhost:3000 server is involved. Activity Monitor shows no "node server.js" child process.

#### Scenario: Electron window loading

- WHEN the Electron application starts in production mode
- THEN it SHALL load the application UI via loadFile (static HTML) or direct connection to the remote backend
- AND SHALL NOT spawn a local Next.js standalone server process

##### Example:

In electron/main.ts, createMainWindow calls mainWindow.loadURL("https://api.aire.tw") or mainWindow.loadFile("app/index.html"). The old launchNextServer() function in electron/launcher.ts is removed. ps aux shows no "node .next/standalone/server.js" process.

### Requirement: Drizzle ORM Data Layer

All database operations SHALL use Drizzle ORM with type-safe queries.

#### Scenario: Remote database operations

- WHEN the application performs CRUD operations on user, license, or listing data
- THEN it SHALL use Drizzle ORM queries against the PostgreSQL database on Zeabur

##### Example:

API route /api/listings GET handler: const listings = await db.select().from(listingsTable).where(eq(listingsTable.orgId, session.orgId)). Drizzle generates SQL: SELECT * FROM listings WHERE org_id = 'org_abc123'. Result is type-safe ListingRow[].

#### Scenario: Local SQLite cache

- WHEN the application needs offline access to listing data
- THEN it SHALL use Drizzle ORM with SQLite adapter for local caching
- AND sync with the remote PostgreSQL when connectivity is restored

##### Example:

Electron main process uses drizzle(betterSqlite3("~/Library/Application Support/AIRE/cache.db")) with SQLite adapter. On network restore, app fetches GET /api/listings?updatedAfter=2026-05-01T00:00:00Z from Zeabur, upserts results into local SQLite cache.

### Requirement: Better-Auth Integration

All authentication SHALL use Better-Auth provided by the Supastarter platform.

#### Scenario: User login

- WHEN a user enters credentials on the AIRE login page
- THEN the credentials SHALL be verified against the Better-Auth service on Zeabur
- AND a session token SHALL be issued and stored securely in the Electron app

##### Example:

User submits email "agent@realty.tw" and password on login page. Better-Auth client SDK calls POST https://api.aire.tw/api/auth/sign-in/email. Response: {"token": "eyJhbG...", "user": {"id": "usr_123", "name": "王小明"}}. Electron stores token via safeStorage.encryptString(token) to avoid plain-text storage.

#### Scenario: Multi-tenant organization access

- WHEN a user belongs to multiple organizations (real estate agencies)
- THEN the application SHALL allow switching between organizations
- AND data visibility SHALL be scoped to the selected organization via RBAC

##### Example:

User "王小明" belongs to "信義房屋台南店" (org_abc) and "永慶不動產安平店" (org_def). After login, app shows organization picker. User selects "信義房屋台南店". All subsequent API calls include header X-Organization-Id: org_abc. GET /api/listings returns only listings where org_id = 'org_abc'.

#### Scenario: Session persistence

- WHEN the user closes and reopens the AIRE desktop application
- THEN the existing session SHALL be restored if the token has not expired
- AND expired sessions SHALL redirect to the login page

##### Example:

User closes AIRE.app at 14:00. Token expiresAt is "2026-05-11T14:00:00Z" (24h TTL). User reopens at 15:00 same day. App reads token from safeStorage, checks expiry — still valid. App skips login, loads dashboard directly. If token had expired, app shows login page with message "登入已過期，請重新登入".
