## 0. Docker Container 環境設定

- [x] 0.1 [Tool: copilot-codex] Create Dockerfile: Node.js 20 LTS base image, install Puppeteer + Chromium, copy app, expose port 3000; per Docker Container 封裝：跨平台執行環境 decision
- [x] 0.2 [Tool: copilot-codex] Create docker-compose.yml: app service + SQLite volume mount (/output for PDFs); environment variables via .env file
- [x] 0.3 [Tool: codex] Test Docker build on Mac: `docker compose up` → localhost:3000 reachable; Puppeteer generates test PDF inside container
- [x] 0.4 [Tool: cursor] Write client installation guide (Traditional Chinese, ≤5 steps): install Docker Desktop → download docker-compose.yml → run docker compose up → open browser

## 1. Database Schema & Record Model

- [x] 1.1 [Tool: codex] Design and create listing record table with two-part listing record structure: field-visit fields, supplementary fields, and status enum (draft → field-visit-complete → ready-for-generation → documents-ready); use SQLite with schema compatible with PostgreSQL per 本機 → SaaS 遷移路徑 decision
- [x] 1.2 [Tool: codex] Write and run database migration for listing records table (SQLite for local; schema must be PostgreSQL-compatible for future SaaS migration)
- [x] 1.3 [Tool: copilot-codex] Write unit tests for record status transitions (draft → field-visit-complete → ready-for-generation → documents-ready)

## 2. Field-Visit Form (Agent, Mobile)

- [x] 2.1 [Tool: cursor] Build field-visit form UI component with property type selector (residential / farmland) per 資料輸入方式：Web 表單（分兩段填寫）design decision; 物件類型支援：農地、住宅（第一版）
- [x] 2.2 [Tool: cursor] Implement field-visit form by property type: residential fields (address, asking price, floor area, age, layout, floor, parking, notes) and farmland fields (address, land area, land category, irrigation, road frontage, notes)
- [x] 2.3 [Tool: copilot-codex] Implement save partial field-visit data logic: save with status "field-visit-incomplete", block document generation trigger
- [x] 2.4 [Tool: codex] Write tests: agent saves partial data → status remains incomplete; agent completes all required fields → status becomes field-visit-complete

## 3. Secretary Supplementary Data Entry (Desktop)

- [x] 3.1 [Tool: cursor] Build secretary supplementary data entry UI section (land registration transcript summary, cadastral map reference, land use zoning, mortgage/lien status)
- [x] 3.2 [Tool: copilot-codex] Implement secretary completes supplementary data logic: update status to "ready-for-generation", enable Generate Documents button
- [x] 3.3 [Tool: copilot-codex] Implement validation: secretary attempts to generate documents before field-visit data is complete → show error listing missing fields, block API call
- [x] 3.4 [Tool: codex] Write tests: secretary submits supplementary data → status becomes ready-for-generation; Generate Documents blocked when field-visit incomplete

## 4. Document Generation (Three-Provider Architecture)

三個 AI Provider 分工：
- **Codex CLI**（本機）→ 不動產說明書、物調表（正式文件）
- **Claude Haiku**（`claude-haiku-4-5`）→ 591刊登文、銷售DM（行銷文字）
- **Gemini**（`gemini-2.0-flash`）→ 社群貼文×5 + 短影片劇本（社群內容）

切換方式：`.env` 設定 `DOCUMENT_GENERATOR_PROVIDER=codex|haiku|gemini|all`，`all` 為三者並行（預設）。

- [x] 4.0 [Tool: copilot-codex] Refactor DocumentGenerator interface per AI Provider 分工：三個 Provider 並行，依文件類型切分 decision: split into three specialized interfaces — FormalDocumentGenerator (disclosure + survey), MarketingDocumentGenerator (591 + sales DM), SocialDocumentGenerator (social posts + script); create TriProviderDocumentGenerator that orchestrates all three in parallel and merges results
- [x] 4.1 [Tool: copilot-codex] Implement CodexFormalGenerator: structured prompt for disclosure_document + property_survey, returns JSON; install @anthropic-ai/sdk and implement HaikuMarketingGenerator: prompt for listing_591 + sales_dm; install @google/generative-ai and implement GeminiSocialGenerator: prompt for social_posts (5 platforms with character limits) + short_video_script (100-150 chars with CTA)
- [x] 4.2 [Tool: copilot-codex] Implement trigger document generation endpoint per Claude API 呼叫時機：全部欄位填寫完成後一次觸發 decision: validate record status is ready-for-generation, call TriProviderDocumentGenerator (three parallel API calls), merge results, update record status to documents-ready
- [x] 4.3 [Tool: copilot-codex] Implement error handling per provider: if any provider fails, display which provider failed and reason, keep status as ready-for-generation, allow retry; partial success not accepted (all three must succeed)
- [x] 4.4 [Tool: codex] Write tests: all three providers succeed → all documents stored, status updated; any single provider failure → status unchanged, error shows which provider failed; provider selection via DOCUMENT_GENERATOR_PROVIDER env var

## 5. PDF Output (Puppeteer)

- [x] 5.1 [Tool: copilot-codex] Set up PDF 產出技術：Puppeteer（伺服器端）in Next.js API route using Docker container's built-in Chromium (Linux); verify Puppeteer launches correctly inside Docker with no platform-specific path configuration
- [ ] 5.2 [Tool: cursor] Build HTML template for real estate disclosure document (PDF): property address, land area/floor area, asking price, land registration summary, mortgage/lien status, land use zoning, agent contact — per two-part listing record fields ⏸️ 凍結：等客戶提供樣版
- [ ] 5.3 [Tool: cursor] Build HTML template for property condition survey form (PDF): A4 single-page format, company standard layout ⏸️ 凍結：等客戶提供樣版
- [ ] 5.4 [Tool: cursor] Build HTML template for sales DM copy (PDF): property highlights, key selling points, agent contact, A4 format ⏸️ 凍結：等客戶確認格式
- [x] 5.5 [Tool: copilot-codex] Implement PDF download endpoints: render HTML template with listing data → Puppeteer → return PDF file; add download buttons in UI for each PDF document
- [ ] 5.6 [Tool: codex] Test: real estate disclosure document PDF includes all required fields; survey form renders on A4; sales DM PDF generates and downloads correctly ⏸️ 凍結：等 5.2-5.4 完成

## 6. Plain Text Outputs (591 & Social Media)

- [x] 6.1 [Tool: cursor] Build plain text display UI for 591 listing text (plain text): read-only text area + Copy button; verify 591 text does not contain markdown formatting
- [x] 6.2 [Tool: cursor] Build platform-separated social media referral posts (plain text) UI: five tabs (Facebook, Instagram, Threads, TikTok, YouTube), each with plain text area + Copy button per 社群貼文：純文字顯示 + 複製按鈕（各平台分頁）design decision
- [x] 6.3 [Tool: copilot-codex] Implement platform character limits validation in prompt: Facebook ≤63,206 / Threads ≤500 / TikTok ≤2,200 / Instagram ≤2,200 / YouTube ≤5,000; posts do not contain markdown formatting
- [x] 6.4 [Tool: codex] Write tests: each platform post within character limit; no markdown symbols in output

## 7. Short-Video Script & Marketing Guidance

- [x] 7.1 [Tool: copilot-codex] Add short-video script generation to Claude prompt: spoken narration, 100–150 Chinese characters, ends with call-to-action (script ends with a call-to-action)
- [x] 7.2 [Tool: cursor] Build short-video script display UI: plain text area + Copy button with FlowGo 整合：方案 A（手動銜接，第一版）guidance note directing agent to paste script into FlowGo text node
- [x] 7.3 [Tool: cursor] Build three-platform referral flow guidance static UI block (Shorts → YouTube → Facebook) shown on marketing outputs tab
- [x] 7.4 [Tool: codex] Test: script length 100–150 characters; script ends with call-to-action phrase

## 8. Regenerate Individual Documents

- [x] 8.1 [Tool: copilot-codex] Implement regenerate individual documents endpoint: accept document type param, call Claude API with saved listing data, replace only that document's stored content
- [x] 8.2 [Tool: cursor] Add "Regenerate" button to each document output section in UI
- [x] 8.3 [Tool: codex] Test: regenerate single document → only that document updated, others unchanged

## 9. Integration & End-to-End Testing

- [x] 9.1 [Tool: copilot] Code review: cross-check field-visit form → supplementary data → generation trigger → PDF output → plain text output flow for correctness and edge cases (Kimi quota exhausted, switched to Copilot; CR passed — regenerate merge logic confirmed correct)
- [x] 9.2 [Tool: copilot] End-to-end test: create residential listing → complete both data sections → generate all documents → verify all five outputs present and downloadable/copyable
- [x] 9.3 [Tool: copilot] End-to-end test: create farmland listing → complete both data sections → generate all documents → verify farmland-specific fields appear in outputs
