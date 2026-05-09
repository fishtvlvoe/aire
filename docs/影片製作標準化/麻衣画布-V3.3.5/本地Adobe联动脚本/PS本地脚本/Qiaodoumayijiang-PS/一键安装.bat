@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ===============================================
echo   Qiaodoumayijiang PS 扩展 - 一键安装脚本
echo ===============================================
echo.

:: 设置路径
set "EXTENSION_NAME=com.qiaodoumayijiang.ps.panel"
set "CEP_FOLDER=%APPDATA%\Adobe\CEP\extensions"
set "TARGET_FOLDER=%CEP_FOLDER%\%EXTENSION_NAME%"
set "SOURCE_FOLDER=%~dp0"

:: 1. 开启调试模式（修改注册表）
echo [1/4] 启用 CEP 调试模式...
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.9" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.10" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
echo      已启用 CEP 调试模式

:: 2. 创建扩展目录
echo.
echo [2/4] 创建扩展目录...
if not exist "%CEP_FOLDER%" (
    mkdir "%CEP_FOLDER%"
    echo      已创建 CEP 扩展目录
)

:: 3. 复制扩展文件
echo.
echo [3/4] 复制扩展文件...
if exist "%TARGET_FOLDER%" (
    echo      正在删除旧版本...
    rd /s /q "%TARGET_FOLDER%"
)

:: 使用 robocopy 复制文件
robocopy "%SOURCE_FOLDER%" "%TARGET_FOLDER%" /E /XF "一键安装.bat" "安装说明.txt" >nul 2>&1

echo      已复制扩展到: %TARGET_FOLDER%

:: 4. 创建素材目录
echo.
echo [4/4] 创建素材目录...
set "ASSETS_FOLDER=%USERPROFILE%\Qiaodoumayijiang"
if not exist "%ASSETS_FOLDER%" (
    mkdir "%ASSETS_FOLDER%"
    mkdir "%ASSETS_FOLDER%\images"
    echo      已创建素材目录: %ASSETS_FOLDER%
) else (
    echo      素材目录已存在: %ASSETS_FOLDER%
)

:: 完成
echo.
echo ===============================================
echo   安装完成！
echo ===============================================
echo.
echo   使用方法:
echo   1. 重启 Adobe Photoshop
echo   2. 在菜单栏选择: 窗口 ^> 扩展 ^> Qiaodoumayijiang
echo   3. 将图片放入 %ASSETS_FOLDER%\images 目录
echo   4. 面板会自动显示图片，点击或双击导入到 PS
echo.
echo   素材目录: %ASSETS_FOLDER%
echo.
pause
