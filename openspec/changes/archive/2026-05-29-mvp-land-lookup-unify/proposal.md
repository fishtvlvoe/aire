## Why

地政查詢（地址 → 地段／建號／地號）目前存在兩套並行的 runtime：本機 Web 走 Next.js API route + EasyMap、桌面 App 走 Rust IPC，邏輯分叉導致「改一邊壞另一邊」；且本機 Web 目前查不到地段建號地號，阻斷 MVP 核心鏈的第一環，必須先把查詢合成一套並修復。

## What Changes

- 新增統一查詢契約：以 registry-discovery-contract 作為單一事實來源，本機 Web 與桌面 App 共用同一份地址查詢邏輯，移除兩套分叉路徑
- 定型「探查 vs 拉謄本」職責邊界：address-discovery（EasyMap，免費，草稿階段探查）與 formal-pull（COP，付費，需帳密，正式拉謄本）的分工寫入 spec
- 修復本機 Web 查不到地段建號地號（根因待查準：EasyMap 覆蓋不足 vs 重構半成品銜接斷裂；**禁止盲目還原 route.ts**，避免砸掉合理的拆分重構）
- 收編工作區既有的查詢拆分重構為此 change 的實作基礎（非重做）：address-discovery/route.ts、local-formal-pull-proxy.ts、formal-pull-data/route.ts、registry-discovery-contract.ts、src-tauri/src/land_registry/*

## Non-Goals

- 不做草稿書（disclosure）生成、PDF 產出、序號／IP 授權 — 各自為後續獨立 change
- 不做平台打包與安裝信任（Windows／macOS 簽章、auto-update）
- 不擴充物件類型，沿用現有單一類型
- 不做說明書（Official，簽約回補簽名頁那段）
- 不變更買斷／IP 鎖定的授權與收費模式

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `local-address-discovery-proxy`：本機 Web 與桌面 App 共用同一查詢契約；修復 discovery 銜接導致查不到的問題
- `land-registry-address-lookup`：address-to-parcel 查詢在 Web 與 App 回傳一致的 ParcelInfo（同一契約來源）

## Impact

- Affected specs：local-address-discovery-proxy、land-registry-address-lookup
- Affected code：
  - Modified：src/app/api/local/address-discovery/route.ts、src/lib/server/local-address-discovery-proxy.ts、src/lib/server/local-formal-pull-proxy.ts、src/app/api/local/formal-pull-data/route.ts、src/lib/registry-discovery-contract.ts、src/lib/land-registry-api.ts、src/components/PullParcelDataButton.tsx、src-tauri/src/land_registry/mod.rs、src-tauri/src/land_registry/easymap_r02.rs、src-tauri/src/land_registry/apis/address_to_parcel.rs
  - New：（無，相關檔案已於工作區封存於 commit de45aebe）
  - Removed：（無）
- Dependencies 新增：（無）
- 環境變數新增：（無；將於實作時確認既有 EasyMap／COP endpoint 設定是否正確，不新增變數）
