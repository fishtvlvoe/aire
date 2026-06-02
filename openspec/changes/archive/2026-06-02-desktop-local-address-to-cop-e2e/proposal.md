## Why

目前 AIRE 的工作被拆成兩段：`mvp-land-lookup-unify` 只處理地址對地段／地號／建號契約，`browser-local-runtime-mvp` 偏本機 runtime / 打包。這讓 `土地面積 / 公告現值 / 公告地價 / 實價登錄` 雖然已開始出現在 `/cases/new`，但還沒有被一條明確 SR 約束成「免費前查」與「付費正式查」兩層資料鏈，更沒有一路接到 PDF 組裝與 Mac 驗收主線。

如果繼續分散處理，會出現四種回歸：

- UI 顯示欄位，但正式 COP / trusted data 不吃這些欄位
- formal pull 打中正確 API，但 PDF 仍讀不到或優先序錯誤
- Mac 版看起來能查，實際無法從地址查詢一路走到正式 PDF
- 舊桌面版已接上的實價登錄真資料，在 web / local runtime 退回 mock fixture，導致台南查到舊 `裕農路`、台北查到固定 `和平東路`
- 免費前查與付費正式查邊界不清，導致本來應免費的地址補齊 / 附近行情被誤認成要先打 COP 才能完成
- 地址前查只定位到土地時，系統可能從同地號建物清單偷拿第一個建號當正式查詢目標，造成 `58巷4號` 查到 `58巷16號` 這類錯物件資料
- 匯入明細與 PDF 前置審核對欄位語意不足，會把未查 API 列成上游失敗，或把 `BUILDINGFLOOR=003`、用途代碼 `A` 直接當成樓層 / 主要用途顯示

## What Changes

- 恢復 `desktop-local-address-to-cop-e2e` 為 active change，作為唯一的 Mac 先行主線
- 明確切分兩層流程：
  - 簽約前免費前查：地址候選、附近實價登錄、免費可得的公告值 / 面積 / 候選補齊、免費可得的建物標示參考資料；此階段只產 reference / pre-survey 版本工作台與 PDF，不得產生 COP 成本
  - 簽約後正式補件：案件完成簽單或進入正式補件階段後，才輸入正式調閱所需資料，並依使用者確認調閱電子謄本 / formal COP 的所有權與他項權利資料
- 明確定義 7 個欄位的資料鏈：
  `地段 / 地號 / 建號 / 土地面積 / 公告現值 / 公告地價 / 實價登錄`
  必須從免費地址查詢候選、人工確認、必要時 formal COP pull、local trusted record、dossier assembly 一路可追
- 明確定義 COP 是「正式查詢來源」而非可回寫儲存；系統要寫入的是本機案件資料、provenance、query run 與 PDF snapshot
- 明確定義成本規則：只有需要串正式付費 API 的動作，才顯示費用並要求使用者確認；免費前查不得產生成本
- 明確修正估價規則：正式補件費用不得用「成功項目數 × NT$10」固定估算，必須依 `moi-service-catalog` / COP 服務目錄的 API 單價與實際查詢單位計算
- 收斂案件工作台摘要 UI：核心三頁（欄位初審 / 補件與現場 / 正式資料匯入）使用 12px 表格式摘要；非核心頁（物件資料總覽 / PDF 檢查）使用 17px 精簡單行摘要；主工作區字級統一為 17px
- 把 PDF 需求收斂成同一條鏈：命中正確 formal API 後，trusted data 與上述欄位可用於產出草稿 / 說明書 PDF
- 補回實價登錄 source 統一：web、local runtime、desktop app 都必須走同一套地址解析、city dataset mapping、日期倒序與來源 provenance，不能再讓 Tauri / web 各自使用不同資料源
- 修正候選與欄位語意：同一土地有多個建號時列成候選或要求人工確認，不得自動使用第一個建號；樓層、主要用途、建物面積必須依欄位語意轉換後才可進工作台與 PDF
- 匯入明細只顯示本次實際查詢項目的缺漏；未查 API 不得顯示為「上游未回」
- 驗收順序改成 Mac first：先完成本機 Web / Mac App 可正常跑通，再延後 Windows smoke / installer / signing

## Non-Goals

- 不處理 Windows VM、installer、code signing、auto-update
- 不擴充新的外部地政來源；沿用既有 EasyMap discovery、formal COP、Twinkle real-price
- 不重做整套 PDF theme / 排版，只補資料鏈與驗證缺口
- 不在本 change 內重構所有 legacy / `dist-local-runtime` 型別問題
- 不把免費前查誤做成隱性付費流程；是否付費必須是產品可見且由使用者明確觸發
- 不在簽約前調閱所有權、他項權利或電子謄本；這些正式產權資料只屬於簽約後補件階段
- 不把免費前查資料標示成正式謄本；免費資料只能標示為 reference / pre-survey

## Capabilities

### New Capabilities

- `desktop-local-address-to-cop-e2e`: Mac-first 的地址查詢 → confirmed key → formal COP → trusted data → PDF 單一驗收主線
- `nationwide-free-pre-survey`: 全台地址前查、附近實價登錄、候選補齊、免費資料展示

### Modified Capabilities

- `registry-data-provenance`: 新增公告現值、公告地價、土地面積、實價登錄來源與 trusted/ reference 邊界
- `dossier-data-assembly`: 新增正式地政資料與實價登錄、公告值欄位組裝規則
- `authorized-registry-pdf-completeness`: 正式 pull 與 PDF 使用 confirmed registry key 與 trusted data
- `real-price-query`: 實價登錄不只顯示於 UI，也進入 dossier 組裝與 PDF 可用資料
- `desktop-real-price-source-parity`: 桌面版既有真資料查詢能力必須在 web / local runtime 恢復一致
- `paid-query-consent-and-cost`: 需要付費的正式查詢必須先顯示費用與用途，再由使用者決定是否執行
  - 新增兩段式補件邊界：簽約前免費前查不扣費；簽約後正式補件才調閱電子謄本 / formal COP，且費用依服務目錄逐項計算

## Impact

- Affected specs: `desktop-local-address-to-cop-e2e`, `nationwide-free-pre-survey`, `paid-query-consent-and-cost`, `registry-data-provenance`, `dossier-data-assembly`, `authorized-registry-pdf-completeness`, `real-price-query`
- Affected code:
  - Modified: `src/app/(dashboard)/cases/new/page.tsx`, `src/lib/land-registry-api.ts`, `src/lib/registry-provenance.ts`, `src/lib/pdf-engine/assemble-dossier-data.ts`, `src/lib/pdf-engine/document.tsx`, `src/lib/moi-service-catalog.ts`, `src/lib/server/local-formal-pull-proxy.ts`, `src/components/PullParcelDataButton.tsx`, `src/components/workbench/DemoAlignedWorkbench.tsx`, `src/app/(dashboard)/cases/[id]/preview/page.tsx`, `src/lib/export-pdf.ts`, `src/app/api/local/pdf/route.ts`, `src-tauri/src/land_registry/pull.rs`
  - New: `src/lib/pdf-engine/__tests__/assemble-dossier-mac-chain.test.ts`, `src/app/(dashboard)/cases/new/__tests__/formal-cop-persistence.test.tsx`
  - Removed: (none)
