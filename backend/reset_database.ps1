# Reset Database Script
# This script deletes the SQLite database and recreates it with migrations
# Usage: .\reset_database.ps1

Write-Host "🗑️  Resetting database..." -ForegroundColor Yellow
Write-Host ""

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Navigate to backend directory
Push-Location $scriptDir

try {
    # Check if db.sqlite3 exists
    if (Test-Path "db.sqlite3") {
        Write-Host "❌ Deleting existing database (db.sqlite3)..." -ForegroundColor Red
        Remove-Item "db.sqlite3" -Force
        Write-Host "✓ Database deleted" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  Database file not found (fresh start)" -ForegroundColor Cyan
    }

    Write-Host ""
    Write-Host "📝 Running migrations..." -ForegroundColor Blue
    
    # Activate virtual environment if it exists
    $venvPath = "..\..\.venv\Scripts\Activate.ps1"
    if (Test-Path $venvPath) {
        & $venvPath
        Write-Host "✓ Virtual environment activated" -ForegroundColor Green
    }

    # Run migrations
    python manage.py migrate
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Database reset successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Database Stats:" -ForegroundColor Cyan
        Write-Host "   - New empty SQLite database created"
        Write-Host "   - All migrations applied"
        Write-Host "   - Ready for fresh data"
    } else {
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
