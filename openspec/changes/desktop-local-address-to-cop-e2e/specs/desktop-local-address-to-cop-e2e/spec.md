## ADDED Requirements

### Requirement: Local address-to-COP E2E gates app packaging

AIRE SHALL complete local Web and Desktop App address-to-COP E2E before Desktop App packaging acceptance, Windows acceptance, or auto-update implementation is allowed. The E2E SHALL prove address discovery status, confirmed registry key, formal COP pull, billing/cache/error records, saved JSON, and PDF generation from saved data.

#### Scenario: App packaging starts before address-to-COP E2E passes

- **GIVEN** local Web and Desktop App address-to-COP E2E evidence is missing or failing
- **WHEN** an implementer attempts Desktop App packaging acceptance or auto-update implementation
- **THEN** the work SHALL stop
- **AND** this SR SHALL be completed first.

#### Scenario: Address-to-COP E2E passes

- **GIVEN** local Web and Desktop App both preserve discovery diagnostics and confirmed registry matches
- **AND** formal COP pull succeeds from a confirmed key
- **AND** repeat formal pull is cache hit with zero additional cost
- **AND** PDF generation uses saved JSON without paid calls
- **WHEN** release acceptance is reviewed
- **THEN** Desktop fullflow packaging acceptance SHALL resume only under the downstream SR.
