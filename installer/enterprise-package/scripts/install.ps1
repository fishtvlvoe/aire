# install.ps1
# AIRE 企業內部分發包 — 安裝腳本
# 用法：
#   .\install.ps1               # 互動模式
#   .\install.ps1 -Silent       # 靜默模式（適合 GPO 軟體部署）

param(
    [switch]$Silent = $false,
    [string]$InstallerPath = ""
)

# 自動偵測 installer
if (-not $InstallerPath) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $packageDir = Split-Path -Parent $scriptDir
    $installers = Get-ChildItem -Path $packageDir -Filter "AIRE-*-Setup.exe" | Sort-Object Name -Descending
    if ($installers.Count -eq 0) {
        Write-Error "找不到 AIRE installer。請確認 AIRE-<version>-Setup.exe 在 $packageDir 目錄下。"
        exit 1
    }
    $InstallerPath = $installers[0].FullName
}

if (-not (Test-Path $InstallerPath)) {
    Write-Error "Installer 不存在：$InstallerPath"
    exit 1
}

Write-Host ""
Write-Host "AIRE 企業內部分發包 — 安裝" -ForegroundColor Cyan
Write-Host "Installer：$(Split-Path -Leaf $InstallerPath)" -ForegroundColor Cyan
Write-Host ""

if (-not $Silent) {
    Write-Host "提醒：請確認信任鏈已部署（install-trust.ps1 已執行）。" -ForegroundColor Yellow
    $confirm = Read-Host "繼續安裝？(Y/N)"
    if ($confirm -ne "Y" -and $confirm -ne "y") {
        Write-Host "已取消安裝。" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "正在執行安裝..."
if ($Silent) {
    $proc = Start-Process -FilePath $InstallerPath -ArgumentList "/S" -Wait -PassThru
} else {
    $proc = Start-Process -FilePath $InstallerPath -Wait -PassThru
}

if ($proc.ExitCode -eq 0) {
    Write-Host "✓ AIRE 安裝成功。" -ForegroundColor Green
} else {
    Write-Error "安裝失敗，exit code：$($proc.ExitCode)"
    exit $proc.ExitCode
}
