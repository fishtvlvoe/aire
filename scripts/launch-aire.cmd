@echo off
:: launch-aire.cmd — Windows launcher 包裝腳本
:: 供 NSIS installer 建桌面捷徑指向此 .cmd，
:: 由此呼叫 Node.js 執行 launch-aire.mjs。
::
:: 使用方式：雙擊此檔案，或由安裝程式建立捷徑。
:: 需求：Node.js 18+ 已安裝於系統 PATH。

:: 切換到此腳本所在的 scripts/ 目錄
cd /d "%~dp0"

:: 呼叫 launch-aire.mjs（路徑相對於 scripts/）
node "launch-aire.mjs"
