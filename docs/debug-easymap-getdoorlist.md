# DEBUG 立案：EasyMap R02 Door_json_getDoorList 回 500

> **狀態：✅ 已解決**（2026-05-29）。R02 上游故障 → 遷移 Z10Web，地段/地號/建號三項正常。
> 實測：台南中華東路一段100號→新後甲段/14310000/建號00773000；新竹中華路一段76號→溪橋段/06720000/建號00347000。
> spectra-debug 四階段全完成。前置修復 commit `9e5b606a`（省轄市 town code）。

## 問題

EasyMap R02 `Door_json_getDoorList` 一律回 HTTP 500「系統發生錯誤」，導致 AIRE 地址查（address-discovery）查不到地段/地號候選。**既有 code 從未成功過的 pre-existing bug**，非 browser-local-runtime-mvp 搬遷造成。

## Phase 1：Reproduce（✅ 完成）

```bash
# mac 本機 dev 即可重現
AIRE_LOCAL_TOKEN=x AIRE_DATA_DIR=/tmp/x PORT=3998 pnpm dev   # 背景
curl -s -X POST http://127.0.0.1:3998/api/local/address-discovery \
  -H "X-Local-Token: x" -H "Content-Type: application/json" \
  -d '{"address":"臺南市東區中華東路一段100號"}'
# → status:manual_required, errors:[{easymap_r02, "Door_json_getDoorList returned http_status=500: 系統發生錯誤"}]
```

- 一致發生：台南（D/area01）、新竹（O/area01）**都** 500。
- 預期：回真實 section/land/building 候選。

## Phase 2：Isolate（✅ 完成）

位置：`src/lib/server/local-address-discovery-proxy.ts` → `EasyMapClient.discoverDoorplate`（L162-209），呼叫 `/Door_json_getDoorList`（L171-186）。

逐步逆向已確認（手動 curl 對 EasyMap 官網）：

| 步驟 | 狀態 |
|------|------|
| 網路連通（mac → 內政部） | ✅ setToken.jsp 200/58ms |
| token 解析 | ✅ setToken body 兩個 input，regex 抓對 `name="token"` 的真 token |
| session cookie | ✅ JSESSIONID + TS cookie（需 `/Index` GET 先建 session） |
| `City_json_getTownList` | ✅ 直轄市回各區 `[{01,東區}...]`；省轄市回 `[{01,市名}]`（town code 已修，9e5b606a）|
| `City_json_getRoadList` | ✅ 回 `[{srcName,name}]` 道路名稱清單（**無 road code/id，只有名稱**）|
| `Door_json_getDoorList` | 🔴 **一律 500**，所有參數組合 |

手動測 getDoorList 三種組合（台南 D/area01/中華東路一段/no100），**全部 500**：
- (A) 最小參數：city/area/road/no/doorPlateType/cityName/townName
- (B) 重現現有 code：加 doorPlate=roadName + lane=null + alley=null
- (C) lane/alley 傳空字串

→ 排除「lane/alley null 變字串」假設。500 在 getDoorList 呼叫本身。

現有 code getDoorList 參數（疑點）：
```
city, area, road, doorPlate(=roadName ← 可疑), doorPlateType:"A",
lane, alley, no, cityName, townName
```

## Phase 3：Root Cause（✅ 決定性發現：上游伺服器故障）

**用 Chrome MCP 逆向官網 network，決定性證據**：
在官網實際查「臺南市東區中華東路一段100號」（選縣市D→東區01→中華東路一段→號），
觸發的全部請求只有：
- `setToken.jsp` 200
- **`Door_json_getDoorList` 500** ← 官網自己也 500
- 一堆 `wmts.nlsc.gov.tw` 地圖磚（純背景圖，非地籍資料）

**根因＝EasyMap R02 伺服器端 `Door_json_getDoorList` 故障**。官網用同一 endpoint 也 500，
地圖只移到道路附近、並未真正查出門牌/地號。這**不是 AIRE code 的參數或序列 bug**
（手動 curl 台南/新竹 500、官網 500，三個資料點一致）。AIRE 改 code 無法修上游故障。

**出路（待 Phase 4 決策）**：
1. 新版 **Z10Web**（`https://easymap.land.moi.gov.tw/Z10Web`，官網「新版體驗」連結）——舊版 R02 疑似停止維護，新版可能是替代 API。← 優先驗證
2. 等內政部修復 R02（若為暫時故障）。
3. 走 COP 付費正式謄本（formal-pull，需 COP 帳密）取代免費 EasyMap 初查。

## Phase 4：Fix — 遷移到 Z10Web（✅ 出路已實證）

**Z10Web 實證**：在 `https://easymap.land.moi.gov.tw/Z10Web` 門牌地址定位查
「臺南市東區中華東路一段100號」→ **成功查到**：地段「新後甲段」、地號 1431、
面積 295.03㎡、公告現值 187000、公告地價 35500。R02 舊版查不到、Z10Web 查得到。

**Z10Web 門牌→地號 API 序列（已逆向，host: easymap.moi.gov.tw/Z10Web）**：
1. `layout/setToken.jsp` (POST) — 取 token（每次 API 前）
2. `RoadPath_json_autoComplete?format=json&q=<完整地址>` (GET) — 回門牌候選清單
3. `HouseholdDoorPlate_json_detail` (POST) — 選定門牌 → 座標/詳情
4. `Land_json_getMapImageLayersByCoord` (POST) — 用座標查地籍圖層（得地號）
5. `LandDesc_ajax_detail` (POST) — 地號 → 詳情（地段/地號/面積/公告現值/公告地價）
6. `Land_json_locate` (POST) — 地號定位（地圖框）

**待辦（重寫 discoverDoorplate）**：
- 各 POST endpoint 的 body 參數需再用 curl 逐一逆向（方法同 R02 逆向：setToken 取 token + cookie → 打 API 看回應），重點 HouseholdDoorPlate_json_detail / getMapImageLayersByCoord / LandDesc_ajax_detail 的參數名。
- 重寫 `EasyMapClient`（local-address-discovery-proxy.ts）改走 Z10Web base + 上述序列。
- 保留 R02 作為 fallback 或直接淘汰（R02 getDoorList 已壞）。
- 先寫 failing test（台南中華東路一段100號 → 斷言地段「新後甲段」+ 地號 1431），再實作轉綠。
- 驗證：新竹、台南各一筆回真實地段/地號/建號，縣市不錯置。

## 已排除

- ❌ 網路問題（mac 能通）
- ❌ token 解析問題（regex 正確）
- ❌ town code 問題（已修 9e5b606a）
- ❌ lane/alley null 字串假設（空字串也 500）
- ❌ 省轄市特有（台南直轄市也 500）
