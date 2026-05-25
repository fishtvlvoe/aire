# align-product-ui-with-demo-reference — Design

## 對焦結論

這次落差不是「樣式還沒套好」，而是正式產品主流程沒有以 demo 為基準重建。

```
demo 期望
  AIRE 正式產品 = 案件工作台 + 地政資料 + 產出文件 + 系統設定
       ↓
現在看到
  正式產品 = 舊 wizard / 零散 key-in / 簡化 sidebar / 舊設定頁
       ↓
本 SR 要補
  重新定義產品殼層、工作台、設定、費用、升級、前後端端口
```

## 參考基準

| 類型 | 檔案 | 角色 |
|---|---|---|
| 工作台 demo | `UI-UX-DEMO-REFERENCE/registry-autofill-workbench.html` | 正式案件工作台、sidebar、欄位審核、補件、費用、PDF 檢查的 UI/UX 基準 |
| 設定 demo | `UI-UX-DEMO-REFERENCE/registry-autofill-settings.html` | 系統設定、升級開關、地政規則、費用歸屬、PDF 圖資欄位、地政授權的 UI/UX 基準 |

## 1. 本來應該做，卻沒做的

| # | demo 本來要求 | 目前產品狀態 | 落差 | 本 SR 要求 |
|---|---|---|---|---|
| A1 | 資料夾式主選單：案件管理、地政資料、產出文件、系統設定，各自有子選單 | `AppSidebar` 仍接近只有「案件管理 / 設定」的簡化導覽 | 資訊架構完全不同，使用者找不到地政資料、費用紀錄、PDF 輸出等入口 | 重做 sidebar 成 demo 的資料夾 + 子選單，保留收合與個人設定 |
| A2 | 主畫面是「說明書工作台」 | 案件仍容易進到舊版 wizard 或只看到 PDF 預覽區 | demo 工作台沒有成為主流程 | 案件主路由改為 demo-aligned workbench，舊 wizard 降為 legacy/過渡 |
| A3 | 左欄「案件與章節」：案件卡、地址與地政判斷、章節 pills、本章完成度 | 現有頁面沒有完整左欄，章節與案件資訊分散 | 使用者無法先看案件狀態，再進欄位審核 | 建立 workbench 左欄，章節依地政結果自動帶出 |
| A4 | 右欄「欄位審核」：欄位、資料來源、補件、費用、PDF 檢查 tabs | 現有只有局部 field/survey 或 wizard step | 沒有形成審核工作台 | 建立右欄 tabs，把欄位狀態、補件、費用、PDF 檢查集中 |
| A5 | 新增案件先輸入地址，由地政自動判斷土地/建物/農舍 | `cases/new` 仍是人工物件類型優先 | 使用者被迫先懂地政分類 | 改成 address-first，查不到或多候選才顯示人工選擇 |
| A6 | 欄位列顯示客戶懂的資料來源與狀態 | 目前仍有 `MOI_API_*`、`COP309`、英文方案或 backend 字可能露出 | 客戶認知負擔太高 | 前台只顯示中文服務名與白話狀態，工程細節移到稽核/admin |
| A7 | 費用紀錄能看到成功、失敗、0 元、免費、回傳筆數、正確金額 | 現有 ledger/usage 能力未整合成 demo 入口 | 客戶不知道花了多少、為何扣款 | 建立「地政資料 → 費用紀錄」產品入口與 UI contract |
| A8 | 設定頁分類：授權與升級、地政資料規則、費用與帳務、PDF 圖資欄位、地政授權 | 現有 settings 是授權、API key、logs、premium、dev admin 等混合 | 設定分類與 demo 不同，也讓工作台塞太多說明 | settings 重排成 demo 分類；舊功能移入相對應分類或 admin |
| A9 | 升級功能是 iOS-style toggle，未升級灰色，已升級可開關 | 目前只有部分 entitlement/feature flag，UI 未對齊 demo | 升級端口與客戶可見操作不清楚 | 建立 entitlement adapter 與 toggle UI contract |
| A10 | 屋主資料邊界、費用歸屬、PDF 圖資欄位放設定，不放工作台 | 之前 demo 嘗試與現有工作台混在一起 | 工作台變擠，且客戶每次作業都看到不必要規則 | 全部移到設定或專屬查帳頁 |
| A11 | PDF 圖資欄位預留地籍圖、地標圖、空拍圖、格局圖位置 | 目前不是以 demo 設定分類呈現 | 未來升級功能沒有清楚 UI 與端口 | 在 settings 建立 PDF asset slots 與授權關聯 |
| A12 | 視覺風格要接近 demo：輕量灰階、低飽和、清楚間距、無突兀厚黑框 | 目前實作畫面與 demo 差距大，像不同產品 | 視覺信任感不足 | 設 CSS token 與 Playwright screenshot gate，對照 demo 檢查 |
| A13 | 前後端端口要對齊：地址判斷、欄位狀態、費用 ledger、升級 toggle | 現有前端局部有資料，後端/adapter 契約不完整 | UI 看起來有東西，但功能不能完整運作 | 補 adapter interface、mock、Tauri/backend contract 與測試 |

## 2. 可以保留，但需要修改樣式或位置的

| # | 可保留項目 | 目前價值 | 需要怎麼改 |
|---|---|---|---|
| B1 | `AppSidebar` 的收合與 profile 概念 | 符合使用者要的個人設定入口 | 改成 demo 的資料夾式主選單，不保留簡化兩項導覽 |
| B2 | `CaseWizardStep2` 的地址/地政資料局部 UI | 已有地政查詢與 registry preview 基礎 | 拆出成 workbench 左欄「地址與地政判斷」與右欄「資料來源」 |
| B3 | `PullParcelDataButton` / 查詢前確認 | 可避免使用者誤扣地政費用 | 文案改中文服務名與費用規則，結果進費用紀錄 |
| B4 | `HouseMvpWorkbench` 的現場確認、補件、欄位缺漏能力 | 內容方向符合「欄位審核」 | 拆掉常駐升級/規則說明，改成右欄 tabs 的補件與現場確認內容 |
| B5 | `KeyinSplitPage` 的左右分割操作思路 | 符合兩欄工作區方向 | 視覺與資訊架構要改成 demo，不保留獨立怪異版面 |
| B6 | `settings/page.tsx` 內的 license、land API、premium、logs | 都是必要後台功能 | 重分類到「授權與升級 / 地政授權 / 費用與帳務 / admin」 |
| B7 | PDF 預覽與匯出能力 | demo 有「產出文件」與「PDF 檢查」 | 不作為案件主畫面唯一內容，改成工作台 tab 或產出文件子選單 |
| B8 | mock-backend / local case fixtures | 可以支援前端驗證 | 要補 demo-aligned seed data：農舍、土地 2 筆、建物 1 筆、27 元費用 |
| B9 | 現有 local/Tauri 隱私邊界 | 符合「案件資料不送 OPCOS」 | 文案移到設定，不要塞在工作台常駐區 |

## 3. demo 本來就沒有，但現有產品有的東西

| # | 現有項目 | demo 是否需要 | 處理方式 |
|---|---|---|---|
| C1 | 品牌/主題設定 | demo 沒有 | 保留在系統設定次要頁，不要放主工作台 |
| C2 | Dev super admin / debug feature flags | demo 沒有 | 移到 admin/dev-only，不給一般客戶看到 |
| C3 | license activation 細節頁 | demo 沒有完整展開 | 收進「授權與升級」或「地政授權」，維持功能但改入口 |
| C4 | 操作 logs 原始紀錄 | demo 只有費用與地政資料方向 | 保留為 admin/稽核，客戶只看費用紀錄與白話狀態 |
| C5 | PDF iframe 內建 viewer 的完整工具列 | demo 沒有要求完整 iframe 細節 | 可保留，但放到「PDF 預覽 / PDF 檢查」而非主流程首頁 |
| C6 | 38 題現場確認完整問卷 | demo 只露出現場確認章節 | 保留內容，但用章節/tab progressive disclosure，不要一次塞滿 |
| C7 | floor plan/photo upload panels | demo 只要求 PDF 圖資欄位預留 | 另接 `floor-plan-assets-and-ai-schematic` 或後續 SR，本 SR 只保留 slot/entitlement |
| C8 | 舊版五步 wizard | demo 沒有 | 降為 legacy/dev route 或逐步拆元件重用，不作主流程 |
| C9 | 英文方案 enum 與技術 label | demo 沒有 | 前台禁止；只留在程式、admin 或 logs |

## SR 關係

`align-product-ui-with-demo-reference` 取代 `disclosure-registry-autofill-system-update` 中「產品級 UI 整合」的判斷基準，尤其是 sidebar、workbench、settings、customer-facing wording、visual verification 相關項目。

它不取代原 SR 的 MOI catalog、outcome ledger、費用計算、地政欄位 mapping 等後端資料工作；那些能力會被本 SR 當作工作台與設定頁的資料來源。

```
舊 SR：資料與 API 能力
        ↓ 提供資料
新 SR：正式產品 UI/UX 對齊 demo
        ↓ 呈現給客戶
AIRE 工作台與設定頁
```

## 設計原則

- 工作台只放「此案件現在要做什麼」。
- 設定頁放「一次性規則、升級、授權、費用歸屬」。
- 費用紀錄放「成功/失敗/免費/0 元/扣款原因」。
- 客戶畫面只用中文業務詞，工程碼留在 admin/log。
- 先地址判斷，不能判斷才人工選。
- 視覺必須拿 demo 截圖對照，不用 build 成功取代 UI 驗收。

## 驗證策略

| 類型 | 驗證 |
|---|---|
| Spec gate | `spectra analyze align-product-ui-with-demo-reference --json`、`spectra validate align-product-ui-with-demo-reference` |
| Unit/Component | sidebar folders、settings categories、entitlement toggles、address-first state、field row label sanitization |
| API/Adapter | registry classification、usage ledger、entitlement state、PDF asset slots mock contract |
| Browser | 1440px、1024px、768px 對照 demo reference 截圖 |
| Text audit | 前台不得出現 `MOI_API_`、`COP309`、`Basic`、`pro`、`advanced`、backend enum |
