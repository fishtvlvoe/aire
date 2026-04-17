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
if not exist "%DATA_DIR%\db" mkdir "%DATA_DIR%\db"
echo       資料目錄：%DATA_DIR%

:: 建立三個 AI 後端憑證目錄
echo.
echo [3/5] 建立 AI 憑證目錄...
if not exist "%USERPROFILE%\.codex" mkdir "%USERPROFILE%\.codex"
if not exist "%USERPROFILE%\.gemini" mkdir "%USERPROFILE%\.gemini"
if not exist "%USERPROFILE%\.claude" mkdir "%USERPROFILE%\.claude"
echo       憑證目錄已就緒。

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

:: 選擇 AI 後端
echo.
echo [5/5] 選擇 AI 後端並完成登入授權...
echo.
echo   請選擇要使用的 AI 後端：
echo   [1] Gemini    （需要 Google 帳號，免費）
echo   [2] Codex     （需要 OpenAI 訂閱）
echo   [3] Claude    （需要 Anthropic 帳號）
echo   [4] 略過      （稍後再設定）
echo.
set /p CHOICE=請輸入選項 (1/2/3/4)：

if "%CHOICE%"=="1" goto LOGIN_GEMINI
if "%CHOICE%"=="2" goto LOGIN_CODEX
if "%CHOICE%"=="3" goto LOGIN_CLAUDE
if "%CHOICE%"=="4" goto SKIP_LOGIN
echo 無效選項，略過登入。
goto SKIP_LOGIN

:LOGIN_GEMINI
echo.
echo ------------------------------------------------
echo   Gemini 登入（Google 帳號）
echo   系統會顯示一組網址，請在瀏覽器中開啟並授權。
echo ------------------------------------------------
echo.
:: 更新 compose.yaml 使用 gemini 後端
powershell -Command "(Get-Content '%~dp0compose.yaml') -replace 'LLM_BACKEND=.*', 'LLM_BACKEND=gemini' | Set-Content '%~dp0compose.yaml'"
docker compose -f "%~dp0compose.yaml" run --rm app gemini auth login
goto LOGIN_DONE

:LOGIN_CODEX
echo.
echo ------------------------------------------------
echo   Codex 登入（OpenAI 帳號）
echo   系統會顯示一組驗證碼與網址，請在瀏覽器完成授權。
echo ------------------------------------------------
echo.
powershell -Command "(Get-Content '%~dp0compose.yaml') -replace 'LLM_BACKEND=.*', 'LLM_BACKEND=codex' | Set-Content '%~dp0compose.yaml'"
docker compose -f "%~dp0compose.yaml" run --rm -it app codex login --device-auth
goto LOGIN_DONE

:LOGIN_CLAUDE
echo.
echo ------------------------------------------------
echo   Claude Code 登入（Anthropic 帳號）
echo   系統會顯示一組網址，請在瀏覽器中開啟並授權。
echo ------------------------------------------------
echo.
powershell -Command "(Get-Content '%~dp0compose.yaml') -replace 'LLM_BACKEND=.*', 'LLM_BACKEND=claude-code' | Set-Content '%~dp0compose.yaml'"
docker compose -f "%~dp0compose.yaml" run --rm -it app claude login
goto LOGIN_DONE

:SKIP_LOGIN
echo.
echo [略過] 登入步驟已略過。
echo 請在安裝完成後手動執行對應的登入指令。
goto DONE

:LOGIN_DONE
if errorlevel 1 (
    echo.
    echo [警告] 登入流程未完成，請稍後重新執行此腳本完成登入。
    echo.
)

:DONE
echo.
echo ================================================
echo   首次安裝設定完成！
echo.
echo   後續啟動請執行 start.bat
echo   開啟瀏覽器後前往 http://localhost:3000
echo ================================================
echo.
pause
endlocal
