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

- 免費前查：
  - 地址候選查詢
  - 實價登錄附近行情
  - 免費可得的地段 / 地號 / 建號候選
  - 免費可得的土地面積 / 公告值參考欄位
- 付費正式查：
  - 只有當使用者已確認目標物件，並要求正式土地 / 建物資料時
  - 才能用 confirmed `section_name / land_no / building_no` 去打付費 API

每次付費動作前，UI 必須清楚告知：

- 這次要查什麼
- 預估成本 / 單價
- 失敗是否仍可能計費

使用者未明確確認前，不得自動發動付費正式查詢。

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

## Implementation Contract

- **Behavior**
  - 使用者在 `/cases/new` 輸入地址後，系統先執行免費前查，顯示候選資料與附近實價登錄
  - 使用者完成人工確認後，系統保存 confirmed registry key 與 7 個欄位
  - formal COP pull 只能使用 confirmed registry key，且必須由使用者明確觸發付費動作
  - formal COP 成功後，trusted data 與 reference/query provenance 可供 dossier assembly 使用
  - PDF 產出使用保存後的本機 snapshot，不依賴即時候選結果

- **Interface / data shape**
  - `land_registry_data.confirmed_registry_match` 至少包含：
    `section_name`, `land_no`, `building_no`, `land_area_sqm`, `announced_land_current_value`, `announced_land_value`
  - `registry provenance` 必須保存：
    candidate source、formal source、query run id、cache hit、cost、error、isPaid、pricingNote
  - `dossier assembly` 必須輸出可供 PDF 使用的：
    announced values、land area、recent sale records 或其統計結果
  - recent sale records 必須來自 real dataset；若 fallback dataset 較舊，仍要以真資料顯示，不可混入 mock fixture

- **Failure modes**
  - 免費前查失敗：UI 顯示友善錯誤，不得偷偷轉打付費 API
  - 查得到候選但 formal COP 失敗：案件保留 confirmed/reference data，PDF 不得誤標 trusted
  - `query_real_price` 失敗：UI 顯示友善訊息，dossier 回空集合
  - `query_real_price` 命中錯 dataset：不得默默顯示其他路段 fixture；必須回空集合或真實錯誤
  - 缺少 confirmed key：禁止 formal COP pull，禁止把 candidate 當正式謄本
  - 使用者未確認付費：不得發動正式查詢，也不得寫入付費成本紀錄

- **Acceptance criteria**
  - `/cases/new` 可先以免費前查看到並保存 7 個欄位
  - formal COP pull 使用 confirmed key，且付費前會顯示費用與用途，成功後 trusted data 可追
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
