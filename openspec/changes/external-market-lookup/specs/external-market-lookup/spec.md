## ADDED Requirements

### Requirement: External Platform Deep-Link Buttons

物件編輯頁 SHALL 在「補充資料」tab 提供至少三個外連按鈕：「591 實價登錄」「信義房屋」「樂屋網」。每個按鈕的 URL SHALL 由系統根據該物件的縣市、行政區、總價（若有）動態組出，並以 `target="_blank"` 與 `rel="noopener noreferrer"` 開新分頁。

系統 SHALL NOT 自行 fetch、scrape、或透過 headless browser 訪問 591 / 信義 / 樂屋的任何頁面。所有對第三方平臺的訪問都必須由使用者瀏覽器主動發起。

#### Scenario: 業務點擊「591 實價登錄」查看周邊成交

- **WHEN** 業務在編輯「台北市中正區、總價 2500 萬」的物件時點擊「591 實價登錄」按鈕
- **THEN** 系統 SHALL 在新分頁打開 `https://price.591.com.tw/list?regionid=1&section=63`（regionid=1 對應台北、section=63 對應中正區）
- **AND** 系統 SHALL NOT 發出任何對 591.com.tw 的伺服器端請求

#### Scenario: 業務點擊「信義房屋」查看待售案

- **WHEN** 業務在編輯「新北市板橋區」的物件時點擊「信義房屋」按鈕
- **THEN** 系統 SHALL 在新分頁打開信義房屋對應「新北市-板橋區」的搜尋結果頁
- **AND** URL SHALL 包含 `target="_blank"` 與 `rel="noopener noreferrer"` 屬性

#### Scenario: 物件位於對應表未覆蓋的偏鄉地區

- **WHEN** 業務編輯位於「澎湖縣望安鄉」的物件並點擊外連按鈕
- **THEN** 系統 SHALL fallback 到「縣市層」搜尋（僅帶入縣市、不指定行政區）
- **AND** UI SHALL 在按鈕旁顯示「此區域對應表未覆蓋，已導向縣市層搜尋」提示

#### Scenario: 系統嘗試任何形式的自動訪問（負面案例）

- **WHEN** 開發者試圖在 codebase 內加入對 591 / 信義 / 樂屋的 fetch 呼叫或 Puppeteer/Playwright 訪問
- **THEN** Code Review SHALL 拒絕該變更
- **AND** spec 明確禁止此類自動互動

### Requirement: Market Research Summary Field

物件編輯頁 SHALL 提供「周邊行情摘要」textarea 欄位（最多 500 字元），允許業務在查看第三方平臺後自行填寫摘要。該欄位內容 SHALL 儲存至 `listings.market_summary` 資料庫欄位（TEXT NULL）。

#### Scenario: 業務填寫摘要

- **WHEN** 業務在 textarea 輸入「同社區近三月成交 3 件，每坪 75–82 萬，待售 5 戶平均單價 80 萬，本案定價合理偏低」
- **AND** 點擊儲存
- **THEN** 系統 SHALL 將內容寫入 `listings.market_summary` 欄位
- **AND** 重新載入頁面時 SHALL 顯示已儲存的摘要

#### Scenario: 摘要超過字元上限

- **WHEN** 業務輸入超過 500 字元
- **THEN** UI SHALL 阻擋輸入並顯示「最多 500 字元」提示

#### Scenario: 摘要為空

- **WHEN** 業務未填寫摘要直接儲存
- **THEN** 系統 SHALL 接受空值（市場行情摘要為選填欄位）
- **AND** 不動產說明書「周邊環境」章節 SHALL 顯示「待補」

### Requirement: Market Research Attachment Upload

物件編輯頁 SHALL 提供附件上傳區，接受 jpg、png、pdf 格式檔案，單檔最大 5MB，單一物件最多 10 個 `market_research` 類型附件。上傳的附件 SHALL 儲存於 `listing.attachments` JSON 欄位並標記 `type: "market_research"`。

#### Scenario: 業務上傳 591 截圖

- **WHEN** 業務上傳「591_周邊成交.png」（2.3MB）
- **THEN** 系統 SHALL 將檔案儲存至附件區
- **AND** `listing.attachments` SHALL 新增一筆記錄 `{ filename: "591_周邊成交.png", type: "market_research", uploaded_at: <ISO timestamp> }`

#### Scenario: 附件超過大小上限

- **WHEN** 業務上傳 6MB 的 PDF
- **THEN** 系統 SHALL 拒絕上傳並顯示「單檔最大 5MB，建議使用 1080p 截圖」

#### Scenario: 附件超過數量上限

- **WHEN** 物件已有 10 個 `market_research` 附件，業務嘗試上傳第 11 個
- **THEN** 系統 SHALL 拒絕上傳並顯示「最多 10 個周邊行情附件」

#### Scenario: 不接受的檔案格式

- **WHEN** 業務上傳 docx 或 mp4
- **THEN** 系統 SHALL 拒絕並顯示「僅接受 jpg / png / pdf」

### Requirement: Legal Boundary Disclosure

UI SHALL 在外連按鈕區塊上方顯示明確標籤：「以下按鈕將在新分頁開啟外部網站，由您自行查看後填寫摘要與上傳截圖。本系統不會自動讀取或儲存第三方平臺內容。」

#### Scenario: 法律邊界提示文案存在

- **WHEN** 業務首次進入「補充資料」tab 並看到外連按鈕區
- **THEN** 區塊頂部 SHALL 顯示上述法律邊界提示文案
- **AND** 文案 SHALL 與按鈕同 viewport 可見（不需捲動才看到）
