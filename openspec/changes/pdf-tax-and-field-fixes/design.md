## Context

本次改動橫跨三個模組：
- `src/lib/parsers/transcript-parser.ts`：OCR 謄本文字 → 結構化欄位
- `src/lib/document-generator/build-input.ts`：組裝 `DocumentGeneratorInput`（含 `system_computed`）
- `src/lib/document-generator/pdf/dossier-building.ts`：LLM prompt 指令

現況：
- `buildDocumentInput()` 是同步函式，`system_computed` 已包含 `computed_deed_tax`、`computed_stamp_tax_*`、`computed_registration_fee`、`computed_escrow_fee_each`，但 prompt 未告知 LLM 這些欄位存在。
- `src/lib/document-generator/tax-calculator.ts`（同步）提供 deed_tax / stamp_tax / registration_fee / escrow_fee 試算；`src/lib/scrapers/tax-calculator.ts`（非同步 Puppeteer scraper）提供土地增值稅，但實際使用簡易公式（×0.1 / ×0.08），並非真正網路試算。
- `transcript-parser.ts` 以 `/公告地價/` regex 解析「公告地價」，但謄本中「申報地價」使用不同措辭，現有 regex 漏抓。
- LLM prompt 要求標注「（OCR讀取，請確認）」，導致系統訊息出現在正式 PDF。

## Goals / Non-Goals

**Goals:**
- 移除 PDF 中所有系統性雜訊文字（OCR 標注、「資料不足」、「待補」）
- 讓 LLM 正確讀取 `system_computed` 的稅費欄位（尤其是 `computed_deed_tax`）
- 將土地增值稅試算結果加入 `system_computed`，使 LLM 可直接引用
- 解析謄本的「申報地價」欄位（`announced_land_price`）
- 釐清 prompt 中「公告現值」的語意

**Non-Goals:**
- 不新增房屋稅、地價稅自動計算
- 不修改 PDF 版型或視覺樣式
- 不重排補件流程
- 不對接財政部實際試算網頁（維持現有公式近似值）

## Decisions

### 申報地價 regex 擴充

`findFirstNumberNear()` 加入 `/申報地價/` 和 `/當期申報地價/` 兩個 keyword regex，賦值給 `announced_land_price`。

**Alternatives Considered:**
- 改用全文正則一次匹配「當期申報地價：\d+年\d+月([\d,]+(?:\.\d+)?)元」→ 不適合，與現有 `findFirstNumberNear` 架構不符，且維護兩套解析邏輯。
- 新增獨立 parser 專門處理申報地價 → 過度設計，現有 helper 已足夠。

### 土地增值稅同步試算加入 document-generator/tax-calculator.ts

在 `src/lib/document-generator/tax-calculator.ts` 新增同步函式 `calculateLandValueIncrement()`，複用 scraper 的公式（general = previousTransferValue × 0.1；selfUse = previousTransferValue × 0.08）。任一輸入缺值則回傳 null。由 `build-input.ts` 呼叫，結果存入 `system_computed.computed_land_increment_general` 與 `system_computed.computed_land_increment_self_use`。

**Alternatives Considered:**
- 改用非同步 scraper（`src/lib/scrapers/tax-calculator.ts`）→ `buildDocumentInput()` 為同步函式，改非同步會影響所有呼叫端（API route、测试），成本過高；且 scraper 本身仍是公式近似，無實益。
- 把土地增值稅計算移至 API route → 需傳遞中間結果，打破 `DocumentGeneratorInput` 的自足性，不符架構慣例。

### LLM Prompt 全面禁用雜訊文字

`dossier-building.ts` 中：
1. 刪除「並在欄位後標注（OCR讀取，請確認）」指示，改為「直接使用值，不加任何來源標注」。
2. 章節 8：無資料欄位改為「狀態欄留空，備註欄留空，不填任何文字」。
3. 章節 10：`system_computed` 有值則填，無值留空，禁止填任何說明文字；補充 `computed_deed_tax`、`computed_stamp_tax_buyer`、`computed_stamp_tax_seller`、`computed_registration_fee`、`computed_escrow_fee_each` 欄位說明。
4. 章節 12：補充 `computed_land_increment_general`（一般稅率）與 `computed_land_increment_self_use`（自用稅率）欄位說明；缺值留空。
5. 章節 7 prompt 中「公告現值」改為「公告土地現值（每平方公尺，土地專屬，不含建物評定現值）」。

**Alternatives Considered:**
- 在後處理 HTML 階段用 regex 刪除標注 → 不穩定，LLM 輸出格式多樣，regex 易誤刪；根因在 prompt，應從源頭修正。
- 新增 replacePendingPlaceholders 覆蓋更多模式 → 已移除「待補」；但「資料不足」、「待系統計算」等文字由 LLM 自由決策產生，不固定，無法 regex 全覆蓋。

## Risks / Trade-offs

- [Risk] LLM 可能忽略新的「禁止填文字」指示，仍自行填入說明 → 在 prompt 以「**嚴格規則**」強調，並在現有規則列表中以獨立條目列出；實際效果依賴 LLM 遵從率。
- [Risk] 土地增值稅試算公式（×0.1 / ×0.08）為粗估，非台灣稅法精準公式 → 在 `system_computed` 欄位名稱加 `_approx` 後綴（`computed_land_increment_general_approx`）並在 prompt 中標注「試算近似值，以主管機關核定為準」，告知業務人員。
- [Risk] 新增 `announced_land_price` regex 若謄本格式不同可能漏抓 → 欄位缺值時保持 null，不影響其他功能；列為後續改進項目。
- [Risk] 修改 prompt 會使既有 LLM 輸出格式改變，需重新測試整份 PDF → 驗收時需人工比對章節 5–12 的代表性輸出。

## Migration Plan

1. 依 Step A → B → C 順序各自 commit，保持每步可獨立 rollback。
2. Step A：`transcript-parser.ts` 修改，新增 test case（unit）。
3. Step B：`build-input.ts` 修改，新增 test case（unit）；`document-generator/tax-calculator.ts` 新增函式。
4. Step C：`dossier-building.ts` prompt 修改，以 listing 204 跑端對端人工驗證，確認 PDF 無「OCR讀取，請確認」、無「資料不足」、契稅欄位顯示計算金額。
5. Rollback：每步 revert commit 即可，無 DB migration，無 schema 變更。

## Open Questions

- `announced_land_price` 在 `transcript-parser.ts` 第 199 行已有 `/公告地價/` regex；「申報地價」與「公告地價」在業務上是否為同一欄位？若是，直接合併 regex；若否，應分別存入不同欄位。待實作前確認謄本範本。
