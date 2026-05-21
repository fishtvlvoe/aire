# SDD：地政 API 欄位反推與自動帶入規則

日期：2026-05-20

## 結論

AIRE 不動產說明書不能只讓使用者按「拉謄本」後手填資料。凡是地政 API / 謄本可取得的欄位，MVP 預設都要自動帶入本機資料與 PDF 預覽。只有 API 沒有、查不到、或現場才知道的欄位，才保留空白給業務手寫或後補。

原始 API payload 必須完整保存在客戶本機，不上傳雲端。顯示欄位則由 payload 推導，不要把謄本資料只壓平成地號/建號。

## 來源文件

- `docs/0417-new/建安不動產欄位總表.md`
- `openspec/changes/aire-license-local-vault-architecture/artifacts/page-contract-house-property-rights.md`
- `openspec/changes/aire-license-local-vault-architecture/artifacts/page-contract-house-land-display.md`
- `docs/cop-scrape/05-服務說明文件/MOI_API_001地籍土地標示部資料服務.html`
- `docs/cop-scrape/05-服務說明文件/MOI_API_002地籍土地所有權部資料服務.html`
- `docs/cop-scrape/05-服務說明文件/MOI_API_003地籍土地他項權利部資料服務.html`
- `docs/cop-scrape/05-服務說明文件/MOI_API_004地籍建物標示部資料服務.html`
- `docs/cop-scrape/05-服務說明文件/MOI_API_005地籍建物所有權部資料服務.html`
- `docs/cop-scrape/05-服務說明文件/MOI_API_006地籍建物他項權利部資料服務.html`

## API 可抓欄位與用途

### MOI_API_001 地籍土地標示部

必須保存與可預覽欄位：

| API 欄位 | 中文 | AIRE 帶入位置 |
| --- | --- | --- |
| `RDATE` | 登記日期 | 土地標示/登記日期 |
| `REASON` | 登記原因 | 土地標示/土地登記原因 |
| `AREA` | 面積 | 土地標示/總面積、稅費試算 |
| `ZONING` | 使用分區 | 土地標示/使用分區 |
| `LCLASS` | 使用地類別 | 土地標示/使用編定 |
| `ALVALUE` | 公告土地現值 | 土地增值稅/公告現值 |
| `ALPRICE` | 公告地價 | 地價稅/公告地價 |
| `COUNTY` | 縣市 | 案件/地址輔助 |
| `DISTRICT` | 鄉鎮市區 | 案件/地址輔助 |
| `Y_COORDINATE` | 視中心縱坐標 | 地圖/生活機能定位 |
| `X_COORDINATE` | 視中心橫坐標 | 地圖/生活機能定位 |
| `MAPSHEET` | 圖幅號 | 地籍圖/附件 |
| `BUILDINGCOUNT` | 地上建物建號數量 | 土地標示/地上建物摘要 |
| `NOTE[].CONTENT` | 其他登記事項內容 | 產權注意事項/其他登記事項 |

### MOI_API_002 地籍土地所有權部

必須保存與可預覽欄位：

| API 欄位 | 中文 | AIRE 帶入位置 |
| --- | --- | --- |
| `OWRNO` | 所有權登記次序 | 本機謄本紀錄 |
| `RDATE` | 登記日期 | 土地標示/登記日期 |
| `REASON` | 登記原因 | 土地標示/取得原因 |
| `REASONDATE` | 登記原因發生日期 | 土地標示/取得日期 |
| `RIGHT` | 權利範圍類別 | 土地標示/權利範圍 |
| `DENOMINATOR` | 權利範圍分母 | 土地標示/權利範圍 |
| `NUMERATOR` | 權利範圍分子 | 土地標示/權利範圍 |
| `DLPRICE` | 申報地價 | 稅費試算 |
| `OWNER.LTYPE` | 所有人類別 | 本機謄本紀錄 |
| `OWNER.LID` | 統一編號 | 本機敏感資料，只本機保存 |
| `OWNER.LNAME` | 姓名 | 土地標示/所有權人 |
| `OWNER.LADDR` | 地址 | 本機敏感資料，只本機保存 |
| `ORNO` | 他項權利登記次序 | 他項權利/抵押索引 |
| `LTDATE` | 前次移轉年月 | 土地增值稅/前次移轉 |
| `LTVALUE` | 前次移轉現值或原規定地價 | 土地增值稅/前次移轉現值 |
| `NOTE[].CONTENT` | 其他登記事項內容 | 產權注意事項/其他登記事項 |

### MOI_API_003 地籍土地他項權利部

必須保存與可預覽欄位：

| API 欄位 | 中文 | AIRE 帶入位置 |
| --- | --- | --- |
| `ORNO` | 他項權利登記次序 | 土地他項權利 |
| `RDATE` | 登記日期 | 他項權利/登記日期 |
| `REASON` | 登記原因 | 他項權利/登記原因 |
| `SETRIGHT` + `SRDENOMINATOR` + `SRNUMERATOR` | 設定權利範圍 | 他項權利/設定範圍 |
| `AREA` | 設定權利範圍面積 | 他項權利/設定面積 |
| `CERTIFICATENO` | 證明書字號 | 他項權利/證明書 |
| `RIGHTTYPE` | 權利種類 | 產權注意事項/權利種類 |
| `LNAME` | 權利人姓名 | 產權注意事項/權利人 |
| `CCP_RV` | 擔保債權總金額/權利價值 | 產權注意事項/抵押金額 |
| `STARTDATE` / `ENDDATE` | 存續期間 | 產權注意事項/期間 |
| `CCCONTENT` | 擔保債權種類及範圍內容 | 產權注意事項/範圍內容 |
| `共同擔保地號` | 共同擔保土地 | 土地標示/共同擔保地號 |
| `共同擔保建號` | 共同擔保建物 | 土地標示/共同擔保建號 |
| `NOTE[].CONTENT` | 其他登記事項內容 | 產權注意事項/其他登記事項 |

### MOI_API_004 地籍建物標示部

必須保存與可預覽欄位：

| API 欄位 | 中文 | AIRE 帶入位置 |
| --- | --- | --- |
| `RDATE` | 登記日期 | 建物標示/登記日期 |
| `REASON` | 登記原因 | 建物標示/登記原因 |
| `AREA` | 建物總面積 | 物件資料表/登記坪數 |
| `BNUMBER` | 建物門牌 | 物件資料表/門牌地址 |
| `PURPOSE` | 主要用途 | 建物標示/法定用途 |
| `MATERIAL` | 主要建材 | 建物標示/主要建材 |
| `BUILDINGFLOOR` | 建物層數 | 建物標示/總樓層 |
| `COMPLETEDATE` | 建築完成日期 | 建物標示/建築完成日 |
| `COMPLETEDATE` 推算 | 屋齡 | 物件資料表/屋齡 |
| `LANDNO[]` | 基地地號 | 建物標示/坐落地號 |
| `FLOORACC[]` | 分層或附屬建物 | 主建/附屬建物/樓層面積 |
| `SHAREDAREA[]` | 共有部分 | 共有部分/公設面積與權利範圍 |
| `SHAREDPARK[]` | 共有部分停車位 | 車位資料 |
| `NOTE[].CONTENT` | 其他登記事項內容 | 建物標示/其他登記事項 |

### MOI_API_005 地籍建物所有權部

必須保存與可預覽欄位：

| API 欄位 | 中文 | AIRE 帶入位置 |
| --- | --- | --- |
| `OWRNO` | 所有權登記次序 | 本機謄本紀錄 |
| `RDATE` | 登記日期 | 建物標示/取得日期 |
| `REASON` | 登記原因 | 建物標示/取得原因 |
| `REASONDATE` | 登記原因發生日期 | 建物標示/取得日期 |
| `RIGHT` | 權利範圍類別 | 建物標示/權利範圍 |
| `DENOMINATOR` | 權利範圍分母 | 建物標示/權利範圍 |
| `NUMERATOR` | 權利範圍分子 | 建物標示/權利範圍 |
| `OWNER.LTYPE` | 所有人類別 | 本機謄本紀錄 |
| `OWNER.LID` | 統一編號 | 本機敏感資料，只本機保存 |
| `OWNER.LNAME` | 姓名 | 建物標示/所有權人 |
| `OWNER.LADDR` | 地址 | 本機敏感資料，只本機保存 |
| `ORNO` | 他項權利登記次序 | 建物他項權利索引 |
| `NOTE[].CONTENT` | 其他登記事項內容 | 產權注意事項/其他登記事項 |

### MOI_API_006 地籍建物他項權利部

必須保存與可預覽欄位與 `MOI_API_003` 同型，但標的是建物：

| API 欄位 | 中文 | AIRE 帶入位置 |
| --- | --- | --- |
| `ORNO` | 他項權利登記次序 | 建物他項權利 |
| `RDATE` | 登記日期 | 產權注意事項/登記日期 |
| `REASON` | 登記原因 | 產權注意事項/登記原因 |
| `RIGHTTYPE` | 權利種類 | 產權注意事項/權利種類 |
| `LNAME` | 權利人姓名 | 產權注意事項/權利人 |
| `CCP_RV` | 擔保債權總金額/權利價值 | 產權注意事項/抵押金額 |
| `共同擔保地號` | 共同擔保土地 | 土地標示/共同擔保地號 |
| `共同擔保建號` | 共同擔保建物 | 土地標示/共同擔保建號 |
| `NOTE[].CONTENT` | 其他登記事項內容 | 產權注意事項/其他登記事項 |

## 表格欄位反推結果

### API 應自動帶入

- 地段、地號、土地面積、使用分區、使用地類別、公告現值、公告地價、地上建物數量
- 土地所有權人、土地取得日期、土地登記原因、土地權利範圍、前次移轉現值
- 建號、門牌、建物總面積、主要用途、主要建材、總樓層、建築完成日期、屋齡
- 建物分層/附屬建物、共有部分、公設、車位共有資料
- 建物所有權人、建物取得日期、建物登記原因、建物權利範圍
- 土地/建物他項權利、抵押權利種類、權利人、擔保債權金額、共同擔保地建號
- 地圖定位用座標，若 API 有 `X_COORDINATE/Y_COORDINATE` 則優先用 API，不再先 geocode 地址

### 必須手填或現場補

- 格局、室內現況、管理費、管理方式、可否帶看、鑰匙保管
- 漏水、壁癌、增建、頂加、外推、夾層、凶宅/事故等現況調查
- 委託總價、付款條件、附贈設備、稅費手動調整
- 實價行情解讀、市調說明、生活機能摘要文字

## 實作要求

1. `拉謄本` 成功後，第 2 步必須顯示土地標示部、土地所有權部、建物標示部、建物所有權部、他項權利的可讀預覽。
2. 預覽要標出「讀到的資料」與「會帶入不動產說明書的位置」。
3. API 有資料時，後續 PDF/工作台預設使用 API 值，不要求使用者重填。
4. API 沒資料時，草稿輸出空白，不顯示 `待補`。
5. 原始 payload 必須保存在本機 DB/local vault；雲端不得收集。
6. 建築完成日一律推算屋齡，但仍保留建築完成日原值。
7. API payload 的所有欄位先完整保存，即使第一版 PDF 還沒全部顯示，避免之後重抓。
8. API payload 可另存新檔為本機 JSON，第一版先輸出 `.aire-registry.json`；後續匯入功能應讀同一 schema。
9. 所有權人欄位只可來自 API payload、手動輸入或正式匯入資料；mock 不得塞假姓名。若 COP/MOI 因個資規則不提供姓名，預覽與草稿保持空白。

## 2026-05-20 實作狀態

### 已落地到程式碼

1. 可讀預覽
   - `src/lib/registry-preview.ts`
   - `src/components/PullParcelDataButton.tsx`
   - `src/components/case-wizard/CaseWizardStep2.tsx`
   - 驗證：`src/lib/__tests__/registry-preview.test.ts`、`src/components/__tests__/CaseWizardStep2.test.tsx`、`e2e/aire-disclosure-registry-ux.spec.ts`

2. 本機保存
   - `src-tauri/migrations/012_registry_payloads.sql`
   - `src-tauri/src/db/cases.rs`
   - `src-tauri/src/commands/cases.rs`
   - mock/localStorage 路徑同步支援 `land_registry_data`。

3. COP/MOI wrapper 與欄位擴充
   - 土地標示：`src-tauri/src/land_registry/apis/land_registry.rs`
   - 土地所有權：`src-tauri/src/land_registry/apis/co_owners.rs`
   - 土地他項權利：`src-tauri/src/land_registry/apis/mortgages.rs`
   - 建物標示：`src-tauri/src/land_registry/apis/building_registry.rs`
   - 建物所有權：`src-tauri/src/land_registry/apis/building_ownership.rs`
   - 建物他項權利：`src-tauri/src/land_registry/apis/building_other_rights.rs`
   - pull API ids 已包含：`land_registry`、`co_owners`、`building_registry`、`building_ownership`、`mortgages`、`building_other_rights`。

4. PDF/HTML 自動帶入
   - `src/lib/pdf-engine/assemble-dossier-data.ts`
   - 建物版 property sheet 已從保存的 API payload 回填地號、使用分區、土地面積、所有權人、取得日期、登記坪數、主建物、附屬建物、共有部分、車位、樓層、用途、建材、建築完成日、屋齡、權利範圍。

5. 相關 UX 修正
   - 實價登錄 mock 不再用固定台南資料污染臺北案件。
   - 生活機能與位置圖合併成一頁。
   - 固定頁碼移除。
   - 謄本完整預覽集中在右側，左側只留操作按鈕與狀態，避免欄位擠壓跑版。
   - 查詢完成後可按「另存新檔」輸出 `.aire-registry.json`。
   - mock 後端不再回傳假的所有權人姓名；實際 API 沒有 owner 時列為空白欄位。

### 已跑驗證

```bash
pnpm test
pnpm type-check
cargo test -p aire --lib land_registry -- --nocapture
E2E_BASE_URL=http://localhost:3000 pnpm exec playwright test e2e/aire-disclosure-registry-ux.spec.ts --project=chromium-tauri
spectra analyze aire-license-local-vault-architecture --json
```

結果：
- Vitest：103 個測試檔、505 個測試通過。
- TypeScript：通過。
- Rust land_registry：87 個測試通過，僅既有 warning。
- Playwright：第 2 步到預覽匯出流程通過。
- Spectra analyze：Coverage / Consistency / Ambiguity / Gaps 皆 clean。

### 留給後續真機驗收

1. 實際 Tauri app 拉謄本後，關閉重開確認 `land_registry_data` 仍存在。
2. 用正式 COP token / sandbox token 確認欄位名稱與訂閱權限沒有與文件落差。
3. 確認是否購買/接上建號反查、建物權利範圍、建物權利狀態、地籍圖 WFS/WMS 等進階端點。
