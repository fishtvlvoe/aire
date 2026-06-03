# verify-checksum.ps1
# AIRE 企業內部分發包 — sha256 驗證腳本
# 用法：.\verify-checksum.ps1
# 需求：manifest.json 存在於同一目錄（或上層目錄）

param(
    [string]$ManifestPath = "",
    [string]$PackageRoot = ""
)

# 自動偵測 manifest.json 位置
if (-not $ManifestPath) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $packageDir = Split-Path -Parent $scriptDir
    $ManifestPath = Join-Path $packageDir "manifest.json"
}
if (-not $PackageRoot) {
    $PackageRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
}

if (-not (Test-Path $ManifestPath)) {
    Write-Error "找不到 manifest.json：$ManifestPath"
    exit 1
}

$manifest = Get-Content $ManifestPath | ConvertFrom-Json
$allPass = $true

Write-Host ""
Write-Host "AIRE 企業內部分發包 sha256 驗證" -ForegroundColor Cyan
Write-Host "版本：$($manifest.version)" -ForegroundColor Cyan
Write-Host "Release 狀態：$($manifest.release_status)" -ForegroundColor Yellow
Write-Host ""

foreach ($entry in $manifest.files) {
    $filePath = Join-Path $PackageRoot $entry.path
    if (-not (Test-Path $filePath)) {
        Write-Host "MISSING  $($entry.path)" -ForegroundColor Red
        $allPass = $false
        continue
    }
    $actual = (Get-FileHash -Path $filePath -Algorithm SHA256).Hash.ToLower()
    $expected = $entry.sha256.ToLower()
    if ($actual -eq $expected) {
        Write-Host "PASS     $($entry.path)" -ForegroundColor Green
    } else {
        Write-Host "FAIL     $($entry.path)" -ForegroundColor Red
        Write-Host "         expected: $expected"
        Write-Host "         actual:   $actual"
        $allPass = $false
    }
}

Write-Host ""
if ($allPass) {
    Write-Host "✓ 所有檔案 sha256 驗證通過。" -ForegroundColor Green
    exit 0
} else {
    Write-Host "✗ 部分檔案驗證失敗，停止部署。" -ForegroundColor Red
    exit 1
}
