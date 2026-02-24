@echo off
:: ============================================
:: LEGAL SYSTEM - BACKUP AUTOMATICO
:: Faz backup do banco de dados SQLite3
:: Sugestao: Executar diariamente via Agendador de Tarefas do Windows
:: ============================================

title Legal System - Backup Automatico
color 0B
cls

echo.
echo ====================================
echo   LEGAL SYSTEM - BACKUP AUTOMATICO
echo ====================================
echo.

:: ============================================
:: Configuracoes
:: ============================================
set DB_FILE=backend\db.sqlite3
set BACKUP_DIR=backups
set DATE_STAMP=%DATE:~-4%-%DATE:~3,2%-%DATE:~0,2%
set TIME_STAMP=%TIME:~0,2%-%TIME:~3,2%-%TIME:~6,2%
set TIME_STAMP=%TIME_STAMP: =0%

set BACKUP_NAME=backup_%DATE_STAMP%_%TIME_STAMP%.sqlite3
set LOG_FILE=%BACKUP_DIR%\backup.log

:: ============================================
:: Verificar se banco existe
:: ============================================
if not exist "%DB_FILE%" (
    echo [ERRO] Banco de dados nao encontrado: %DB_FILE%
    echo.
    pause
    exit /b 1
)

:: ============================================
:: Criar pasta de backup
:: ============================================
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
    echo [OK] Pasta de backup criada: %BACKUP_DIR%\
)

echo [1/4] Verificando banco de dados...
echo       Arquivo: %DB_FILE%

for %%A in ("%DB_FILE%") do set DB_SIZE=%%~zA
echo       Tamanho: %DB_SIZE% bytes
echo.

:: ============================================
:: Copiar banco de dados
:: ============================================
echo [2/4] Fazendo backup...
echo       Destino: %BACKUP_DIR%\%BACKUP_NAME%

copy "%DB_FILE%" "%BACKUP_DIR%\%BACKUP_NAME%" >nul

if errorlevel 1 (
    echo [ERRO] Falha ao copiar banco de dados!
    echo.
    pause
    exit /b 1
)

echo [OK] Backup criado com sucesso!
echo.

:: ============================================
:: Registrar no log
:: ============================================
echo [3/4] Registrando no log...

echo [%DATE% %TIME%] Backup criado: %BACKUP_NAME% (%DB_SIZE% bytes) >> "%LOG_FILE%"

echo [OK] Log atualizado
echo.

:: ============================================
:: Limpar backups antigos (manter ultimos 30)
:: ============================================
echo [4/4] Limpando backups antigos (manter ultimos 30)...

:: Contar backups
set COUNT=0
for %%F in (%BACKUP_DIR%\backup_*.sqlite3) do set /a COUNT+=1

echo       Total de backups: %COUNT%

if %COUNT% GTR 30 (
    echo [!] Mais de 30 backups encontrados, removendo os mais antigos...
    
    :: Deletar os mais antigos (manter ultimos 30)
    set /a TO_DELETE=%COUNT%-30
    
    for /f "skip=30" %%F in ('dir /b /o-d %BACKUP_DIR%\backup_*.sqlite3') do (
        echo [DEL] %%F
        del "%BACKUP_DIR%\%%F" >nul 2>&1
    )
    
    echo [OK] Backups antigos removidos
) else (
    echo [OK] Quantidade de backups dentro do limite
)

echo.
echo ====================================
echo   BACKUP CONCLUIDO!
echo ====================================
echo.
echo Backup criado: %BACKUP_NAME%
echo Localizacao:   %BACKUP_DIR%\
echo Tamanho:       %DB_SIZE% bytes
echo.
echo Para restaurar:
echo   1. Pare o sistema (PARAR_SISTEMA.bat)
echo   2. Copie o backup para backend\db.sqlite3
echo   3. Reinicie o sistema (INICIAR_SISTEMA.bat)
echo.
echo ====================================
echo.

:: Se executado manualmente, pausar. Se agendado, fechar automaticamente
if "%1"=="" (
    echo Pressione qualquer tecla para sair...
    pause >nul
)
