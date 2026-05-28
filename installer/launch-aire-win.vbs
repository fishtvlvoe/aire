' launch-aire-win.vbs — AIRE Windows 無 terminal 啟動器
'
' 功能：
'   1. 定位 bundled node.exe（相對於此 .vbs 所在目錄）
'   2. 以 WScript.Shell.Run 呼叫，SW_HIDE = 0（不顯示 terminal 視窗）
'   3. 設定工作目錄為安裝根目錄
'
' 設計說明：
'   - 不使用 .cmd 捷徑，因為 .cmd 會短暫閃出黑色 terminal 視窗
'   - VBScript CreateObject("WScript.Shell").Run 可完全隱藏控制台
'   - launch-aire.mjs 本身負責 port 探測、health polling 及開瀏覽器
'     詳見 scripts/launch-aire.mjs
'
' ⚠️ 未在 Windows 真機驗證 — 待 Windows 環境/CI 驗收

Option Explicit

Dim oShell, oFso
Dim sInstDir, sNodeExe, sLauncherMjs
Dim sCmd, nResult

Set oShell = CreateObject("WScript.Shell")
Set oFso   = CreateObject("Scripting.FileSystemObject")

' 取得此 .vbs 所在目錄（= 安裝根目錄）
sInstDir = oFso.GetParentFolderName(WScript.ScriptFullName)

' bundled node.exe 路徑
sNodeExe = oFso.BuildPath(sInstDir, "node-runtime\node.exe")

' launcher 腳本路徑
sLauncherMjs = oFso.BuildPath(sInstDir, "scripts\launch-aire.mjs")

' 驗證 node.exe 存在
If Not oFso.FileExists(sNodeExe) Then
  MsgBox "找不到 Node.js runtime：" & vbCrLf & sNodeExe & vbCrLf & vbCrLf & _
         "請重新安裝 AIRE。", vbCritical, "AIRE 啟動失敗"
  WScript.Quit 1
End If

' 驗證 launcher 存在
If Not oFso.FileExists(sLauncherMjs) Then
  MsgBox "找不到 launcher：" & vbCrLf & sLauncherMjs & vbCrLf & vbCrLf & _
         "請重新安裝 AIRE。", vbCritical, "AIRE 啟動失敗"
  WScript.Quit 1
End If

' 組合執行指令
' 用 "..." 包裝路徑，處理含空格的使用者名稱
sCmd = """" & sNodeExe & """ """ & sLauncherMjs & """"

' SW_HIDE = 0 — 不顯示任何視窗（含 terminal）
' bWaitOnReturn = False — 不等待，VBS 立即結束
nResult = oShell.Run(sCmd, 0, False)

' 清理
Set oFso   = Nothing
Set oShell = Nothing

WScript.Quit 0
