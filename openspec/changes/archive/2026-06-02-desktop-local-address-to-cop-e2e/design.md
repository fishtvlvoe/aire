## Context

目前 repo 已經有兩個進行中的 change：

- `mvp-land-lookup-unify`: 解 lookup 契約與 Web/App 一致性
- `browser-local-runtime-mvp`: 解 local runtime、token、Node PDF write、Windows 安裝

但使用者現在真正需要的，是一條能在 Mac 上先正常運作的產品主線：

1. 免費地址查詢拿到候選
2. 免費顯示附近實價登錄與可補齊欄位
3. 確認地段 / 地號 / 建號
4. 只有需要正式土地 / 建物資料時才打 COP API，且先顯示費用
5. 產出 PDF

現況缺口不是單一 API，而是沒有 active SR 把這條鏈完整定型。`mvp-land-lookup-unify` 甚至明文把 PDF / disclosure 排除在外，無法直接承接這個需求。

另外，實價登錄目前存在一個明確回歸：舊 Tauri command 曾接到 Twinkle 真資料，但 web / local runtime 在 `query_real_price` 上退回 mock backend，導致地址查詢後顯示固定假行情，而不是依地址命中的最新成交資料。

## Goals / Non-Goals

**Goals**

- 建立一條 Mac first 的 active SR，約束地址查詢到 PDF 的完整資料鏈
- 明確定義免費前查與付費正式查的產品邊界
- 保證 7 個核心欄位在 confirmed match、trusted record、provenance、dossier assembly 間可追蹤
- 明確 formal COP pull 的輸入鍵與 PDF 的 trusted data 優先序
- 先完成本機 Web / Mac App 驗收，再談 Windows

**Non-Goals**

- Windows VM smoke、installer、簽章、自動更新
- 新增額外資料源或重構所有舊 PDF 版型
- 處理與本 change 無關的 legacy typecheck 問題

## Decisions

### 決策 1：`desktop-local-address-to-cop-e2e` 作為唯一主線，Mac 優先驗收

`mvp-land-lookup-unify` 保持 lookup 契約上游 change；正式 COP 與 PDF 不再塞回去。真正的可運作主線由 `desktop-local-address-to-cop-e2e` 承接，先要求本機 Web 與 Mac App 可以跑通。

- **Alternatives considered**
  - 繼續把 PDF 需求塞進 `mvp-land-lookup-unify`：否決，會破壞原本 change 邊界
  - 直接先做 Windows acceptance：否決，現在 blocker 是資料鏈不是平台環境

### 決策 2：COP 是讀取來源，系統寫入的是本機 trusted data 與 provenance

外部 COP API 不作為可回寫目標。所謂「欄位進 COP」在產品語意上，定義為：

- confirmed registry key 可作為 formal COP pull 輸入
- formal pull 結果與 7 個欄位一起落進本機案件資料 / provenance / query ledger
- PDF 只讀本機 trusted snapshot，不讀即時候選
- 免費前查資料與正式付費資料必須分層保存，不能混成單一成本來源

- **Alternatives considered**
  - 把欄位視為要寫回外部 COP：否決，外部 API 沒有這種寫入能力，規格會失真

### 決策 3：PDF 組裝優先序採 trusted COP > manual confirmed > candidate/reference

PDF 內正式謄本欄位一律優先吃 formal COP 成功後的 trusted data。  
`土地面積 / 公告現值 / 公告地價 / 實價登錄` 若 formal data 沒覆蓋，可使用 confirmed reference 或 query result，但必須帶 provenance。

- **Alternatives considered**
  - 讓候選欄位直接覆蓋正式資料：否決，會讓未正式確認資料污染客戶 PDF

### 決策 4：實價登錄同時是 UI 資料與 dossier input

`query_real_price` 不只負責頁面顯示，也必須進入 `assemble-dossier-data` 的 dossier snapshot。PDF 可用空結果，但不得因查無實價登錄而崩潰。

### 決策 5：實價登錄 source 以「地址感知 dataset mapping」統一，不允許 web fallback 到 mock fixture

`query_real_price` 必須在 web、local runtime、desktop app 使用同一套規則：

- 先用地址解析出 city / district / road keyword
- 依 city 選 Twinkle dataset
- 用交易日期倒序拿最近成交
- 回傳結果保留 source / query 條件可追蹤

第一階段至少覆蓋：

- 台南市：沿用既有 city dataset
- 台北市：改走台北實價周報 dataset
- 其他城市：暫用全國 dataset，但必須保留後續補 city-specific mapping 的擴充點

禁止 web/dev 再退回固定 fixture，因為那會讓使用者看到與地址無關的錯資料。

### 決策 6：付費查詢只能在 confirmed key 後觸發，且必須先顯示費用

產品邏輯要明確區分：

- 簽約前免費前查：
  - 地址候選查詢
  - 實價登錄附近行情
  - 免費可得的地段 / 地號 / 建號候選
  - 免費可得的土地面積 / 公告值參考欄位
- 簽約後正式補件：
  - 只有當案件完成簽單或進入正式補件階段，並要求電子謄本 / formal COP 的正式產權資料時
  - 才能用 confirmed `section_name / land_no / building_no` 與正式調閱所需資料去打付費 API
  - 所有權、他項權利 / 抵押不得放在簽約前免費前查階段自動調閱

每次付費動作前，UI 必須清楚告知：

- 這次要查什麼
- 預估成本 / 單價
- 失敗是否仍可能計費

使用者未明確確認前，不得自動發動付費正式查詢。

費用估算不得使用固定「成功項目數 × NT$10」。正式補件階段必須依 `moi-service-catalog` / COP 服務目錄的 API 單價與實際查詢單位計算，並將預估費用與實際費用拆成可讀明細。

| 階段 | 目的 | 來源 | 成本規則 | PDF 標示 |
| --- | --- | --- | --- | --- |
| 簽約前免費前查 | 快速確認物件、產出參考說明書 | Z10Web / R02 / 免費實價登錄 / 地圖與生活機能 | 不得產生 COP 成本 | reference / pre-survey |
| 簽約後正式補件 | 調閱正式產權資料與電子謄本 | formal COP / 電子謄本 | 依服務目錄與實際查詢單位計價 | trusted / formal |

### 決策 6D：補件流程改成兩段式，正式資料匯入只屬於簽約後

工作台的補件流程要重切，不再把所有資料都擠在同一個「正式資料匯入」頁面：

- 前段是免費物件核對：確認地址、地段、地號、建號、建物面積、建築完成日、屋齡、實價登錄、位置圖、生活機能、Logo 與 PDF 參考內容
- 後段是簽約後正式補件：使用者明確進入正式資料階段後，才顯示電子謄本 / formal COP 的所有權與他項權利調閱入口

這個切分的產品含義是：前期產出可以完整形成參考說明書，但不得要求使用者先花 COP 費；正式產權風險確認則留到簽單後，透過電子謄本 / formal COP 補上 trusted data。

若免費前查已取得建物標示參考資料，工作台與 PDF 可以使用，但來源必須標示為免費前查 / reference。只有簽約後正式補件回來的正式資料，才可以標示為 trusted / formal。

### 決策 6B：地址候選不得用同土地第一個建號猜測目標建物

Z10Web / EasyMap 若只能從門牌定位到土地，再從土地明細讀到多個建號，系統不得把第一個建號當成目標建物。這種資料只能形成候選清單或人工確認需求。

正式付費查詢使用的 `confirmed_registry_match` 必須來自同一筆已確認建物候選，或使用者人工輸入並確認的完整 key。系統不得用「土地候選 + 同地號第一個建號」組合出建物 key。

若 formal COP 回傳的建物門牌與案件地址不一致，系統應顯示查詢 key 與回傳門牌，並要求回到候選 / 建號修正流程。這是最後一道防錯保護，不能取代前段候選選擇修正。

正式匯入建物資料前，系統應先用官方門牌查建號服務解析案件地址。解析成功時，以官方回傳的 `UNIT / SEC / NO` 覆蓋前查候選建號再送後續建物標示 / 所有權查詢；解析失敗或回傳門牌不一致時，不得送出後續付費建物查詢。

Z10Web 是免費前查的 primary source；R02 只可作為 fallback 或交叉驗證來源，不得把土地 / 門牌路徑改回 R02-first。地段地號輸入也必須先走 Z10Web，避免新版 / 舊版便民系統鄉鎮代碼差異導致可查資料被誤判為 manual required。

R02 舊版便民系統若恢復可用，可作為 Z10Web 的交叉驗證來源：兩者地號 / 建號一致時提高可信度；其中一方不可用時保留可用來源並顯示診斷；兩者衝突時不得自動標高可信，必須顯示候選衝突供人工確認。

電梯大樓或公寓若 Z10Web 只能定位到同一土地並回多個建號，且輸入地址含 `樓` / `之幾`，系統應把國字樓層與戶別正規化為 R02 可解析的阿拉伯數字格式，例如 `八樓之一` / `8樓之一` 皆轉為 `8樓之1`。此時 R02 只用來做戶別解析並縮小 Z10Web 候選，不得改變 primary source；若 R02 回單一 `office / section / landNo / buildingNo` 且存在於 Z10Web 候選中，系統可將候選縮為該建號並標為 high confidence。

地址解析必須忽略使用者輸入中的任意半形空白。`台南市東區中華東路三段 24 巷 8 號 5 樓` 與 `台南市東區中華東路三段24巷8號5樓` 應被視為同一地址查詢，不得因空白導致 Z10Web / R02 lookup 結果分歧。

地址解析也必須將全形 / 半形、中文 / 阿拉伯數字視為同義輸入。`中華東路三段` 與 `中華東路3段`、`五樓之一` 與 `5樓之1`、`２４巷８號` 與 `24巷8號` 應進入同一個內部地址模型；呼叫便民系統時可依 Z10Web / R02 實際支援格式產生查詢變體。

### 決策 6C：工作台與 PDF 欄位必須使用可讀語意，不直接顯示地政原始代碼

地政回傳欄位需要先判斷語意再顯示：

- `BUILDINGFLOOR` / `building_floor` 若為 `003`、`013層`、`三層` 等總層數或登記層數，不得直接當成本戶樓層；本戶樓層優先來自門牌樓層、候選樓層或人工前置審核
- 主要用途若為 `A`、`H2` 等代碼，工作台與 PDF 應顯示對應可讀文字，無法解碼時顯示「代碼 A，待確認」，不得冒充已解讀用途
- 建物面積必須保留單位轉換語意；平方公尺與坪數不得顛倒，來源文字需區分「建物標示資料」與「PDF 前置審核」

### 決策 6A：工作台摘要與字級分成核心三頁模式與非核心頁模式

案件工作台不再使用左側大摘要卡。摘要區統一移到主工作區上方，並分成兩種模式：

- 核心三頁：`欄位初審`、`補件與現場`、`正式資料匯入`
  - 使用 12px 緊湊摘要表
  - 欄位固定為：`名稱 / 地址 / 地政組成 / 已帶入 / 待補件 / 待確認 / 資料狀態`
- 非核心頁：`物件資料總覽`、`PDF 檢查`
  - 使用 17px 精簡單行摘要
  - 只保留：`物件摘要 / 名稱 / 地址`

除摘要表之外，主工作區文字統一使用 17px，包括標題、說明、tabs、按鈕、badge、表格內容與 PDF 檢查內容。

響應式行為採可換行堆疊，不用固定欄寬，也不退回大卡片摘要。

### 決策 7：驗收必須留下 Mac 證據，Windows 延後

完成定義不是 unit test 綠而已，而是：

- `/cases/new` 查詢成功
- formal COP pull 成功
- dossier preview / export 成功
- 以上流程在 Mac 上有 smoke evidence

### 決策 8：第一階段驗收邊界是「便民系統免費前查」，第二階段才進 COP

截至 2026-05-31，本 change 的第一階段可以交給 Fish 親測驗收。驗收目標不是證明全台所有異形資料都已涵蓋，而是確認兩種核心輸入都能形成可用草稿：

1. 真實有地址的建物
2. 有地段地號的土地

第一階段只允許使用免費前查資料，並產出 reference / pre-survey 草稿。這階段已確認：

- 建物地址可從 Z10Web primary source 回土地 / 建物候選，並以 R02 作為必要時的 fallback、交叉驗證或戶別縮小來源。
- 不同建物類型已覆蓋大樓、華廈、公寓、透天、別墅等真實 fixture；其中大樓 / 公寓要特別處理樓層與 `之幾` 戶別。
- 土地地段地號可從 Z10Web 回正式地段名稱、段代碼、地政事務所代碼、正規化地號、土地面積、使用分區、公告現值、公告地價。
- 使用分區可作為第一階段土地類型判斷依據，例如 `山坡地保育區`、`特定農業區`；但不得把它當成正式產權結論。
- 買家版 reference PDF 不得顯示內部候選狀態、`candidate_found`、`unconfirmed`、成本診斷或「來源：PDF 前置審核」等系統語言。

第一階段仍不得做的事：

- 不得自動調閱所有權、他項權利、電子謄本或 formal COP。
- 不得把免費前查資料標示為 formal / trusted。
- 不得因免費前查缺少所有權人、取得日期、權利範圍、抵押或限制登記，而顯示成前查失敗；這些欄位屬於簽約後正式補件。
- 不得為了補齊 PDF 而用假值或 mock 值填買家版內容。

第二階段才進 COP。COP 階段的輸入不應再猜地址，而是使用第一階段人工確認後的完整 key：

```text
地政事務所代碼 + 段代碼 + 地號 + 建號（建物才有）
```

COP 階段要做的事：

- 顯示正式補件入口，清楚區分「正式土地 / 建物資料」與「免費前查資料」。
- 依案件類型列出將查詢的 API 與用途。
- 依 `moi-service-catalog` 顯示逐項費用，不得退回固定每項 NT$10。
- 使用者明確確認後才送 formal pull。
- formal pull 成功後，把 trusted data 寫回本機案件、provenance 與 PDF snapshot，並覆蓋對應 reference 欄位。
- formal pull 失敗時保留 reference data，但不得把 reference data 冒充正式資料。

第二階段 COP 預期資料：

| 案型 | COP 補件內容 |
| --- | --- |
| 土地 | 土地標示部、土地所有權部、土地他項權利部、公告現值/公告地價正式資料、必要的土地位置圖/註記 |
| 建物 | 建物標示部、建物所有權部、建物他項權利部，必要時補土地標示/土地權利 |
| 共通 | 所有權人、取得日期、權利範圍、抵押/他項權利、限制登記、信託/查封等正式登記事項 |

#### 已踩過、後續代理不得重犯的坑

| 類型 | 坑 | 必須遵守的處理方式 |
| --- | --- | --- |
| 查詢來源順序 | 先走 R02 會錯過 Z10Web 新版資料或造成鄉鎮代碼差異 | Z10Web 是 primary；R02 只做 fallback / 交叉驗證 / 戶別縮小 |
| 大樓多建號 | 同一土地可能回多個建號 | 不得自動取第一筆；必須列候選或用樓層/戶別縮小 |
| 樓層戶別 | `8樓之1`、`八樓之一`、`五樓之1` 格式不同 | 先正規化中文/阿拉伯數字與 `之一` → `之1`，再查詢/比對 |
| 地址空白 | 半形/全形空白會讓便民系統查詢不穩 | 內部正規化要忽略空白；UI 提示不要留空白或多餘符號 |
| 中文/阿拉伯數字 | `三段` / `3段`、`八號五樓` 格式不同 | 產生查詢變體並收斂到同一內部地址模型 |
| 土地分號 | `850-1` 曾被錯轉成 `85010000`，detail 查成 `8501` | 必須轉成 `08500001`，detail lookup 還原為 `850-1` |
| 土地正式地段名 | 使用者輸入 `港子前段`，Z10Web 回 `港子墘段` | 以 Z10Web 回傳正式名稱作為資料欄位，保留原輸入供比對 |
| 土地使用分區 | 有查到但未進 PDF | `zoning` 必須從 candidate/provenance 帶到 dossier 與買家版 PDF |
| 大樓土地面積 | 容易被誤解成單戶土地 | 建物案顯示「基地土地總面積（坪）」 |
| 內部狀態外洩 | 買家版 PDF 曾出現 `candidate_data_available`、`unconfirmed` | 內部狀態只留 UI / 系統，不進買家版 PDF |
| 實價登錄舊資料 | city dataset 可能只到 2022 | 合併 national fallback，依交易日期倒序去重，優先新資料 |
| 生活機能誤判 | 樂團/補習班被當學校，牙醫過度出現 | 學校只列正式學制；醫療優先大型醫院與一般/小兒/家醫/內科/耳鼻喉 |
| PDF 現況表 | 土地現況表曾拆太多頁、字太小、含「未填」 | 34 題單頁、字級放大，只留「是 / 否」 |
| formal key | `manual-*` 或未確認候選被送 COP | 只有完整 `office / section / land_no / building_no` confirmed key 可送 formal |
| formal 回傳門牌不一致 | 可能查到不同戶 | 不寫入 trusted PDF data，要求回候選修正 |

## Implementation Contract

- **Behavior**
  - 使用者在 `/cases/new` 輸入地址後，系統先執行免費前查，顯示候選資料與附近實價登錄
  - 使用者完成人工確認後，系統保存 confirmed registry key 與 7 個欄位
  - 簽約前流程只能保存 reference / pre-survey 資料與參考 PDF，不得自動發動 formal COP、電子謄本、所有權或他項權利查詢
  - formal COP / 電子謄本 pull 只能在簽約後正式補件階段使用 confirmed registry key，且必須由使用者明確觸發付費動作
  - formal COP 成功後，trusted data 與 reference/query provenance 可供 dossier assembly 使用
  - PDF 產出使用保存後的本機 snapshot，不依賴即時候選結果

- **Interface / data shape**
  - `land_registry_data.confirmed_registry_match` 至少包含：
    `section_name`, `land_no`, `building_no`, `land_area_sqm`, `announced_land_current_value`, `announced_land_value`
  - `registry provenance` 必須保存：
    candidate source、formal source、query run id、cache hit、cost、error、isPaid、pricingNote
  - formal cost ledger 必須保存服務目錄來源、API code、unit price、billable quantity、estimated cost 與 actual cost；不得只保存 `successCount * 10`
  - `dossier assembly` 必須輸出可供 PDF 使用的：
    announced values、land area、recent sale records 或其統計結果
  - recent sale records 必須來自 real dataset；若 fallback dataset 較舊，仍要以真資料顯示，不可混入 mock fixture

- **Failure modes**
  - 免費前查失敗：UI 顯示友善錯誤，不得偷偷轉打付費 API
  - 查得到候選但 formal COP 失敗：案件保留 confirmed/reference data，PDF 不得誤標 trusted
  - 簽約前缺少所有權或他項權利：不得顯示為免費前查失敗；必須標示為「簽約後正式補件調閱」
  - 費用服務目錄缺少單價：不得退回固定 NT$10 估算；必須阻止付費確認並顯示 pricing configuration error
  - `query_real_price` 失敗：UI 顯示友善訊息，dossier 回空集合
  - `query_real_price` 命中錯 dataset：不得默默顯示其他路段 fixture；必須回空集合或真實錯誤
  - 缺少 confirmed key：禁止 formal COP pull，禁止把 candidate 當正式謄本
  - 門牌查詢只定位到土地且同土地有多個建號：不得自動選第一個建號，必須列候選或要求人工確認
  - formal COP 回傳門牌與案件地址不一致：不得寫入 trusted PDF 資料，並顯示需要修正候選 key
  - 本次未查的 API：不得在匯入明細中顯示為「上游未回或需補正式資料」
  - 使用者未確認付費：不得發動正式查詢，也不得寫入付費成本紀錄

- **Acceptance criteria**
  - `/cases/new` 可先以免費前查看到並保存 7 個欄位
  - 簽約前 reference PDF 可產出且成本為 0，不含所有權 / 他項權利 / 電子謄本正式查詢
  - 簽約後正式補件頁才顯示所有權 / 他項權利 / 電子謄本調閱入口
  - formal COP pull 使用 confirmed key，且付費前會顯示費用與用途，成功後 trusted data 可追
  - formal cost 使用服務目錄逐項計價，畫面不得再出現固定「每成功項目 NT$10」的估算邏輯
  - dossier assembly / PDF 可讀到這些欄位
  - Mac smoke 可從新建案件走到 PDF 產出

## Risks / Trade-offs

- [同時碰 lookup、formal pull、PDF，面寬較大]
  - 先補紅燈測試鎖住資料鏈，再逐段轉綠
- [announcement / real-price 欄位部分地址可能缺值]
  - 規格接受缺值，但必須保留 provenance 與空值語意
- [現有 typecheck 噪音很多]
  - 本 change 的驗收以 focused tests + Mac smoke 為主，不把 legacy `dist-local-runtime` 紅燈當 blocker

## Migration Plan

- 先補 `cases/new` persistence、formal pull、dossier assembly 的 focused tests
- 完成後跑 Mac 本機 smoke：新建案件、formal pull、preview/export PDF
- Windows 驗收維持 parked，不納入本次完成定義
