## Context

AIRE 目前的 `AddressToParcelApi` 會先將地址 normalize，再呼叫 COP `/BuildingNo/1.0/QueryByAddress`。程式註解宣稱 `ADDRESS` 不含縣市，但 `docs/cop-scrape/05-服務說明文件/MOI_API_037門牌模糊檢索建號服務.html` 內容標示「地址必須包含縣市名稱、路名、門牌號」。

這造成真實地址 `台南市東區裕農路288巷17號8樓之1` live 查詢時送出 `東區裕農路288巷17號8樓之1`，回傳 0 筆，後續所有建物／土地 API 都沒有可用地建號。

## Decisions

### D1. 地址查詢送完整地址

`AddressToParcelApi::lookup` SHALL keep the normalized full address in `ADDRESS` and separately derive `CITY` from the same full address.

理由：與官方文件一致，也避免跨縣市同路名地址因缺少縣市而查不到或查錯。

### D2. 全量驗收分為地址、建物、土地、可用 MOI 端點四層

Live 驗收 SHALL output:

- `address_to_parcel`: 地址轉建號結果。
- building APIs: `building_registry`, `building_ownership`, `building_other_rights`。
- land APIs: `land_registry`, `zoning`, `land_value`, `co_owners`, `mortgages`。
- `raw_moi_endpoint_attempts`: 以裕農路測試案可取得的地址、土地、建物、座標與帳務條件，嘗試所有可直接呼叫的 MOI/COP 端點，包含目前尚未有 AIRE structured parser 的服務。

若建物標示資料可反推出基地土地號，土地端點 SHALL use discovered land IDs. 若反推不到，驗收檔 SHALL record fallback attempt and failure details rather than silently skipping land APIs.

不應只因為 `MOI_API_037` 地址轉建號被授權擋住，就停止後續端點驗收。當公開資料或既有資料可取得地號/建號時，live runner SHALL continue with those candidates and record the source and confidence level.

### D3. 驗收資料保留完整結果，不只摘要

Live dump SHALL include per API `success`, `data`, `error`, `total_cost`, and billing entries. This makes the output usable for UI/PDF mapping review and cost reconciliation.

### D4. 不可自動呼叫的 MOI API 要列入排除理由

若 MOI API 需要本案沒有、且不應由系統猜測的輸入，例如所有權人姓名或身分證字號，live dump SHALL record it in `skipped_moi_endpoints` with `reason`, not omit it silently.

## Risks

- 真實地址可能在 MOI/COP 授權範圍內仍查不到建號。此時 SR 仍需保存 raw/parsed failure details so we can tell whether it is payload format, authorization scope, or official data absence.
- 目前 `BillingLog` 仍用 wrapper 固定成本與本機 transaction placeholder；正式費用 ledger 仍屬後續 SR 範圍。
- 本次 live 驗收中，`MOI_API_037` 回 `COP317`（服務僅供申請），表示目前 COP 帳號尚未被授權使用門牌模糊檢索建號服務。
- 本次 live 驗收中，尚未產品化的 raw endpoint attempts 多數回 `COP312` 或 `COP305`。這些端點已列入驗收輸出，但正式串接仍需後續以官方介面名稱與帳號授權確認後建立 typed client。

## Non-Goals

- 不把 raw endpoint attempts 直接產品化成 UI 功能；本 SR 先建立真實驗收資料與缺口。
- 不在測試檔內 hard-code secrets。
- 不將 live dump 內容提交到 git。
