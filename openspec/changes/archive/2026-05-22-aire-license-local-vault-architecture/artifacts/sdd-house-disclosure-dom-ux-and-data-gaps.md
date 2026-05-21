# SDD：成屋不動產說明書 DOM/UX 與資料缺口紀錄

日期：2026-05-20

## 目的

這份文件是給後續開發直接讀的工作紀錄。以後修 AIRE 成屋不動產說明書時，先看這份，不要只翻聊天紀錄。

## 已用假資料走過的 DOM 檢查

測試入口：
- `/cases/11111111-1111-4111-8111-111111111111`
- 假案件狀態直接切到第 3 步與第 5 步
- viewport：1440、1728

已確認：
- 成屋第 3 步有載入 `HouseMvpWorkbench`
- 現況調查表左側 38 題、右側預覽 38 列
- 現況調查頁只顯示「現場調查照片上傳」
- 生活機能頁只顯示「位置圖上傳 / 周邊圖上傳」
- 產權注意事項與增值稅附註不顯示圖片上傳
- `格局圖上傳` 不再錯誤出現在所有成屋頁
- PDF 預覽已改用 iframe 隔離，PDF HTML 的 CSS 不會污染 App 外層 DOM
- 1440 寬度下工作台上下排列，預覽可維持接近 A4 寬度
- 1728 寬度以上才左右並排

## 已修正的 UX 問題

1. 第 3 步 UI 太窄
   - 原因：案件頁外層 `max-w-4xl` 加上左右欄硬切 50/50。
   - 修正：案件頁放寬為工作台版面；1440 寬度上下排列，1728 以上才左右並排。

2. 圖片上傳欄位名稱錯誤
   - 原因：所有成屋圖片都共用「格局圖上傳」。
   - 修正：依頁面 slot 顯示：
     - 現況調查：現場調查照片
     - 生活機能：位置圖、周邊圖
     - 土地：土地規劃圖

3. 預覽匯出 UI 跑掉
   - 原因：PDF HTML 用 `dangerouslySetInnerHTML` 直接插入 App DOM，`body` 與 `*` reset CSS 影響整個 App。
   - 修正：改成 iframe `srcDoc` 隔離 PDF 預覽。

4. 步驟列顯示 1、2、3、5
   - 原因：實價登錄第 4 步未啟用時隱藏，但 UI 仍顯示原始 step number。
   - 修正：步驟列不顯示數字，改成「狀態 icon + 名稱」。

5. PDF 底部頁碼
   - Fish 已決策草稿/變動文件不要顯示固定頁碼。
   - 修正方向：HTML / React PDF header/footer 不再輸出頁碼字樣。

## 新增資料缺口

### A. 謄本資料有抓，但 PDF 物件資料表沒有完整帶入

目前 `assembleDossierData` 的建物版只讀：
- `building_registry.area`
- `building_registry.purpose`
- `building_registry.construction_date`
- `building_ownership.certificate_no`
- `building_ownership.ownership_date`

但 COP 文件顯示，建物標示部可提供更多欄位：
- MOI_API_004 地籍建物標示部資料服務
  - `AREA`：建物總面積
  - `PURPOSE`：主要用途
  - `BUILDINGFLOOR`：建物層數
  - `COMPLETEDATE`：建築完成日期
  - `FLOORACC`：建物分層或附屬建物
  - `SHAREDAREA`：共有部分面積
  - `SHAREDPARK`：共有部分停車位
- MOI_API_005 地籍建物所有權部資料服務
  - 權狀字號、登記日期、所有權資料
- MOI_API_026 建物標示及權利範圍查詢服務
  - 建物標示與權利範圍整合查詢，單筆 2 元

待修：
- 把 `BUILDINGFLOOR`、建築完成日期、建物總面積、分層/附屬/共有/車位資料映射到 `propertySheet`。
- 屋齡可由 `COMPLETEDATE` 推算，但 PDF 應標註資料來源與日期。
- 若 API 沒回資料，草稿仍留空白，不顯示「待補」。

### B. 拉謄本後缺少可讀預覽

目前第 2 步拉完地政 API，只顯示成功幾項與確認儲存，使用者看不到實際抓到哪些內容。

待修：
- 第 2 步拉資料後顯示「資料預覽表」：
  - API 名稱
  - 抓到的主要欄位
  - 會帶入 PDF 的欄位
  - 空白/缺資料欄位
  - 是否已儲存到本機
- 使用者在 PDF 前就要能知道資料是否正確。
- 2026-05-20 補充決策：API 抓得到的欄位都必須自動帶入，不要求使用者重填。欄位反推表見 `sdd-registry-api-field-backfill-map.md`。

### C. 附近實價行情仍可能使用舊假資料

問題：
- 實價行情頁面目前可能顯示舊的台南假資料。
- 臺北案件應顯示臺北附近行情。

待修：
- 追 `query_real_price` 在 mock 與 Tauri path 的資料來源。
- 測試臺北地址時，不應回台南固定資料。
- Fish 已確認：若查不到資料，輸出空白，不混入舊資料。

### D. 生活機能太長，位置圖與生活機能圖要合併

Fish 決策：
- 生活機能不需要列很多。
- 本機資料與網路參考皆顯示生活機能不應只有公園/捷運/市場。
- 第一版建議摘要類別：學校 1 個、醫療 1 個、公園 1 個、捷運/交通 1 個、市場/超市 1 到 2 個。
- 位置圖與生活機能圖可以合併成同一頁。

待修：
- `nearbyAmenities` 只保留生活機能摘要。
- HTML/PDF 不再把生活機能與位置圖拆成兩頁。
- 一頁內放地圖 + 摘要表。

## 建議下一個實作順序

1. 第 2 步地政資料可讀預覽
2. 建物謄本欄位映射補齊
3. 實價登錄 mock/正式資料來源切開，避免舊假資料污染
4. 生活機能摘要與位置圖合併
5. 再跑一次 DOM/UX/PDF smoke test

## 已確認 / 仍待確認

1. 已確認：實價行情查不到時輸出空白，不混入舊資料。
2. 已確認：屋齡由建築完成日自動推算，並保留建築完成日原值。
3. 已確認：API 有的地政欄位都要自動抓取、保存、預覽、帶入。
4. 待確認：生活機能是否除學校/醫療/公園/交通/市場外，再加入商圈、警察、行政機關。

## 2026-05-20 實作收斂紀錄

### 已補完

1. 第 2 步地政資料預覽
   - 新增 `src/lib/registry-preview.ts`，把地政 payload 轉成使用者看得懂的區塊。
   - 第 2 步會顯示土地標示部、土地所有權部、建物標示部、建物所有權部、他項權利/抵押。
   - 預覽欄位會說明「抓到什麼」與「會帶入哪個不動產說明書位置」。

2. 地政 payload 本機保存
   - 新增 SQLite migration `src-tauri/migrations/012_registry_payloads.sql`。
   - `cases` 資料列加入 `land_registry_data`，拉取後可在本機案件中保存。
   - 注意：目前已完成 schema/命令/前端 mock 驗證；真實 Tauri app 重新開啟後的 SQLite 手動驗證仍保留在 `4.9` / `4.26`。

3. 建物謄本欄位自動帶入
   - `assembleDossierData` 會從保存的 `building_registry` / `building_ownership` / `land_registry` / `co_owners` 回填物件資料表。
   - 已補欄位：建物總面積、主建物、附屬建物、共有部分、車位面積、樓層、主要用途、主要建材、建築完成日、屋齡、所有權人、取得日期、權利範圍。

4. 實價登錄假資料污染
   - mock backend 已改成依 district/keyword 回傳。
   - 臺北案件不再顯示台南固定舊資料。
   - 查不到時回空陣列，PDF/HTML 保持空白。

5. 生活機能與位置圖合併
   - PDF 與 HTML 都改成單頁 `位置圖與生活機能`。
   - 生活機能摘要上限：學校 1、醫療 1、公園 1、捷運/交通 1、市場/超市 2。
   - 地圖自動產生失敗時保留手動圖片上傳/覆蓋路徑。

6. UI/UX 自檢
   - 第 2 步拉完謄本後可看到內容，不再只看到地號/建號。
   - 第 3 步工作台使用更寬的左側表單與右側預覽配置。
   - 圖片欄位依頁面顯示，不再每頁都叫「格局圖」。
   - 步驟列不顯示 1、2、3、5，避免第 4 步被方案隱藏時看起來斷號。
   - 預覽匯出仍用 iframe 隔離，避免 PDF HTML CSS 污染 App UI。

7. 2026-05-20 追加：謄本預覽版面與另存新檔
   - 左側查詢區不再硬塞完整謄本欄位，只保留查詢完成狀態、確認儲存、另存新檔。
   - 右側完整預覽改為可換行的欄位列，不再用固定寬度表格，避免「讀到的資料 / 帶入位置」擠壓跑版。
   - 拉到的謄本資料可另存為 `.aire-registry.json` 本機 JSON 檔，內含 schema、exportedAt、caseId、parcelId、apiIds、payload，方便未來做匯入/重用。
   - 若 API payload 沒有提供所有權人，畫面維持空白/列入空白欄位，不得用 mock 或案件預設姓名假裝成謄本所有權人。

### 驗證紀錄

已通過：

```bash
pnpm test
pnpm type-check
cargo test -p aire --lib land_registry -- --nocapture
E2E_BASE_URL=http://localhost:3000 pnpm exec playwright test e2e/aire-disclosure-registry-ux.spec.ts --project=chromium-tauri
```

測試覆蓋：
- `pnpm test`：103 個測試檔、505 個測試全部通過。
- Playwright E2E：用假資料走第 2 步謄本預覽、第 3 步工作台、圖片欄位、生活機能頁、水平溢出檢查、預覽 iframe。
- E2E 刻意不依賴外部 geocode/地圖服務；地圖與生活機能合併邏輯由 unit/integration tests 驗證，避免第三方網路造成假失敗。

2026-05-20 追加驗證：

```bash
pnpm test
pnpm type-check
cargo test -p aire --lib -- --nocapture
E2E_BASE_URL=http://localhost:3000 pnpm exec playwright test e2e/aire-disclosure-registry-ux.spec.ts --project=chromium-tauri
```

追加驗證結果：
- Vitest：103 個測試檔、505 個測試通過。
- Rust lib：235 個測試通過。
- Playwright：第 2 步到預覽匯出流程通過。

### 仍不能假裝完成的缺口

1. 真實 COP token / 訂閱端點
   - 目前已補欄位包裝與 mock/Rust parser。
   - 付費上線前仍要用真實 COP 帳號跑一次 production/sandbox。

2. 地址反查建號與部分進階 COP 服務
   - `building_other_rights` 已補 wrapper。
   - 建號查詢、權利範圍、權利狀態、地籍圖 WFS/WMS 仍要依訂閱權限確認後接。

3. 真實 Tauri DB 持久化手動驗收
   - migration 與命令已補。
   - 還需要用桌面 app 實際拉一次謄本、關閉重開、檢查案件仍有 `land_registry_data`。

## 2026-05-20 Debug：Step 5 預覽與下載 PDF 不一致

### Fish 回報

1. 第 5 步畫面顯示「不動產說明書預覽 / 預覽內容已隔離於 iframe」，但 iframe 內容與下載後的 PDF 不一樣。
2. 實際下載檔案：`/Users/fishtv/Downloads/AIRE-2026-001-說明書 (1).pdf`。
3. 下載 PDF 的「不動產現況說明書」與原始表單差異很大。
4. 草稿版若沒有勾選，PDF 應該留空白勾選欄位，讓業務到現場手寫或打勾；不應輸出「是、否、未填」這種系統狀態文字。

### 已重現

用 `pdftotext` 檢查下載 PDF，現況頁包含：

- `肆、不動產現況說明書（建物）`
- `一、基地現況調查（共 35 題）`
- 多題旁邊輸出 `是`、`否`、`未填`

### 根因

目前第 5 步有兩套輸出管線：

1. iframe 預覽：`renderDisclosureHtml()` + `toIframePreviewHtml()`
2. 下載 PDF：`@react-pdf/renderer` + `PdfDocument`

兩套 renderer/template 不同，因此預覽不可能保證等於下載 PDF。

另外，`PdfDocument` 的建物現況表仍使用舊的 `BuildingConditionSurveyPages` 58 題 schema，所以下載 PDF 會出現舊版 `未填` 答案選項；這與已決策的 38 題 MVP 空白勾選表不一致。

### 修正決策

1. 第 5 步預覽與下載必須共用同一份 PDF blob。
   - 預覽 iframe 改用 `src=blob:` 顯示實際 PDF。
   - 下載按鈕直接下載同一份 blob。
   - 這樣預覽看到什麼，下載就是什麼。
2. 建物現況表 PDF 改用 38 題 Page Contract。
   - 標題改為 `肆、現況調查表`。
   - 每題只有空白 `是 / 否` 勾選框與可書寫備註線。
   - 金額題顯示可書寫線。
   - 不輸出 `未填`。
3. 獨立預覽頁 `/cases/[id]/preview` 也同步改成 PDF blob iframe，避免另一個入口再次出現「預覽與下載不一致」。

### 驗收標準

1. 第 5 步 iframe 的 `src` 是 PDF blob，不再用 `srcDoc` HTML 預覽。
2. 點「匯出 PDF」下載的是同一份已預覽的 PDF blob。
3. 下載 PDF 的建物現況表不含 `未填`。
4. 下載 PDF 的建物現況表使用 38 題 MVP 標題與欄位，不再使用舊 58 題標題。
5. 單元測試要覆蓋：
   - Step 5 iframe 改為 blob src。
   - `PdfDocument` 建物版不渲染 `未填`。
