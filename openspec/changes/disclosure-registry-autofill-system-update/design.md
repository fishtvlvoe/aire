## Context

目前 AIRE 的問題不是單純「API 少接幾支」。真正缺口是說明書欄位、地政服務、費用紀錄各自存在，沒有一個共同的決策表。

```
舊版說明書 / 欄位總表 / 現有表單
        ↓
每個欄位到底從哪裡來
        ↓
docs/cop-scrape 哪些 API 可以查
        ↓
哪些已串、哪些未串、哪些免費、哪些付費、哪些不可用
        ↓
成功/失敗與費用怎麼算
        ↓
UI / PDF 不再默默空白
```

已知現況：

- `docs/cop-scrape` 已保留 COP/MOI 服務清單、價格、HTML 文件與 API 分類。
- 目前 land registry backend 只串少數地政入口，且多處仍以固定單價估費。
- `docs/0417-new/建安不動產欄位總表.md` 與 `docs/0417-old` 顯示農地、農舍、透天有大量欄位來自謄本、地政資料、地籍圖、使用分區資料與公開資料。
- 目前土地與成屋 disclosure form 只覆蓋核心欄位，很多可查欄位仍可能空白或被當成人工欄位。
- Fish 看到 MOI 介接紀錄中有成功、失敗、回傳筆數、COP309、未付款 27 元等資訊，AIRE 後台需要能對得上這些帳。

## Goals

- 建立 field-source matrix，先回答每個說明書欄位能不能由地政或公開資料取得。
- 建立 MOI service catalog，保留服務代碼、價格、免費/付費、權限、文件來源與計費單位。
- 建立 registry autofill engine，讓已取得資料能穩定填入草稿，且不覆蓋使用者手填值。
- 建立 outcome classifier 與 cost ledger，讓 API 呼叫成功/失敗、回傳筆數、費用與客戶後台統計一致。
- 先補農地、農舍、透天別墅三種高風險類型，再擴到 13 種物件類型。
- 把 `moi-api-coverage-fallback-cost-map` 與 `moi-api-usage-ledger-and-cost-audit` 吸收到本 SR，避免後續重複規格。

## Non-Goals

- 不在同一個實作批次接完全部 COP/MOI 服務。
- 不自動呼叫政府限定 API。
- 不替代現場調查與人工合約判斷。
- 不處理 OPCOS 付費、發票與收款。
- 不將敏感案件資料同步到雲端。

## System Update Plan

### Phase 1: 欄位來源矩陣

建立 `disclosure-field-source-matrix`，每個欄位至少包含：

| 欄位 | 說明 |
| --- | --- |
| `field_key` | AIRE 內部欄位鍵 |
| `document_area` | 說明書章節或表單區塊 |
| `property_types` | 適用物件類型 |
| `source_kind` | `registry_api`、`gis_layer`、`public_data`、`field_visit`、`manual_document`、`derived`、`unsupported` |
| `automation_state` | `filled_from_registry`、`mapping_gap`、`integration_gap`、`manual_required`、`not_supported` |
| `service_codes` | 可提供資料的 MOI/COP/WMS/WFS 服務 |
| `required_for_completion` | 是否影響說明書完成 |
| `review_note` | 人工確認原因 |

正推：有 matrix 後，系統知道哪些欄位應自動帶入。

逆推：如果 PDF 還是空白，matrix 可以判斷是使用者未補、API 未串、mapping 未做，或資料本來不可自動取得。

### Phase 2: MOI/COP 服務目錄

建立 `moi-service-catalog`，來源是 `docs/cop-scrape`，輸出給前端與 Rust backend 共用的 catalog。

服務至少分類：

| 分類 | 行為 |
| --- | --- |
| `required` | 說明書核心流程必接 |
| `fallback` | 主 API 失敗或無資料時可補查 |
| `free_enrichment` | 免費或授權免費，可提升完整度 |
| `billing_only` | 用於帳務核對 |
| `restricted` | 政府限定或一般客戶不可用 |
| `defer` | 已知但本階段不接 |

價格政策至少支援：

- `free`
- `auth_free`
- `price_by_row`
- `price_by_location`
- `price_by_duration`
- `restricted`
- `unknown`

### Phase 3: 成功/失敗與費用帳

建立 `moi-outcome-and-cost-ledger`。

Outcome classifier 不得只看 HTTP 2xx，必須同時看 MOI payload：

| outcome | 定義 | 預設計費 |
| --- | --- | --- |
| `transport_failure` | HTTP、timeout、network 失敗 | 0 |
| `moi_success` | MOI `STATUS = 1` 且 payload 可用 | 依 cost policy |
| `empty_success` | 呼叫成功但 `RETURNROWS = 0` 或 payload 空，且業務上代表無資料 | 0，除非 catalog 指定 |
| `domain_failure` | MOI 回傳錯誤碼，例如 COP309 | 0，除非官方帳務證明需計費 |
| `restricted_failure` | 權限或縣市範圍不可用 | 0 |
| `parse_failure` | AIRE 無法解析可用 payload | 0，需記錄 |

Ledger 每筆至少記錄 service code、transaction id、request fingerprint、started/finished time、MOI status/code/message、return rows、outcome、cost policy、billable amount、case/local user reference。

### Phase 4: Autofill engine

建立 `registry-autofill-engine`：

- 以 field-source matrix 決定可填欄位。
- 以 service catalog 決定資料來源與 fallback。
- 以 source priority 合併多 API 結果。
- 手填欄位永遠不被自動覆蓋。
- 欄位若無法帶入，必須回傳 gap reason 給 UI。

欄位狀態：

| 狀態 | UI 意義 |
| --- | --- |
| `filled_from_registry` | 已由地政或公開資料帶入 |
| `mapping_gap` | 已有資料但還沒對到 AIRE 欄位 |
| `integration_gap` | 文件顯示可查，但 API 尚未串接 |
| `manual_required` | 必須現場或人工確認 |
| `not_supported` | 目前無資料來源或不可用 |

### Phase 5: 物件類型覆蓋順序

第一批優先順序：

1. 農地：土地標示、權利、他項、非都市使用分區、使用編定、農用限制、地籍圖、公告現值、公告地價。
2. 農舍：建物標示、建物所有權、建物他項、土地與建物權屬關係、合法農舍與使用限制提示。
3. 透天別墅：建物標示、建物所有權、建物他項、坐落土地、樓層/面積/用途；騎樓、車庫、夾層、頂加、道路寬度維持人工確認。

後續再擴到公寓、大樓華廈、套房、店面、廠房、建地、工業地、商業地、鄉村區建地、其他土地。

### Phase 6: UI/UX 審核工作台

本 SR 的 UI/UX 不是裝飾層，而是地政資料能不能被助理正確使用的核心流程。實作時必須先做可用的審核工作台，再視覺微調。

設計基準：

- 產品型態：桌面 App 內的營運工作台，不是 landing page。
- 使用者：房仲助理、店長、老闆；核心任務是快速確認欄位、補件、列印，不是瀏覽內容。
- 風格：專業、克制、高對比、可掃描；採白底、細邊框、清楚分區、少量 teal/blue 作為狀態色。
- 禁止：大 hero、行銷卡片堆疊、單色漸層裝飾、過度圓角、沒有標籤的 icon、只有 placeholder 的 input。

主要畫面：

| 畫面 | 目的 | 必要區塊 |
| --- | --- | --- |
| 欄位審核工作台 | 助理確認哪些資料已帶入、哪些要人工補 | 左側章節/欄位清單、中間表單、右側來源與缺口面板、底部費用摘要 |
| API 呼叫明細 | 核對 MOI 成功/失敗、回傳筆數、費用 | 日期/服務/狀態/歷程編號篩選、統計卡、明細表、錯誤訊息抽屜 |
| 欄位來源矩陣檢視 | 內部或 admin 檢查哪些欄位未串 | 物件類型 filter、source kind filter、coverage 狀態、service code、下一步 |
| 補件清單 | 交給助理或業務員知道還缺什麼 | 人工必填、API 未串、查無資料、需現場確認分組 |

欄位狀態 UI：

| 狀態 | 標籤文案 | 視覺語意 | 可執行動作 |
| --- | --- | --- | --- |
| `filled_from_registry` | 地政已帶入 | 成功色，不要搶眼 | 查看來源、保留手填、套用資料 |
| `mapping_gap` | 有資料未對欄 | 警示色 | 查看原始欄位、建立 mapping 任務 |
| `integration_gap` | API 未串接 | 中性警示 | 加入待串接清單 |
| `manual_required` | 需人工確認 | 資訊色 | 加到補件清單、標記完成 |
| `not_supported` | 目前不可查 | 灰階 | 查看原因 |

互動規則：

- 使用者點擊欄位時，右側面板顯示來源服務、查詢時間、transaction id、回傳筆數、費用、缺口原因。
- 手填欄位不可被自動覆蓋；若有 registry candidate，顯示「使用地政值」與「保留手填值」兩個明確動作。
- API 查詢按鈕需要 loading、success、empty、error、partial 狀態，不得點擊後無回饋。
- 批次查詢前顯示預估費用與可能免費項目；查詢後顯示實際費用與失敗不計費原因。
- 表格與篩選必須支援鍵盤操作、可見 focus state、每個 input 有 label，觸控目標最小 44px。
- 桌面寬度以 1280px 以上為主要設計；1024px 可用雙欄；768px 以下改成分頁或抽屜，但文字不可互相擠壓。

驗收畫面至少要截圖驗證：

- 1440px：完整三欄工作台。
- 1024px：表單與來源面板可讀。
- 768px：來源面板可收合，主要表單不被遮住。
- 錯誤狀態：COP309 顯示為 domain failure，費用為 0 或依政策顯示。
- 空資料狀態：`RETURNROWS = 0` 顯示查無資料，不誤顯示系統錯誤。

## Integration Notes

- Rust backend 需要將 API response 與 ledger 寫入分離：無論成功或失敗都要記錄 ledger，但只有 `moi_success` 或 catalog 指定 billable 的 outcome 才計入費用。
- 前端 disclosure draft 需要保存 field status metadata，不只保存欄位值。
- PDF 產出需能追蹤欄位來源；正式 PDF 預設不顯示內部 debug 標籤，但預覽/審核模式必須能顯示來源與缺口。
- OPCOS 只接授權與帳務摘要，不保存案件明細。

## Risks And Mitigations

| 風險 | 對策 |
| --- | --- |
| `docs/cop-scrape` 文件與官方現況不同步 | catalog 要保留來源檔案與產生時間，未知價格標成 `unknown` 並阻止正式計費 |
| API 成功但資料不可用 | outcome classifier 區分 `moi_success`、`empty_success`、`parse_failure` |
| 使用者不清楚為何欄位空白 | UI 顯示 gap reason，不只顯示空 input |
| 介面做完仍需大量重改 | 本 SR 先定義工作台版型、狀態文案、互動規則與截圖驗收 |
| 接太多 API 造成範圍失控 | matrix 先分 `required`、`fallback`、`free_enrichment`、`defer` |
| 費用與 MOI 帳務不同 | ledger 記錄 transaction id、return rows、cost policy，保留 reconciliation 查詢 |

## Superseded SR Handling

- `moi-api-coverage-fallback-cost-map` 的 catalog、coverage matrix、fallback、cost policy 內容由本 SR 的 `disclosure-field-source-matrix`、`moi-service-catalog`、`registry-autofill-engine` 承接。
- `moi-api-usage-ledger-and-cost-audit` 的 usage ledger、費用表、後台查詢內容由本 SR 的 `moi-outcome-and-cost-ledger` 承接。
- 兩個舊 SR 均未開始實作，不應封存為完成；整理方式是停用或 park，並以本 SR 作為後續唯一入口。
