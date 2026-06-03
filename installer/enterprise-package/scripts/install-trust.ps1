# install-trust.ps1
# AIRE 企業內部分發包 — 信任鏈匯入腳本
# 需要以 Administrator 身份執行
# 用法：.\install-trust.ps1

param(
    [string]$TrustDir = ""
)

# 確認以 Administrator 執行
$currentPrincipal = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "此腳本必須以 Administrator 身份執行。請右鍵「以系統管理員身份執行」。"
    exit 1
}

# 自動偵測 trust/ 目錄
if (-not $TrustDir) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $packageDir = Split-Path -Parent $scriptDir
    $TrustDir = Join-Path $packageDir "trust"
}

$rootCert = Join-Path $TrustDir "AIRE-RootCA.cer"
$publisherCert = Join-Path $TrustDir "AIRE-Publisher.cer"

Write-Host ""
Write-Host "AIRE 企業內部分發包 — 信任鏈匯入" -ForegroundColor Cyan
Write-Host ""

# 匯入 Root CA
if (-not (Test-Path $rootCert)) {
    Write-Error "找不到 root certificate：$rootCert"
    exit 1
}
Write-Host "匯入 Root CA → Trusted Root Certification Authorities..."
$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2 $rootCert
$store = New-Object System.Security.Cryptography.X509Certificates.X509Store "Root", "LocalMachine"
$store.Open("ReadWrite")
$store.Add($cert)
$store.Close()
Write-Host "  ✓ Root CA 已匯入 (Subject: $($cert.Subject))" -ForegroundColor Green

# 匯入 Publisher cert
if (-not (Test-Path $publisherCert)) {
    Write-Error "找不到 publisher certificate：$publisherCert"
    exit 1
}
Write-Host "匯入 Publisher cert → Trusted Publishers..."
$pubCert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2 $publisherCert
$pubStore = New-Object System.Security.Cryptography.X509Certificates.X509Store "TrustedPublisher", "LocalMachine"
$pubStore.Open("ReadWrite")
$pubStore.Add($pubCert)
$pubStore.Close()
Write-Host "  ✓ Publisher cert 已匯入 (Subject: $($pubCert.Subject))" -ForegroundColor Green

Write-Host ""
Write-Host "✓ 信任鏈匯入完成。請執行 install.ps1 安裝 AIRE。" -ForegroundColor Green
Write-Host ""
Write-Host "驗證方式（可選）：" -ForegroundColor Gray
Write-Host "  certlm.msc → 受信任的根憑證授權單位 → 確認 AIRE RootCA 存在" -ForegroundColor Gray
Write-Host "  certlm.msc → 受信任的發行者 → 確認 AIRE Publisher 存在" -ForegroundColor Gray
