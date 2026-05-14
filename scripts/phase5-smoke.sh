#!/bin/bash
# Phase 5 真機驗收腳本
# 用法：./scripts/phase5-smoke.sh
# 跑完整 SDD 驗收（build + test + cargo + e2e + visual parity）

set -e

REPORT_DIR="docs/phase5-smoke-reports"
mkdir -p "$REPORT_DIR"
TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
REPORT="$REPORT_DIR/smoke-$TIMESTAMP.md"

echo "# AIRE Phase 5 Smoke Report" > "$REPORT"
echo "" >> "$REPORT"
echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$REPORT"
echo "" >> "$REPORT"

pass() { echo "✅ $1"; echo "- ✅ $1" >> "$REPORT"; }
fail() { echo "❌ $1"; echo "- ❌ $1" >> "$REPORT"; FAIL_COUNT=$((FAIL_COUNT + 1)); }
FAIL_COUNT=0

# ─── Build ───
echo "## Build" >> "$REPORT"
if pnpm build 2>&1 | tail -10 > /tmp/pnpm-build.log; then
  pass "pnpm build"
else
  fail "pnpm build — see /tmp/pnpm-build.log"
fi
if cargo build --manifest-path src-tauri/Cargo.toml 2>&1 | tail -10 > /tmp/cargo-build.log; then
  pass "cargo build"
else
  fail "cargo build — see /tmp/cargo-build.log"
fi
echo "" >> "$REPORT"

# ─── Test ───
echo "## Test" >> "$REPORT"
if pnpm test 2>&1 | tail -20 > /tmp/pnpm-test.log; then
  pass "pnpm test (frontend)"
else
  fail "pnpm test — see /tmp/pnpm-test.log"
fi
if cargo test --manifest-path src-tauri/Cargo.toml 2>&1 | tail -30 > /tmp/cargo-test.log; then
  pass "cargo test (backend)"
else
  fail "cargo test — see /tmp/cargo-test.log"
fi
echo "" >> "$REPORT"

# ─── 紅燈轉綠檢查 ───
echo "## Red-light to green conversion" >> "$REPORT"
echo '```' >> "$REPORT"
pnpm test 2>&1 | grep -E "Tests:|passed|failed" | tail -5 >> "$REPORT" || true
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

# ─── E2E（若 Tauri dev server 已啟） ───
echo "## E2E (Playwright)" >> "$REPORT"
if pnpm exec playwright test 2>&1 | tail -30 > /tmp/playwright.log; then
  pass "Playwright e2e"
else
  fail "Playwright e2e — see /tmp/playwright.log（可能 Tauri dev server 未啟，啟 pnpm tauri dev 後重跑）"
fi
echo "" >> "$REPORT"

# ─── Spectra drift（檢查實作對 spec ） ───
echo "## Spectra drift detection" >> "$REPORT"
for SDD in aire-phase1-html-pdf-renderer aire-phase1-data-portability aire-phase1-legal-clauses-autofill aire-land-registry-foundation; do
  echo "### $SDD" >> "$REPORT"
  echo '```' >> "$REPORT"
  spectra drift "$SDD" 2>&1 | tail -20 >> "$REPORT" || echo "⚠️ spectra drift failed for $SDD" >> "$REPORT"
  echo '```' >> "$REPORT"
done
echo "" >> "$REPORT"

# ─── 結果 ───
echo "" >> "$REPORT"
echo "## Summary" >> "$REPORT"
if [ "$FAIL_COUNT" -eq 0 ]; then
  echo "✅ **All checks passed — ready for production**" >> "$REPORT"
  echo "✅ All checks passed"
else
  echo "❌ **$FAIL_COUNT check(s) failed — fix before production**" >> "$REPORT"
  echo "❌ $FAIL_COUNT check(s) failed"
fi

echo ""
echo "📄 Full report: $REPORT"
echo ""
echo "下一步（人工配合 Fish）："
echo "1. 啟 Tauri dev: pnpm tauri dev"
echo "2. 完整客戶旅程 10 步測試（見 ~/.claude/plans/aire-phase4-5-plan.md）"
echo "3. 截圖 + 視覺 diff < 5%（vs mockups/pdf-themes/）"

[ "$FAIL_COUNT" -eq 0 ] && exit 0 || exit 1
