# AIRE Browser Local-First Edition

## R1: Architecture — Browser-Only Delivery

The AIRE browser edition MUST run entirely within a web browser without requiring installation of a desktop application package.

#### R1-S1: User opens the application URL

WHEN a user navigates to the AIRE application URL in a modern web browser (Chrome 120+, Edge 120+, Safari 17+, Firefox 121+)
THEN the application MUST load and initialize within 3 seconds on a standard broadband connection (50 Mbps)
AND the user MUST be able to interact with the UI without installing any software

#### R1-S2: No desktop installer required

WHEN a user accesses AIRE on Windows, macOS, or Linux
THEN the browser edition MUST NOT require downloading or executing `.exe`, `.msi`, `.dmg`, or `.app` files
AND the browser edition MUST NOT trigger operating system security warnings

## R2: Data Sovereignty — All Data Stored Locally

All user data including cases, drafts, settings, and PDF assets MUST be stored on the user's device. No case data SHALL be transmitted to or stored on cloud servers.

#### R2-S1: Case data persistence across sessions

WHEN a user creates a case with address, land lot numbers, and owner information
AND the user closes the browser tab
AND the user reopens the application URL in the same browser profile
THEN the case MUST be retrievable with all fields intact
AND the retrieval MUST complete within 500 milliseconds

#### R2-S2: No cloud data transmission

WHEN a user saves or modifies any case data
THEN the application MUST NOT transmit case content, owner names, addresses, or land registry data to any remote server except through the API gateway for external API queries
AND the API gateway MUST only receive query parameters (e.g., section number, lot number), never case content

## R3: Database — SQLite in Browser

The application MUST use a SQLite-compatible database engine running within the browser via WebAssembly.

#### R3-S1: Schema compatibility

WHEN the browser edition initializes for the first time
THEN it MUST execute all existing SQLite migrations (001_initial.sql through 013_registry_payloads.sql)
AND the resulting schema MUST be compatible with the existing SQLite schema (shared with the Node local edition's better-sqlite3)

#### R3-S2: WAL mode support

WHEN the database performs concurrent read and write operations
THEN the SQLite WASM engine MUST support WAL (Write-Ahead Logging) mode
AND concurrent reads MUST NOT block writes

#### R3-S3: Storage backend

WHEN the SQLite WASM engine persists data
THEN it MUST use the Origin Private File System (OPFS) as the primary storage backend
AND if OPFS is unavailable, it MUST fall back to IndexedDB

## R4: Encryption — Application-Layer Encryption

Sensitive data stored in the browser database MUST be encrypted using Web Crypto API.

#### R4-S1: Master password derivation

WHEN a user sets a master password during first-time setup
THEN the application MUST derive a 256-bit key using argon2id (WASM implementation)
WITH a randomly generated 16-byte salt stored in IndexedDB
AND the argon2id parameters MUST be: memory=64MB, iterations=3, parallelism=4

#### R4-S2: Field-level encryption

WHEN case data containing owner names, ID numbers, or addresses is saved
THEN sensitive fields MUST be encrypted using AES-GCM with the derived key
AND the ciphertext MUST be stored in the SQLite database
AND non-sensitive fields (case status, creation date) SHALL NOT be required to be encrypted

#### R4-S3: Password verification

WHEN a user enters their master password to unlock the application
THEN the application MUST verify the password by attempting to decrypt a stored verifier
AND if decryption fails, the application MUST reject the password within 1 second
AND if decryption succeeds, the derived key MUST be held in memory only (never persisted to storage)

## R5: File Storage — OPFS for PDF and Assets

PDF exports, floor plan sketches, and case assets MUST be stored in the browser's Origin Private File System.

#### R5-S1: PDF export storage

WHEN a user exports a case to PDF
THEN the generated PDF MUST be written to OPFS under `/exports/{case_id}/{timestamp}.pdf`
AND the file MUST be readable by the application on subsequent sessions

#### R5-S2: Case asset import

WHEN a user imports an image or document as a case asset
THEN the file bytes MUST be stored in OPFS under `/cases/{case_id}/assets/{asset_id}.{ext}`
AND the asset MUST be retrievable with the original filename and MIME type preserved

#### R5-S3: Export to user-visible location

WHEN a user clicks "Export to Downloads"
THEN the application MUST use the File System Access API (showSaveFilePicker) to let the user choose a destination folder
AND write the selected file to that location
AND if File System Access API is unavailable, fall back to standard browser download

## R6: UI Code Reuse — Minimal Frontend Changes

The browser edition MUST reuse the existing Next.js UI components with minimal modification.

#### R6-S1: Component compatibility

WHEN the browser edition renders any page from the existing Next.js App Router
THEN all React components MUST function identically to the existing local edition
EXCEPT for file system operations which use OPFS instead of the local edition's file system APIs

#### R6-S2: IPC removal

WHEN the browser edition makes a data operation
THEN it MUST NOT use Tauri's `invoke()` mechanism
AND it MUST use either browser-native APIs (IndexedDB, OPFS, fetch) or the browser SQLite layer

## R7: Offline Operation

The browser edition MUST support offline operation for all local data operations.

#### R7-S1: Offline case editing

WHEN the user's device loses network connectivity
THEN the user MUST still be able to create, read, update, and delete cases
AND all changes MUST be persisted to local storage

#### R7-S2: Offline PDF generation

WHEN the user's device is offline
THEN the user MUST still be able to generate PDF exports
AND the PDF MUST be written to OPFS

#### R7-S3: Online requirement indicator

WHEN external API operations (land registry query, legal clause sync, license verification) are attempted while offline
THEN the application MUST display a clear "需連線網路" indicator
AND MUST NOT crash or corrupt local data
