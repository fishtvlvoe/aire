# HANDOFF — mvp-land-lookup-unify（地政查詢修復 + MVP 合一）

> 產生於 2026-05-28。給冷啟動接手的 session：讀完這份 + `design.md` + `notes-inventory.md` 就能接上。
> 一句話現況：**「地址查不到地段建號地號」已修好並驗證（commit bfc91017）。剩「Web/App 合一、Rust 編譯驗證、R02 偶發 500 處理、清理」未做。**

---

## 0. 專案脈絡（接手必讀）

- AIRE = opcOS 子服務，台灣不動產「草稿書/說明書」產生系統。
- 技術棧：**Tauri 2.x（Rust 殼）+ Next.js 16（App Router）+ TypeScript + SQLite（本機）**。
- 交付形態：**桌面 App**（不是 Web SaaS），因為謄本含屋主隱私不能上雲。**本機運作是賣點，不是限制。**
- 客戶平台：**Windows 為主、macOS 為輔**（曾誤判為 Mac 優先，已更正，見 §7）。
- 交付只認桌面 App；**本機 Web（next dev）= 開發/E2E 工具，不交付客戶**。

### 查詢鏈架構（核心，務必理解）

```
地址 ──(R02 EasyMap)──> 地段/建號/地號 ──(COP)──> 權威謄本內部資料
       免費、必經入口                      付費、需客戶帳密
```

- **R02 是必經入口**：COP 不能直接用地址查（現有 COP 實作只有 `QueryByLandNo`/`QueryByBuildNo`，見 `src/lib/server/local-formal-pull-proxy.ts`）。
- COP 文件上有 `MOI_API_036`（地址→建號），但 **Fish 實戰經驗：模糊地址（缺精確門牌）查不到**，所以不靠它。
- design.md 把查詢拆成「探查（R02 免費，草稿階段）/ 拉謄本（COP 付費，正式階段）」——但兩者是**串聯**（R02 先，COP 後），不是二選一。

---

## 1. 這個 session 的軌跡（怎麼走到現在）

1. **封存**：working tree 有一大坨未 commit 的進行中工作（查詢拆分重構 + 42 個舊 `openspec/changes/desktop-*` 刪除 + 一堆 artifacts/smoke），全部原封不動 commit 成 **`de45aebe`**（"封存 MVP 重整前工作區快照"，300 檔，**本機未 push**）。
2. **開分支**：從 de45aebe 開 **`feat/aire-mvp`**。
3. **開 sr**：`mvp-land-lookup-unify`（proposal/design/2 specs/tasks，analyze 0 問題，validate 通過）。
4. **Debug 根因**：地址查不到（詳見 §2）。
5. **修復**：commit **`bfc91017`**（"fix(r02): 補 getTownList 缺少的 cityName + doorPlateType 欄位"，3 檔）。

---

## 2. 根因（完整技術鏈，全程實證，非推測）

**症狀**：本機 Web（`POST /api/local/address-discovery`）查「台北市信義區信義路五段7號」回 `status: manual_required`、`candidates: []`、`errors: [{source:"easymap_r02", message:"easymap_town_not_found"}]`。

**根因鏈**：
1. 地址解析正確（cityName=台北市, districtName=信義區, roadName=信義路五段, doorNumber=7）。
2. R02 `setToken`（`/R02/pages/setToken.jsp`）**線上可達**（HTTP 200），token 取得正常。→ 推翻「R02 打不通」。
3. **R02 `/City_json_getTownList` 回空 `[]`** → 取不到鄉鎮代碼（townCode）。
4. 取鄉鎮失敗的錯誤被 `src/lib/server/local-address-discovery-proxy.ts` 約 **line 364 的空 catch 靜默吞掉**（原註解："R02 occasionally rejects town-list token requests..."）。
5. 退用本地 fallback 表 `KNOWN_R02_TOWN_CODES`（定義約 **line 859**），但表**只有 5 筆**：`D:東區→01`、`D:永康區→39`、`E:苓雅區→08`、`O:北區→01`、`O:新竹市→01`（原作者踩同坑、手動硬塞的測試區）。
6. 台北（cityCode=A）不在表內 → `resolveTownCode`（約 line 350）throw `easymap_town_not_found`（line 368）→ `manual_required`。

**為什麼之前「有時查得到」**：那 5 個 fallback 區走捷徑、繞過 getTownList；其他全台地址因 getTownList 回空 + 不在表內 → 一律查不到。**整個系統實際只靠那 5 個區硬撐。**

**真正的根因（Fish 點破）**：不是 R02 不穩，是**送給 getTownList 的欄位不齊**。getTownList 真實需要 **5 個 body 欄位**：
```
cityCode, cityName, doorPlateType, struts.token.name, token
```
程式只送了 `cityCode` + token，**漏了 `cityName` 和 `doorPlateType`** → R02 回空。

**實證**：curl 補齊 `cityCode=A` + `cityName=臺北市` + `doorPlateType=A` + token → getTownList 回完整台北鄉鎮清單（含 `信義區=17`）。

---

## 3. 修復內容（commit bfc91017，3 檔 55 行）

### 3.1 `src/lib/server/local-address-discovery-proxy.ts`
- `resolveTownCode`：getTownList 的 body 補 `cityName`（用 cityCode 反查 `CITY_CODE_BY_NAME`，對照表約 **line 1153**）+ `doorPlateType: "A"`。
- 約 line 364 的空 catch 改為 `console.error("[resolveTownCode] getTownList failed:", err)`（不再靜默吞，符合 design.md Implementation Contract）。

### 3.2 `src-tauri/src/land_registry/easymap_r02.rs`
- `resolve_town_code` 簽名新增 `city_name: &str` 參數；HashMap body 補 `cityName` + `doorPlateType=A`。
- 錯誤路徑改 `tracing::error!`。
- 兩個呼叫方 `discover_doorplate` / `discover_land_descriptor` 補傳 `&parts.city_name` / `&parsed.city_name`。
- **注意：Rust 端欄位補對了，但本機 tauri 編譯環境卡住，尚未 `cargo build` 驗證。見 §6 待辦。**

### 3.3 `src/lib/server/__tests__/local-address-discovery-proxy.test.ts`
- 新增測試「sends cityName and doorPlateType in getTownList request body」。

### 後續端點（已實測，現有欄位足夠，未改）
- `City_json_getSectionList`：curl 實測 `cityCode=A, area=17` 正常回信義區地段。
- `Door_json_getDoorList` / `Door_json_getFullDoorListByA`：現有程式已含 `cityName`+`doorPlateType`，不需補。

### fallback 表
- `KNOWN_R02_TOWN_CODES` 5 筆**保留當備胎**（沒刪）。

---

## 4. 驗證證據（curl，dev server 在 localhost:3000）

```bash
# 台北信義（原本查不到）→ 修後 candidate_found
curl -s -X POST http://localhost:3000/api/local/address-discovery \
  -H "Content-Type: application/json" \
  -d '{"address":"台北市信義區信義路五段7號"}'
# → status: candidate_found, 20 筆
#   全是「信義路五段7號」各樓層（一樓/101樓/71樓...= 台北101），
#   地號 03410000、各樓層建號（00285000 一樓 / 00286000 101樓...），source=easymap_r02
#   → 資料真實正確，道路有處理對，非碰巧

# 台中市政路386號（非原 5 區）→ candidate_found, 20 筆 → 證明全台通
# 高雄鼓山（非原 5 區）→ manual_required, error="Door_json_getDoorList http_status=500 系統發生錯誤"
#   → 這是 R02 SERVER 端偶發 500，跟欄位無關（townCode 已取到、進到 getDoorList 才 500）。見 §6 待辦 3。
```
- `pnpm tsc --noEmit`：0 錯。
- `pnpm vitest run`：15 pass / 0 fail（含新測試）。

---

## 5. R02 技術 know-how（接手做後續查詢/UI 必備）

- Base URL：`https://easymap.moi.gov.tw/R02`（常數 `EASYMAP_BASE_URL`，proxy 檔約 line 14）。
- **Token**：`POST /R02/pages/setToken.jsp` → 回 HTML，抓 `name="token" value="([A-Z0-9]+)"`。是 Struts CSRF token，配 cookie session（TS* 是 F5 BIG-IP cookie）。每次查詢前重取。
- **送 token 的方式**：body 加 `struts.token.name=token` + `token=<值>`（不是 header）。
- **端點清單**（程式用到的）：
  - `City_json_getCityList`（取 22 縣市，回 `{id,name}`，台北 id=A）
  - `City_json_getTownList`（取鄉鎮，**需 cityCode+cityName+doorPlateType+token**）
  - `City_json_getSectionList`（取地段，需 cityCode+area=townCode）
  - `Door_json_getDoorList` / `Door_json_getFullDoorListByA`（門牌→地號建號）
  - `Map_json_getMaxMinLandNo`、`Land_json_locate`、`BuildingDesc_ajax_detail`、`LandDesc_ajax_detail`
- **doorPlateType**：`A`=地政門牌、`B`=戶政門牌（門牌查詢 tab 的下拉，目前程式寫死 A）。
- **cityCode 對照**（getCityList 回的）：A臺北 B臺中 C基隆 D臺南 E高雄 F新北 G宜蘭 H桃園 I嘉義市 J新竹縣 K苗栗 M南投 N彰化 O新竹市 P雲林 Q嘉義縣 T屏東 U花蓮 V臺東 W金門 X澎湖 Z連江。
- **台北 town code 範例**：松山01 大安02 中正03 萬華05 大同09 中山10 文山11 南港13 內湖14 士林15 北投16 **信義17**。

### 抓「真實送出欄位」的方法（reuse，下次卡欄位時用）
在 R02 頁面注入 XHR/fetch hook 記錄請求 `bodyKeys`，再用 UI 操作觸發：
```js
// 注入後，操作 UI（選縣市等），再讀 window.__cap 的 bodyKeys（只取 key 名，避開安全過濾）
XMLHttpRequest.prototype.send 包一層，攔 /City_json|Door_json/ 的 url，push body
```
- **Chrome MCP 操作 R02 的坑**：查詢觸發地圖渲染會讓頁面**凍結**，`javascript_tool` evaluate 與 `read_network_requests` 會超時。需重整頁面再抓。讀 `window.__cap` 時只回 key 名（`new URLSearchParams(body).keys()`），含 value/完整 url 會被 cookie/query 安全過濾擋掉。
- **R02 UI 操作**：道路必須**選下拉**（有 road code），不能只在文字框打字；巷/弄/號分格。（程式 curl 是 parse 地址字串查，跟 UI 手動是兩條路；程式那條已驗證查到。）

---

## 6. 待辦（串接下一步，依優先序）

1. **Rust 編譯驗證**（交付 App 必須）：`cd src-tauri && cargo build`，確認 §3.2 的 `resolve_town_code` 改動編譯通過。環境卡住時排查 tauri/rust toolchain。
2. **R02 偶發 500 處理**（getDoorList "系統發生錯誤"）：加重試機制；查不到時 UI 引導使用者補**精確門牌/地號**（Fish：模糊地址查不到是本質限制，任何 API 都一樣）。對應 design.md「manual_required 明示」。
3. **Web/App 真正合一**（design 決策 1，sr task 3.1/3.2）：目前 Web（Next route）與 App（Rust IPC）**各自補了欄位、仍是兩套**。要以 `registry-discovery-contract` 為單一事實來源，移除分叉。這是「改 A 壞 B」的結構解，但不急（查詢已能用）。
4. **sr 剩餘 task**：2.x 紅燈測試補齊（目前只補了 1 個）、3.1/3.2 合一、5.1 完整驗收。`spectra status --change mvp-land-lookup-unify --json` 看進度（已 done：1.1、4.1、4.2）。
5. **清理**（Fish 交代的「要清的」，push 前）：`artifacts/smoke/` 一百多個測試截圖/PDF + `*.db`/`*.sqlite` + `.gemini/`/`.opencode/`/`.cursorrules`/`GEMINI.md` 加進 `.gitignore` + `git rm -r --cached`。注意 `artifacts/smoke/*.json` 部分含 login/installer 字樣，可能有測試帳密 → de45aebe 歷史已含（因未 push 不外流），push 前評估是否清歷史。
6. **MVP 後續 change**（整條鏈其他段，各自開 sr）：草稿書（disclosure）生成 → PDF 產出 → 序號/IP 授權。本 change 只做「地址→地段建號地號」入口。

---

## 7. 架構決策與認知更正（避免接手者重犯）

- **R02→COP 是串聯不是二選一**：曾誤判可二選一，Fish 更正。R02 是地址→地號的必經入口。
- **平台 Windows 為主**：曾建議「MVP 先做 Mac（簽章 US$99 便宜）」，但產品 context 寫明客戶多用 Windows → 已更正。平台決策留到「打包/安裝」change，以 Windows 為主。
- **安裝信任**：免手動的解 = 簽章+公證（macOS Apple Developer US$99/年；Windows Authenticode，OV 要養 SmartScreen 信譽 / EV 立即免警告）。跟「本機 vs SaaS」無關。
- **不是 R02 不穩**：debug 一度歸因「R02 不穩」，Fish 點破是「欄位沒給齊」→ 修好全台通。教訓：**reuse-first，先讀 `docs/gov-site-analysis/04-easymap-r02.md` 等既有分析，別從頭逆向**。

---

## 8. 環境現況

- 分支：`feat/aire-mvp`；HEAD = `bfc91017`（修復）；其下 `de45aebe`（封存，未 push）。
- dev server：`next dev` 在 `localhost:3000`（背景 PID 9823，非本 session 啟動）。
- Chrome：tab 1944452134 開著 R02/Index（可能凍結，可關）。
- sr 狀態：`mvp-land-lookup-unify` 已 unpark + in-progress；筆記在 `notes-inventory.md`（含完整 debug 紀錄）。
- 全域記憶/規則：`~/.claude/`（soul.md, lessons*.md, rules/）。
