## MODIFIED Requirements

### Requirement: UpdateChecker renders without hydration mismatch

The UpdateChecker component SHALL use client-side state initialization to detect the Electron environment. The component MUST render identically on server and client during initial render (both return null). After mount, the component SHALL check `window.electronAPI` via `useEffect` and update state accordingly.

#### Scenario: SSR and CSR initial render match
- **WHEN** the page is server-rendered and then hydrated on the client
- **THEN** both server and client initial render return null (no hydration mismatch error)

#### Scenario: Electron environment detected after mount
- **WHEN** the component mounts in an Electron environment where `window.electronAPI` exists
- **THEN** the component SHALL display the update checker UI after the useEffect runs

#### Scenario: Browser environment detected after mount
- **WHEN** the component mounts in a standard browser where `window.electronAPI` is undefined
- **THEN** the component SHALL remain hidden (return null)
