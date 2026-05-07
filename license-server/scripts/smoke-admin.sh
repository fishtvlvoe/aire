#!/usr/bin/env bash
# license-server admin migration smoke test
# 覆蓋 admin-ui-migration-to-license-server design.md Migration Plan 步驟 3 列出的 6 個情境
# 用法：
#   BASE_URL=http://localhost:3000 \
#   LICENSE_ADMIN_TOKEN=xxx \
#   ADMIN_PASSWORD=yyy \
#   ./scripts/smoke-admin.sh
#
# 任一情境失敗即停（set -e），全綠才會印出 ✅。

set -euo pipefail

# ---------- Pre-condition：檢查必要環境變數 ----------
BASE_URL="${BASE_URL:-http://localhost:3000}"

if [[ -z "${LICENSE_ADMIN_TOKEN:-}" ]]; then
  echo "❌ 缺少環境變數 LICENSE_ADMIN_TOKEN（既有 client API bearer 用）" >&2
  exit 1
fi

if [[ -z "${ADMIN_PASSWORD:-}" ]]; then
  echo "❌ 缺少環境變數 ADMIN_PASSWORD（admin login 用）" >&2
  exit 1
fi

echo "🔧 BASE_URL = ${BASE_URL}"
echo ""

# ---------- 共用工具 ----------
# 用單一檔案接 Set-Cookie header，避免污染 stdout
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

# ---------- Scenario 1：Client API Bearer 仍正常 ----------
echo "▶ [1/6] Client API Bearer：GET /api/license/list"
HTTP_CODE_1="$(curl -s -o "${TMP_DIR}/s1.body" -w "%{http_code}" \
  -H "Authorization: Bearer ${LICENSE_ADMIN_TOKEN}" \
  "${BASE_URL}/api/license/list?page=1&pageSize=20")"

if [[ "${HTTP_CODE_1}" != "200" ]]; then
  echo "❌ [1] 預期 200，實際 ${HTTP_CODE_1}" >&2
  cat "${TMP_DIR}/s1.body" >&2 || true
  exit 1
fi

# 驗證 body 含 items 與 total 兩個 key
if ! grep -q '"items"' "${TMP_DIR}/s1.body" || ! grep -q '"total"' "${TMP_DIR}/s1.body"; then
  echo "❌ [1] body 缺 items 或 total" >&2
  cat "${TMP_DIR}/s1.body" >&2 || true
  exit 1
fi
echo "  ✓ 200 + 含 items/total"

# ---------- Scenario 2：未登入訪問 /admin/licenses 導向 /admin/login ----------
echo "▶ [2/6] 未登入訪問 /admin/licenses 應 307 redirect"
HTTP_CODE_2="$(curl -s -o /dev/null -w "%{http_code}" \
  "${BASE_URL}/admin/licenses")"

# Next.js redirect 預設 307；middleware 也明寫 307。同時容許 308 以防 Next 升級行為變動。
if [[ "${HTTP_CODE_2}" != "307" && "${HTTP_CODE_2}" != "308" ]]; then
  echo "❌ [2] 預期 307/308，實際 ${HTTP_CODE_2}" >&2
  exit 1
fi
echo "  ✓ ${HTTP_CODE_2} redirect"

# ---------- Scenario 3：POST /api/admin/session 錯誤密碼 → 401 ----------
echo "▶ [3/6] POST /api/admin/session 錯誤密碼應 401"
HTTP_CODE_3="$(curl -s -o "${TMP_DIR}/s3.body" -w "%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"password":"wrong-password-for-smoke-test"}' \
  "${BASE_URL}/api/admin/session")"

if [[ "${HTTP_CODE_3}" != "401" ]]; then
  echo "❌ [3] 預期 401，實際 ${HTTP_CODE_3}" >&2
  cat "${TMP_DIR}/s3.body" >&2 || true
  exit 1
fi

if ! grep -q '"invalid_password"' "${TMP_DIR}/s3.body"; then
  echo "❌ [3] body 缺 invalid_password" >&2
  cat "${TMP_DIR}/s3.body" >&2 || true
  exit 1
fi
echo "  ✓ 401 + invalid_password"

# ---------- Scenario 4：POST /api/admin/session 正確密碼 → 200 + Set-Cookie ----------
echo "▶ [4/6] POST /api/admin/session 正確密碼應 200 + Set-Cookie"
HTTP_CODE_4="$(curl -s -o "${TMP_DIR}/s4.body" -D "${TMP_DIR}/s4.headers" -w "%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"${ADMIN_PASSWORD}\"}" \
  "${BASE_URL}/api/admin/session")"

if [[ "${HTTP_CODE_4}" != "200" ]]; then
  echo "❌ [4] 預期 200，實際 ${HTTP_CODE_4}" >&2
  cat "${TMP_DIR}/s4.body" >&2 || true
  exit 1
fi

# 抽出 Set-Cookie：grep 對大小寫不敏感（HTTP/2 header 可能是小寫）
SET_COOKIE_LINE="$(grep -i '^set-cookie:' "${TMP_DIR}/s4.headers" | head -n1 || true)"
if [[ -z "${SET_COOKIE_LINE}" ]]; then
  echo "❌ [4] 回應缺 Set-Cookie header" >&2
  cat "${TMP_DIR}/s4.headers" >&2
  exit 1
fi

# 驗證 cookie 名 + Max-Age=14400（4 小時）
if ! echo "${SET_COOKIE_LINE}" | grep -q 'admin_session='; then
  echo "❌ [4] Set-Cookie 缺 admin_session=" >&2
  echo "${SET_COOKIE_LINE}" >&2
  exit 1
fi
if ! echo "${SET_COOKIE_LINE}" | grep -q 'Max-Age=14400'; then
  echo "❌ [4] Set-Cookie 缺 Max-Age=14400" >&2
  echo "${SET_COOKIE_LINE}" >&2
  exit 1
fi

# 抽出 cookie 的 name=value 部分（去掉 "Set-Cookie: " 前綴和 ";" 後屬性）給後面用
SESSION_COOKIE="$(echo "${SET_COOKIE_LINE}" \
  | sed -E 's/^[Ss]et-[Cc]ookie:[[:space:]]*//' \
  | cut -d';' -f1 \
  | tr -d '\r\n')"

if [[ -z "${SESSION_COOKIE}" ]]; then
  echo "❌ [4] 無法抽出 SESSION_COOKIE" >&2
  exit 1
fi
echo "  ✓ 200 + admin_session= + Max-Age=14400"

# ---------- Scenario 5：帶 cookie 訪問 /admin/licenses → 200 ----------
echo "▶ [5/6] 帶 session cookie 訪問 /admin/licenses 應 200"
HTTP_CODE_5="$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Cookie: ${SESSION_COOKIE}" \
  "${BASE_URL}/admin/licenses")"

if [[ "${HTTP_CODE_5}" != "200" ]]; then
  echo "❌ [5] 預期 200，實際 ${HTTP_CODE_5}" >&2
  exit 1
fi
echo "  ✓ 200"

# ---------- Scenario 6：DELETE /api/admin/session → 200 + 清 cookie（Max-Age=0） ----------
echo "▶ [6/6] DELETE /api/admin/session 應 200 + Max-Age=0"
HTTP_CODE_6="$(curl -s -o "${TMP_DIR}/s6.body" -D "${TMP_DIR}/s6.headers" -w "%{http_code}" \
  -X DELETE \
  -H "Cookie: ${SESSION_COOKIE}" \
  "${BASE_URL}/api/admin/session")"

if [[ "${HTTP_CODE_6}" != "200" ]]; then
  echo "❌ [6] 預期 200，實際 ${HTTP_CODE_6}" >&2
  cat "${TMP_DIR}/s6.body" >&2 || true
  exit 1
fi

CLEAR_COOKIE_LINE="$(grep -i '^set-cookie:' "${TMP_DIR}/s6.headers" | head -n1 || true)"
if [[ -z "${CLEAR_COOKIE_LINE}" ]]; then
  echo "❌ [6] DELETE 回應缺 Set-Cookie header" >&2
  cat "${TMP_DIR}/s6.headers" >&2
  exit 1
fi
if ! echo "${CLEAR_COOKIE_LINE}" | grep -q 'admin_session='; then
  echo "❌ [6] clear cookie 缺 admin_session=" >&2
  echo "${CLEAR_COOKIE_LINE}" >&2
  exit 1
fi
if ! echo "${CLEAR_COOKIE_LINE}" | grep -q 'Max-Age=0'; then
  echo "❌ [6] clear cookie 缺 Max-Age=0" >&2
  echo "${CLEAR_COOKIE_LINE}" >&2
  exit 1
fi
echo "  ✓ 200 + Max-Age=0"

echo ""
echo "✅ All 6 smoke tests passed"
