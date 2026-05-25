## Implementation

- [x] Cover case management design with failing tests for `補件入口統一到補件現場工作台`, including the design decision `補件入口統一到物件審核`.
- [x] Change the case-row `補件` action to route to `/cases/:id?tab=supplements`.
- [x] Add mock backend commands and persistence for `補件現場資料可持久化`, including the design decision `補件/現場資料先用 mock draft persistence`.
- [x] Make `DemoAlignedWorkbench` load and save supplement answers, statuses, upload file names, and supplement-list state.
- [x] Make `PDF 檢查` use persisted upload file names for its upload count, covering the design decision `PDF check reads the same persisted draft`.
- [x] Add mock backend commands and persistence for `個人設定儲存到資料層`, including the design decision `個人設定接 mock profile settings`.
- [x] Make `/settings` load and save profile settings through mock backend commands.
- [x] Add or update unit tests so `tests must catch persistence, not only presence`: supplement routing, supplement draft persistence, profile persistence, and password command usage.

## Verification

- [x] Run focused case/settings/workbench/mock backend unit tests.
- [x] Run type-check.
- [x] Run full unit test suite.
- [x] Run production build.
- [x] Run Rust workspace tests from `src-tauri`.
- [x] Run focused Playwright E2E for product IA and workbench.
- [x] Run `spectra analyze fix-cr-review-persistence-and-supplement-routing --json` and `spectra validate fix-cr-review-persistence-and-supplement-routing`.
