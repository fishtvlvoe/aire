#!/usr/bin/env bash
# 打包 Windows installer
# 核心邏輯：先用 rsync -rL 把 pnpm symlink 全部解析成實體檔案，
# NSIS 再打包純檔案目錄，避免 Windows 裝完後 symlink 斷鏈。

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FLAT_DIR="$(mktemp -d /tmp/aire-pkg-XXXXXX)"

echo "▶ 解析 symlink → $FLAT_DIR"

# dist-local-runtime：-rL 遞迴展開所有 symlink 成實體檔案
# 排除 .next/node_modules（symlink 指向 workspace pnpm store，體積巨大）
# runtime 只依賴 top-level node_modules/
rsync -rL \
  --ignore-errors \
  --exclude='.git' \
  --exclude='*.map' \
  --exclude='.next/node_modules' \
  "$REPO_ROOT/dist-local-runtime/" \
  "$FLAT_DIR/dist-local-runtime/" || true

# installer、scripts：直接複製（已是實體檔案）
rsync -r "$REPO_ROOT/installer/" "$FLAT_DIR/installer/"
rsync -r "$REPO_ROOT/scripts/"   "$FLAT_DIR/scripts/"

echo "▶ pnpm hoist（shamefully-hoist 頂層，修 @swc/helpers 等隱性依賴）"
node "$(dirname "$0")/hoist-pnpm.mjs" "$FLAT_DIR/dist-local-runtime/node_modules"

mkdir -p "$FLAT_DIR/out"

echo "▶ makensis"
makensis \
  "-DPROJECT_ROOT=$FLAT_DIR" \
  "$REPO_ROOT/installer/aire-installer.nsi" \
  2>&1

mkdir -p "$REPO_ROOT/out"
cp "$FLAT_DIR/out/AIRE-"*"-Setup.exe" "$REPO_ROOT/out/"

echo "▶ 清理暫存"
rm -rf "$FLAT_DIR"

EXE=$(ls "$REPO_ROOT/out/AIRE-"*"-Setup.exe" | tail -1)
shasum -a 256 "$EXE"
echo "✓ 完成：$EXE"
