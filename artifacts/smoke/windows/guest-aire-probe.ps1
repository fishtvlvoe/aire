$ErrorActionPreference = "Continue"

$result = [ordered]@{
  capturedAt = (Get-Date).ToString("o")
  computerName = $env:COMPUTERNAME
  username = $env:USERNAME
  userProfile = $env:USERPROFILE
  localAppData = $env:LOCALAPPDATA
  appData = $env:APPDATA
  installedExecutables = @()
  installedShortcuts = @()
  runningProcesses = @()
  appDataCandidates = @()
  users = @()
  interactiveSessions = @()
}

$searchRoots = @(
  "$env:LOCALAPPDATA\Programs",
  "$env:APPDATA\Microsoft\Windows\Start Menu\Programs",
  "$env:ProgramFiles",
  "${env:ProgramFiles(x86)}",
  "$env:USERPROFILE\Desktop",
  "C:\Users\AIRE\AppData\Local\Programs",
  "C:\Users\AIRE\AppData\Roaming\Microsoft\Windows\Start Menu\Programs",
  "C:\Users\AIRE\Desktop",
  "C:\Users\Public\Desktop",
  "C:\ProgramData\Microsoft\Windows\Start Menu\Programs"
) | Where-Object { $_ -and (Test-Path $_) }

foreach ($root in $searchRoots) {
  $result.installedExecutables += Get-ChildItem -Path $root -Recurse -ErrorAction SilentlyContinue -Filter "AIRE*.exe" |
    Select-Object -ExpandProperty FullName
  $result.installedShortcuts += Get-ChildItem -Path $root -Recurse -ErrorAction SilentlyContinue -Filter "*AIRE*.lnk" |
    Select-Object -ExpandProperty FullName
}

$result.runningProcesses = Get-Process -ErrorAction SilentlyContinue |
  Where-Object { $_.ProcessName -match "AIRE|aire" } |
  Select-Object ProcessName, Id, MainWindowTitle, Path |
  ConvertTo-Json -Depth 4 | ConvertFrom-Json

$webviewRoots = @(
  "$env:LOCALAPPDATA\com.fishot.aire",
  "$env:LOCALAPPDATA\AIRE",
  "$env:APPDATA\AIRE",
  "$env:APPDATA\aire"
) | Where-Object { $_ }

foreach ($root in $webviewRoots) {
  $result.appDataCandidates += [ordered]@{
    path = $root
    exists = Test-Path $root
  }
}

$result.users = Get-ChildItem C:\Users -Directory -ErrorAction SilentlyContinue |
  Select-Object Name, FullName |
  ConvertTo-Json -Depth 4 | ConvertFrom-Json

$result.interactiveSessions = (quser 2>$null) -join "`n"

$result | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 C:\Windows\Temp\aire-utmctl-probe.json
