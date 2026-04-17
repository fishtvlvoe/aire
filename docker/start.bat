@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ================================================
echo   建安 AI 系統啟動中
echo ================================================
echo.

:: 確認 Docker Desktop 是否執行中
echo [1/3] 確認 Docker Desktop 狀態...
docker info >nul 2>&1
if errorlevel 1 (
    echo.
    echo [錯誤] Docker Desktop 尚未啟動！
    echo 請先開啟 Docker Desktop，等待齒輪圖示停止轉動後再執行此腳本。
    echo.
    pause
    exit /b 1
)
echo       Docker Desktop 運行正常。

:: 啟動容器
echo.
echo [2/3] 啟動建安 AI 服務...
docker compose up -d
if errorlevel 1 (
    echo.
    echo [錯誤] 容器啟動失敗，請確認 docker-compose.yml 設定是否正確。
    echo.
    pause
    exit /b 1
)
echo       服務已啟動，等待系統就緒...

:: 健康檢查輪詢（最多 60 秒，每 2 秒一次）
echo.
echo [3/3] 等待系統健康檢查...
set /a ATTEMPT=0
set /a MAX_ATTEMPTS=30

:HEALTH_CHECK
set /a ATTEMPT+=1
curl -s -o nul -w "%%{http_code}" http://localhost:3000/api/health 2>nul | findstr /x "200" >nul
if not errorlevel 1 (
    echo       系統已就緒！（第 !ATTEMPT! 次檢查通過）
    goto LAUNCH_BROWSER
)

if !ATTEMPT! geq %MAX_ATTEMPTS% (
    echo.
    echo [警告] 系統啟動超時（超過 60 秒）。
    echo 服務可能需要更多時間，或發生錯誤。
    echo 請執行 "docker compose logs" 查看詳細記錄。
    echo.
    pause
    exit /b 1
)

:: 顯示等待進度
set /p "=." <nul
timeout /t 2 /nobreak >nul
goto HEALTH_CHECK

:LAUNCH_BROWSER
echo.
echo ================================================
echo   建安 AI 系統已成功啟動！
echo   正在開啟瀏覽器...
echo ================================================
echo.
start http://localhost:3000

echo 瀏覽器已開啟，如未自動開啟請手動前往：
echo   http://localhost:3000
echo.
pause
endlocal
