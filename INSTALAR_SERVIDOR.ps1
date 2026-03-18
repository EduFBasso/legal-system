#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Instala o Legal System em um computador Windows (servidor de escritório).

.DESCRIPTION
    Script completo de instalação para primeiro uso. Executa:
      1. Verificação de pré-requisitos (Git, Python, Node.js)
      2. Clone do repositório GitHub
      3. Criação do ambiente Python e instalação de dependências
      4. Configuração automática do .env (com IP detectado da máquina)
      5. Migrações do banco de dados
      6. Build de produção do frontend
      7. Registro dos serviços Windows via NSSM

.NOTES
    PRÉ-REQUISITOS (instalar manualmente antes de rodar este script):
      • Git         → https://git-scm.com/download/win
      • Python 3.11 → https://www.python.org/downloads/release/python-3119/
                      (marcar "Add Python to PATH" durante instalação)
      • Node.js 20  → https://nodejs.org/en  (LTS, Windows Installer)

    Executar como Administrador:
      Clique com botão direito no PowerShell → "Executar como administrador"
      Depois rode: .\INSTALAR_SERVIDOR.ps1
#>

param(
    [string]$InstallPath = "C:\dev\legal-system",
    [string]$RepoUrl = "https://github.com/EduFBasso/legal-system.git",
    [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

# ─── Helpers de output ────────────────────────────────────────────────────────
function Write-Step { param($msg) Write-Host "`n══ $msg" -ForegroundColor Cyan }
function Write-OK { param($msg) Write-Host "  [OK]  $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  [!!!] $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host "`n  [ERRO] $msg" -ForegroundColor Red; exit 1 }
function Write-Info { param($msg) Write-Host "        $msg" -ForegroundColor Gray }

# ─── Variáveis derivadas ──────────────────────────────────────────────────────
$venvPython = "$InstallPath\.venv\Scripts\python.exe"
$venvPip = "$InstallPath\.venv\Scripts\pip.exe"
$nssmPath = "$InstallPath\nssm-2.24\win64\nssm.exe"
$backendDir = "$InstallPath\backend"
$frontendDir = "$InstallPath\frontend"

# ─── Banner ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║          LEGAL SYSTEM — INSTALAÇÃO NO SERVIDOR           ║" -ForegroundColor Blue
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
#  PASSO 1 — Verificar pré-requisitos
# ═══════════════════════════════════════════════════════════════════════════════
Write-Step "1/8  Verificando pré-requisitos"

$git = Get-Command git    -ErrorAction SilentlyContinue
$python = Get-Command python -ErrorAction SilentlyContinue
$node = Get-Command node   -ErrorAction SilentlyContinue
$npm = Get-Command npm    -ErrorAction SilentlyContinue

$missing = @()
if (-not $git) { $missing += "Git    →  https://git-scm.com/download/win" }
if (-not $python) { $missing += "Python →  https://www.python.org/downloads/release/python-3119/" }
if (-not $node) { $missing += "Node   →  https://nodejs.org/en  (LTS)" }
if (-not $npm) { $missing += "npm    (instalado junto com Node.js)" }

if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "  Instale os programas abaixo e rode este script novamente:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "    $_" -ForegroundColor Yellow }
    exit 1
}

$pyVer = (python --version 2>&1) -replace "Python ", ""
$nodeVer = (node --version 2>&1) -replace "v", ""
Write-OK "Python $pyVer | Node.js $nodeVer | Git ok"

# ═══════════════════════════════════════════════════════════════════════════════
#  PASSO 2 — Detectar IP do servidor
# ═══════════════════════════════════════════════════════════════════════════════
Write-Step "2/8  Detectando IP da máquina na rede"

$detectedIP = (
    Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.PrefixOrigin -eq 'Dhcp' -or $_.PrefixOrigin -eq 'Manual' } |
    Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.*' } |
    Select-Object -First 1
).IPAddress

if (-not $detectedIP) {
    $detectedIP = "127.0.0.1"
    Write-Warn "Não foi possível detectar IP local. Usando 127.0.0.1."
    Write-Warn "Edite backend\.env e frontend\.env.local depois para corrigir."
}
else {
    Write-OK "IP detectado: $detectedIP"
}

$hostName = $env:COMPUTERNAME

# ═══════════════════════════════════════════════════════════════════════════════
#  PASSO 3 — Clonar repositório
# ═══════════════════════════════════════════════════════════════════════════════
Write-Step "3/8  Repositório"

if (Test-Path "$InstallPath\.git") {
    Write-OK "Repositório já existe em $InstallPath — atualizando..."
    Set-Location $InstallPath
    git fetch origin
    git checkout $Branch
    git pull origin $Branch
}
else {
    Write-Info "Clonando $RepoUrl → $InstallPath ..."
    git clone --branch $Branch $RepoUrl $InstallPath
    Write-OK "Clone concluído"
}

Set-Location $InstallPath

# ═══════════════════════════════════════════════════════════════════════════════
#  PASSO 4 — Ambiente Python e dependências
# ═══════════════════════════════════════════════════════════════════════════════
Write-Step "4/8  Ambiente Python"

if (-not (Test-Path "$InstallPath\.venv")) {
    Write-Info "Criando virtualenv..."
    python -m venv "$InstallPath\.venv"
}

Write-Info "Instalando dependências Python (pode demorar 1-2 min na primeira vez)..."
& $venvPip install --upgrade pip --quiet
& $venvPip install -r "$backendDir\requirements.txt" --quiet
Write-OK "Dependências Python instaladas (inclui waitress para produção)"

# ═══════════════════════════════════════════════════════════════════════════════
#  PASSO 5 — Configurar backend .env
# ═══════════════════════════════════════════════════════════════════════════════
Write-Step "5/8  Configurando backend/.env"

# Gerar SECRET_KEY aleatória
$chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#%^&*(-_=+)'
$secretKey = -join ((1..60) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })

$envContent = @"
# Gerado automaticamente por INSTALAR_SERVIDOR.ps1 em $(Get-Date -Format 'yyyy-MM-dd')
# NÃO versionar este arquivo (já está no .gitignore)

SECRET_KEY=$secretKey
DEBUG=False

ALLOWED_HOSTS=localhost,127.0.0.1,$detectedIP,$hostName

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://${detectedIP}:5173,http://${hostName}:5173

# Banco de dados (SQLite padrão — copie db.sqlite3 do computador anterior se houver dados)
# DATABASE_URL=sqlite:///db.sqlite3

OAB_NUMBER=507553
ADVOGADA_NOME=Vitoria Rocha de Morais

JWT_ACCESS_TOKEN_HOURS=8
JWT_REFRESH_TOKEN_HOURS=168
"@

$envPath = "$backendDir\.env"
if (Test-Path $envPath) {
    Write-Warn "backend\.env já existe — mantendo arquivo atual (não sobrescrito)."
    Write-Info "Para regenerar, delete $envPath e rode o script novamente."
}
else {
    $envContent | Set-Content -Encoding UTF8 $envPath
    Write-OK "backend\.env criado com IP $detectedIP"
}

# ═══════════════════════════════════════════════════════════════════════════════
#  PASSO 6 — Banco de dados e estáticos
# ═══════════════════════════════════════════════════════════════════════════════
Write-Step "6/8  Banco de dados"

Write-Info "Aplicando migrações..."
Set-Location $backendDir
& $venvPython manage.py migrate --noinput
Write-OK "Migrações aplicadas"

Write-Info "Coletando arquivos estáticos..."
& $venvPython manage.py collectstatic --noinput 2>&1 | Out-Null
Write-OK "Estáticos coletados"

# Criar superusuário se não existir
Write-Info "Verificando usuário master..."
$createUser = & $venvPython manage.py shell -c @"
from django.contrib.auth import get_user_model
User = get_user_model()
exists = User.objects.filter(is_superuser=True).exists()
print('exists' if exists else 'missing')
"@
if ($createUser.Trim() -eq 'missing') {
    Write-Warn "Nenhum superusuário encontrado."
    Write-Warn "Crie manualmente depois com:"
    Write-Info "  cd $backendDir"
    Write-Info "  $venvPython manage.py createsuperuser"
}
else {
    Write-OK "Superusuário já existe"
}

# ─── Aviso sobre banco de dados ───────────────────────────────────────────────
Write-Host ""
Write-Host "  ┌─────────────────────────────────────────────────────────┐" -ForegroundColor Yellow
Write-Host "  │  ATENÇÃO — BANCO DE DADOS                               │" -ForegroundColor Yellow
Write-Host "  │  Se já havia dados no computador anterior (Dell-Edu),   │" -ForegroundColor Yellow
Write-Host "  │  copie o arquivo:                                        │" -ForegroundColor Yellow
Write-Host "  │    C:\dev\legal-system\backend\db.sqlite3               │" -ForegroundColor Yellow
Write-Host "  │  para este mesmo caminho neste computador.              │" -ForegroundColor Yellow
Write-Host "  └─────────────────────────────────────────────────────────┘" -ForegroundColor Yellow

# ═══════════════════════════════════════════════════════════════════════════════
#  PASSO 7 — Build de produção do frontend
# ═══════════════════════════════════════════════════════════════════════════════
Write-Step "7/8  Frontend (build de produção)"

Set-Location $frontendDir

# Criar .env.local
$envLocalPath = "$frontendDir\.env.local"
if (Test-Path $envLocalPath) {
    Write-Warn "frontend\.env.local já existe — mantendo arquivo atual."
}
else {
    @"
# Gerado por INSTALAR_SERVIDOR.ps1
VITE_API_URL=http://${detectedIP}:8000/api
"@ | Set-Content -Encoding UTF8 $envLocalPath
    Write-OK "frontend\.env.local criado"
}

Write-Info "Instalando pacotes npm..."
npm install --silent
Write-OK "npm install concluído"

Write-Info "Gerando build de produção (pode demorar 30-60 segundos)..."
npm run build
Write-OK "Build gerado em frontend\dist\"

# ═══════════════════════════════════════════════════════════════════════════════
#  PASSO 8 — Serviços Windows via NSSM
# ═══════════════════════════════════════════════════════════════════════════════
Write-Step "8/8  Registrando serviços Windows"

Set-Location $InstallPath

if (-not (Test-Path $nssmPath)) {
    Write-Warn "NSSM não encontrado em $nssmPath"
    Write-Warn "Os serviços Windows NÃO foram registrados."
    Write-Warn "Para iniciar manualmente, rode:"
    Write-Info "  infra\backend_prod.cmd"
    Write-Info "  infra\frontend_prod.cmd"
}
else {
    $backendCmd = "$InstallPath\infra\backend_prod.cmd"
    $frontendCmd = "$InstallPath\infra\frontend_prod.cmd"

    # ── Backend service ───────────────────────────────────────────────────────
    $svcBack = Get-Service -Name "LegalSystem-Backend" -ErrorAction SilentlyContinue
    if ($svcBack) {
        Write-Info "Serviço LegalSystem-Backend já existe — atualizando..."
        Stop-Service "LegalSystem-Backend" -Force -ErrorAction SilentlyContinue
        & $nssmPath set LegalSystem-Backend Application "C:\Windows\System32\cmd.exe"
        & $nssmPath set LegalSystem-Backend AppParameters "/c `"$backendCmd`""
    }
    else {
        & $nssmPath install LegalSystem-Backend "C:\Windows\System32\cmd.exe" "/c `"$backendCmd`""
    }
    & $nssmPath set LegalSystem-Backend AppDirectory $backendDir
    & $nssmPath set LegalSystem-Backend DisplayName  "Legal System - Backend (Waitress)"
    & $nssmPath set LegalSystem-Backend Description  "Django backend do Legal System"
    & $nssmPath set LegalSystem-Backend Start        SERVICE_AUTO_START
    Write-OK "LegalSystem-Backend registrado"

    # ── Frontend service ──────────────────────────────────────────────────────
    $svcFront = Get-Service -Name "LegalSystem-Frontend" -ErrorAction SilentlyContinue
    if ($svcFront) {
        Write-Info "Serviço LegalSystem-Frontend já existe — atualizando..."
        Stop-Service "LegalSystem-Frontend" -Force -ErrorAction SilentlyContinue
        & $nssmPath set LegalSystem-Frontend Application "C:\Windows\System32\cmd.exe"
        & $nssmPath set LegalSystem-Frontend AppParameters "/c `"$frontendCmd`""
    }
    else {
        & $nssmPath install LegalSystem-Frontend "C:\Windows\System32\cmd.exe" "/c `"$frontendCmd`""
    }
    & $nssmPath set LegalSystem-Frontend AppDirectory $frontendDir
    & $nssmPath set LegalSystem-Frontend DisplayName  "Legal System - Frontend (Vite Preview)"
    & $nssmPath set LegalSystem-Frontend Description  "Frontend React do Legal System"
    & $nssmPath set LegalSystem-Frontend Start        SERVICE_AUTO_START
    Write-OK "LegalSystem-Frontend registrado"

    # ── Iniciar serviços ──────────────────────────────────────────────────────
    Write-Info "Iniciando serviços..."
    Start-Service "LegalSystem-Backend"
    Start-Sleep -Seconds 3
    Start-Service "LegalSystem-Frontend"
    Start-Sleep -Seconds 5

    $back = (Get-Service "LegalSystem-Backend").Status
    $front = (Get-Service "LegalSystem-Frontend").Status
    Write-OK "Backend: $back | Frontend: $front"
}

# ─── Resumo final ─────────────────────────────────────────────────────────────
Set-Location $InstallPath
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              INSTALAÇÃO CONCLUÍDA!                       ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Acesso local:     http://localhost:5173" -ForegroundColor White
Write-Host "  Acesso na rede:   http://${detectedIP}:5173" -ForegroundColor White
Write-Host "  API backend:      http://${detectedIP}:8000/api/" -ForegroundColor White
Write-Host ""
Write-Host "  Para atualizar o código no futuro:" -ForegroundColor Gray
Write-Host "    .\ATUALIZAR.ps1   (executar como Administrador)" -ForegroundColor Yellow
Write-Host ""
