#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Atualiza o Legal System com as últimas mudanças do repositório (main).

.DESCRIPTION
    Executa:
      1. git pull origin main
      2. pip install (caso dependências tenham mudado)
      3. python manage.py migrate
      4. npm install (caso pacotes tenham mudado)
      5. npm run build  (rebuild de produção do frontend)
      6. Reinicia os serviços Windows

    Executar como Administrador (necessário para reiniciar serviços).
#>

$ErrorActionPreference = "Stop"
$InstallPath = "C:\dev\legal-system"
$venvPython = "$InstallPath\.venv\Scripts\python.exe"
$venvPip = "$InstallPath\.venv\Scripts\pip.exe"

function Write-Step { param($msg) Write-Host "`n══ $msg" -ForegroundColor Cyan }
function Write-OK { param($msg) Write-Host "  [OK]  $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  [!!!] $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host "`n  [ERRO] $msg" -ForegroundColor Red; exit 1 }
function Write-Info { param($msg) Write-Host "        $msg" -ForegroundColor Gray }

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║           LEGAL SYSTEM — ATUALIZAÇÃO DE CÓDIGO           ║" -ForegroundColor Blue
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

if (-not (Test-Path "$InstallPath\.git")) {
    Write-Fail "Repositório não encontrado em $InstallPath. Execute INSTALAR_SERVIDOR.ps1 primeiro."
}

Set-Location $InstallPath

# ═══════════════════════════════════════════════════════════════════════════════
#  1 — Git pull
# ═══════════════════════════════════════════════════════════════════════════════
Write-Step "1/5  Baixando atualizações (git pull)"

git fetch origin
$localHash = git rev-parse HEAD
$remoteHash = git rev-parse origin/main

if ($localHash -eq $remoteHash) {
    Write-OK "Código já está atualizado ($(($localHash).Substring(0,7)))"
}
else {
    git pull origin main
    $newHash = git rev-parse HEAD
    Write-OK "Atualizado: $($localHash.Substring(0,7)) → $($newHash.Substring(0,7))"
}

# ═══════════════════════════════════════════════════════════════════════════════
#  2 — Parar serviços antes de atualizar
# ═══════════════════════════════════════════════════════════════════════════════
Write-Step "2/5  Parando serviços"

@("LegalSystem-Backend", "LegalSystem-Frontend") | ForEach-Object {
    $svc = Get-Service -Name $_ -ErrorAction SilentlyContinue
    if ($svc -and $svc.Status -eq "Running") {
        Stop-Service $_ -Force
        Write-OK "$_ parado"
    }
    else {
        Write-Info "$_ já estava parado"
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
#  3 — Atualizar backend (pip + migrate)
# ═══════════════════════════════════════════════════════════════════════════════
Write-Step "3/5  Backend"

Write-Info "Instalando dependências Python..."
& $venvPip install -r "$InstallPath\backend\requirements.txt" --quiet
Write-OK "Dependências ok"

Write-Info "Aplicando migrações..."
Set-Location "$InstallPath\backend"
& $venvPython manage.py migrate --noinput
Write-OK "Migrações aplicadas"

& $venvPython manage.py collectstatic --noinput 2>&1 | Out-Null
Write-OK "Estáticos coletados"

# ═══════════════════════════════════════════════════════════════════════════════
#  4 — Rebuild frontend (npm install + build)
# ═══════════════════════════════════════════════════════════════════════════════
Write-Step "4/5  Frontend (rebuild de produção)"

Set-Location "$InstallPath\frontend"
Write-Info "npm install..."
npm install --silent
Write-Info "npm run build..."
npm run build
Write-OK "Frontend recompilado"

# ═══════════════════════════════════════════════════════════════════════════════
#  5 — Reiniciar serviços
# ═══════════════════════════════════════════════════════════════════════════════
Write-Step "5/5  Reiniciando serviços"

$backSvc = Get-Service "LegalSystem-Backend"  -ErrorAction SilentlyContinue
$frontSvc = Get-Service "LegalSystem-Frontend" -ErrorAction SilentlyContinue

if ($backSvc) {
    Start-Service "LegalSystem-Backend"
    Start-Sleep -Seconds 3
    Write-OK "LegalSystem-Backend: $((Get-Service LegalSystem-Backend).Status)"
}
else {
    Write-Warn "Serviço LegalSystem-Backend não encontrado. Inicie manualmente:"
    Write-Info "  $InstallPath\infra\backend_prod.cmd"
}

if ($frontSvc) {
    Start-Service "LegalSystem-Frontend"
    Start-Sleep -Seconds 3
    Write-OK "LegalSystem-Frontend: $((Get-Service LegalSystem-Frontend).Status)"
}
else {
    Write-Warn "Serviço LegalSystem-Frontend não encontrado. Inicie manualmente:"
    Write-Info "  $InstallPath\infra\frontend_prod.cmd"
}

# ─── Resumo ───────────────────────────────────────────────────────────────────
Set-Location $InstallPath
$commitLog = git log --oneline -3
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ATUALIZAÇÃO CONCLUÍDA!                      ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Últimos commits:" -ForegroundColor Gray
$commitLog | ForEach-Object { Write-Host "    $_" -ForegroundColor White }
Write-Host ""
