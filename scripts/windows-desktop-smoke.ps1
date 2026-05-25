param(
  [Parameter(Mandatory = $true)]
  [string]$InstallerPath,

  [Parameter(Mandatory = $true)]
  [string]$OutputDir
)

$ErrorActionPreference = "Stop"

function Write-JsonFile {
  param(
    [Parameter(Mandatory = $true)] [string]$Path,
    [Parameter(Mandatory = $true)] $Value
  )

  $Value | ConvertTo-Json -Depth 8 | Out-File -FilePath $Path -Encoding utf8
}

function Find-AireExecutable {
  $candidates = @(
    (Join-Path $env:LOCALAPPDATA "Programs\AIRE\AIRE.exe"),
    (Join-Path $env:LOCALAPPDATA "AIRE\AIRE.exe"),
    (Join-Path $env:ProgramFiles "AIRE\AIRE.exe")
  )

  $programFilesX86 = [Environment]::GetFolderPath("ProgramFilesX86")
  if ($programFilesX86) {
    $candidates += (Join-Path $programFilesX86 "AIRE\AIRE.exe")
  }

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
      return (Resolve-Path $candidate).Path
    }
  }

  $searchRoots = @($env:LOCALAPPDATA, $env:ProgramFiles, $programFilesX86) |
    Where-Object { $_ -and (Test-Path $_) }
  foreach ($root in $searchRoots) {
    $found = Get-ChildItem -Path $root -Filter "AIRE.exe" -Recurse -ErrorAction SilentlyContinue |
      Select-Object -First 1
    if ($found) {
      return $found.FullName
    }
  }

  throw "AIRE.exe was not found after installation."
}

function Capture-DesktopScreenshot {
  param([Parameter(Mandatory = $true)] [string]$Path)

  Add-Type -AssemblyName System.Windows.Forms
  Add-Type -AssemblyName System.Drawing

  $bounds = [System.Windows.Forms.SystemInformation]::VirtualScreen
  $bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.CopyFromScreen($bounds.Left, $bounds.Top, 0, 0, $bounds.Size)
    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$InstallerPath = (Resolve-Path $InstallerPath).Path
$installLog = Join-Path $OutputDir "install.log"
$processJson = Join-Path $OutputDir "process.json"
$windowJson = Join-Path $OutputDir "window.json"
$screenshotPath = Join-Path $OutputDir "launch.png"

$install = Start-Process -FilePath "msiexec.exe" `
  -ArgumentList @("/i", "`"$InstallerPath`"", "/qn", "/norestart", "/L*v", "`"$installLog`"") `
  -Wait `
  -PassThru

if ($install.ExitCode -ne 0) {
  throw "MSI install failed with exit code $($install.ExitCode). See $installLog"
}

$exePath = Find-AireExecutable
$app = Start-Process -FilePath $exePath -PassThru
Start-Sleep -Seconds 8

$process = Get-Process -Id $app.Id -ErrorAction Stop
$windowSeen = $false
for ($i = 0; $i -lt 12; $i++) {
  $process.Refresh()
  if ($process.MainWindowHandle -ne 0 -or $process.MainWindowTitle) {
    $windowSeen = $true
    break
  }
  Start-Sleep -Seconds 2
}

$process.Refresh()
Write-JsonFile -Path $processJson -Value ([ordered]@{
  installerPath = $InstallerPath
  executablePath = $exePath
  processId = $process.Id
  processName = $process.ProcessName
  mainWindowHandle = $process.MainWindowHandle.ToInt64()
  mainWindowTitle = $process.MainWindowTitle
  startedAt = (Get-Date).ToString("o")
})

Write-JsonFile -Path $windowJson -Value ([ordered]@{
  windowSeen = $windowSeen
  title = $process.MainWindowTitle
  handle = $process.MainWindowHandle.ToInt64()
})

Capture-DesktopScreenshot -Path $screenshotPath
if (!(Test-Path $screenshotPath) -or ((Get-Item $screenshotPath).Length -le 0)) {
  throw "Screenshot was not created or is empty."
}

Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
