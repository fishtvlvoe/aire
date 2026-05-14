#!/bin/bash
# Phase 4 Layer 1 — Kimi CR 自動化腳本
# 用法：./scripts/phase4-kimi-cr.sh <sdd-name>
# 例：./scripts/phase4-kimi-cr.sh aire-phase1-data-portability

set -e

SDD_NAME="${1:?Usage: $0 <sdd-name>}"
OUTPUT_DIR="docs/phase4-cr-reports"
mkdir -p "$OUTPUT_DIR"

# SDD 對應的程式碼路徑
declare -A SDD_PATHS=(
  ["aire-phase1-html-pdf-renderer"]="src/lib/pdf-engine src/lib/pdf-themes src/lib/pdf-blocks src/components/LogoUploader.tsx src/components/ThemeSelector.tsx src/components/PdfPreviewer.tsx src-tauri/src/branding"
  ["aire-phase1-data-portability"]="src-tauri/src/data_portability src-tauri/src/crypto src/components/RecoveryCodeModal.tsx src/components/MasterPasswordPrompt.tsx src/components/ImportConflictDialog.tsx"
  ["aire-phase1-legal-clauses-autofill"]="src-tauri/src/legal_clauses src-tauri/src/realtor_license src/lib/pdf-blocks/legal-notice.tsx src/components/RealtorLicenseField.tsx"
  ["aire-land-registry-foundation"]="src-tauri/src/land_registry src-tauri/src/encryption.rs"
)

PATHS="${SDD_PATHS[$SDD_NAME]}"
if [ -z "$PATHS" ]; then
  echo "❌ Unknown SDD: $SDD_NAME"
  echo "Available: ${!SDD_PATHS[@]}"
  exit 1
fi

REPORT="$OUTPUT_DIR/${SDD_NAME}-kimi-cr.md"
echo "# Phase 4 Kimi CR Report — $SDD_NAME" > "$REPORT"
echo "" >> "$REPORT"
echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$REPORT"
echo "Paths reviewed: $PATHS" >> "$REPORT"
echo "" >> "$REPORT"

# Kimi 三 lens 並行（correctness / security / performance）
for LENS in correctness security performance; do
  echo "🔍 Running Kimi CR with lens: $LENS"
  echo "## $LENS lens" >> "$REPORT"
  echo '```' >> "$REPORT"

  case "$LENS" in
    correctness)
      PROMPT="對 $SDD_NAME 的 $PATHS 程式碼做 correctness 審查。只看：
1. 邏輯錯誤 / 邊界條件 / 型別誤用
2. unwrap/panic 在 production code
3. Result/Option 處理是否完整
4. lifetime / borrow checker 邊界
5. async/await 死鎖、未 await 的 Future
回報 Critical / Warning / Suggestion 分類，每條附：檔案:行號 + 具體問題 + 建議修法。"
      ;;
    security)
      PROMPT="對 $SDD_NAME 的 $PATHS 程式碼做 security 審查。只看：
1. OWASP top 10 (injection / XSS / auth / crypto)
2. timing attack / nonce reuse / 弱亂數
3. memory zeroize / dangling sensitive data
4. PII leak (log / panic / Display impl)
5. SQL injection / TOCTOU / SSRF
回報 Critical / Warning / Suggestion 分類，每條附：檔案:行號 + CVE 類別 + 攻擊向量 + 修法。"
      ;;
    performance)
      PROMPT="對 $SDD_NAME 的 $PATHS 程式碼做 performance 審查。只看：
1. N+1 query / 迴圈 IO
2. 不必要的 clone / allocation
3. 缺 cache / 同操作重複
4. 同步阻塞 async runtime
5. 記憶體 leak / unbounded growth
回報 Critical / Warning / Suggestion 分類，每條附：檔案:行號 + 量級估算 + 修法。"
      ;;
  esac

  kimi -p --print -w . -p "$PROMPT" 2>&1 >> "$REPORT" || echo "⚠️ Kimi failed for $LENS" >> "$REPORT"
  echo '```' >> "$REPORT"
  echo "" >> "$REPORT"
done

# spectra audit 補充
echo "## spectra audit" >> "$REPORT"
echo '```' >> "$REPORT"
spectra audit "$SDD_NAME" >> "$REPORT" 2>&1 || echo "⚠️ spectra audit failed" >> "$REPORT"
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

# spectra drift 補充
echo "## spectra drift" >> "$REPORT"
echo '```' >> "$REPORT"
spectra drift "$SDD_NAME" >> "$REPORT" 2>&1 || echo "⚠️ spectra drift failed" >> "$REPORT"
echo '```' >> "$REPORT"

echo "✅ Phase 4 CR complete: $REPORT"
