# Script para instalar SQLite3 CLI no Windows
# Execução: Abra PowerShell como ADMINISTRADOR e execute: .\install_sqlite.ps1

# Tenta diferentes caminhos possíveis (o SQLite muda a estrutura)
$possibleUrls = @(
    "https://www.sqlite.org/2024/sqlite-tools-win-x64-3510200.zip",
    "https://sqlite.org/2024/sqlite-tools-win-x64-3510200.zip",
    "https://www.sqlite.org/sqlite-tools-win-x64-3510200.zip"
)

$zipFile = "$env:TEMP\sqlite-tools.zip"
$extractPath = "$env:TEMP\sqlite-tools"
$destinationPath = "C:\Windows\System32"

$downloadSuccess = $false

foreach ($url in $possibleUrls) {
    try {
        Write-Host "Tentando baixar de: $url" -ForegroundColor Cyan
        Invoke-WebRequest -Uri $url -OutFile $zipFile -ErrorAction Stop
        $downloadSuccess = $true
        Write-Host "Download bem-sucedido!" -ForegroundColor Green
        break
    } catch {
        Write-Host "Falhou. Tentando próxima URL..." -ForegroundColor Yellow
    }
}

if (-not $downloadSuccess) {
    Write-Host "`nERRO: Não foi possível baixar o SQLite." -ForegroundColor Red
    Write-Host "Por favor, faça o download manual:" -ForegroundColor Yellow
    Write-Host "1. Acesse: https://www.sqlite.org/download.html" -ForegroundColor Yellow
    Write-Host "2. Baixe: sqlite-tools-win-x64-3510200.zip" -ForegroundColor Yellow
    Write-Host "3. Extraia e copie sqlite3.exe para C:\Windows\System32\" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nExtraindo arquivos..." -ForegroundColor Cyan
$extractPath = "$env:TEMP\sqlite-tools"
$destinationPath = "C:\Windows\System32"

Write-Host "Baixando SQLite3 CLI..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $url -OutFile $zipFile

Write-Host "Extraindo arquivos..." -ForegroundColor Cyan
Expand-Archive -Path $zipFile -DestinationPath $extractPath -Force

Write-Host "Copiando sqlite3.exe para System32..." -ForegroundColor Cyan
$sqlite3Exe = Get-ChildItem -Path $extractPath -Filter "sqlite3.exe" -Recurse | Select-Object -First 1
Copy-Item -Path $sqlite3Exe.FullName -Destination "$destinationPath\sqlite3.exe" -Force

Write-Host "Limpando arquivos temporários..." -ForegroundColor Cyan
Remove-Item -Path $zipFile -Force
Remove-Item -Path $extractPath -Recurse -Force

Write-Host "`nInstalação concluída!" -ForegroundColor Green
Write-Host "Teste executando: sqlite3 --version" -ForegroundColor Yellow

# Testar instalação
Write-Host "`nTestando..." -ForegroundColor Cyan
& sqlite3 --version
