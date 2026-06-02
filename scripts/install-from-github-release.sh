#!/usr/bin/env bash
set -euo pipefail

REPO="fishtvlvoe/aire"
API_URL="https://api.github.com/repos/${REPO}/releases/latest"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "✗ 這支安裝腳本只支援 macOS"
  exit 1
fi

ARCH="$(uname -m)"
if [[ "$ARCH" == "arm64" ]]; then
  DMG_PATTERN='aire-.*-arm64\.dmg$'
else
  DMG_PATTERN='aire-.*-x64\.dmg$'
fi

echo "▶ 讀取最新 release：${API_URL}"
RELEASE_JSON="$(curl -fsSL -H 'Accept: application/vnd.github+json' -H 'X-GitHub-Api-Version: 2022-11-28' "$API_URL")"

DMG_URL="$(printf '%s' "$RELEASE_JSON" | python3 -c 'import json,re,sys
release=json.load(sys.stdin)
pat=re.compile(sys.argv[1])
for a in release.get("assets",[]):
    n=a.get("name","")
    if pat.search(n):
        print(a.get("browser_download_url",""))
        raise SystemExit(0)
raise SystemExit(1)
' "$DMG_PATTERN")" || {
  echo "✗ 找不到符合架構的 dmg 檔"
  exit 1
}

TAG_NAME="$(printf '%s' "$RELEASE_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tag_name","unknown"))')"
DMG_PATH="/tmp/aire-${TAG_NAME}-${ARCH}.dmg"
MOUNT_POINT="/tmp/aire-install-${TAG_NAME}-${ARCH}"

echo "▶ 下載 dmg：${DMG_URL}"
curl -fL "$DMG_URL" -o "$DMG_PATH"

mkdir -p "$MOUNT_POINT"
echo "▶ 掛載 dmg"
hdiutil attach "$DMG_PATH" -nobrowse -mountpoint "$MOUNT_POINT" >/dev/null

cleanup() {
  hdiutil detach "$MOUNT_POINT" -quiet >/dev/null 2>&1 || true
}
trap cleanup EXIT

APP_PATH="$(find "$MOUNT_POINT" -maxdepth 2 -name '*.app' | head -n 1)"
if [[ -z "$APP_PATH" ]]; then
  echo "✗ 找不到 AIRE .app"
  exit 1
fi

echo "▶ 安裝到 /Applications"
cp -R "$APP_PATH" /Applications/

INSTALLED_APP="/Applications/$(basename "$APP_PATH")"
echo "▶ 啟動 ${INSTALLED_APP}"
open "$INSTALLED_APP"

echo "✓ 安裝完成（tag: ${TAG_NAME}）"
