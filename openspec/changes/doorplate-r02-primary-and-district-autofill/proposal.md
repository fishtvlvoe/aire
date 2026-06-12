## Why

目前 AIRE 的門牌前查策略仍把 `Z10Web` 當 primary、`R02` 當補證，且缺行政區的輸入會直接落成「查不到資料」。這和實際使用情境不符：使用者輸入的是門牌建物地址，只要地址完整到 `號`，系統就應優先走建物主線；缺行政區時也應先嘗試補全，而不是直接打回人工。

## What Changes

- 新增缺行政區門牌地址的補全流程：先用 `縣市 + 路名 + 號` 查唯一行政區；唯一命中才自動補全，否則顯示候選區或明確標記地址不完整。
- 修改完整門牌地址的查詢策略：只要輸入是完整門牌且含 `號`，就以 `R02` 作為建物主線，不再以 `Z10Web` 作 primary。
- 修改 `Z10Web` 角色：對完整門牌建物地址改為補證、校驗與候選補充，不得先把 `R02` 建物主線打回「像是沒有資料」。
- 修改結果分流：區分 `地址不完整`、`外部來源 timeout / unavailable`、`候選衝突待確認`、`無可信候選`，不得再全部摺成「本次沒有取得可用資料」。
- 新增 live/runtime guardrail：若門牌地址因 `Z10Web` 補證失敗而降級，必須在 diagnostics 與 skill 中留下可追溯理由。

## Non-Goals

- 不處理地段地號輸入主線改寫；本次只針對門牌建物地址。
- 不做模糊猜區後直接默默採用多個候選中的第一個行政區。
- 不把缺行政區的錯誤輸入偽裝成正式成功候選。
- 不在本次 change 內調整正式 COP / 付費查詢的商業流程。

## Capabilities

### New Capabilities

- `doorplate-district-autofill`: 門牌地址缺行政區時，系統可先做唯一行政區補全或回傳候選區。
- `doorplate-r02-primary-resolution`: 完整門牌建物地址以 R02 為主線解析建號，Z10Web 改為補證。

### Modified Capabilities

- `desktop-local-address-to-cop-e2e`: 修改既有「Z10 primary、R02 補證」的門牌策略，改成完整門牌 `R02 primary / Z10 verify`。
- `nationwide-free-pre-survey`: 修改缺行政區、timeout、候選衝突的前台狀態與文案邊界。

## Impact

- Affected specs:
  - New: `doorplate-district-autofill`
  - New: `doorplate-r02-primary-resolution`
  - Modified: `desktop-local-address-to-cop-e2e`
  - Modified: `nationwide-free-pre-survey`
- Affected code:
  - Modified: `src/lib/server/local-address-discovery-proxy.ts`
  - Modified: `src/lib/product-ui-demo-alignment.ts`
  - Modified: `src/app/(dashboard)/cases/new/page.tsx`
  - Modified: `src/lib/land-registry-api.ts`
  - Modified: `src/lib/server/__tests__/local-address-discovery-proxy.test.ts`
  - Modified: `src/lib/__tests__/product-ui-demo-alignment.test.ts`
  - Modified: `src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx`
  - Modified: `.claude/skills/aire-delivery-guardrails/SKILL.md`
- Dependencies 新增:
  - 無新增外部服務；沿用 EasyMap R02 / Z10Web
- 環境變數新增:
  - 無
