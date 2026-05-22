# refine-product-navigation-ia — Design

## Context

使用者截圖指出目前 AIRE 的產品 UI 有三個重複層：

1. 左側側欄已經有「案件總覽、說明書工作台、補件清單」。
2. `/cases` 主內容又出現同名頁內按鈕。
3. 案件列又放「開啟工作台」按鈕，但點擊列本身也會進工作台。

另外，`HouseMvpWorkbench` 目前會把「現場必問工作台」、「自動化功能」、「BASIC / pro / advanced」等內容放在同一個工作表面，與客戶的實際思考路徑不一致。客戶只想先選案件，再進案件內處理說明書欄位、補件、現場必問、PDF，不需要在案件總覽看到每一種內部工具。

## Goals / Non-Goals

**Goals:**

- 建立 AIRE 的三層導覽模型：一級產品模組、二級清單或模組頁、三級案件內工作台。
- 消除同頁重複導覽：側欄已有的二級子選單，不在同一頁主內容再用同名 tab 重複出現。
- 消除主動作重複：案件列與「開啟工作台」只能保留一個主要進入方式，另一個降為輔助或移除。
- 將現場必問、補件、PDF、資料來源歸到案件內三級工作台，不在案件總覽攤開。
- 將方案 enum 與工程語彙轉成中文客戶語言，例如「基本方案」、「進階方案」、「尚未升級」。

**Non-Goals:**

- 不改地政 API 回傳格式與費用計算。
- 不重新設計 PDF 版型。
- 不處理 AIRE 子網站或 OPCOS 授權後端。
- 不把所有功能移除；本 SR 只改資訊架構與可見入口。

## Decisions

### Decision 1: 使用三層導覽模型

AIRE 的點擊層級固定為：

```
一級：側欄產品模組
  案件管理 / 地政資料 / 產出文件 / 系統設定
        ↓
二級：模組內清單或設定頁
  案件總覽 / 地政查詢 / 費用紀錄 / 授權與升級
        ↓
三級：單一案件工作台
  基本資料 / 地政資料 / 揭露資料 / 現場必問 / 補件 / PDF 檢查
```

Rationale: 這能讓每一次點擊都有明確語意。使用者先選模組，再選案件或設定分類，最後才處理案件內任務。

Alternatives Considered:

- 保留側欄子選單 + 頁內同名 tabs：否決，因為同一頁出現兩套相同分類，造成使用者不知道該點哪裡。
- 把所有功能放進 `/cases` 一頁：否決，因為案件總覽會變成雜訊頁，不符合「先選案件」的心智模型。
- 只保留兩項側欄「案件管理 / 設定」：否決，因為地政資料、費用紀錄、PDF 產出都會失去固定入口。

### Decision 2: 案件總覽只負責選案件與看狀態

`/cases` 是二級頁，它只顯示案件清單、搜尋/篩選、案件狀態摘要、建立案件。它不顯示「說明書工作台 / 補件清單」同名頁內 tabs；這些是側欄子選單或案件內任務，不應在同一頁重複。

Rationale: 使用者在總覽頁的任務是找到案件，不是填寫案件。

Alternatives Considered:

- 在 `/cases` 放三個 pills「案件總覽 / 說明書工作台 / 補件清單」：否決，與左側同名子選單重複。
- 保留舊表格：否決，舊表格對操作密集但缺乏任務脈絡。
- 把第一筆案件直接展開在總覽：否決，會造成總覽與工作台混淆。

### Decision 3: 案件列只有一個主進入動作

案件列的主動作是「點擊案件列進入案件工作台」。如果保留按鈕，按鈕只能作為明確可見的同一主動作，不得再額外製造第二個不同入口；桌面版可以用整列點擊 + row hover，按鈕只在需要提升可發現性時顯示為同一動作。

Rationale: 同一列同時有整列可點與「開啟工作台」會讓使用者以為兩者行為不同。

Alternatives Considered:

- 同時保留整列點擊與黑色「開啟工作台」按鈕：否決，主動作重複。
- 只保留 icon：否決，非工程使用者不容易理解 icon 的目標。
- 只保留文字 link：可接受，但必須與整列點擊語意一致。

### Decision 4: 現場必問是案件內三級模組

「現場必問工作台」不出現在案件總覽；它在案件詳情內，作為「說明書工作台」中的一個章節或 tab。現場必問的頁面選擇，例如現況調查表、位置圖、產權注意事項、稅務附註，是三級內部選項。

Rationale: 現場必問依附於一個案件，不能在未選案件前攤開。

Alternatives Considered:

- 把現場必問當成側欄二級頁：否決，因為它不是跨案件模組，而是案件內任務。
- 把所有現場必問頁卡直接放在工作台首頁：否決，會讓案件內工作台一開始就過載。
- 保留為 legacy 獨立頁：可短期保留，但正式入口必須放進案件內。

### Decision 5: 方案與工程語彙只在設定或 admin 顯示

客戶前台顯示「基本方案、進階方案、尚未升級、已開啟、不可用」，不顯示 BASIC、pro、advanced、MOI_API code、raw error code。工程語彙只允許在 admin、debug、費用明細展開區或測試資料。

Rationale: 客戶畫面要降低認知負擔，工程碼只會讓使用者覺得產品未完成。

Alternatives Considered:

- 直接顯示 backend enum：否決，違反既有客戶文案規則。
- 完全隱藏升級功能：否決，未來升級端口需要保留。
- 將升級說明放工作台常駐：否決，工作台只放此案件現在要做的事。

## Implementation Contract

#### Behavior

- 使用者開啟 `/cases` 時，只看到案件總覽與案件選擇，不看到同名的「案件總覽 / 說明書工作台 / 補件清單」頁內 tabs。
- 使用者點擊案件列時，進入 `/cases/:id` 的案件工作台。
- 使用者在案件工作台內，才看到該案件的三級任務：基本資料、地政資料、揭露資料、現場必問、補件、PDF 檢查。
- 使用者在案件總覽不會看到「BASIC、pro、advanced」或自動化功能的方案 enum。
- 使用者在側欄點擊二級項目時，頁面只切到該二級頁，不在主內容重複同名導覽。

#### Interface / data shape

- 新增 `product-navigation-ia` contract，輸出一份 navigation model：
  - `level: "primary" | "secondary" | "case-workbench"`
  - `label: string`
  - `href: string`
  - `scope: "global" | "module" | "case"`
  - `primaryAction?: boolean`
- `getDemoSidebarFolders()` 仍可保留，但必須依 navigation model 產生，不再讓 `/cases` 主內容硬寫同名分類。
- 案件工作台內部 tabs 由案件 scope 驅動，不與全域側欄共用同名狀態。

#### Failure modes

- 如果沒有案件，`/cases` 顯示空狀態與「新增案件」，不顯示工作台內部模組。
- 如果案件資料載入失敗，顯示中文錯誤與重試，不跳到工作台空白頁。
- 如果使用者直接開 `/cases?view=workbench`，系統應導向最近案件、要求先選案件，或顯示「請先選擇案件」；不得在未選案件時攤開三級工作台。

#### Acceptance criteria

- Unit test 覆蓋 navigation model 的三層分類與禁止重複規則。
- Component test 確認 `/cases` 不渲染同名頁內 tabs，也不渲染 `BASIC/pro/advanced`。
- Playwright 覆蓋 `/cases` → 點案件 → `/cases/:id` → 切到現場必問。
- Playwright 截圖確認側欄與主內容沒有同名導覽重複。
- Spectra analyze 與 validate 皆為 0 Critical、0 Warning。

#### Scope boundaries

- In scope: UI/UX 資訊架構、前端導覽 contract、客戶文案、測試與 SR 文件。
- Out of scope: 地政 API 串接、收費策略、OPCOS 後端授權、PDF 版型生成。

## Risks / Trade-offs

- [Risk] 改導覽會讓既有測試仍期待舊表格或舊 tabs → Mitigation：先更新 specs，再用失敗測試鎖定新行為。
- [Risk] demo HTML 本身也有兩個 details open，可能被誤解為正式產品規則 → Mitigation：本 SR 明確定義正式產品以三層 IA 為準，demo 只作視覺參考。
- [Risk] 移除頁內 tabs 後，使用者找不到補件清單 → Mitigation：補件入口保留在側欄二級與案件內三級，但不在 `/cases` 同頁重複。
- [Risk] 快速改 UI 可能只藏掉元素，沒有真的修點擊語意 → Mitigation：新增 navigation model test 與 Playwright click-flow 驗收。

## Migration Plan

1. 先建立 navigation model 與測試，讓側欄、案件總覽、案件工作台共用同一份層級定義。
2. 修改 `/cases` 成純二級案件選擇頁，移除同名頁內 tabs 與重複主 CTA。
3. 修改 `/cases/:id`，把現場必問、補件、PDF 檢查整理為案件內三級任務。
4. 修改客戶文案與文字 audit，禁止方案 enum 出現在前台。
5. 跑 unit、component、Playwright、build、Spectra gate。

Rollback strategy: 若新導覽造成阻塞，可保留舊 `/cases` 實作為 legacy route，將 sidebar 指回舊頁；navigation model 與 SR 文件保留，作為下一輪修正依據。

## Open Questions

- 「補件清單」二級頁要顯示跨案件補件總表，還是只作為篩選後的案件總覽？目前建議：跨案件補件總表。
- `產出文件 → PDF 預覽` 二級頁要先要求選案件，還是預設打開最近案件？目前建議：要求選案件，避免誤操作。
