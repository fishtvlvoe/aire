## 1. Spec

- [x] 1.0 對位 design decision 原文，確保 tasks 明確覆蓋以下三條：decision 1: 完整門牌 `有號` 即進 `r02 primary`；decision 3: `z10web` 失敗不等於 `r02` 主線失敗；decision 4: 明確翻掉舊 archive 的 `z10 primary` 決策。[Tool: codex]
  - Evidence: `spectra analyze doorplate-r02-primary-and-district-autofill --json` clean on 2026-06-12.
- [x] 1.1 補齊 `doorplate-r02-primary-and-district-autofill` proposal / design / specs / tasks，並明寫它取代 archive `2026-06-02-desktop-local-address-to-cop-e2e` 中門牌 `Z10 primary` 的舊決策；tasks 必須覆蓋 design 的 `goals`、`non-goals`、`decision 1: 完整門牌 \`有號\` 即進 \`r02 primary\``、`decision 2: 缺行政區只在唯一命中時自動補全`、`decision 3: \`z10web\` 失敗不等於 \`r02\` 主線失敗`、`decision 4: 明確翻掉舊 archive 的 \`z10 primary\` 決策`、`parser contract`、`discovery contract`、`ui contract`、`skill contract`。[Tool: codex]
  - Evidence: proposal/design/specs/tasks updated under this change and analyzer gaps/coverage cleaned.
- [x] 1.2 跑 `spectra analyze doorplate-r02-primary-and-district-autofill --json` 與 `spectra validate doorplate-r02-primary-and-district-autofill`，修到 Critical 0 / Warning 0，並確認 design 的 `goals` 已達成且 `non-goals` 未被誤擴 scope。[Tool: codex]
  - Evidence: `spectra analyze doorplate-r02-primary-and-district-autofill --json`; `spectra validate doorplate-r02-primary-and-district-autofill`.

## 2. Tests First

- [x] 2.1 先補 `local-address-discovery-proxy.test.ts`：Requirement `Complete doorplate building inputs SHALL use R02 as the primary building-resolution source` 對應 `decision 1: 完整門牌 \`有號\` 即進 \`r02 primary\`` 與 `discovery contract`，驗證完整門牌 `有號` 時必須先走 R02 primary；R02 有候選但 Z10 timeout 時不得回 `no_data`。[Tool: codex]
  - Evidence: added `uses R02 as the primary lookup for a complete doorplate with 號 even without floor information`; focused Vitest pass.
- [x] 2.2 先補 `local-address-discovery-proxy.test.ts`：Requirement `Missing district doorplate inputs SHALL attempt unique district autofill` 對應 `decision 2: 缺行政區只在唯一命中時自動補全` 與 `parser contract`，驗證缺行政區但唯一命中行政區時系統可自動補全後續查詢；多命中與零命中需分開驗證。[Tool: codex]
  - Evidence: added unique / ambiguous / no-match district tests in `local-address-discovery-proxy.test.ts`; focused Vitest pass.
- [x] 2.3 先補 `new-case-page.test.tsx`：Requirement `Free pre-survey error states SHALL distinguish incomplete address from unavailable provider` 對應 `decision 3: \`z10web\` 失敗不等於 \`r02\` 主線失敗` 與 `ui contract`，驗證缺行政區顯示地址不完整；provider timeout 保留建物優先 fallback；候選衝突顯示待確認，不再說查不到資料。[Tool: codex]
  - Evidence: added incomplete-address UI test and kept existing provider-timeout / low-confidence tests; focused Vitest pass.
- [x] 2.4 先補 `product-ui-demo-alignment.test.ts` 或 `new-case-page.test.tsx`：Requirement `Complete doorplate pre-survey SHALL preserve building-first intent` 對應 `decision 3: \`z10web\` 失敗不等於 \`r02\` 主線失敗`，驗證完整 `有號` 門牌即使補證失敗，也不得退成 `土地 0 筆 · 建物 0 筆` 或 generic no-data。[Tool: codex]
  - Evidence: `product-ui-demo-alignment.test.ts` and `new-case-page.test.tsx` cover building-first fallback and pass in focused Vitest.

## 3. Implementation

- [x] 3.1 實作 `doorplate-district-autofill`：門牌 parser / discovery flow 支援缺行政區時的唯一補全與候選區回傳，並落實 `Missing district doorplate inputs SHALL attempt unique district autofill` 與 `parser contract`。[Tool: codex]
  - Evidence: `src/lib/server/local-address-discovery-proxy.ts` now supports unique district autofill and distinct ambiguous/missing district errors.
- [x] 3.2 實作 `doorplate-r02-primary-resolution`：完整門牌 `有號` 改為 `R02 primary / Z10 verify`，並保留衝突與 timeout 診斷，落實 `Complete doorplate building inputs SHALL use R02 as the primary building-resolution source`、`discovery contract`，並明確覆蓋 `decision 4: 明確翻掉舊 archive 的 \`z10 primary\` 決策`。[Tool: codex]
  - Evidence: `src/lib/server/local-address-discovery-proxy.ts` now runs doorplate lookup through R02 primary and updates conflict behavior/tests accordingly.
- [x] 3.3 調整 `cases/new` 前台狀態與文案：落實 `Free pre-survey error states SHALL distinguish incomplete address from unavailable provider` 與 `Complete doorplate pre-survey SHALL preserve building-first intent`，明確分流 `地址不完整`、`provider timeout`、`候選衝突`、`manual required`。[Tool: codex]
  - Evidence: `src/app/(dashboard)/cases/new/page.tsx` adds `incomplete_address` handling and friendly missing-district copy.
- [x] 3.4 更新 `.claude/skills/aire-delivery-guardrails/SKILL.md`，落實 `skill contract`，加入「完整門牌 R02 primary、缺區先做唯一補全、Z10 只作補證」的 guardrail，避免舊 archive 決策回流。[Tool: codex]
  - Evidence: skill updated on 2026-06-12 with R02-primary and district-autofill guardrails.

## 4. Verify

- [x] 4.1 跑 focused tests：`pnpm exec vitest run src/lib/server/__tests__/local-address-discovery-proxy.test.ts src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx src/lib/__tests__/product-ui-demo-alignment.test.ts`，確認 `goals` 成立且 `non-goals` 未被誤擴到地段地號主線或 formal COP / 付款 / PDF trusted 邏輯。[Tool: codex]
  - Evidence: focused Vitest passed with 3 files / 91 tests on 2026-06-12.
- [x] 4.2 跑 type-check：`pnpm exec tsc --noEmit`，確認 `parser contract`、`discovery contract`、`ui contract` 的型別與狀態分流一致。[Tool: codex]
  - Evidence: `pnpm exec tsc --noEmit` passed on 2026-06-12.
- [ ] 4.3 若部署 live，重測至少兩筆地址：
  - 缺行政區：`台南市永華路580號5樓之3`
  - 完整門牌：`台南市永康區永華路580號5樓之3`
  驗證 `decision 2: 缺行政區只在唯一命中時自動補全`、`decision 3: \`z10web\` 失敗不等於 \`r02\` 主線失敗`、`ui contract` 是否成立；結果需寫回 SR，不可只在對話口頭說明。[Tool: codex]
