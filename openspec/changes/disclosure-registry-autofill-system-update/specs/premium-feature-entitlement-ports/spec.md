# premium-feature-entitlement-ports Specification

## Purpose

Defines stable UI gates and frontend/backend ports for future paid AIRE capabilities such as Google Maps, advanced GIS layers, Street View, AI floor plan schematic generation, and marketing modules.

## ADDED Requirements

### Requirement: Premium feature entitlement ports SHALL expose locked and unlocked feature UI

The system SHALL render future paid features in predictable settings or admin UI locations even when the current user is not entitled to use them.

Each premium feature gate SHALL include feature id, display label, required plan, current entitlement state, short user-facing description, and next action.

Locked features SHALL show an upgrade action in settings or admin surfaces instead of failing silently. Unlocked but not-yet-implemented features SHALL show a "coming soon" or "reserved" state instead of an error.

The first reserved feature ids SHALL include `google_maps_location`, `google_street_view`, `advanced_gis_layers`, `ai_floor_plan_schematic`, and `marketing_modules`.

#### Scenario: Google Maps is visible but locked for a basic plan

- **GIVEN** the active plan is `basic`
- **AND** feature `google_maps_location` requires `pro`
- **WHEN** the user opens the system settings or admin feature panel
- **THEN** the Google Maps location card SHALL be visible in the upgrade feature area
- **AND** the card SHALL show a locked state and an upgrade action
- **AND** the system SHALL NOT attempt to call the Google Maps preview port

#### Scenario: Advanced user sees AI floor plan as reserved when backend is not implemented

- **GIVEN** the active plan is `advanced`
- **AND** feature `ai_floor_plan_schematic` is entitled
- **AND** the backend port returns `FeatureNotAvailable`
- **WHEN** the user opens the AI floor plan card
- **THEN** the card SHALL show a reserved or coming-soon state
- **AND** the UI SHALL NOT present the result as a runtime failure

### Requirement: Premium feature menus SHALL appear only after entitlement

The main AIRE navigation SHALL keep Basic users focused on the original land-registry workflow.

Basic users SHALL see only core folders such as case management, land registry data, output documents, and settings. Premium feature menus such as advanced maps, AI floor plan, Street View, aerial photo, and marketing modules SHALL NOT appear in the main workspace navigation until the license entitlement allows them.

The settings or admin feature panel SHALL still list unavailable premium features as disabled controls so users can understand upgrade options without adding global upgrade controls to every case workspace.

#### Scenario: Basic navigation hides premium menus

- **GIVEN** the active plan is `basic`
- **WHEN** the user opens the main AIRE sidebar
- **THEN** the sidebar SHALL show the core land-registry workflow folders
- **AND** the sidebar SHALL NOT show advanced maps, AI floor plan, Street View, aerial photo, or marketing module folders
- **AND** the settings feature panel SHALL show those premium features as disabled upgrade controls

#### Scenario: Pro navigation shows advanced map folder

- **GIVEN** the active plan is `pro`
- **AND** feature `google_maps_location` is entitled
- **WHEN** the user opens the main AIRE sidebar
- **THEN** the sidebar SHALL include an advanced maps folder
- **AND** the folder SHALL include the Google Maps or landmark map entry

### Requirement: Premium feature controls SHALL use disabled and enabled toggle states

Admin and settings surfaces SHALL render premium feature controls as iOS-style toggle switches.

If the account or license is not entitled to a feature, the toggle SHALL be grey, disabled, and paired with an upgrade action.

If the account or license is entitled to a feature, the toggle SHALL be enabled and allow the user to turn the local feature on or off without changing the subscription.

The toggle state SHALL represent local enablement for an entitled feature; entitlement state SHALL come from OPCOS/license verification and SHALL NOT be overridden by the local toggle.

#### Scenario: Locked feature toggle is grey and disabled

- **GIVEN** the active plan is `basic`
- **AND** feature `google_maps_location` requires `pro`
- **WHEN** the admin opens the upgrade feature settings panel
- **THEN** the Google Maps toggle SHALL be visible in the off position
- **AND** the toggle SHALL be grey and disabled
- **AND** the row SHALL show an upgrade action

#### Scenario: Entitled feature toggle can be turned on and off

- **GIVEN** the active plan is `pro`
- **AND** feature `google_maps_location` is entitled
- **WHEN** the admin opens the upgrade feature settings panel
- **THEN** the Google Maps toggle SHALL be enabled
- **WHEN** the admin turns the toggle off
- **THEN** local feature setting for `google_maps_location` SHALL become disabled
- **AND** the subscription entitlement SHALL remain unchanged

### Requirement: Premium feature slots SHALL reserve document locations and cost ownership

The system SHALL reserve document and workflow slots for aerial photo, landmark map, cadastral map, and original floor plan assets.

Each reserved slot SHALL define source type, entitlement feature id, default plan, cost owner, fallback behavior, and privacy boundary.

Allowed cost owner values SHALL include `customer_moi`, `aire_included`, `aire_metered`, `manual_upload`, `free_public`, and `unknown`.

Land-registry-derived cadastral map costs SHALL be classified as `customer_moi` when they use the customer's MOI/COP account. Google maps, aerial photo services, AI floor plan processing, and marketing modules SHALL be classified as `aire_included` or `aire_metered`.

#### Scenario: Basic user sees reserved floor plan upload slot

- **GIVEN** the active plan is `basic`
- **WHEN** the user edits the disclosure document assets
- **THEN** the original floor plan slot SHALL allow manual upload
- **AND** AI floor plan generation SHALL not appear as an active main-menu workflow
- **AND** the feature settings panel SHALL show AI floor plan as disabled until upgrade

#### Scenario: Cadastral map distinguishes MOI cost from AIRE processing

- **GIVEN** a cadastral map is generated from a MOI/COP land registry service
- **WHEN** the usage ledger classifies the cost
- **THEN** the MOI query cost owner SHALL be `customer_moi`
- **AND** any upgraded AIRE overlay or formatting step SHALL be classified separately as `aire_included` or `aire_metered`

### Requirement: Premium feature entitlement ports SHALL provide stable frontend and backend feature ports

The system SHALL define stable frontend adapter functions and Tauri/backend command names for premium features before the integrations are fully implemented.

The entitlement adapter SHALL expose at least `getEntitlements`, `canUseFeature`, `requestFeatureUpgrade`, and `openOpcosUpgrade`.

The reserved backend command names SHALL include `get_entitlements`, `request_feature_upgrade`, `open_opcos_upgrade`, `generate_google_map_preview`, `fetch_google_street_view_reference`, `generate_advanced_gis_overlay`, `generate_ai_floor_plan_schematic`, and `generate_marketing_assets`.

When a user lacks entitlement, feature ports SHALL return or throw an `UpgradeRequired` error. When a feature is entitled but not implemented, feature ports SHALL return or throw `FeatureNotAvailable`.

#### Scenario: Locked feature returns UpgradeRequired

- **GIVEN** a basic user invokes `generate_google_map_preview`
- **WHEN** the backend checks entitlement for `google_maps_location`
- **THEN** the command SHALL return `UpgradeRequired`
- **AND** the response SHALL include the required plan `pro`
- **AND** no external Google API request SHALL be sent

#### Scenario: Entitled reserved feature returns FeatureNotAvailable

- **GIVEN** an advanced user invokes `generate_ai_floor_plan_schematic`
- **AND** the AI floor plan implementation has not shipped
- **WHEN** the backend handles the command
- **THEN** the command SHALL return `FeatureNotAvailable`
- **AND** the response SHALL preserve the feature id `ai_floor_plan_schematic`

### Requirement: Premium feature ports SHALL protect local case privacy

Premium feature upgrade requests sent to OPCOS SHALL contain only account, device, license, plan, and requested feature metadata.

Requests SHALL NOT include owner data, full property address, land number, building number, registry payloads, PDFs, or uploaded case images.

#### Scenario: Upgrade request excludes case data

- **GIVEN** a user clicks upgrade on the Google Maps location card inside a case
- **WHEN** AIRE calls `request_feature_upgrade`
- **THEN** the request payload SHALL include requested feature id and current license/device reference
- **AND** the request payload SHALL NOT include case address, owner name, land number, building number, PDF bytes, or registry response payload
