## Context

截至 2026-06-12，AIRE 的門牌前查核心決策仍沿用 archive change `2026-06-02-desktop-local-address-to-cop-e2e`：

- `Z10Web` 是 primary source
- `R02` 只做 fallback / 交叉驗證 / 戶別縮小

這個決策對「土地先定位，再補建號候選」的資料鏈是保守的，但和目前實際使用者期望衝突：

1. 使用者輸入的是完整門牌建物地址，產品上應直接走建物主線。
2. 地址少行政區時，系統應先嘗試補全，而不是直接顯示查不到資料。
3. `Z10Web` 若 timeout 或比對衝突，不應先把 `R02` 已拿到的建物主線打回「像沒有資料」。

## Goals / Non-Goals

### Goals

- 讓完整門牌建物地址改用 `R02 primary`。
- 讓缺行政區的門牌先走唯一候選補全。
- 讓 `Z10Web` 只作補證與衝突診斷，不再先主導「打回沒資料」。
- 把錯誤狀態分流成使用者可理解且工程可追查的類型。
- 把這次新策略寫進 skill，避免日後再被舊 archive 決策覆寫。

### Non-Goals

- 不修改地段地號輸入主線。
- 不建立靠猜測自動採用多區候選的行為。
- 不在本 change 內動 formal COP、付款、PDF trusted 邏輯。

## Decisions

### Decision 1: 完整門牌 `有號` 即進 `R02 primary`

- 採用方案：
  - 只要 parser 判定為完整門牌且有 `號`，就先走 `R02` 建物主線。
  - `Z10Web` 只作補證，不再是 primary。
- 為何採用：
  - 門牌地址的產品意圖是找建物，不是先找土地。
  - 這符合目前使用者直覺，也符合前台 `有號就是建物路徑` 的規則。
- Alternatives considered：
  - 保留 `Z10 primary`：與現場操作不符，容易把建物地址錯降級。
  - 同時並行兩邊但以先回者為準：會讓結果不穩，且難以解釋衝突來源。

### Decision 2: 缺行政區只在唯一命中時自動補全

- 採用方案：
  - 對少了 `區/鄉/鎮/市` 的門牌，先用 `縣市 + 路名 + 號` 做行政區查找。
  - 唯一命中才自動補全；多命中改為顯示候選區；零命中回 `address_incomplete_missing_district`。
- 為何採用：
  - 可以提升成功率，但不會用錯區污染後續建號。
- Alternatives considered：
  - 一律不補：太僵硬，會把可補全的常見輸入都打回失敗。
  - 多命中也直接取第一個：風險過高，容易查錯物件。

### Decision 3: `Z10Web` 失敗不等於 `R02` 主線失敗

- 採用方案：
  - 若 `R02` 已有單一或可縮小的建物候選，而 `Z10Web` timeout / unavailable，前台顯示為「已取得候選，待補證」或「建物需確認」，不得直接打回 `no_data`。
- 為何採用：
  - `Z10Web` 在這個策略下是補證層，不應提升為主結果的 hard gate。
- Alternatives considered：
  - 兩者都成功才算有資料：會讓大量可用建物候選被錯殺。

### Decision 4: 明確翻掉舊 archive 的 `Z10 primary` 決策

- 採用方案：
  - 在新 SR 明寫：本次是產品策略修正，取代 `2026-06-02-desktop-local-address-to-cop-e2e` 的門牌 primary-source 決策。
- 為何採用：
  - 若不寫清楚，其他 agent 很容易依 archive 的舊設計再做回去。
- Alternatives considered：
  - 只在 code 裡默改：之後 spec / code 會再度分叉。

## Implementation Contract

### Parser contract

- 完整門牌地址最少要能辨識：
  - `city`
  - `district/town`
  - `road`
  - `no`
- 若少 `district/town` 但其餘齊全，應進行政區補全流程，而不是直接 `address_parse_failed`。

### Discovery contract

- `doorplate-r02-primary-resolution`
  - Input: 完整門牌地址或可唯一補全行政區的門牌地址
  - Primary: `R02`
  - Secondary: `Z10Web`
- 狀態至少區分：
  - `candidate_found`
  - `low_confidence_unresolved`
  - `address_incomplete_missing_district`
  - `provider_timeout`
  - `manual_required`

### UI contract

- `cases/new` 對不同錯誤需分開顯示：
  - 缺行政區：要求補行政區或選候選區
  - 外部 timeout：可重查，保留追查編號
  - 候選衝突：顯示候選/待確認，不可說成沒資料

### Skill contract

- `aire-delivery-guardrails` 必須加入：
  - 完整門牌 `R02 primary`
  - 缺行政區先查唯一區補全
  - `Z10` 是補證，不得把門牌建物主線直接打回 no-data

## Risks / Trade-offs

- [Risk] 路名在多區重複，行政區補全誤命中
  - Mitigation：只有唯一候選才自動補全，多候選強制人工選。
- [Risk] 改成 `R02 primary` 後，某些舊測試會因 archive 決策翻轉而失敗
  - Mitigation：同步更新 spec、tests、skill，避免只改 code。
- [Risk] `Z10Web` 補證失敗時放寬結果，可能讓低品質候選更常進前台
  - Mitigation：前台只標成 `待補證/待確認`，不得自動升成 trusted。

## Migration Plan

1. 先新增 SR artifact，明確覆蓋舊門牌 primary-source 決策。
2. 先寫測試：
  - 缺行政區唯一補全
  - 完整門牌 `R02 primary`
  - `R02` 有候選但 `Z10` timeout 不得回 no-data
3. 實作 parser / discovery / UI 狀態分流。
4. 更新 skill。
5. 跑 focused tests、type-check。
6. 若部署 live，重測 `台南市永康區永華路580號5樓之3` 類案例與缺區案例。
