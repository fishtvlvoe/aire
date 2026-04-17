#!/bin/bash
set -e

echo "================================================"
echo "  建安 AI 首次安裝設定"
echo "  請確保網路連線正常"
echo "================================================"
echo

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 確認 Docker 是否執行中
echo "[1/5] 確認 Docker 狀態..."
if ! docker info >/dev/null 2>&1; then
    echo
    echo "[錯誤] Docker 尚未啟動！"
    echo "請先開啟 Docker Desktop，等待狀態列顯示 'Engine running' 後再執行此腳本。"
    echo
    exit 1
fi
echo "      Docker 運行正常。"

# 建立資料目錄
echo
echo "[2/5] 建立資料目錄..."
mkdir -p "$HOME/建安AI/data/db"
echo "      資料目錄：$HOME/建安AI/data"

# 建立三個 AI 後端憑證目錄
echo
echo "[3/5] 建立 AI 憑證目錄..."
mkdir -p "$HOME/.codex" "$HOME/.gemini" "$HOME/.claude"
echo "      憑證目錄已就緒。"

# 拉取最新 image
echo
echo "[4/5] 下載最新版本映像檔（需要網路連線，請稍候）..."
docker compose -f "$SCRIPT_DIR/compose.yaml" pull
echo "      映像檔下載完成。"

# 選擇 AI 後端
echo
echo "[5/5] 選擇 AI 後端並完成登入授權..."
echo
echo "  請選擇要使用的 AI 後端："
echo "  [1] Gemini    （需要 Google 帳號，免費）"
echo "  [2] Codex     （需要 OpenAI 訂閱）"
echo "  [3] Claude    （需要 Anthropic 帳號）"
echo "  [4] 略過      （稍後再設定）"
echo
read -rp "請輸入選項 (1/2/3/4)：" CHOICE

update_backend() {
    sed -i.bak "s/LLM_BACKEND=.*/LLM_BACKEND=$1/" "$SCRIPT_DIR/compose.yaml"
    rm -f "$SCRIPT_DIR/compose.yaml.bak"
}

case "$CHOICE" in
1)
    echo
    echo "------------------------------------------------"
    echo "  Gemini 登入（Google 帳號）"
    echo "  系統會顯示一組網址，請在瀏覽器中開啟並授權。"
    echo "------------------------------------------------"
    echo
    update_backend "gemini"
    docker compose -f "$SCRIPT_DIR/compose.yaml" run --rm app gemini auth login
    ;;
2)
    echo
    echo "------------------------------------------------"
    echo "  Codex 登入（OpenAI 帳號）"
    echo "  系統會顯示一組驗證碼與網址，請在瀏覽器完成授權。"
    echo "------------------------------------------------"
    echo
    update_backend "codex"
    docker compose -f "$SCRIPT_DIR/compose.yaml" run --rm -it app codex login --device-auth
    ;;
3)
    echo
    echo "------------------------------------------------"
    echo "  Claude Code 登入（Anthropic 帳號）"
    echo "  系統會顯示一組網址，請在瀏覽器中開啟並授權。"
    echo "------------------------------------------------"
    echo
    update_backend "claude-code"
    docker compose -f "$SCRIPT_DIR/compose.yaml" run --rm -it app claude login
    ;;
4)
    echo
    echo "[略過] 登入步驟已略過。"
    echo "請在安裝完成後手動執行對應的登入指令。"
    ;;
*)
    echo "無效選項，略過登入。"
    ;;
esac

echo
echo "================================================"
echo "  首次安裝設定完成！"
echo
echo "  後續啟動請執行：bash start.sh"
echo "  開啟瀏覽器後前往 http://localhost:3000"
echo "================================================"
echo
