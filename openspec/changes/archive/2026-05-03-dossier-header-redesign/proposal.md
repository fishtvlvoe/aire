## Summary

重新設計不動產說明書 PDF 封面資訊表格，使版面更清晰、欄位語意更正確，並新增承辦人與店長欄位。

## Motivation

現有封面表格將公司名稱擠入地址同行的最後一格，導致長字串溢出格外；「案件編號」語意與「物件編號」混淆；負責人欄位只有一格，無法區分承辦人、店長與經紀人角色；地址已在說明書正文中出現，封面重複顯示。

## Proposed Solution

調整 `src/lib/pdf-generator/templates/dossier.html` 的封面 table 結構為 4 列：

```
                    不動產說明書
            ┌──────────────────────────┐
            │    {物件名稱副標題}       │
            └──────────────────────────┘

┌──────────┬───────────────────────────────────────────┐
│ 物件編號  │ {PROPERTY_ID}                             │
├──────────┼───────────────────────────────────────────┤
│ 物件名稱  │ {PROPERTY_NAME}                           │
├──────────┼───────────────────────────────────────────┤
│ 公司名稱  │ {COMPANY_NAME}                            │
├──────────────────┬─────────────────┬─────────────────┤
│ 承辦人：{value}  │ 店長：{value}    │ 經紀人：{value}  │
└──────────────────┴─────────────────┴─────────────────┘
```

具體變更：
- H1「不動產說明書」標題下方新增物件名稱副標題（`<p class="subtitle">`），使用 `{{PROPERTY_NAME}}` 佔位符
- 移除原有「地址」列與「案件編號」列
- 「案件編號」欄改為「物件編號」（資料來源不變，仍取 `supplementary_data.case_number`）
- 最後一列改為 3 格並排：承辦人（`supplementary_data.case_handler`）、店長（`supplementary_data.shop_manager`）、經紀人（`supplementary_data.agent_name`）
- 於 `src/lib/pdf-generator/dossier.ts` 的 `buildFullHtml()` 新增 `{{CASE_HANDLER}}` 與 `{{SHOP_MANAGER}}` 佔位符替換邏輯

## Non-Goals

- 不修改 PDF 頁首頁尾（headerTemplate/footerTemplate）
- 不變更稅費或正文任何章節內容
- 不新增後台 UI 補填承辦人/店長的入口（另一 change）
- 不修改 supplementary-schema.ts 欄位驗證（僅從現有 JSON 取值，缺值顯示空白）

## Alternatives Considered

- 將承辦人/店長/經紀人保留為一格合併顯示 → 無法區分角色，業務溝通時容易混淆，否決。
- 保留地址欄 → 正文章節 5、6 已有地址，封面重複無益，否決。

## Impact

- Affected specs: property-dossier
- Affected code:
  - Modified: src/lib/pdf-generator/templates/dossier.html
  - Modified: src/lib/pdf-generator/dossier.ts
