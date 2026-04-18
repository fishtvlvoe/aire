## ADDED Requirements

### Requirement: Top navigation stepper shows five-stage progress on listing pages

The system SHALL render a top navigation stepper on every `/listings/[id]/*` page (fill, supplementary, generating, documents) above the page title. The stepper SHALL display five fixed stages in order: 選類型, 現勘, 補件, 產生中, 文件輸出.

Each stage SHALL display one of three visual states:
- Green (completed): the stage has been reached based on `listing.status`
- Blue (current): the stage matches the currently open page
- Gray (pending): the stage has not been reached

The status-to-stage mapping SHALL be:
- `draft` → stages 1 green, 2 blue/green, 3-5 gray
- `field-visit-complete` → stages 1-2 green, 3 blue/green, 4-5 gray
- `ready-for-generation` → stages 1-3 green, 4 blue/green, 5 gray
- `documents-ready` → stages 1-4 green, 5 blue/green

Stages in green or blue state SHALL be clickable and SHALL navigate to the corresponding page. Stages in gray state SHALL NOT be clickable and MUST show `cursor-not-allowed`. Stage 1 (選類型) SHALL render as green but non-clickable when viewed from any `/listings/[id]/*` page because the property type cannot be changed after creation.

#### Scenario: Stepper on documents page with documents-ready status

- **WHEN** a user opens `/listings/5/documents` and the listing has status `documents-ready`
- **THEN** stages 1-4 SHALL be green and clickable
- **THEN** stage 5 SHALL be blue and marked as the current page
- **THEN** clicking stage 2 SHALL navigate the user to `/listings/5/fill`

#### Scenario: Stepper on fill page with draft status

- **WHEN** a user opens `/listings/5/fill` and the listing has status `draft`
- **THEN** stage 1 SHALL be green and non-clickable
- **THEN** stage 2 SHALL be blue and marked as the current page
- **THEN** stages 3-5 SHALL be gray and non-clickable

#### Scenario: Stepper does not allow skipping ahead

- **WHEN** a user views stages 3-5 in gray state
- **THEN** clicking any gray stage SHALL NOT navigate to any page
- **THEN** the gray stages SHALL visually indicate a disabled state (reduced opacity or `cursor-not-allowed`)

### Requirement: Listing page row navigation depends on listing status

The listing page (`/listings`) SHALL route each listing row based on `listing.status`:
- WHEN `listing.status === 'documents-ready'` THEN the address link and action button SHALL navigate to `GET /listings/{id}/documents` and the action button label SHALL read `查看文件`.
- WHEN `listing.status` is any other value (`draft`, `field-visit-complete`, `ready-for-generation`) THEN the address link and action button SHALL navigate to `GET /listings/{id}/fill` and the action button label SHALL read `進入填寫`.

The routing rule SHALL be implemented as a pure function in `src/lib/listing-routes.ts` so that both the listings table and the sidebar recent-listings component share a single implementation.

#### Scenario: Click address on documents-ready listing

- **WHEN** user clicks the address of a listing whose status is `documents-ready`
- **THEN** the browser SHALL navigate to `/listings/{id}/documents` (HTTP 200 on initial render)

#### Scenario: Click action button on draft listing

- **WHEN** user clicks the action button on a listing whose status is `draft`
- **THEN** the browser SHALL navigate to `/listings/{id}/fill`
- **THEN** the action button SHALL display the label `進入填寫`

#### Scenario: Empty listings table

- **WHEN** the listings list is empty
- **THEN** no routing rules SHALL be triggered and an empty-state message SHALL be displayed

### Requirement: Sidebar shows recent listings for quick access

The sidebar SHALL display a section below the existing navigation items titled `最近物件`. This section SHALL render up to five most recently created listings ordered by `created_at` descending. Each item SHALL show the listing address (truncated to 20 characters with ellipsis when longer) and a status badge.

Clicking any item SHALL navigate using the same routing rule defined in the Listing page row navigation requirement: `documents-ready` → `/listings/{id}/documents`; otherwise `/listings/{id}/fill`.

The sidebar SHALL fetch recent listings by calling `GET /api/listings` once per page mount and SHALL slice the first 5 entries sorted by `created_at` descending on the client. When the listings list is empty the section SHALL display the placeholder text `尚無物件`.

#### Scenario: Sidebar shows five most recent listings

- **WHEN** the system has 8 listings in the database
- **THEN** the sidebar `最近物件` section SHALL show exactly 5 entries
- **THEN** the entries SHALL be ordered by `created_at` descending

#### Scenario: Sidebar with no listings

- **WHEN** the listings list is empty
- **THEN** the sidebar SHALL display `尚無物件` under `最近物件`

#### Scenario: Click on recent listing navigates by status

- **WHEN** user clicks a recent-listing entry whose listing status is `documents-ready`
- **THEN** the browser SHALL navigate to `/listings/{id}/documents`
