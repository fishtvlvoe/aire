## ADDED Requirements

### Requirement: Windows runtime acceptance must be distinct from packaging

The Desktop Shell release process SHALL distinguish Windows packaging success from Windows runtime acceptance. A successful Windows installer build SHALL NOT be used as proof that the installed Windows Desktop App launches or completes the customer-facing smoke.

#### Scenario: GitHub Actions build succeeds

- **WHEN** the Windows installer workflow succeeds on GitHub Actions
- **THEN** the release evidence SHALL record packaging success only and SHALL keep Windows runtime acceptance incomplete until the installed app runs in Windows

##### Example: Packaging only

- **GIVEN** GitHub Actions run `26398171467` produces a Windows installer
- **WHEN** no Windows VM launch evidence exists
- **THEN** release evidence marks packaging complete and Windows runtime acceptance incomplete

#### Scenario: Installed Windows app launches

- **WHEN** the Windows installer is installed and launched inside UTM, Parallels, Windows 365, Dev Box, or a physical Windows device
- **THEN** the release evidence SHALL record Windows runtime acceptance for the verified runtime and artifact
