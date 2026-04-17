@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ================================================
echo   建安 AI 首次安裝設定
echo   請確保網路連線正常
echo ================================================
echo.

:: 確認 Docker Desktop 是否執行中
echo [1/5] 確認 Docker Desktop 狀態...
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

:: 建立資料目錄
echo.
echo [2/5] 建立資料目錄...
set DATA_DIR=%USERPROFILE%\建安AI\data
if not exist "%DATA_DIR%" (
    mkdir "%DATA_DIR%"
    if errorlevel 1 (
        echo.
        echo [錯誤] 無法建立資料目錄：%DATA_DIR%
        echo 請確認您有足夠的磁碟空間與寫入權限。
        echo.
        pause
        exit /b 1
    )
    echo       已建立資料目錄：%DATA_DIR%
) else (
    echo       資料目錄已存在：%DATA_DIR%
)

:: 建立 SQLite 資料庫子目錄（避免首次啟動寫入失敗）
if not exist "%DATA_DIR%\db" (
    mkdir "%DATA_DIR%\db"
    echo       已建立資料庫目錄：%DATA_DIR%\db
)

:: 建立 Codex 憑證目錄
echo.
echo [3/5] 建立 Codex 憑證目錄...
set CODEX_DIR=%USERPROFILE%\建安AI\.codex
if not exist "%CODEX_DIR%" (
    mkdir "%CODEX_DIR%"
    if errorlevel 1 (
        echo.
        echo [錯誤] 無法建立憑證目錄：%CODEX_DIR%
        echo 請確認您有足夠的磁碟空間與寫入權限。
        echo.
        pause
        exit /b 1
    )
    echo       已建立憑證目錄：%CODEX_DIR%
) else (
    echo       憑證目錄已存在：%CODEX_DIR%
)

:: 拉取最新 image
echo.
echo [4/5] 下載最新版本映像檔（需要網路連線，請稍候）...
docker compose -f "%~dp0compose.yaml" pull
if errorlevel 1 (
    echo.
    echo [錯誤] 映像檔下載失敗！
    echo 請確認網路連線是否正常，以及 Docker Hub 是否可存取。
    echo.
    pause
    exit /b 1
)
echo       映像檔下載完成。

:: 執行 Codex 裝置代碼流登入
echo.
echo [5/5] 設定 Codex AI 登入授權（裝置代碼流）...
echo.
echo ------------------------------------------------
echo   系統將顯示一組驗證碼與網址。
echo   請：
echo     1. 在瀏覽器開啟顯示的網址
echo     2. 輸入驗證碼完成授權
echo     3. 使用 OpenAI 訂閱帳號登入
echo   （需要 ChatGPT Plus 或 OpenAI API 訂閱）
echo ------------------------------------------------
echo.

docker compose -f "%~dp0compose.yaml" run --rm -it app codex login --device-auth
if errorlevel 1 (
    echo.
    echo [錯誤] Codex 登入失敗！
    echo 請確認您的 OpenAI 帳號狀態，或稍後重新執行此腳本。
    echo.
    pause
    exit /b 1
)

echo.
echo ================================================
echo   首次安裝設定完成！
echo.
echo   登入憑證已儲存至：%CODEX_DIR%
echo   後續啟動不需重新登入。
echo.
echo   下次使用請直接執行 start.bat 啟動系統。
echo ================================================
echo.
pause
endlocal
