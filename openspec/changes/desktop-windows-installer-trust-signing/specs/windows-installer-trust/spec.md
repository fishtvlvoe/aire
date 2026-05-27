# windows-installer-trust Specification

## Purpose

定義 AIRE Windows installer 在正式 release 前必須通過的簽章、信譽、誤判處理與 Windows VM 驗收要求。

## ADDED Requirements

### Requirement: Windows installer trust metadata

The system SHALL generate a trust metadata artifact for every Windows installer release candidate before it is marked customer-release-ready.

#### Scenario: Trust metadata is recorded for a release candidate

- **WHEN** GitHub Actions produces a Windows installer release candidate
- **THEN** the release pipeline records workflow run URL, commit SHA, installer filename, installer sha256, source artifact URL, signing status, publisher subject, certificate thumbprint, timestamp status, SmartScreen observation, Defender observation, and Windows VM smoke evidence paths
- **AND** the metadata is stored under artifacts/smoke/windows/trust/

### Requirement: Customer release requires trusted code signing

The system SHALL require a trusted Windows code signing signature before a Windows installer is marked customer-release-ready.

#### Scenario: Unsigned installer remains internal-only

- **WHEN** a Windows installer has no trusted code signing signature
- **THEN** the release checklist marks the installer as internal-only
- **AND** the release checklist MUST NOT mark the installer customer-release-ready

##### Example: unsigned NSIS installer

- **GIVEN** installer `AIRE_0.1.3_x64-setup.exe` has signing status `unsigned`
- **WHEN** the release checklist is generated
- **THEN** the Windows release status is `internal-only`

#### Scenario: Signed installer exposes verified publisher

- **WHEN** a Windows installer is signed with Azure Artifact Signing or an equivalent trusted code signing provider
- **THEN** signature verification succeeds against a Windows trusted root
- **AND** the installer exposes the configured AIRE publisher identity

##### Example: signed release candidate

- **GIVEN** installer `AIRE_0.1.4_x64-setup.exe` has publisher subject `AIRE`
- **WHEN** signature verification runs on Windows
- **THEN** the verification result is `valid`

### Requirement: SmartScreen warning classification

The system SHALL classify Windows install warnings separately as SmartScreen low-reputation warnings or Defender malware detections.

#### Scenario: Low-reputation SmartScreen warning does not block internal smoke

- **WHEN** SmartScreen shows a low-reputation or unrecognized-app warning without a Defender malware detection name
- **THEN** the internal Windows VM smoke SHALL continue only after manual acknowledgement
- **AND** the release evidence records that the installer is not yet customer-release-ready unless code signing and trust metadata pass

##### Example: SmartScreen only

- **GIVEN** SmartScreen shows `Windows protected your PC`
- **AND** Defender shows no malware detection name
- **WHEN** Fish acknowledges the warning in the UTM VM
- **THEN** the smoke result is recorded as `internal-only`

#### Scenario: Defender malware detection blocks release

- **WHEN** Windows Defender reports a concrete malware or unwanted software detection for the installer
- **THEN** the release gate fails
- **AND** the team submits the installer to Microsoft Security Intelligence for review
- **AND** the release evidence records the detection name, installer sha256, screenshot path, and submission evidence

### Requirement: Release documents distinguish runtime acceptance from trust acceptance

The system SHALL keep Windows runtime acceptance and installer trust acceptance as separate release checklist items.

#### Scenario: Runtime passes but trust gate is incomplete

- **WHEN** the installer launches successfully in the UTM Windows VM
- **AND** the installer is unsigned or lacks trust metadata
- **THEN** the release report SHALL mark Windows runtime smoke as passed
- **BUT** the release report MUST keep customer Windows release blocked by installer trust gate

##### Example: app opens but installer unsigned

- **GIVEN** the installed Windows app opens to the AIRE login screen
- **AND** trust metadata has signing status `unsigned`
- **WHEN** release status is calculated
- **THEN** runtime smoke is `partial-pass`
- **AND** customer release is `blocked`

#### Scenario: Trust gate passes

- **WHEN** the installer has valid trust metadata, trusted code signing verification, and no unresolved Defender detection
- **THEN** the release checklist SHALL mark Windows installer trust gate as passed

##### Example: signed clean installer

- **GIVEN** trust metadata has signing status `valid`
- **AND** Defender observation is `clean`
- **WHEN** the checklist is generated
- **THEN** Windows installer trust gate is `passed`
