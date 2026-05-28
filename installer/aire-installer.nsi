; ============================================================================
; aire-installer.nsi — AIRE Windows 安裝程式 (NSIS 獨立腳本)
;
; 設計依據：
;   openspec/changes/browser-local-runtime-mvp/design.md Decision 8
;   installMode: currentUser（對齊 src-tauri/tauri.conf.json nsis 設定）
;
; 打包內容：
;   1. dist-local-runtime/     — Next.js standalone server + native bindings
;   2. installer/node-runtime/ — bundled Node.js Windows binary (node.exe)
;   3. scripts/launch-aire.mjs — 跨平台 launcher 核心
;   4. installer/launch-aire-win.vbs — 無 terminal 視窗啟動器
;
; 安裝目標：$LOCALAPPDATA\Programs\AIRE\
;   理由：currentUser installMode 不需要管理員權限，符合 MVP 單機部署定位；
;   $LOCALAPPDATA\Programs\ 是 Windows 推薦的 per-user app 安裝位置。
;
; ⚠️ 未在 Windows 真機驗證 — 待 Windows 環境/CI 驗收
;    驗收清單詳見 installer/README.md
; ============================================================================

; ── 基本設定 ──────────────────────────────────────────────────────────────────
!define PRODUCT_NAME    "AIRE"
!define PRODUCT_VERSION "0.1.3"
!define PRODUCT_PUBLISHER "核流有限公司"
!define PRODUCT_URL     "https://aire.opcos.me"

; 安裝目標（currentUser，不需要管理員）
!define INSTALL_DIR     "$LOCALAPPDATA\Programs\AIRE"

; 資料目錄（案件資料/DB/credential — uninstall 不刪除）
!define DATA_DIR        "$LOCALAPPDATA\AIRE"

; Registry key（用於 uninstaller 及 Programs & Features）
!define REG_UNINSTALL   "Software\Microsoft\Windows\CurrentVersion\Uninstall\AIRE"

; ── NSIS 設定 ────────────────────────────────────────────────────────────────
Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "..\out\AIRE-${PRODUCT_VERSION}-Setup.exe"
Unicode true

; per-user 安裝，不需要 UAC elevation
RequestExecutionLevel user
InstallDir "${INSTALL_DIR}"

; 壓縮設定（LZMA 最高壓縮，對 node_modules 有效）
SetCompressor /SOLID lzma
SetCompressorDictSize 32

; 現代 UI
!include "MUI2.nsh"
!include "LogicLib.nsh"

; ── MUI 設定 ──────────────────────────────────────────────────────────────────
!define MUI_ABORTWARNING
!define MUI_ICON "..\public\favicon.ico"
!define MUI_UNICON "..\public\favicon.ico"

; 安裝頁面
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; 解安裝頁面
!insertmacro MUI_UNPAGE_WELCOME
; 自訂確認頁面（詢問是否同時清除資料目錄）
!insertmacro MUI_UNPAGE_CUSTOM un.ConfirmDataPage un.ConfirmDataLeave
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "TradChinese"
!insertmacro MUI_LANGUAGE "English"

; ── 版本資訊（顯示在安裝檔屬性中） ────────────────────────────────────────────
VIProductVersion "${PRODUCT_VERSION}.0"
VIAddVersionKey /LANG=0 "ProductName"      "${PRODUCT_NAME}"
VIAddVersionKey /LANG=0 "ProductVersion"   "${PRODUCT_VERSION}"
VIAddVersionKey /LANG=0 "CompanyName"      "${PRODUCT_PUBLISHER}"
VIAddVersionKey /LANG=0 "FileDescription"  "AIRE 不動產 AI 助理 安裝程式"
VIAddVersionKey /LANG=0 "FileVersion"      "${PRODUCT_VERSION}"
VIAddVersionKey /LANG=0 "LegalCopyright"   "Copyright 2025 ${PRODUCT_PUBLISHER}"

; ── Uninstall 資料清除選項（全域變數） ──────────────────────────────────────────
Var RemoveData

; ── 安裝 Section ──────────────────────────────────────────────────────────────
Section "主程式" SecMain
  SectionIn RO  ; 必選，不可取消勾選

  SetOutPath "$INSTDIR"

  ; ── 1. dist-local-runtime/ — Next.js standalone server ───────────────────
  SetOutPath "$INSTDIR\dist-local-runtime"
  File /r /x "*.map" "..\dist-local-runtime\*.*"

  ; ── 2. bundled Node.js runtime ────────────────────────────────────────────
  SetOutPath "$INSTDIR\node-runtime"
  File /r "installer\node-runtime\*.*"

  ; ── 3. launcher 腳本 ──────────────────────────────────────────────────────
  SetOutPath "$INSTDIR\scripts"
  File "..\scripts\launch-aire.mjs"

  ; ── 4. 無 terminal 視窗啟動器（VBScript wrapper） ─────────────────────────
  SetOutPath "$INSTDIR"
  File "launch-aire-win.vbs"

  ; ── 5. 寫入資料目錄（確保目錄存在，不強制清除既有資料） ──────────────────────
  CreateDirectory "${DATA_DIR}"

  ; ── 6. 建立桌面捷徑 ────────────────────────────────────────────────────────
  CreateShortcut "$DESKTOP\AIRE.lnk" \
    "$INSTDIR\launch-aire-win.vbs" \
    "" \
    "$INSTDIR\node-runtime\node.exe" \
    0 \
    SW_SHOWNORMAL \
    "" \
    "AIRE 不動產 AI 助理"

  ; ── 7. 建立開始功能表捷徑 ──────────────────────────────────────────────────
  CreateDirectory "$SMPROGRAMS\AIRE"
  CreateShortcut "$SMPROGRAMS\AIRE\AIRE.lnk" \
    "$INSTDIR\launch-aire-win.vbs" \
    "" \
    "$INSTDIR\node-runtime\node.exe" \
    0 \
    SW_SHOWNORMAL \
    "" \
    "AIRE 不動產 AI 助理"
  CreateShortcut "$SMPROGRAMS\AIRE\解除安裝 AIRE.lnk" \
    "$INSTDIR\Uninstall.exe"

  ; ── 8. 寫入 Uninstaller ────────────────────────────────────────────────────
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ; ── 9. 寫入 Programs & Features（Add/Remove Programs） ─────────────────────
  WriteRegStr   HKCU "${REG_UNINSTALL}" "DisplayName"          "${PRODUCT_NAME}"
  WriteRegStr   HKCU "${REG_UNINSTALL}" "DisplayVersion"       "${PRODUCT_VERSION}"
  WriteRegStr   HKCU "${REG_UNINSTALL}" "Publisher"            "${PRODUCT_PUBLISHER}"
  WriteRegStr   HKCU "${REG_UNINSTALL}" "URLInfoAbout"         "${PRODUCT_URL}"
  WriteRegStr   HKCU "${REG_UNINSTALL}" "InstallLocation"      "$INSTDIR"
  WriteRegStr   HKCU "${REG_UNINSTALL}" "UninstallString"      "$INSTDIR\Uninstall.exe"
  WriteRegStr   HKCU "${REG_UNINSTALL}" "QuietUninstallString" '"$INSTDIR\Uninstall.exe" /S'
  WriteRegDWORD HKCU "${REG_UNINSTALL}" "NoModify"             1
  WriteRegDWORD HKCU "${REG_UNINSTALL}" "NoRepair"             1

SectionEnd

; ── 解安裝：自訂資料清除確認頁面 ─────────────────────────────────────────────
Function un.ConfirmDataPage
  ; 建立自訂頁面：詢問是否同時刪除客戶資料目錄
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  ${NSD_CreateLabel} 0 0 100% 40u "解除安裝將移除程式檔案。$\r$\n$\r$\n您的案件資料保存於：$\r$\n${DATA_DIR}"
  Pop $0

  ${NSD_CreateCheckbox} 0 50u 100% 12u "同時刪除所有案件資料（無法復原）"
  Pop $1
  ; 預設不勾選，保護客戶資料
  ${NSD_SetState} $1 ${BST_UNCHECKED}
  nsDialogs::SetUserData $1 ""

  nsDialogs::Show
FunctionEnd

Function un.ConfirmDataLeave
  ; 讀取勾選狀態，寫入全域變數 $RemoveData
  ${NSD_GetState} $1 $RemoveData
FunctionEnd

; ── 解安裝 Section ────────────────────────────────────────────────────────────
Section "Uninstall"

  ; ── 1. 移除桌面捷徑與開始功能表 ────────────────────────────────────────────
  Delete "$DESKTOP\AIRE.lnk"
  Delete "$SMPROGRAMS\AIRE\AIRE.lnk"
  Delete "$SMPROGRAMS\AIRE\解除安裝 AIRE.lnk"
  RMDir  "$SMPROGRAMS\AIRE"

  ; ── 2. 移除程式目錄（含 dist-local-runtime、node-runtime、scripts） ─────────
  RMDir /r "$INSTDIR\dist-local-runtime"
  RMDir /r "$INSTDIR\node-runtime"
  RMDir /r "$INSTDIR\scripts"
  Delete   "$INSTDIR\launch-aire-win.vbs"
  Delete   "$INSTDIR\Uninstall.exe"
  RMDir    "$INSTDIR"

  ; ── 3. 條件刪除資料目錄（只在使用者明確勾選時才刪） ──────────────────────────
  ${If} $RemoveData == ${BST_CHECKED}
    RMDir /r "${DATA_DIR}"
    DetailPrint "已刪除資料目錄：${DATA_DIR}"
  ${Else}
    DetailPrint "保留資料目錄：${DATA_DIR}"
  ${EndIf}

  ; ── 4. 清除 Registry ─────────────────────────────────────────────────────
  DeleteRegKey HKCU "${REG_UNINSTALL}"

SectionEnd
