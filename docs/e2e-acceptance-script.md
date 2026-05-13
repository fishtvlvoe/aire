# AIRE Phase 1 端到端驗收腳本

> 對應 AIRE Phase 1 Group 12.1（E2E 驗收）。
> Phase 1 為「人工驗收」，未來可改 Playwright + Tauri WebDriver 自動化。
> 預估執行時間：30-45 分鐘。

## 前置準備

### 1. 啟動 mock OPCOS API（如果 OPCOS 雲端還沒部署）

```bash
# 簡易 mock：建一個 node script 模擬 /api/license/verify 與 /api/license/activate
cat > /tmp/mock-opcos.js <<'EOF'
const http = require('http');
const PORT = 3500;
http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.url === '/api/license/activate' && req.method === 'POST') {
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', () => {
      const data = JSON.parse(body || '{}');
      if (!data.license_key?.startsWith('AIRE-')) {
        res.writeHead(422);
        res.end(JSON.stringify({ error: 'invalid_key' }));
        return;
      }
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'active',
        token: 'mock-token-' + Date.now(),
        valid_until: '2027-12-31T00:00:00Z',
      }));
    });
  } else if (req.url === '/api/license/verify' && req.method === 'POST') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'active' }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'not_found' }));
  }
}).listen(PORT, () => console.log('Mock opcOS on :' + PORT));
EOF
node /tmp/mock-opcos.js &
```

### 2. 環境變數

```bash
export OPCOS_API_BASE_URL=http://localhost:3500
```

### 3. 啟動 AIRE dev

```bash
cd ~/Development/products/AIRE
pnpm tauri dev
```

## 端到端流程

### 步驟 1：首次啟用

**動作**：
1. 等 AIRE 主視窗開啟（預期看到啟用畫面）
2. 在輸入框打 `AIRE-TEST-0001-MOCK`
3. 點「啟用」

**預期**：
- ✅ 啟用按鈕進入 loading 狀態（inline spinner）
- ✅ 1-2 秒後跳轉到主畫面 `/cases`
- ✅ 顯示 EmptyState「尚無案件，按右上角『新增案件』開始」
- ✅ SQLite 的 `settings` 表有 `license_status=activated` 與 `device_id` 兩筆記錄
- ✅ keychain 內有 `aire/license_key` 與 `aire/license_token` 兩筆

**驗證指令**：
```bash
# 看 SQLite 內容
sqlite3 ~/Library/Application\ Support/aire/aire.db "SELECT key, value FROM settings;"
# 看 keychain（macOS）
security find-generic-password -s aire -a license_key
```

### 步驟 2：建立成屋案件

**動作**：
1. 點「新增案件」
2. 選「成屋」
3. 輸入：
   - 地號：`測試-001`
   - 地址：`台南市東區大同路 100 號`
   - 屋主姓名：`王測試`
4. 點「下一步」進入案件編輯頁

**預期**：
- ✅ 跳轉到 `/cases/<id>`
- ✅ 案件 header 顯示輸入的 3 欄
- ✅ 表單渲染 5 個 tab（標示/權利/稅費/現況/附件）
- ✅ 預設 `標示` tab 被選中
- ✅ SQLite `cases` 表新增一筆 `property_type='residential'` `status='draft'` 的記錄

### 步驟 3：填欄位 + 草稿自動儲存

**動作**：
1. 在「標示」tab 填：
   - 建物地號：`測試建物-001`
   - 土地地號：`測試地段-001-001`
   - 建物面積：`35.6`
   - 屋齡：`12`
2. 等 1.5 秒
3. 切到「現況」tab，把「漏水滲水」按「否」、「重大裝修」按「是」
4. 等 1.5 秒
5. **關閉視窗**（不點儲存）
6. 重開 AIRE
7. 點該案件進入編輯頁

**預期**：
- ✅ 每次欄位變動後 1 秒，右上角 indicator 從「儲存中」變「已儲存 HH:mm:ss」（Asia/Taipei 時區，秒數）
- ✅ 視窗關閉前 onCloseRequested 強制 flush 一次
- ✅ 重開後欄位值全部恢復（建物地號、土地地號、建物面積 35.6、屋齡 12、漏水「否」、重大裝修「是」）
- ✅ `disclosure_drafts` 表有對應 `case_id` 的 row、`payload_json` 內含這些欄位

### 步驟 4：標示為完成

**動作**：
1. 點「標示為完成」按鈕

**預期**：
- ✅ `cases.status` 轉為 `completed`
- ✅ 「標示為完成」按鈕消失（spec：僅 draft 狀態顯示）
- ✅ 列表頁該案件顯示「已完成」

### 步驟 5：建立土地案件

**動作**：
1. 回 `/cases`，「新增案件」→「土地」
2. 輸入：地號 `土地-001`、地址 `桃園市中壢區 XX 路 100 號`、屋主 `林測試`
3. 進入編輯頁，在「標示」tab 填：
   - 土地面積：`120.5`
   - 使用分區：`住宅區`
4. 在「權利」tab 填：
   - 持分比例：`0.5`
5. 嘗試輸入 `1.5` 到持分比例

**預期**：
- ✅ 土地表單只 4 個 tab（標示/權利/稅費/現況）
- ✅ 持分比例 `1.5` 被驗證拒，inline error 顯示「持分比例需介於 0 到 1」
- ✅ 改回 `0.5` OK

### 步驟 6：匯出 PDF（成屋）

**動作**：
1. 回成屋案件編輯頁
2. 點「匯出 PDF」按鈕
3. 在系統檔案對話框選擇桌面
4. 確認預設檔名為 `測試-001_residential_<YYYYMMDD>.pdf`
5. 點儲存

**預期**：
- ✅ Toast 顯示「匯出成功」（綠色，3 秒消失）
- ✅ Toast 內含「開啟所在資料夾」按鈕、點擊後開啟桌面
- ✅ 桌面出現 .pdf 檔
- ✅ 開啟 PDF：第 0 頁封面看到「測試 不動產」（如有設公司名）、第 3 頁建物標示看到地號 + 面積 + 屋齡（座標可能微跑）
- ✅ `cases.status` 轉為 `exported`
- ✅ `operation_log` 表新增 `action=pdf_export result=ok payload={output_path:...}` 一筆

### 步驟 7：離線寬限測試

**動作**：
1. 關掉 mock-opcos (`pkill -f mock-opcos`)
2. 關閉 AIRE
3. 重開 AIRE

**預期**：
- ✅ 直接進主畫面（已啟用 < 7 天，不打 API）
- ✅ `operation_log` 沒有新的 `verify_license` 嘗試（< 7 天閾值）

### 步驟 8：序號撤銷模擬

**動作**：
1. 修改 mock-opcos 讓 `verify` 回 401 `revoked`
2. 啟動 mock-opcos
3. 修改本機 SQLite `settings.license_verified_at` 為 10 天前
4. 重開 AIRE

**預期**：
- ✅ App 啟動時呼叫 verify
- ✅ 收到 401 → 跳啟用畫面
- ✅ 啟用畫面顯示「授權已被遠端撤銷，請重新啟用」
- ✅ SQLite `cases`、`disclosure_drafts` 資料保留（不刪）

### 步驟 9：鍵盤快捷鍵

**動作**：
1. 在 `/cases` 按 `Cmd/Ctrl+N`
2. 按 Esc

**預期**：
- ✅ Cmd+N 跳轉到 `/cases/new`
- ✅ 在案件編輯頁按 `Cmd+S` 強制 flush autosave，indicator 立刻顯示「已儲存」

### 步驟 10：清理

```bash
pkill -f mock-opcos
rm -rf ~/Library/Application\ Support/aire/
# 重新啟動會回到「啟用畫面」狀態
```

## 驗收紀錄

| 驗收日期 | 驗收者 | 通過數 | 失敗項 | AIRE 版本 |
| --- | --- | --- | --- | --- |
| YYYY-MM-DD | Fish | __/10 步驟 | （列失敗步驟編號） | 0.1.0 |

## 失敗處理

任何步驟失敗 → 開 spectra debug change：
```bash
cd ~/Development/products/AIRE
spectra new change "aire-phase1-fix-<bug>" --agent claude
```
