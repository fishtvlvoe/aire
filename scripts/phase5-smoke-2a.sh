#!/usr/bin/env bash
# Phase 5 — #2a land-registry-foundation 真機沙箱 smoke 驗收腳本
#
# 用途：用真實 OPCOS sandbox API key 跑端對端驗收，確認 land_registry 子系統
# （token 取得、API 呼叫、快取命中、餘額 ledger）在離線環境之外仍可運作。
#
# 用法：./scripts/phase5-smoke-2a.sh
#
# 設計：
# - 本腳本「不會」自動執行真實 HTTP 呼叫（避免錯誤地消耗 sandbox 額度）。
# - 它是 SOP 提示器：列出每一步該做什麼、預期看到什麼、出錯時看哪裡。
# - 真正執行交給 AIRE 桌面 App（土地查詢頁）+ 開發者人工檢視 log。
#
# 對應 #2a tasks.md Stage 3：真機 sandbox 驗收。
#
# 失敗準則：任一步驟「實際結果」與「預期」不符就 fail，需開新 spectra ingest。

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
LOG_DIR="$ROOT_DIR/docs/phase5-smoke-reports"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
REPORT="$LOG_DIR/smoke-2a-$TIMESTAMP.md"

mkdir -p "$LOG_DIR"

# ─── 顏色輸出 ───
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

step() { echo -e "${BLUE}==> Step $1: $2${NC}"; }
info() { echo -e "${YELLOW}    $1${NC}"; }
ok()   { echo -e "${GREEN}    [OK] $1${NC}"; }
warn() { echo -e "${YELLOW}    [WARN] $1${NC}"; }
fail() { echo -e "${RED}    [FAIL] $1${NC}"; exit 1; }

# ─── Step 0: 前置檢查 ───
step 0 "前置檢查 (.env / OPCOS_SANDBOX_API_KEY)"
if [ ! -f "$ENV_FILE" ]; then
    fail ".env 不存在於 $ENV_FILE，請先建立（參考 .env.example）"
fi

# 不直接 source（避免污染 shell），用 grep 確認 key 存在。
if ! grep -q '^OPCOS_SANDBOX_API_KEY=' "$ENV_FILE"; then
    fail ".env 缺少 OPCOS_SANDBOX_API_KEY（請向 OPCOS 後台申請 sandbox key）"
fi

KEY_LEN="$(grep '^OPCOS_SANDBOX_API_KEY=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '\n' | wc -c | tr -d ' ')"
if [ "$KEY_LEN" -lt 16 ]; then
    fail "OPCOS_SANDBOX_API_KEY 長度過短 ($KEY_LEN < 16)，疑似佔位值；請改填真實 sandbox key"
fi
ok ".env 含 OPCOS_SANDBOX_API_KEY（長度 $KEY_LEN）"

echo ""

# ─── Step 1: 取得 access token ───
step 1 "OPCOS Token 取得 (sandbox endpoint)"
info "操作：在 AIRE 桌面 App 進入「設定 → 雲端服務」頁面"
info "      點擊「測試連線」按鈕"
info ""
info "預期結果："
info "  - 200 OK，UI 顯示「連線成功」綠燈"
info "  - operation_log 出現一筆 type=opcos_token_refresh, status=success"
info ""
info "驗證指令："
info "  sqlite3 ~/Library/Application\\ Support/aire/aire.db \\"
info "    \"SELECT created_at, type, status FROM operation_log \\"
info "     WHERE type='opcos_token_refresh' ORDER BY id DESC LIMIT 1;\""
info ""
info "失敗排查："
info "  - 401 Unauthorized → key 錯，重抓 sandbox key"
info "  - 5xx / timeout → 檢查 sandbox endpoint 是否在 .env 設對"
info "  - keychain 寫入失敗 → 看 Console.app 過濾 'aire' 找錯誤"
echo ""

# ─── Step 2: 真實沙箱地號查詢 ───
step 2 "Land Registry — 單筆地號查詢 (sandbox)"
info "操作：AIRE 桌面 App → 土地查詢頁面"
info "      輸入 sandbox 提供的測試地號（例如 A-01-0001-0001-00）"
info "      按「查詢」"
info ""
info "預期結果："
info "  - HTTP 200，UI 顯示完整地號資料（所有權人、面積、地目、座標）"
info "  - billing_log 出現一筆 cost > 0 的記錄（單次 API 計費）"
info "  - cache 出現一筆對應 query_date 的紀錄"
info ""
info "驗證指令："
info "  sqlite3 ~/Library/Application\\ Support/aire/aire.db \\"
info "    \"SELECT parcel_id, endpoint, cost, transaction_id, created_at \\"
info "     FROM billing_log ORDER BY id DESC LIMIT 1;\""
info ""
info "失敗排查："
info "  - HTTP 4xx → 看 errors/mod.rs 對應的 LandRegistryError 變體"
info "  - billing_log 沒寫入 → 看 disk_resilience 是否回 DiskFull"
info "  - cache 沒寫入 → 確認 query_date 計算（synced_now 偏移）"
echo ""

# ─── Step 3: 快取命中驗證 ───
step 3 "Cache 命中 — 同地號重查"
info "操作：5 秒內，對 Step 2 的同一地號再按一次「查詢」"
info ""
info "預期結果："
info "  - UI 顯示資料的時間 < 200ms（沒有走外部 API）"
info "  - billing_log 沒新增記錄（cost 不再扣）"
info "  - operation_log 出現 type=land_registry_cache_hit"
info ""
info "驗證指令："
info "  sqlite3 ~/Library/Application\\ Support/aire/aire.db \\"
info "    \"SELECT COUNT(*) FROM billing_log WHERE created_at > datetime('now','-1 minute');\""
info "  # 應為 1（只算 Step 2 那筆），不是 2"
echo ""

# ─── Step 4: 餘額 ledger 計算 ───
step 4 "Billing Ledger — 餘額正確扣減"
info "操作：開啟「使用量」頁面（或 dev tools 查 ledger view）"
info ""
info "預期結果："
info "  - total_credit - spent = available_balance（精度差 < 0.01）"
info "  - aggregate_daily(today) = Step 2 那筆 cost（單次扣款，cache 不重計）"
info ""
info "驗證指令："
info "  sqlite3 ~/Library/Application\\ Support/aire/aire.db \\"
info "    \"SELECT SUM(cost) FROM billing_log \\"
info "     WHERE date(created_at) = date('now');\""
info ""
info "失敗排查："
info "  - 餘額對不上 → 看 billing_log/mod.rs::aggregate_daily 是否被 cache 重複觸發"
info "  - 扣款重複 → 看 record_call 是否在 cache_hit 路徑被誤觸"
echo ""

# ─── Step 5: 寫報告 ───
step 5 "產出報告"
{
    echo "# AIRE #2a Land Registry Sandbox Smoke Report"
    echo ""
    echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "Operator: $(whoami)"
    echo "Host: $(hostname)"
    echo ""
    echo "## Checklist"
    echo ""
    echo "- [ ] Step 1: Token 取得成功"
    echo "- [ ] Step 2: 沙箱地號查詢回 200"
    echo "- [ ] Step 3: Cache 命中，billing 不重扣"
    echo "- [ ] Step 4: 餘額 ledger 計算正確"
    echo ""
    echo "## Notes"
    echo ""
    echo "(填寫實際觀察、異常、後續行動)"
} > "$REPORT"

ok "報告模板已建立：$REPORT"
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  Smoke SOP 列印完畢，請依步驟人工執行    ${NC}"
echo -e "${GREEN}  完成後請編輯 $REPORT 勾選結果           ${NC}"
echo -e "${GREEN}=========================================${NC}"
