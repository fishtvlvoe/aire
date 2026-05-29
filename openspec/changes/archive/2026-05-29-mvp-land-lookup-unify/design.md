## Context

地政查詢（地址 → 地段／建號／地號）目前有兩條並行 runtime：本機 Web 走 Next.js API route（`/api/local/address-discovery`）+ EasyMap，桌面 App 走 Rust IPC（`land_registry_address_lookup`）。兩條各自實作查詢邏輯，改一邊不影響另一邊，造成「改 A 壞 B」。工作區已有一套進行中的拆分重構（探查 vs 拉謄本），封存於 commit de45aebe，尚未收尾。現況：本機 Web 查不到地段建號地號，阻斷 MVP 核心鏈第一環。既有約束：local-address-discovery-proxy spec 規定本機 Web 必須經 same-origin localhost proxy 查詢，瀏覽器不得直連 EasyMap／COP。

## Goals / Non-Goals

**Goals:**

- 本機 Web 與桌面 App 共用同一份地址查詢契約，回傳一致的 ParcelInfo
- 定型「探查（EasyMap，免費）／拉謄本（COP，付費）」雙路徑拆分
- 修復本機 Web 查不到地段建號地號的問題
- 收編封存於 de45aebe 的查詢拆分重構為實作基礎

**Non-Goals:**

- 草稿書生成、PDF 產出、序號／IP 授權、平台打包、auto-update、物件類型擴充、說明書（Official）
- land-registry-billing-log（查詢計費記錄）的重構，屬獨立 capability

## Decisions

### 決策 1：以 registry-discovery-contract 作為統一查詢契約

Web 與 App 各自只保留薄轉接層，查詢的輸入輸出形狀（DiscoveryResult／ParcelInfo）與狀態語意（candidate_found／manual_required）由 registry-discovery-contract 定義為單一事實來源。

- **Alternatives Considered:**
  - 維持兩套各自實作（否決：正是目前「改 A 壞 B」的根源）
  - 全部邏輯搬進 Rust，Web 也透過 sidecar 呼叫（否決：本 change 范圍過大，且瀏覽器 dev 體驗差，留待後續 Local Runtime change 評估）

### 決策 2：維持探查（EasyMap）與拉謄本（COP）雙路徑拆分

address-discovery 走免費 EasyMap 做草稿階段探查；formal-pull 走付費 COP（需帳密）做正式拉謄本。兩者職責邊界寫入 spec。

- **Alternatives Considered:**
  - 合併為單一查詢一律走 COP（否決：草稿階段就燒付費額度，違反成本控制）
  - 只用 EasyMap（否決：正式拉謄本需要 COP 的權威謄本資料）

### 決策 3：本機 Web 經 same-origin localhost proxy 查詢

本機 Web 的查詢請求一律經 `/api/local/address-discovery`（same-origin）轉發，瀏覽器不直連外部端點。

- **Alternatives Considered:**
  - 瀏覽器直接 fetch EasyMap（否決：CORS 阻擋，且來源 IP 集中易被封）
  - 使用公開 CORS proxy（否決：屋主地址外流第三方，違反隱私底線）

### 決策 4：以契約一致性測試定位查不到根因，禁止盲目還原 route.ts

先以「Web 與 App 同一地址回傳一致 ParcelInfo」的契約測試定位斷點，再判斷是 EasyMap 覆蓋不足或重構銜接斷裂。明文禁止把 route.ts 還原回合併前版本。

- **Alternatives Considered:**
  - 直接 git restore route.ts 回到含 COP 的舊版（否決：會砸掉合理的探查／拉謄本拆分，重蹈「改 A 壞 B」）
  - 直接更換 endpoint 重試（否決：根因未定位前更換等於盲猜）

## Implementation Contract

- **Behavior:** 使用者在本機 Web 與桌面 App 輸入地址後，皆能查到相同的地段／建號／地號清單；查無結果時回傳空清單並標示 manual_required（明示需手動補件），不得拋錯或靜默吞掉。
- **Interface / data shape:** 統一回傳 DiscoveryResult，內含 ParcelInfo 陣列（欄位：parcel_id、address、lot_number、building_number、source、trusted_for_pdf）。Web 入口為 POST `/api/local/address-discovery`；App 入口為 IPC command `land_registry_address_lookup`；兩入口回傳同一 shape，由 registry-discovery-contract 約束。
- **Failure modes:** EasyMap 無覆蓋 → status=manual_required（明示）；COP 帳密未設 → 不走 formal-pull，探查路徑仍須可用；瀏覽器直連外部端點 → 視為違反 proxy 約束，測試須擋下。
- **Acceptance criteria:** (1) 契約測試：同一組已知可查的合成地址，在 Web 與 App 回傳一致的 ParcelInfo；(2) 修復驗證：本機 Web 對已知可查地址回傳非空結果（人工或 e2e 截圖佐證）；(3) proxy 約束測試：瀏覽器層無直連外部端點。
- **Scope boundaries:** in scope = 地址探查契約統一 + 修復查不到 + 探查／拉謄本拆分定型；out of scope = 草稿書、PDF、序號、打包、物件類型、billing-log。

## Risks / Trade-offs

- [統一契約同時牽動 Web 與 App 兩端，改動面廣] → 先寫契約一致性紅燈測試鎖定回傳形狀，再動實作（TDD），任一端偏離即紅燈
- [盲目還原 route.ts 會砸掉探查／拉謄本拆分] → design 與 proposal 明文禁止，改以決策 4 的根因排查流程取代
- [EasyMap 對部分地址無覆蓋，被誤判為 bug] → 區分「無覆蓋（manual_required）」與「銜接斷裂（error）」兩種狀態，acceptance 一律以已知可查地址驗證
- [收編半成品可能殘留未完成銜接] → apply 第一步盤點 registry-discovery-contract.ts 現有完成度，列出缺口再動工

## Migration Plan

- **部署步驟:** 於 feat/aire-mvp 分支實作 → 跑契約測試與 proxy 約束測試全綠 → 本機 Web 對已知可查地址手動驗證查得到（截圖佐證）→ conventional commit。
- **回滾策略:** 以封存點 de45aebe 為回滾基準。若合一造成回歸，git revert 本 change 的 commits 即可回到封存態（查詢仍為兩套，但桌面 App 路徑維持原狀），不影響已封存的其他工作。
- 本 change 不變更 SQLite schema，無 migration DDL。

## Open Questions

- 本機 Web 查不到地段建號地號的確切根因（EasyMap 覆蓋不足 或 重構半成品銜接斷裂）— apply 第一步以契約測試定位。
- EasyMap／COP 的正確 endpoint：產品 context 記為 cop.land.moi.gov.tw，工作區程式碼出現 cop.moi.gov.tw 與 easymap.moi.gov.tw — apply 時查證並對齊。
- registry-discovery-contract.ts 封存版本的完成度與缺口 — apply 第一步盤點。
