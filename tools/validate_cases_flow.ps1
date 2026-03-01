param(
    [switch]$SkipFrontend
)

$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$backendPath = Join-Path $root 'backend'
$frontendPath = Join-Path $root 'frontend'
$pythonExe = Join-Path $root '.venv\Scripts\python.exe'

Write-Host "[1/3] Backend tests (cases + publications)" -ForegroundColor Cyan
Push-Location $backendPath
& $pythonExe -m pytest apps/publications/tests.py apps/cases/tests.py -q
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    throw "Backend tests failed"
}
Pop-Location

if (-not $SkipFrontend) {
    Write-Host "[2/3] Frontend tests (vitest)" -ForegroundColor Cyan
    Push-Location $frontendPath
    npm run test:run
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        throw "Frontend tests failed"
    }
    Pop-Location
}

Write-Host "[3/3] Frontend build" -ForegroundColor Cyan
Push-Location $frontendPath
npm run build
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    throw "Frontend build failed"
}
Pop-Location

Write-Host "✅ Cases flow validation completed successfully." -ForegroundColor Green
