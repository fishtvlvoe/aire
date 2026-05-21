# SR Cleanup 2026-05-22

## 目標狀態

Active SR 只保留正在推進的必要工作：

| SR | 狀態 | 理由 |
|---|---|---|
| `align-product-ui-with-demo-reference` | active | 新的產品 UI/UX 主 SR，負責 demo 對齊、工作台、設定頁、sidebar、視覺驗證 |
| `disclosure-registry-autofill-system-update` | active | 地政/API/catalog/matrix/outcome/ledger/adapter 底層資料 SR，支撐 UI SR |

## 已停用或移出 active 的項目

| SR | 處理 | 原因 |
|---|---|---|
| `aire-house-disclosure-workbench-mvp` | archived with incomplete tasks | 主要 MVP 工作已完成 27/30，剩 Windows VM 安裝與 PDF 人工驗收；不應卡在 active list，也不假裝完成 |
| `aire-license-local-vault-architecture` | archived with incomplete tasks | 舊架構大 SR，剩多個未來/外部/法務/付費項目；目前由 OPCOS/AIRE 授權與 demo UI SR 分段承接 |
| `pdf-browser-image-fix` | archived with incomplete E2E task | 程式與 unit test 已過，但 PDF 圖片 E2E 尚未完成；保留未完成任務記錄，不假裝完成 |
| `moi-api-coverage-fallback-cost-map` | archived with incomplete tasks | 已由 `disclosure-registry-autofill-system-update` 合併承接，避免同一組 API/catalog/cost 工作分散追蹤 |
| `moi-api-usage-ledger-and-cost-audit` | archived with incomplete tasks | 已由 `disclosure-registry-autofill-system-update` 合併承接，避免 ledger/cost audit 分散追蹤 |
| `floor-plan-and-planning-map` | archived with incomplete tasks | 舊圖資/格局圖規劃，後續只保留在 floor-plan 相關正式 archive/spec 或新 SR |
| `floor-plan-assets-and-ai-schematic` | archived with incomplete tasks | AIRE 格局圖/AI 位置由後續 AIRE feature SR 承接；本次不留 active/parked 噪音 |

## 分工邊界

```
align-product-ui-with-demo-reference
  負責：客戶看得到的正式 UI、工作台、設定、文案、視覺對照

disclosure-registry-autofill-system-update
  負責：地政資料怎麼來、成功失敗怎麼判斷、費用怎麼算、欄位怎麼填
```

## 收尾規則

- 未完成的 SR 不硬勾完成來封存。
- 已被新 SR 吸收的任務，在原 SR 註明移交到哪個 SR。
- active list 只保留下一步真正要做的工作。
- 未完成但已過時的項目放入 archive，並保留未完成 checkbox 作為歷史記錄；後續若要重啟，另開新的小 SR，不直接復活舊大 SR。
