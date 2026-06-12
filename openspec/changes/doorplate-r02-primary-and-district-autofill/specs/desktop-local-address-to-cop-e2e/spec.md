# desktop-local-address-to-cop-e2e Specification Delta

## ADDED Requirements

### Requirement: Complete doorplate pre-survey SHALL preserve building-first intent

Complete doorplate building inputs SHALL preserve building-first intent through free pre-survey lookup. The system SHALL NOT demote a complete `號` doorplate input into a land-only or no-data result solely because Z10Web failed to verify it.

#### Scenario: Doorplate keeps building-first fallback on provider failure

- **WHEN** a complete doorplate building address reaches the free pre-survey lookup flow
- **AND** external verification is unavailable
- **THEN** the UI SHALL still classify the case as building-first manual confirmation or low-confidence candidate
- **THEN** it SHALL NOT show `土地 0 筆 · 建物 0 筆` for that address shape unless the address itself is incomplete
