#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Update Legal System on Windows server from main branch.

.DESCRIPTION
    Steps:
      1) git pull origin main
      2) pip install -r requirements
      3) migrate + collectstatic
      4) npm install + npm run build
      5) restart services
#>

$ErrorActionPreference = "Stop"
$InstallPath = "C:\dev\legal-system"
$venvPython = "$InstallPath\.venv\Scripts\python.exe"
$venvPip = "$InstallPath\.venv\Scripts\pip.exe"

function Write-Step { param([string]$msg) Write-Host "`n== $msg" -ForegroundColor Cyan }
function Write-OK { param([string]$msg) Write-Host "  [OK]  $msg" -ForegroundColor Green }
function Write-Warn { param([string]$msg) Write-Host "  [!!]  $msg" -ForegroundColor Yellow }
function Write-Fail { param([string]$msg) Write-Host "`n  [ERR] $msg" -ForegroundColor Red; exit 1 }
function Write-Info { param([string]$msg) Write-Host "       $msg" -ForegroundColor Gray }

if (-not (Test-Path "$InstallPath\.git")) {
    Write-Fail "Repository not found at $InstallPath. Run INSTALAR_SERVIDOR.ps1 first."
}

Set-Location $InstallPath
Write-Step "1/5 Git pull"
git fetch origin
$localHash = git rev-parse HEAD
$remoteHash = git rev-parse origin/main
if ($localHash -ne $remoteHash) {
    git pull origin main
    $newHash = git rev-parse HEAD
    Write-OK "Updated: $($localHash.Substring(0,7)) -> $($newHash.Substring(0,7))"
}
else {
    Write-OK "Already up to date: $($localHash.Substring(0,7))"
}

Write-Step "2/5 Stop services"
@("LegalSystem-Backend", "LegalSystem-Frontend") | ForEach-Object {
    $svc = Get-Service -Name $_ -ErrorAction SilentlyContinue
    if ($svc -and $svc.Status -eq "Running") {
        Stop-Service $_ -Force
        Write-OK "$_ stopped"
    }
    else {
        Write-Info "$_ already stopped"
    }
}

Write-Step "3/5 Backend"
Set-Location "$InstallPath\backend"
Write-Info "Installing Python dependencies..."
& $venvPip install -r "$InstallPath\backend\requirements.txt" --quiet
Write-Info "Running migrations..."
& $venvPython manage.py migrate --noinput
& $venvPython manage.py collectstatic --noinput 2>&1 | Out-Null
Write-OK "Backend updated"

Write-Step "4/5 Frontend"
Set-Location "$InstallPath\frontend"
Write-Info "npm install..."
npm install --silent
Write-Info "npm run build..."
npm run build
Write-OK "Frontend rebuilt"

Write-Step "5/5 Start services"
$backSvc = Get-Service "LegalSystem-Backend"  -ErrorAction SilentlyContinue
$frontSvc = Get-Service "LegalSystem-Frontend" -ErrorAction SilentlyContinue
if ($backSvc) {
    Start-Service "LegalSystem-Backend"
    Start-Sleep -Seconds 3
    Write-OK "LegalSystem-Backend: $((Get-Service LegalSystem-Backend).Status)"
}
else {
    Write-Warn "Service LegalSystem-Backend not found"
}
if ($frontSvc) {
    Start-Service "LegalSystem-Frontend"
    Start-Sleep -Seconds 3
    Write-OK "LegalSystem-Frontend: $((Get-Service LegalSystem-Frontend).Status)"
}
else {
    Write-Warn "Service LegalSystem-Frontend not found"
}

Set-Location $InstallPath
Write-Host ""
Write-Host "Update completed."
Write-Host "Recent commits:"
git log --oneline -3
Write-Host ""
