## Context

裕農路案例證明「地址正確」不等於「正式地址反查 API 能直接回傳單一建號」。目前 COP 地址服務回 COP317，系統只保留一個候選地號 `0001` 到 PDF，導致前期物調表空白。實務上 Fish 在屋主尚未委託前，需要先列出全部候選土地/建物，帶著可討論資料向屋主確認，而不是逐筆手動猜建號。

同類案件風險分析記錄於 `CASE-RISK-ANALYSIS.md`，涵蓋裕農路、勝利街、分戶大樓、placeholder 地號、圖片座標 fallback 與跨瀏覽器 mock storage 差異。

本設計把資料分成三層：

| 層級 | 用途 | PDF 呈現 |
| --- | --- | --- |
| trusted | 正式 API 或已確認建號/地號 | 正式資料 |
| selected_candidate | 使用者暫選的候選建號/地號 | 候選資料，待確認 |
| candidate_list | 全部候選清單 | 候選比較表 |
| inferred_reference | 同棟同戶別尾碼與相鄰樓層規律推測 | 推測資料，非登記資料 |

## Goals / Non-Goals

**Goals:**

- 一次列出地址可推得的所有候選土地與建物，不要求 Fish 逐筆手動試。
- 前期物調 PDF 可使用候選資料填入登記坪數、主建坪、用途、完成日、屋齡、樓層等欄位，並明確標示待確認。
- 使用者可把某一筆候選標成暫用候選或已確認，後續正式 pull 使用已確認建號/地號。
- 找不到唯一建號時，可用同棟同戶別尾碼與相鄰樓層資料產生參考推測，讓業務先有資料跟屋主談。
- 地址 geocode 失敗時，圖資改用候選座標產生位置圖與航拍圖。
- 驗收改成檢查 PDF 實際欄位值與 `pdfimages -list`，不只檢查標題存在。

**Non-Goals:**

- 不新增資料庫 schema；候選資料先存入既有 `land_registry_data` provenance JSON。
- 不把 candidate 資料列為正式謄本資料。
- 不把 inferred_reference 推測資料列為登記資料。
- 不新增雲端同步或跨瀏覽器同步。
- 不處理成交價格與費用試算。
- 不繞過 COP API 權限限制；COP317/COP312/COP305 仍如實顯示。

## Decisions

### Decision: Store all candidates in registry provenance JSON

候選資料寫入既有 `land_registry_data` 的 provenance JSON，新增 `candidate_options`、`selected_candidate_ids`、`confirmed_parcel_ids`、`coordinate_source` 欄位。這保留目前 SQLite schema，讓 browser mock、Tauri SQLite 與 PDF assembly 讀同一份案件資料。

Alternatives Considered:

- 新增 SQLite tables：需要 migration、Tauri command 與 mock storage 同步，會擴大本次範圍；本次先用既有 JSON 承載。
- 只存在 workbench local state：切換頁面或匯出 PDF 時容易遺失，且與正式 path 不一致，因此否決。

### Decision: Candidate data can fill pre-survey fields with mandatory warnings

PDF assembly 允許 selected candidate 的建物/土地資料填入物件資料表與產權調查表，但每個候選區塊必須顯示「候選資料，待屋主/權狀確認」。trusted 資料永遠優先於 candidate 資料。

所有候選版與推測版 PDF 都必須顯示固定警示：「地政資料，最終以正式謄本為主；本說明書不代表完整資訊。」

Alternatives Considered:

- 完全禁止 candidate 進 PDF：前期物調會空白，無法支援洽談情境，因此否決。
- 把 candidate 當正式資料輸出：會產生錯戶資料風險，因此否決。

### Decision: Infer reference values from same-suffix vertical units

當目標戶別例如 `8樓之1` 無法對到唯一建號時，系統會分析同棟候選資料中同尾碼戶別，例如 `3樓之1`、`5樓之1`、`7樓之1`。若登記坪數、主建坪、用途、完成日等欄位一致或落在容許範圍內，assembly 產生 `inferred_reference` 值與 confidence level；若資料衝突，顯示範圍與低信心，不產生單一肯定值。

Alternatives Considered:

- 不做推測：PDF 仍會空白，業務無法與屋主有效討論，因此否決。
- 直接把同尾碼資料當成目標戶正式資料：可能遇到合併戶、頂樓、露台、避難層或公設差異，風險太高，因此否決。

### Decision: Candidate comparison is a first-class workbench section

工作台新增候選清單區塊，顯示全部土地/建物候選、來源、狀態、可用欄位數、摘要值與操作。操作分成「暫用」與「確認」兩種，暫用只影響前期 PDF，確認才更新正式 pull 的 parcel id。

Alternatives Considered:

- 只在 JSON 預覽顯示候選：非工程使用者難以判斷，無法快速跟屋主對資料，因此否決。
- 每個候選都產一份 PDF：使用流程成本過高，且比較困難，因此否決。

### Decision: Use candidate coordinates for image generation fallback

若地址 geocode 失敗，assembly 會讀 candidate reference 或 provenance 裡的座標，呼叫位置圖與航拍圖 API。街景仍依 Google Maps key 與街景 availability 決定；缺 key 時顯示明確原因。

Alternatives Considered:

- 只依賴完整地址 geocode：裕農路案例已驗證會失敗，導致圖頁空白，因此否決。
- 使用固定假圖：會誤導客戶，以為是真實圖資，因此否決。

## Implementation Contract

Behavior:

- 使用者輸入裕農路地址後，工作台顯示土地候選 `DC-1556-00700000` 與建物候選 `DC-1556-00165000`、`DC-1556-00167000`、`DC-1556-00229000`、`DC-1556-00230000`。
- 使用者可按「暫用」選一筆建物候選。PDF 物件資料表與產權調查表顯示該候選可取得的面積、用途、完成日、屋齡、樓層等值，並顯示候選警示。
- 使用者可按「已確認」把候選升級為 confirmed。後續正式 pull 使用 confirmed parcel id。
- 多筆候選存在且未暫用時，PDF 顯示候選比較表，不再只留空欄位。
- 圖資若有候選座標，位置圖與航拍圖 PDF 頁應嵌入圖片；缺 Google Maps key 時，建物外觀頁顯示街景未設定原因。

Interface / data shape:

```json
{
  "candidate_options": [
    {
      "candidate_id": "building:DC-1556-00165000",
      "parcel_type": "building",
      "section_code": "1556",
      "section_name": "富強段",
      "parcel_number": "00165000",
      "normalized_parcel_id": "DC-1556-00165000",
      "source": "public_reference",
      "confidence_label": "same_address_candidate",
      "official_status": "candidate_unconfirmed",
      "query_status": "candidate_data_available",
      "summary_fields": {
        "registeredAreaPing": "...",
        "mainBuildingAreaPing": "...",
        "legalUse": "...",
        "constructionDate": "...",
        "age": "...",
        "floor": "..."
      },
      "warnings": ["待屋主或權狀確認是否為 8樓之1"]
    }
  ],
  "inferred_reference": {
    "target_unit": "8樓之1",
    "basis": "same_suffix_vertical_stack",
    "confidence": "high",
    "source_units": ["3樓之1", "5樓之1", "7樓之1"],
    "estimated_fields": {
      "registeredAreaPing": "31.25",
      "mainBuildingAreaPing": "23.10"
    },
    "warning": "推測資料，非登記資料；地政資料，最終以正式謄本為主；本說明書不代表完整資訊。"
  },
  "selected_candidate_ids": {
    "building": "building:DC-1556-00165000",
    "land": "land:DC-1556-00700000"
  },
  "confirmed_parcel_ids": {},
  "coordinate_source": {
    "lat": 22.986314,
    "lng": 120.22908,
    "source": "candidate_reference"
  }
}
```

Failure modes:

- COP317 official address lookup unavailable: display official lookup unavailable and keep candidate list.
- Candidate probe fails: keep failed candidate row with COP code and no summary fields.
- No selected candidate: PDF renders candidate comparison table and keeps detailed property fields blank.
- Inferred reference available: PDF fills reference fields with inferred labels, source unit list, and the fixed formal-title disclaimer; trusted and selected candidate values still take precedence.
- No coordinate: PDF image pages render blank frames with missing-coordinate reason.

Acceptance criteria:

- Unit tests cover provenance parsing, candidate selection, trusted-over-candidate precedence, and candidate coordinate fallback.
- Component tests cover candidate list rendering and temporary/confirmed actions.
- PDF tests use `pdftotext` to assert candidate warning plus candidate field values exist.
- PDF tests use `pdftotext` to assert inferred reference warning, source units, estimated fields, and the fixed text `地政資料，最終以正式謄本為主；本說明書不代表完整資訊。` exist.
- PDF image tests use `pdfimages -list` to assert location and aerial image objects exist when candidate coordinates are present.
- Playwright E2E covers裕農路 address, all candidate options visible, one selected candidate, PDF export with candidate warning and non-empty candidate fields.

Scope boundaries:

- In scope: candidate list, candidate selection/confirmation, candidate PDF values, image coordinate fallback, tests, CR documentation.
- Out of scope: cloud sync, new database tables, transaction price calculation, bypassing MOI permissions.

## Risks / Trade-offs

- [Risk] 使用者誤把候選資料當正式謄本 → Mitigation：UI 與 PDF 都顯示候選警示，正式交付狀態不得使用 unconfirmed candidate。
- [Risk] 多筆候選資料造成選擇壓力 → Mitigation：候選表以可用欄位數、樓層、面積、用途排序，並保留全部候選。
- [Risk] 候選 API probe 產生成本 → Mitigation：候選 probe 前顯示費用來源與候選數，並記錄每筆 billing log。
- [Risk] 外部座標偏差導致圖資不準 → Mitigation：PDF 標示座標來源，並允許手動覆蓋或上傳圖資。
- [Risk] 同尾碼戶別推測遇到特殊戶造成誤判 → Mitigation：顯示 confidence、source_units 與「非登記資料」警示，並固定顯示「地政資料，最終以正式謄本為主；本說明書不代表完整資訊。」

## Migration Plan

- 部署步驟：先加入 provenance JSON 解析與 mock fixtures，再加入工作台候選清單，最後加入 PDF candidate rendering 與 E2E。
- 資料遷移：既有案件沒有 `candidate_options` 時，維持目前行為；下一次地址 lookup 或資料來源重新整理時產生候選清單。
- 回滾策略：若候選流程造成輸出混亂，關閉 candidate rendering，保留候選清單為 read-only 診斷資料；trusted 資料輸出不受影響。

## Open Questions

- 無。
