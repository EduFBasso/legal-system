# Reset Database Script
# This script deletes the SQLite database and recreates it with migrations
# Usage: .\reset_database.ps1

param(
    [switch]$KeepUsers,
    [string]$UsersBackupFile = ""
)

Write-Host "🗑️  Resetting database..." -ForegroundColor Yellow
Write-Host ""

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Repo root (one level above backend)
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")

# Prefer python from repo-local venv to avoid PATH issues
$pythonExe = Join-Path $repoRoot ".venv\Scripts\python.exe"
$activateVenv = Join-Path $repoRoot ".venv\Scripts\Activate.ps1"

if (-not $UsersBackupFile -or $UsersBackupFile.Trim() -eq "") {
    $UsersBackupFile = Join-Path $scriptDir "_dev_users_backup.json"
}

# Navigate to backend directory
Push-Location $scriptDir

try {
    if (-not (Test-Path $pythonExe)) {
        throw "Python do venv não encontrado em: $pythonExe. Rode primeiro o setup do ambiente (venv)."
    }

    # Activar virtual env (opcional, só para experiência no terminal)
    if (Test-Path $activateVenv) {
        & $activateVenv
        Write-Host "✓ Virtual environment activated" -ForegroundColor Green
    }

    # Se KeepUsers, fazer backup de usuários/perfis ANTES de apagar o banco
    $hasUsersBackup = $false
    if ($KeepUsers -and (Test-Path "db.sqlite3")) {
        Write-Host "👤 Backup de usuários/perfis (KeepUsers) ..." -ForegroundColor Cyan
        & $pythonExe manage.py dumpdata auth.user apps.accounts.userprofile --output "$UsersBackupFile"
        if ($LASTEXITCODE -ne 0) {
            throw "Falha ao gerar backup de usuários em $UsersBackupFile"
        }
        if (Test-Path $UsersBackupFile) {
            $hasUsersBackup = $true
            Write-Host "✓ Backup salvo em: $UsersBackupFile" -ForegroundColor Green
        }
    }

    # Check if db.sqlite3 exists
    if (Test-Path "db.sqlite3") {
        Write-Host "❌ Deleting existing database (db.sqlite3)..." -ForegroundColor Red
        Remove-Item "db.sqlite3" -Force
        Write-Host "✓ Database deleted" -ForegroundColor Green
    }
    else {
        Write-Host "ℹ️  Database file not found (fresh start)" -ForegroundColor Cyan
    }

    Write-Host ""
    Write-Host "📝 Running migrations..." -ForegroundColor Blue

    # Run migrations
    if ($hasUsersBackup) {
        # Evitar que o bootstrap do master crie usuário durante migrate,
        # pois iremos restaurar exatamente os usuários do backup.
        $prevMasterUsername = $env:MASTER_USERNAME
        $prevMasterPassword = $env:MASTER_PASSWORD
        $prevDjangoSuUser = $env:DJANGO_SUPERUSER_USERNAME
        $prevDjangoSuPass = $env:DJANGO_SUPERUSER_PASSWORD
        $prevDjangoSuEmail = $env:DJANGO_SUPERUSER_EMAIL

        $env:MASTER_USERNAME = ''
        $env:MASTER_PASSWORD = ''
        $env:DJANGO_SUPERUSER_USERNAME = ''
        $env:DJANGO_SUPERUSER_PASSWORD = ''
        $env:DJANGO_SUPERUSER_EMAIL = ''

        & $pythonExe manage.py migrate

        # Restaurar env vars
        $env:MASTER_USERNAME = $prevMasterUsername
        $env:MASTER_PASSWORD = $prevMasterPassword
        $env:DJANGO_SUPERUSER_USERNAME = $prevDjangoSuUser
        $env:DJANGO_SUPERUSER_PASSWORD = $prevDjangoSuPass
        $env:DJANGO_SUPERUSER_EMAIL = $prevDjangoSuEmail
    }
    else {
        & $pythonExe manage.py migrate
    }
    
    if ($LASTEXITCODE -eq 0) {
        if ($hasUsersBackup) {
            Write-Host "" 
            Write-Host "👤 Restaurando usuários/perfis do backup..." -ForegroundColor Cyan
            & $pythonExe manage.py loaddata "$UsersBackupFile"
            if ($LASTEXITCODE -ne 0) {
                throw "Falha ao restaurar usuários a partir de $UsersBackupFile"
            }
            Write-Host "✓ Usuários restaurados" -ForegroundColor Green
        }

        Write-Host ""
        Write-Host "✅ Database reset successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Database Stats:" -ForegroundColor Cyan
        Write-Host "   - New empty SQLite database created"
        Write-Host "   - All migrations applied"
        if ($hasUsersBackup) {
            Write-Host "   - Users preserved via KeepUsers backup/restore"
        }
        Write-Host "   - Ready for fresh data"
    }
    else {
        Write-Host ""
        Write-Host "❌ Migration failed!" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host ""
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "💡 Tip: You can now start fresh or import test data" -ForegroundColor Cyan
