## ADDED Requirements

### Requirement: One-click application launch

The system SHALL start the Next.js server and open the application window when the user double-clicks the desktop icon.

#### Scenario: Normal startup

- **WHEN** user double-clicks the application icon
- **THEN** the system SHALL display a splash screen, start the Next.js server, and open the main window pointing to localhost once the server is ready

##### Example: Startup sequence

- **GIVEN** application is installed at C:\Program Files\AI-不動產說明書系統\
- **WHEN** user double-clicks desktop shortcut
- **THEN** t=0s: splash screen appears → t=2s: Next.js server starts on port 3000 → t=3s: server reports ready → splash closes → BrowserWindow opens http://localhost:3000

#### Scenario: Startup time

- **WHEN** the application launches on a standard machine
- **THEN** the main window SHALL be visible within 5 seconds

### Requirement: Splash screen during startup

The system SHALL display a branded splash screen while the server is initializing.

#### Scenario: Splash screen content

- **WHEN** application is starting
- **THEN** a splash screen showing "AI 不動產說明書系統" and a loading indicator SHALL be displayed until the server is ready
