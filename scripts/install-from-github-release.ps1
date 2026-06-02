$ErrorActionPreference = "Stop"

$Repo = "fishtvlvoe/aire"
$ApiUrl = "https://api.github.com/repos/$Repo/releases/latest"

Write-Host "▶ 讀取最新 release：$ApiUrl"
$release = Invoke-RestMethod -Uri $ApiUrl -Headers @{
  "Accept" = "application/vnd.github+json"
  "X-GitHub-Api-Version" = "2022-11-28"
}

$asset = $release.assets | Where-Object { $_.name -match '^aire-setup-.*\.exe$' } | Select-Object -First 1
if (-not $asset) {
  throw "找不到 Windows installer（aire-setup-*.exe）"
}

$installerPath = Join-Path $env:TEMP $asset.name
Write-Host "▶ 下載 installer：$($asset.browser_download_url)"
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $installerPath

Write-Host "▶ 靜默安裝：$installerPath"
Start-Process -FilePath $installerPath -ArgumentList "/S" -Wait

$exeCandidates = @(
  "$env:LOCALAPPDATA\Programs\AIRE\AIRE.exe",
  "$env:LOCALAPPDATA\Programs\aire\AIRE.exe",
  "$env:ProgramFiles\AIRE\AIRE.exe",
  "${env:ProgramFiles(x86)}\AIRE\AIRE.exe"
)

$appExe = $exeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $appExe) {
  $appExe = Get-ChildItem "$env:LOCALAPPDATA\Programs", "$env:ProgramFiles", "${env:ProgramFiles(x86)}" -Recurse -ErrorAction SilentlyContinue -Filter "AIRE.exe" |
    Select-Object -First 1 -ExpandProperty FullName
}

if (-not $appExe) {
  throw "安裝完成但找不到 AIRE.exe，請手動從開始功能表開啟 AIRE。"
}

Write-Host "▶ 啟動 AIRE：$appExe"
Start-Process -FilePath $appExe
Write-Host "✓ 安裝完成（tag: $($release.tag_name)）"
