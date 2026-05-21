## 中文任務總覽（給 Fish 驗收用）

> 下面是目前真正需要接著處理的工作。英文原始任務先保留，避免 Spectra 既有紀錄斷掉。

### A. 目前優先做

- [x] A1 地政資料拉取後，要在第 2 步立即顯示「可讀預覽」，讓使用者知道抓到哪些謄本資料、哪些會帶入 PDF、哪些仍是空白。
- [x] A2 先從不動產說明書表格反推欄位來源：API 抓得到的土地/建物/權利資料必須自動帶入，不要求客戶重填。
- [x] A3 補齊建物謄本欄位映射：建物總面積、建物層數、建築完成日期、屋齡、分層/附屬建物、共有部分、車位面積、權利範圍。
- [x] A4 修正實價登錄資料來源：臺北案件不能顯示台南舊假資料；查不到資料時輸出空白，不混入舊內容。
- [x] A5 生活機能改成一頁摘要：學校 1 個、醫療 1 個、公園 1 個、捷運/交通 1 個、市場/超市 1 到 2 個，並與位置圖合併成同一頁。
- [x] A6 PDF 草稿/預覽不顯示固定頁碼，避免後續加頁後頁碼錯亂。
- [x] A7 用假資料跑 DOM/UX 自檢，確認工作台、預覽匯出、PDF iframe、圖片欄位、生活機能和頁碼都沒有跑版。

### B. 已做完，可驗收

- [x] B1 成屋第 3 步改成 Page Contract 工作台：左側填寫、右側預覽。
- [x] B2 成屋 38 題現況調查表已接進資料模型與預覽。
- [x] B3 圖片上傳欄位已依頁面命名，不再全部叫「格局圖」。
- [x] B4 預覽匯出已改成 iframe 隔離，PDF HTML 不再污染 App 外層 UI。
- [x] B5 步驟列已改成「狀態 icon + 名稱」，不再出現 1、2、3、5。
- [x] B6 Spectra SDD 已新增：`artifacts/sdd-house-disclosure-dom-ux-and-data-gaps.md`。
- [x] B7 拉到的謄本資料可另存新檔為本機 JSON，方便未來匯入或重用；API 沒提供所有權人時不得顯示假姓名。
- [x] B8 第 5 步預覽與下載改成共用同一份 PDF blob，避免 iframe HTML 預覽和下載 PDF 內容不一致。
- [x] B9 建物現況調查 PDF 改成 38 題 MVP 空白勾選欄，不再輸出舊版 58 題與「未填」選項。

### C. 先暫緩，不影響目前 MVP

- [ ] C1 opcOS 完整生態系登入中心。
- [ ] C2 Basic / Pro / Advanced 完整金流與雲端方案頁。
- [ ] C3 104、社群貼文、DM、591 等行銷模組。
- [ ] C4 企業 IP allowlist 與完整客服授權轉移流程。
- [ ] C5 支付閘道與正式訂閱扣款流程。

### D. 已確認 / 仍待確認

- [x] D1 實價行情查不到時：輸出空白，不混入舊資料。
- [x] D2 屋齡：由建築完成日自動推算，並保留建築完成日原值。
- [x] D3 API 有的謄本欄位都要抓到並自動帶入，不要要求客戶重填。
- [x] D4 生活機能類別建議改為：學校、醫療、公園、捷運/交通、市場/超市；等 Fish 最後確認是否再加商圈/警察/行政機關。

## 1. Discussion Capture

- [x] 1.1 Capture Round 1 concern: public PWA JavaScript can change and may exfiltrate browser-local data.
- [x] 1.2 Capture initial architecture direction: cloud license plus local encrypted vault.
- [x] 1.3 Capture first decision: Phase 1 should prefer Tauri/local runtime over public PWA.
- [x] 1.4 Capture Round 2 decision: Phase 1 uses full Tauri App and `aire.opcos.me`, without waiting for full opcOS hub.
- [x] 1.5 Capture Round 3 decision: split architecture discussion, disclosure output completion, and future opcOS work into separate lanes.
- [x] 1.6 Capture Round 4 MVP priority: PDF completion first, then license/download/payment.
- [x] 1.7 Capture Round 5 decision: create PDF gap analysis before fixing old output bugs.
- [x] 1.8 Capture Round 6 disclosure workflow: house/land variants and draft/formal supplement stages.
- [x] 1.9 Capture Round 7 UI boundary: case setup UI and draft disclosure preview UI are separate; generated table preview is not a Word-like editor.
- [x] 1.10 Capture Round 8 MVP behavior: draft workbench right side is generated preview only, not direct editing.
- [x] 1.11 Capture Round 9 preview granularity: single-page preview first, plus required image upload support.
- [x] 1.12 Capture Round 10 image upload clarification: most low-level image capabilities exist, but upload placement and image-slot mapping are missing.
- [x] 1.13 Capture Round 11: old "three-ai" code is unavailable, so it is product memory only; MVP image uploads go in the draft workbench page-level input panel.
- [x] 1.14 Capture Round 12: first draft workbench/gap-analysis slice targets the house version property data sheet.
- [x] 1.15 Capture Round 13: target folder classification excludes filenames containing 土地 for the first house-version slice.
- [x] 1.16 Capture Round 14: JPG inspection selected `3-2+3.JPG` / `產權調查表` as the first house-version workbench target; PDFs are deferred for legal cross-checking.
- [x] 1.17 Capture Round 15: house-version JPG pages are grouped into main disclosure body, market reference, legal text, tax/cost pages, field questionnaire, and living-function map; first implementation scope is `3-2+3.JPG` plus `4.JPG`.
- [x] 1.18 Capture Round 16: base plan is registry pull only; real-price, surrounding market data, maps, aerial/street imagery, cadastral map, and floor plan are add-on/upgrade features.
- [x] 1.19 Capture Round 17: commercial packaging is Basic / Pro / Advanced, controlled by SaaS plan entitlements; customer plan changes must automatically unlock features without manual operator work.
- [x] 1.20 Capture Round 18: registry data persistence is a required pre-implementation verification, not an informal later check.
- [x] 1.21 Capture Round 19: default entitlement strategy is startup sync, manual resync, 7-day offline grace, downgrade preserves existing data, and rules remain adjustable after customer testing.
- [x] 1.22 Capture Round 20: cloud stores only account/license/IP/plan/minimal usage data; all real-estate case data stays local; IP is risk signal/optional allowlist, not primary device lock.
- [x] 1.23 Capture Round 21: one paid license seat authorizes exactly one computer; multiple computers require additional seats/licenses.
- [x] 1.24 Capture Round 22: licensing has three layers: serial/license key, account/email, and local device key/device_id; MVP is one serial/account/seat/computer while structures remain multi-seat ready.
- [x] 1.25 Capture Round 23: device transfer is self-service at most once per month, repeated transfers require Line/email support and reason review; core registry/API workflow requires network.
- [x] 1.26 Capture Round 24: Basic includes formal supplement/editing and manual image upload; Advanced value is API-generated/fetched content, floor-plan processing, aerial/street imagery, and market research automation.
- [x] 1.27 Capture Round 25: legacy 104, social post, DM survey/form, 591/listing post, and marketing automation modules are placed in Advanced backlog and must not block disclosure MVP.
- [x] 1.28 Capture Round 26: content references mostly exist, but implementation requires a Page Contract mapping page, fields, source, storage, preview, PDF renderer, and entitlement before broad coding.
- [x] 1.29 Capture Round 27: source folders are inventoried; 0417-new is field master, 0417-old is workflow/layout reference, cop-scrape is MOI service map, and MOIAPIExample_TOKEN is token/API sample.
- [x] 1.30 Capture Round 28: first house-version property type is 大樓華廈, and the source inventory artifact is the bridge from customer documents to implementation contracts.
- [x] 1.31 Capture Round 29: current code is partially aligned but not final; reuse foundations while rebuilding disclosure UX around Page Contracts.
- [x] 1.32 Capture Round 30: no hard MVP technical blocker found; proceed with sequenced implementation plan.
- [x] 1.33 Capture Round 31: first Page Contract `house.cover` was created for review before code implementation.
- [x] 1.34 Capture Round 32: draft PDF should use old conservative style, render missing fields blank for handwriting, allow date override during Beta, and avoid hard-coded page counts.
- [x] 1.35 Capture Round 33: source/legal/API gap audit completed; 2026 MOI legal-update fields and COP backend wiring gaps recorded.
- [x] 1.36 Capture Round 34: `house.property_rights` Page Contract created; PDF Chinese font garbling risk recorded; payment/gateway discussion intentionally deferred.
- [x] 1.37 Capture Round 35: `交易種類` must not be hard-coded as `買賣`; use blank/buy/sell/rent/exchange/other plus custom text.
- [x] 1.38 Capture Round 36: `附贈設備` defaults to conservative template text, but can be manually edited or cleared for writable blank output.
- [x] 1.39 Capture Round 37: `付款方式` means real-estate transaction payment terms, defaults to `依買賣契約為準`, and supports default/manual/blank; initial `交易種類` is blank.
- [x] 1.40 Capture Round 37 scope: build the complete/highest disclosure capability first; defer Basic/Pro breakdown and SaaS payment/gateway details.
- [x] 1.41 Create home-resume checklist so the next session can continue from Spectra without rereading chat.
- [x] 1.42 Capture Round 38: after checking nearby house-version pages and 105 official format, `house.property_rights` should own expanded `建物標示` instead of keeping `略`.
- [x] 1.43 Capture Round 39: MVP `建物標示` uses a compact business-readable one-page layout; 105 format is a checklist, not the first visible layout.
- [x] 1.44 Capture Round 40: created `house.land_display` Page Contract from `4.JPG` for 土地標示, registry-derived parcel rows, legal notes, and rights summary.
- [x] 1.45 Capture Round 41: created `house.market_reference` Page Contract from `5.JPG` for transparent-price/transaction-market appendix.
- [x] 1.46 Capture Round 42: created `house.ownership_notes` Page Contract from `6.JPG` for controlled 11-topic legal/risk notice page.
- [x] 1.47 Capture Round 43: created `house.fee_responsibility` Page Contract from `7.JPG`, separating buyer/seller responsibility wording from optional fee estimates.
- [x] 1.48 Capture Round 44: created `house.land_value_tax_estimate` Page Contract from `8.JPG`, separating manual/display values from reviewed tax formula metadata.
- [x] 1.49 Capture Round 45: created `house.tax_notes` Page Contract from `9-8+9.JPG` for land-value-tax result summary and seven caution notes.
- [x] 1.50 Capture Round 46: created `house.condition_survey_highrise` Page Contract from the 5-page house condition survey; current 58-question code schema is not automatically aligned.
- [x] 1.51 Capture Round 47: created `house.living_function` Page Contract from `11-房屋-生活機能.JPG`; initial manual-map assumption was superseded by Round 48 auto-map MVP decision.
- [x] 1.52 Capture Round 48: MVP uses the photo's 38-question survey form, first version must auto-generate the living-function map, tax pages need manual/blank and auto-calculation paths, legal/tax wording uses fixed templates; transparent-price inclusion was still open at this point and resolved in Round 49.
- [x] 1.53 Capture Round 49: approved MVP defaults: transparent-price page is output-ready but optional appendix, auto-map failure allows manual upload fallback and does not block export, tax output must label estimates/caveats, fixed legal/tax templates print by default, 38-question survey uses empty checkboxes/writable space, and implementation starts with fixed templates/data model then preview then PDF.
- [x] 1.54 Capture Round 50: registry/API fields must be reverse-mapped from disclosure tables first; every field available from MOI/COP registry APIs should be pulled, stored locally, previewed, and auto-filled instead of asking the user to retype it.

## 2. Architecture Decisions

- [x] 2.1 Decide whether Phase 1 UI is pure Tauri shell or localhost UI embedded by the local app.
- [x] 2.1 Decide whether Phase 1 UI is pure Tauri shell or localhost UI embedded by the local app.
- [x] 2.2 Define exact license activation payload and explicitly forbidden data fields.
- [x] 2.3 Define device fingerprint / activation / transfer policy, including one-seat-one-device binding and explicit transfer workflow.
- [x] 2.4 Define offline grace period and what happens when license revalidation fails.
- [x] 2.5 Define whether IP allowlisting is needed for standard customers or only enterprise customers.
- [x] 2.6 Decide MVP domain strategy: AIRE-specific `aire.opcos.me` before full `opcos.me` ecosystem hub.
- [x] 2.7 Define SaaS plan entitlement payload for Basic / Pro / Advanced and local cache/offline grace behavior.
- [x] 2.8 Define exact minimal usage log fields and explicitly exclude address, land lot, owner, registry payloads, images, PDFs, and case backups from cloud collection.
- [x] 2.9 Implement requirement `cloud-license-local-data-boundary`: license activation/revalidation payloads must exclude plaintext case data, owner data, registry documents, uploaded photos, generated disclosure text, and PDF contents.
- [x] 2.10 Implement requirement `device-bound-license-seat`: enforce one enrolled device per paid seat, with rejected activation or approved transfer when no seat is available.
- [x] 2.11 Implement requirement `local-interface-not-public-url`: Phase 1 protected workflows must run in Tauri/local shell or loopback-only UI, with no shareable public URL and no LAN IP access.
- [ ] 2.12 Implement requirement `local-vault-encryption`: persist customer case data only inside encrypted local vault/local storage controlled by the enrolled device.
- [x] 2.13 Implement requirement `optional-ip-policy`: keep IP allowlisting enterprise-only when enabled and never use IP binding as the default enforcement mechanism.
- [x] 2.14 Implement requirement `aire-first-domain-launch`: make `aire.opcos.me` the customer-facing pricing/download/checkout/license/support surface before the full opcOS hub.
- [x] 2.15 Implement requirement `entitlement-service-before-ecosystem`: build the narrow AIRE entitlement service before any full multi-product account hub, without access to customer case plaintext.

## 3. Legal / Privacy Artifacts

- [x] 3.1 Draft local-vault privacy whitepaper outline.
- [x] 3.2 Draft customer-facing statement: AIRE Cloud does not receive case plaintext.
- [x] 3.3 Draft data retention matrix for account, billing, license, logs, and update telemetry.
- [x] 3.4 Draft no-backup responsibility notice and first-use customer acknowledgment.
- [ ] 3.5 Legal review required: password hashing/auth provider language, IP/device binding terms, and Taiwan personal-data notice wording.

## 4. Implementation Planning

- [x] 4.1 Map existing AIRE license/status commands to the target architecture.
- [x] 4.2 Map existing local SQLite / file storage to local vault requirements.
- [x] 4.3 Define minimum launch checklist for selling AIRE to first partner/customer.
- [x] 4.4 Create separate follow-up change for disclosure output gap analysis using `0520/不動產說明書-bug` as evidence.
- [x] 4.5 Create follow-up implementation change after decisions converge.
- [x] 4.6 Define durable local storage plan for pulled registry payloads; current real DB schema and mock/frontend state appear misaligned.
- [x] 4.7 Define feature-bundle entitlement map for base, market/real-price, map/photo, and cadastral/floor-plan add-ons.
- [ ] 4.8 Replace one-off feature unlock assumptions with plan-based feature visibility in frontend and backend checks.
- [ ] 4.9 Verify registry persistence in the real Tauri path: pull registry data, reload/reopen the case, inspect local SQLite/local vault, and record whether `land_registry_data` is durable before implementation.
- [x] 4.10 Design shared disclosure output slots with entitlement-gated automation controls, so Basic and Advanced use the same document layout but different content sources.
- [x] 4.11 Locate or clarify the legacy `104` feature source/meaning before implementing; current docs confirm DM/social/591 marketing outputs but not a clear standalone 104 module.
- [x] 4.12 Create the first AIRE Page Contract for `3-2+3.JPG` and `4.JPG`: exact fields, source, storage, preview component, PDF renderer, missing-data behavior, and entitlement.
- [x] 4.13 Extract/structure field survey and supplement sources from `docs/0417-old/*現場必問清單.docx`, `*秘書後補清單.docx`, and `10-房屋-現況調查表-*.JPG` before implementing the field survey workbench.
- [x] 4.14 Define UI/UX workbench spec: separate case setup, draft disclosure, formal supplement, field survey, images/maps, and export surfaces.
- [x] 4.14a Implement design topic `stage 1: draft disclosure`: generate deliverable draft disclosure output from known data, blank writable fields, registry/image slots, and right-side official-style preview.
- [ ] 4.14b Implement design topic `stage 2: formal supplement / editing after委託`: support post-委託 correction/backfill using the same Page Contracts without merging it into case setup UI.
- [x] 4.14c Implement design topic `product logic interpretation`: preserve the two-stage product model where case setup, draft disclosure, field survey, formal supplement, images/maps, and export are separate surfaces.
- [x] 4.14d Implement design topic `implication for gap analysis`: use Page Contracts as the gap-analysis source of truth before writing frontend/backend/PDF slices.
- [x] 4.15 Build a source inventory matrix for 建物版 first: field master row, field-visit question, secretary supplement field, visual output page, storage target, entitlement, and API candidate.
- [x] 4.16 Extract the house-version DOCX sources first, prioritizing `大樓華廈`, `公寓`, `透天別墅`, `店面`, `套房`, `農舍`, and `廠房` before land-only forms.
- [x] 4.17 Map first Page Contract fields to COP/MOI service ids from `docs/cop-scrape`, starting with building/land registry fields, ownership, encumbrances, cadastral map, and announced land value.
- [x] 4.18 Treat old `docs/0417-old/*.pdf` files as scanned visual references unless OCR is explicitly needed; do not rely on `pdftotext` for those PDFs.
- [ ] 4.19 Review `artifacts/house-building-source-inventory.md` with Fish and lock the first Page Contract order.
- [x] 4.20 Refactor/replace the generic disclosure tab surface with a Page Contract driven workbench: left structured fields, right official-style page preview.
- [x] 4.21 Expand `case_assets.kind` beyond `floor_plan` to support logo, exterior photos, location/surrounding map, cadastral map, and field survey photos.
- [ ] 4.22 Replace mock-heavy feature flags with SaaS-controlled Basic/Pro/Advanced plan entitlement checks around automation buttons.
- [x] 4.23 Create MVP implementation plan artifact covering Page Contracts, local persistence, workbench UI, asset slots, entitlement, PDF/export, risks, and build order.
- [x] 4.24 Create the first concrete Page Contract artifact for `house.cover`.
- [x] 4.25 Create the first concrete Page Contract artifact for `house.property_rights`.
- [ ] 4.26 Run/record real Tauri registry persistence verification before depending on `land_registry_data` in the workbench.
- [x] 4.27 Audit existing PDF page numbering and define draft/final export behavior so draft templates do not hard-code volatile page counts.
- [ ] 4.28 Verify printed draft spacing for handwriting after the first cover/property-rights renderer exists.
- [x] 4.29 Create source/legal/COP API gap audit artifact before continuing Page Contracts.
- [x] 4.30 Add 2026 legal-update fields to concrete house Page Contracts: solar photovoltaic equipment status/location and building energy efficiency condition/notes.
- [ ] 4.31 Wire COP token endpoint configuration for production/sandbox instead of relying on Basic-auth-only `StaticApiKeyProvider::configured`.
- [x] 4.32 Define AIRE api_id to MOI service-id/endpoint map, including costs and subscription requirements.
- [x] 4.33 Implement or explicitly defer missing COP service wrappers: building other rights, building number lookup, building right scope, building right status, cadastral WFS/WMS.
- [ ] 4.34 Verify whether address-to-building-number service is actually subscribed before making it a primary flow; keep manual fallback regardless.
- [ ] 4.35 Recheck latest MOI disclosure rules and COP service availability before paid launch.
- [x] 4.36 Add PDF Chinese-font validation to export QA: ensure `initReactPdfEngine()` runs, `NotoSansTC` is bundled, and sample Traditional Chinese text renders without garbling.
- [x] 4.37 Decide property-rights top fact defaults: transaction starts blank, gifted equipment defaults to conservative phrase, payment method defaults to `依買賣契約為準`.
- [x] 4.38 Defer payment/gateway architecture discussion until disclosure Page Contracts and the MVP PDF slice are stable.
- [x] 4.39 Inspect next house-version pages to decide whether `house.property_rights` should fully own `建物標示` or render a compact summary to avoid duplicate official sections.
- [x] 4.40 Prioritize full-feature/Advanced-style disclosure completion before splitting Basic/Pro plan limitations.
- [x] 4.41 Decide compact vs fuller 105-format field depth for expanded `建物標示`.
- [x] 4.42 Create next Page Contract for `house.land_display` from `4.JPG`.
- [x] 4.43 After first preview, confirm exact compact `建物標示` field list with Fish.
- [x] 4.44 Decide `house.land_display` open questions: legal/default notes visibility, square-meter/ping display, and whether long land other-rights content stays on this page.
- [x] 4.45 Create next Page Contract for `house.market_reference` from `5.JPG`.
- [x] 4.46 Decide `house.market_reference` remaining open questions: exact table columns and whether AI market interpretation is part of MVP. Inclusion is decided: output-ready optional appendix, not mandatory first-version output.
- [x] 4.47 Create next Page Contract for `house.ownership_notes` from `6.JPG`.
- [x] 4.48 Decide `house.ownership_notes` remaining open question: whether case-specific risks should be highlighted. MVP prints fixed legal clauses by default; normal users cannot edit legal wording.
- [x] 4.49 Create next Page Contract for `house.fee_responsibility` from `7.JPG`.
- [x] 4.50 Decide `house.fee_responsibility` remaining open questions: tax/scrivener review before paid launch. MVP supports blank/manual estimate fields and automatic calculation output; normal users can edit amount/note fields but not fixed wording templates.
- [x] 4.51 Create next Page Contract for `house.land_value_tax_estimate` from `8.JPG`.
- [x] 4.52 Decide `house.land_value_tax_estimate` remaining open questions: wide table readability and tax formula reviewer before paid launch. MVP must support manual/blank values and automatic calculation with source/formula warnings.
- [x] 4.53 Create next Page Contract for `house.tax_notes` from `9-8+9.JPG`.
- [x] 4.54 Decide `house.tax_notes` remaining open question: combine/split with estimate page. MVP prints fixed tax notes by default, even when estimate values are blank.
- [x] 4.55 Create next Page Contract for `house.condition_survey_highrise` from `10-房屋-現況調查表-*.JPG`.
- [x] 4.56 Decide `house.condition_survey_highrise` MVP schema: use the photo's 38-question customer form as the MVP template, do not use the current 58-question code schema as the primary output without explicit mapping.
- [x] 4.56a Decide `house.condition_survey_highrise` remaining open question: question-level vs global photo attachments. Blank answer rendering is decided: empty checkboxes plus writable space.
- [x] 4.57 Create next Page Contract for `house.living_function` from `11-房屋-生活機能.JPG`.
- [x] 4.58 Decide `house.living_function` remaining open questions: row cap/dynamic rows and Draft Disclosure vs Images/Maps workbench placement. Auto-map failure fallback is decided: allow manual upload override and do not block export.
- [x] 4.59 Review completed house-version Page Contract set with Fish before starting implementation.
- [x] 4.60 Start implementation sequence after Page Contract review: fixed templates/data model first, right-side preview second, PDF export third.
- [x] 4.60a Implement first verifiable slice: fixed templates and TypeScript data model for house MVP Page Contracts, including 38-question survey, living-function map state, tax amount source states, and fixed legal/tax templates.
- [x] 4.60b Implement second verifiable slice: right-side HTML preview from the normalized house MVP Page Contract payload.
- [x] 4.60c Implement third verifiable slice: PDF renderer from the same normalized house MVP Page Contract payload.
