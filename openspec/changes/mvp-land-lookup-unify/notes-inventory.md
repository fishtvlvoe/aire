# task 1.1 盤點筆記 — mvp-land-lookup-unify

> 作者：task 1.1 執行紀錄 | 日期：2026-05-28 | 分支：feat/aire-mvp

---

## 1. registry-discovery-contract.ts 現狀

### 已有型別（完整）
| 型別 | 狀態 | 說明 |
|------|------|------|
| `DiscoveryStatus` | ✅ 完整 | `candidate_found \| manual_required \| error` |
| `DiscoverySource` | ✅ 完整 | `easymap_r02 \| local_discovery \| tauri_desktop` |
| `DiscoveryInputKind` | ✅ 完整 | `doorplate \| land_descriptor \| incomplete` |
| `DiscoveryCandidateConfidence` | ✅ 完整 | `high \| needs_selection \| low` |
| `DiscoveryObjectType` | ✅ 完整 | `building \| land` |
| `DiscoverySelectionState` | ✅ 完整 | `not_required \| required \| selected` |
| `DiscoveryIntendedObjectType` | ✅ 完整 | `building \| land \| unknown` |
| `ParsedDiscoveryInput` | ✅ 完整 | 台灣地址拆解結構 |
| `DiscoveryInputClassification` | ✅ 完整 | 輸入種類分類 |
| `DiscoveryCorrectionSuggestion` | ✅ 完整 | 地址糾錯建議 |
| `DiscoveryCandidate` | ✅ 完整 | `registryKey, sectionName, landNumber, buildingNumber, source, confidence?, objectType?` |
| `DiscoveryError` | ✅ 完整 | `source, code, message` |
| `DiscoveryResult` | ✅ 完整 | 統一查詢回傳形狀 |

### 已有函式
| 函式 | 狀態 | 說明 |
|------|------|------|
| `normalizeDiscoveryResult()` | ✅ 完整 | 從原始輸入組裝 DiscoveryResult |
| `normalizeR02DiscoveryRun()` | ✅ 完整 | R02DiscoveryRun → DiscoveryResult |
| `normalizeR02RecordedDiscoveryRun()` | ✅ 完整 | R02RecordedDiscoveryRun → DiscoveryResult |
| `classifyDiscoveryInput()` | ✅ 完整 | 地址種類分類 |
| `suggestDiscoveryCorrections()` | ✅ 完整 | 地址糾錯 |

### 已有缺口（task 1.1 執行前評估）
1. **`DiscoveryCandidate` 缺少 `parcel_id` 和 `address` 欄位**：design.md Implementation Contract 要求 ParcelInfo 含這兩欄，但 DiscoveryCandidate 沒有。兩端（Web/App）目前用不同型別橋接（TS 用 ParcelInfo，Rust 用 DiscoveryCandidate）。
2. **`DiscoveryResult.trustedForPdf` 型別硬編為 `false`（literal type）**：不是 `boolean`，無法表示付費拉謄本後的 `true` 狀態。design 的 `trusted_for_pdf` 要求 boolean。
3. **`DiscoveryResult.totalCostCents` 型別硬編為 `0`（literal type）**：同上，無法表示付費查詢的費用。

### 型別補齊結論
**`pnpm tsc --noEmit` 通過，零錯誤。** 上述缺口是語意缺口，不是 TS 編譯錯誤。

**本 task 範圍判斷**：
- `trustedForPdf: false` → `trustedForPdf: boolean` 和 `totalCostCents: 0` → `totalCostCents: number`：這兩個 literal type 限制是 EasyMap 探查路徑的有意設計（探查永不計費、永不可信 PDF）。若放寬為 boolean/number，需同時確保 formal-pull 路徑正確設值。**保留 literal type 至 task 3.x（實作合一）再評估**，避免現在動型別引入型別錯誤。
- `DiscoveryCandidate` 的 `parcel_id/address` 缺口：Web 端以 `ParcelInfo`（含 parcel_id/address）表示候選；App IPC 端以 `Vec<ParcelInfo>`（Rust，含所有欄位）回傳。兩者繞過 DiscoveryCandidate 直接用 ParcelInfo。**這是雙軌並存的銜接斷點，見第 4 節斷點分析**。

---

## 2. DiscoveryCandidate vs ParcelInfo 型別對應

### TypeScript 端

**DiscoveryCandidate**（`registry-discovery-contract.ts`）：
```
registryKey, sectionName, landNumber, buildingNumber, source, confidence?, objectType?
```

**ParcelInfo**（`land-registry-api.ts`）：
```
parcel_id, address, lot_number, building_number, section_name?, section_code?,
land_office?, source?, trusted_for_pdf?, discovery_confidence?, object_type?, ...
```

**差異**：DiscoveryCandidate 無 `parcel_id`、`address`；ParcelInfo 無 `registryKey`、`confidence`（命名不同）。

### Rust 端

**DiscoveryCandidate**（`discovery_contract.rs`）：
```rust
registry_key, section_name, land_number, building_number, source
// serializes as camelCase
```

**ParcelInfo**（`apis/address_to_parcel.rs`）：
```rust
parcel_id, address, lot_number, building_number, source, trusted_for_pdf,
section_name?, section_code?, land_office?, discovery_confidence?, object_type?, ...
```

**Rust DiscoveryResult**（`discovery_contract.rs`）候選用 `DiscoveryCandidate`，但 IPC `land_registry_address_lookup` 直接回傳 `Vec<ParcelInfo>`（不走 DiscoveryResult 包裝）。

---

## 3. 實際查詢流程

**Web（本機 dev）**：
```
前端 → fetch POST /api/local/address-discovery
→ route.ts → discoverAddressLocally(address) [local-address-discovery-proxy]
→ EasyMapClient.discover() → HTTPS easymap.moi.gov.tw/R02
→ 回傳 AddressDiscoveryResult { candidates: ParcelInfo[] }
→ 前端 land-registry-api.ts 拿 candidates（ParcelInfo[]）
```

**App（桌面 Tauri IPC）**：
```
前端 → invoke("land_registry_address_lookup", { address })
→ pull.rs land_registry_address_lookup（tauri command）
→ easymap_r02::discover_easymap_r02_address(address) → HTTPS easymap.moi.gov.tw/R02
→ 回傳 Vec<ParcelInfo>
→ 前端 land-registry-api.ts 拿 Vec<ParcelInfo>
```

**共同點**：兩路均打 easymap.moi.gov.tw/R02，均回傳 ParcelInfo 陣列，前端消費端接口相容。但兩路**彼此不共用任何邏輯**，也沒有走 registry-discovery-contract 作為統一入口。

---

## 4. 「本機 Web 查不到」斷點假設

### 假設 A：EasyMap upstream 覆蓋不足（manual_required 正常態）
- 可能性：**中**（EasyMap 對部分地址確實查不到）
- 證據：`getLatestDiscoveryRun()` 從 mock-backend 的 `list_registry_query_runs` 拿歷史紀錄，但 Web 模式下這個 IPC mock 未必有資料，導致 fallback 一律 manual_required
- 強度：間接推斷，未實跑驗證

### 假設 B：mockInvoke/getLatestDiscoveryRun 銜接斷裂（重構半成品）
- 可能性：**高**（銜接半成品最符合症狀）
- 關鍵線索：`discoverAddressLocally()` 在 EasyMap 拋例外時走 `fallbackManualResult()`，其中呼叫 `getLatestDiscoveryRun()` → `mockInvoke("list_registry_query_runs")`。Web 環境下若這個 mock 路徑回傳空或模擬失敗，整個 catch 塊會靜默回傳 manual_required，**即使 EasyMap 本身可查**。
- 強度：**強**（有代碼路徑支持，且 mock-backend.ts line 920 有 `list_registry_query_runs` case，但 Web server 端不能存取 Tauri IPC）

### 假設 C：EasyMapClient 的 HTTPS 請求在 Next.js server-side 失敗
- 可能性：**中高**
- 線索：`local-address-discovery-proxy.ts` 用 `node:https` 模組直連 easymap.moi.gov.tw，若 session cookie（token）未初始化，第一次查詢會失敗。EasyMapClient 的 token 靠 `/R02Auth.do` 先取得，若超時或被 WAF 擋，catch 塊觸發 fallbackManualResult。
- 強度：**中**（需實跑才能確認）

### 首要斷點（最高可能）
**假設 B + C 複合**：EasyMapClient 初始 token 請求失敗（C）→ 觸發 catch → getLatestDiscoveryRun 在 Web 環境拿不到歷史（B）→ 回傳 manual_required。task 4.x 應以實跑 dev server + console log 確認。

---

## 5. pnpm tsc --noEmit 結果

```
TypeScript: No errors found
```

✅ 通過，零型別錯誤。**未補型別定義**（現有型別已完整，不需改動即可讓 Web 與 Rust 兩端引用同一形狀）。

---

## 6. 後續 task 2.x 需知

1. 契約一致性測試需 mock EasyMapClient（避免打真實 endpoint）
2. Rust 端 IPC 回傳 `Vec<ParcelInfo>` 不包在 DiscoveryResult 內；測試需轉換比較
3. manual_required 測試需 mock EasyMap 拋錯的路徑（EasyMapUpstreamError）
4. proxy 約束測試可以 grep import 禁止 client-side 直接 fetch easymap.moi.gov.tw

## 根因調查結論（2026-05-28，task 4.1 定位，全程實證）

### 症狀
本機 Web 查「台北市信義區信義路五段7號」回 manual_required、查不到地段建號地號。

### 根因鏈
1. 地址解析正確（台北市/信義區/信義路五段/7號）
2. EasyMap setToken 線上可達（HTTP 200，0.05s）
3. **EasyMap /City_json_getTownList(cityCode=A) 一律回空 []** — 已試遍：直接呼叫、帶 cookie session、先 GET /Index 建 session 前置、參數名變體（city/cityId/id/cityNo 皆觸發 ACCESS DENY，僅 cityCode 通過但回空）
4. 取清單失敗被 local-address-discovery-proxy.ts:364 空 catch 靜默吞掉
5. 退用本地 fallback 表 KNOWN_R02_TOWN_CODES，僅 5 個測試區（D:東區、D:永康區、E:苓雅區、O:北區、O:新竹市）
6. 台北信義不在表內 → line 368 throw easymap_town_not_found → 查不到

### 關鍵事實
- getCityList 正常（回 22 縣市，台北市 id=A，與 CITY_CODE_BY_NAME 一致，值無誤）
- getTownList 回空原因超出 curl 逆向範圍（疑 EasyMap 改版/該端點需瀏覽器特有請求）
- Rust easymap_r02.rs:679 getTownList 呼叫法與 Web 相同（cityCode 參數）→ 兩端同受影響
- 全系統實際只靠那 5 個 fallback 區運作，線上取鄉鎮從未成功

### 待解
- 以真實瀏覽器（Chrome）操作 EasyMap R02 錄 network，找成功取鄉鎮的請求差異
- 線索：原作者當初取得那 5 個 fallback town code 的方法
- 修法候選：(A) 補全本地 town code 表（需正確來源）(B) 複製瀏覽器成功請求治本 (C) 改用其他地政 API

## 真根因確定（2026-05-28，Fish 點破：欄位沒給齊，非 R02 不穩）
- getTownList 真實需 5 欄位: cityCode, cityName, doorPlateType, struts.token.name, token
- 程式 resolveTownCode 只送 cityCode(+token)，漏 cityName + doorPlateType → R02 回 []
- curl 補齊(cityCode=A, cityName=臺北市, doorPlateType=A, token)→ 回完整台北鄉鎮，信義區=17 ✓（實證）
- 那 5 個 KNOWN_R02_TOWN_CODES 是原作者踩同坑沒查出、手動硬塞
- doorPlateType: A=地政門牌, B=戶政門牌（門牌查詢 tab 的下拉）
- 修法:
  1. local-address-discovery-proxy.ts resolveTownCode 的 getTownList body 補 cityName + doorPlateType
  2. Rust easymap_r02.rs:679 resolve_town_code 同步補
  3. 後續 getSectionList/getDoorList 疑同樣漏欄位 → 用 curl 帶完整欄位實測補齊（勿猜）
  4. 空 catch(line 364)改 console.error（不靜默吞，符合 design contract）
  5. 5 個 fallback 保留當備胎
- 抓真實欄位方法（reuse）: 頁面注入 XHR/fetch hook 記錄 City_json/Door_json 請求 bodyKeys；用瀏覽器實際查詢觸發，再讀 hook
- Chrome 操作注意: 查詢觸發地圖渲染會讓 R02 頁面凍結，JS evaluate / network 讀取超時，需重整再抓
