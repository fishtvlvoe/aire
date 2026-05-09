@echo off
chcp 65001 >nul
title Qiaodoumayijiang CEP 扩展安装程序

echo ==========================================
echo   Qiaodoumayijiang CEP 扩展 - 一键安装
echo ==========================================
echo.

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] 需要管理员权限，正在请求...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo [1/4] 开启 CEP 调试模式...
reg add "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKCU\Software\Adobe\CSXS.10" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKCU\Software\Adobe\CSXS.9" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
echo     √ 完成

echo.
echo [2/4] 创建扩展目录...
set "EXT_DIR=%APPDATA%\Adobe\CEP\extensions\com.qiaodoumayijiang.panel"
if not exist "%APPDATA%\Adobe\CEP\extensions" mkdir "%APPDATA%\Adobe\CEP\extensions"
if exist "%EXT_DIR%" (
    echo     发现旧版本，正在删除...
    rmdir /s /q "%EXT_DIR%"
)
mkdir "%EXT_DIR%"
echo     √ 完成

echo.
echo [3/4] 复制扩展文件...
set "SRC_DIR=%~dp0"
xcopy "%SRC_DIR%CSXS" "%EXT_DIR%\CSXS\" /E /I /Y >nul
xcopy "%SRC_DIR%css" "%EXT_DIR%\css\" /E /I /Y >nul
xcopy "%SRC_DIR%js" "%EXT_DIR%\js\" /E /I /Y >nul
copy "%SRC_DIR%index.html" "%EXT_DIR%\" /Y >nul
copy "%SRC_DIR%.debug" "%EXT_DIR%\" /Y >nul
echo     √ 完成

echo.
echo [4/4] 创建素材目录...
set "ASSETS_DIR=%USERPROFILE%\Qiaodoumayijiang"
if not exist "%ASSETS_DIR%" mkdir "%ASSETS_DIR%"
if not exist "%ASSETS_DIR%\images" mkdir "%ASSETS_DIR%\images"
if not exist "%ASSETS_DIR%\videos" mkdir "%ASSETS_DIR%\videos"
if not exist "%ASSETS_DIR%\audio" mkdir "%ASSETS_DIR%\audio"
echo     √ 完成

echo.
echo ==========================================
echo   安装完成！
echo ==========================================
echo.
echo   扩展位置: %EXT_DIR%
echo   素材目录: %ASSETS_DIR%
echo.
echo   请重启 After Effects，然后在菜单中打开:
echo   窗口 -^> 扩展 -^> Qiaodoumayijiang
echo.
echo ==========================================
echo.
pause
