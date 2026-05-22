## 1. SR and validation

- [x] 1.1 Create SR `opcos-aire-license-serial-integration` for OPCOS serial issuance, AIRE activation, plan sync, and clean fake-data tests.
- [x] 1.2 Run `spectra analyze opcos-aire-license-serial-integration --json` and `spectra validate opcos-aire-license-serial-integration`; fix Critical and Warning findings.

## 2. OPCOS serial issuance

- [ ] 2.1 Cover Requirement: OPCOS SHALL be the source of truth for AIRE serial keys / Design: 正常流程. Verify or implement admin AIRE license creation with `productId = "aire"`, plan id, max devices, and `AIRE-XXXX-XXXX-XXXX` key format.
- [ ] 2.2 Cover Requirement: OPCOS SHALL be the source of truth for AIRE serial keys / Design: 正常流程. Verify or implement upgrade request approval creating and linking an active AIRE license.
- [ ] 2.3 Cover Requirement: OPCOS SHALL be the source of truth for AIRE serial keys / Design: 資料邊界. Update OPCOS AIRE product page to show license status, full serial key for authorized users, max device count, and download entry without exposing AIRE case data.

## 3. AIRE desktop activation and settings

- [ ] 3.1 Cover Requirement: AIRE desktop SHALL activate and verify OPCOS serial keys / Design: API Contract. Verify or implement AIRE client contract for OPCOS activate/verify success and error mapping.
- [ ] 3.2 Cover Requirement: AIRE settings SHALL separate local activation from OPCOS upgrade / Design: Settings Contract. Update settings UI so serial activation, current license status, and OPCOS upgrade CTA are separate and customer-readable.
- [ ] 3.3 Cover Requirement: AIRE desktop SHALL activate and verify OPCOS serial keys. Add tests for invalid key, quota exhausted, device mismatch, IP blocked, revoked, and network failure states.

## 4. Clean fake-data E2E

- [ ] 4.1 Cover Requirement: Fake-data E2E tests SHALL start from a clean seeded state / Design: Test Data Contract. Add AIRE E2E reset helper that clears only mock/localStorage test keys before seeding.
- [ ] 4.2 Cover Requirement: Fake-data E2E tests SHALL start from a clean seeded state / Design: Test Data Contract. Add OPCOS test namespace cleanup that only touches test organizations/licenses/users.
- [ ] 4.3 Add an E2E flow proving OPCOS issued serial key can be entered into AIRE and verified without relying on stale local demo data.

## 5. Cross-repo verification and handoff

- [ ] 5.1 Run AIRE unit tests, type-check, build, and license E2E.
- [ ] 5.2 Run OPCOS license API/admin tests and authenticated product-page smoke.
- [ ] 5.3 Run Spectra analyze and validate after implementation.
- [ ] 5.4 Commit and push only this SR's artifacts and related implementation files.
