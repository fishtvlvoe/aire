#!/bin/bash
set -e

echo "================================================"
echo "  建安 AI 系統啟動中"
echo "================================================"
echo

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 確認 Docker 是否執行中
echo "[1/3] 確認 Docker 狀態..."
if ! docker info >/dev/null 2>&1; then
    echo
    echo "[錯誤] Docker 尚未啟動！"
    echo "請先開啟 Docker Desktop，等待狀態列顯示 'Engine running' 後再執行此腳本。"
    echo
    exit 1
fi
echo "      Docker 運行正常。"

# 啟動容器
echo
echo "[2/3] 啟動建安 AI 服務..."
docker compose -f "$SCRIPT_DIR/compose.yaml" up -d
echo "      服務已啟動，等待系統就緒..."

# 健康檢查輪詢（最多 60 秒）
echo
echo "[3/3] 等待系統健康檢查..."
ATTEMPT=0
MAX_ATTEMPTS=30

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "      系統已就緒！（第 $ATTEMPT 次檢查通過）"
        break
    fi
    printf "."
    sleep 2
done

if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
    echo
    echo "[警告] 系統啟動超時（超過 60 秒）。"
    echo "請執行 docker compose logs 查看詳細記錄。"
    exit 1
fi

echo
echo "================================================"
echo "  建安 AI 系統已成功啟動！"
echo "  正在開啟瀏覽器..."
echo "================================================"
echo

open http://localhost:3000

echo "瀏覽器已開啟，如未自動開啟請手動前往："
echo "  http://localhost:3000"
echo
