#!/usr/bin/env bash
# COP API E2E 驗證腳本
# 用法: ./scripts/verify-cop-e2e.sh <PARCEL_ID>
# 例: ./scripts/verify-cop-e2e.sh R3-0201-00010000
#
# PARCEL_ID 格式: UNIT-SEC-NO
#   UNIT = 事務所代碼（如 R3、RA）
#   SEC  = 段代碼（4 碼，如 0201）
#   NO   = 地號（8 碼，如 00010000）

set -euo pipefail

PARCEL_ID="${1:-}"
if [[ -z "$PARCEL_ID" ]]; then
  echo "用法: $0 <PARCEL_ID>"
  echo "例:   $0 R3-0201-00010000"
  exit 1
fi

CLIENT_ID="${LAND_REGISTRY_CLIENT_ID:-9646bd7c-5abc-4be4-916c-07644e5aefd5}"
CLIENT_SECRET="${LAND_REGISTRY_CLIENT_SECRET:-XS9fuLVjc7JlOBTXYfPmz6tVyhapB6ybryP6s982}"
BASE_URL="${LAND_REGISTRY_API_BASE_URL:-https://copapi.moi.gov.tw/cp/api}"
TOKEN_URL="${LAND_REGISTRY_TOKEN_ENDPOINT:-https://copapi.moi.gov.tw/cp/getToken}"

IFS='-' read -r UNIT SEC NO <<< "$PARCEL_ID"

echo "=== COP API E2E 驗證 ==="
echo "地號: $PARCEL_ID  (UNIT=$UNIT SEC=$SEC NO=$NO)"
echo ""

# 1. 取 token
echo "--- 1. 取得 Bearer Token ---"
TOKEN=$(curl -s -X GET "$TOKEN_URL" \
  -H "Authorization: Basic $(echo -n "$CLIENT_ID:$CLIENT_SECRET" | base64)" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); t=d.get('access_token',''); print(t if t else 'ERROR:'+str(d))")
if [[ "$TOKEN" == ERROR* ]]; then
  echo "❌ Token 取得失敗: $TOKEN"; exit 1
fi
echo "✅ Token: ${TOKEN:0:30}..."
echo ""

run_api() {
  local name="$1" path="$2" payload="$3"
  echo "--- $name ---"
  local resp status
  resp=$(curl -s -X POST "${BASE_URL}${path}" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload")
  status=$(echo "$resp" | python3 -c "import json,sys; print(json.load(sys.stdin).get('STATUS','?'))" 2>/dev/null || echo "?")
  if [[ "$status" == "1" ]]; then
    echo "✅ STATUS=1"
    echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); r=d.get('RESPONSE',[]); print('  回傳筆數:', len(r) if isinstance(r,list) else 1)" 2>/dev/null
  elif [[ "$status" == "0" ]]; then
    local msg
    msg=$(echo "$resp" | python3 -c "import json,sys; print(json.load(sys.stdin).get('MESSAGE',''))" 2>/dev/null)
    echo "⚠️  STATUS=0 (空資料或無資料): $msg"
  else
    echo "❌ 未知狀態: $status"
    echo "$resp" | head -c 200
  fi
  echo ""
}

LAND_PAYLOAD="[{\"unit\": \"$UNIT\", \"sec\": \"$SEC\", \"no\": \"$NO\"}]"
LIMIT_PAYLOAD="[{\"unit\": \"$UNIT\", \"sec\": \"$SEC\", \"no\": \"$NO\", \"offset\": 1, \"limit\": 100}]"

run_api "001 LandDescription (土地描述)" "/LandDescription/1.0/QueryByLandNo" "$LAND_PAYLOAD"
run_api "002 LandOwnership (土地所有權)" "/LandOwnership/1.0/QueryByLimit" "$LIMIT_PAYLOAD"
run_api "003 LandOtherRight (他項權利，空=正常)" "/LandOtherRight/1.0/QueryByLimit" "$LIMIT_PAYLOAD"
run_api "004 BuildingDescription (建物描述)" "/BuildingDescription/1.0/QueryByBuildNo" "$LAND_PAYLOAD"
run_api "005 BuildingOwnership (建物所有權)" "/BuildingOwnership/1.0/QueryByLimit" "$LIMIT_PAYLOAD"

echo "=== 完成 ==="
echo "若所有 001-005 都是 ✅ 或 ⚠️（003 空是正常），Criterion 1 達成"
