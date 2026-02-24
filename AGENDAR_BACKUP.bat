@echo off
:: ============================================
:: LEGAL SYSTEM - AGENDAR BACKUP DIARIO
:: Configura Agendador de Tarefas do Windows para backup automatico
:: ============================================

title Legal System - Agendar Backup Automatico
color 0B
cls

echo.
echo =============================================
echo   LEGAL SYSTEM - AGENDAR BACKUP DIARIO
echo =============================================
echo.
echo Este script vai configurar o Windows para
echo fazer backup automatico TODOS OS DIAS as 23h.
echo.
echo Local do backup: backups\
echo Maximo de backups: 30 (ultimos 30 dias)
echo.

set /p CONFIRM="Deseja continuar? (S/N): "
if /I not "%CONFIRM%"=="S" (
    echo Operacao cancelada.
    pause
    exit /b 0
)

echo.
echo Criando tarefa agendada...
echo.

:: ============================================
:: Criar tarefa no Task Scheduler
:: ============================================

set TASK_NAME=LegalSystem_BackupDiario
set SCRIPT_PATH=%~dp0BACKUP_AUTOMATICO.bat
set EXEC_TIME=23:00

:: Deletar tarefa existente (se houver)
schtasks /Delete /TN "%TASK_NAME%" /F >nul 2>&1

:: Criar nova tarefa
schtasks /Create ^
    /TN "%TASK_NAME%" ^
    /TR "\"%SCRIPT_PATH%\" agendado" ^
    /SC DAILY ^
    /ST %EXEC_TIME% ^
    /F

if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao criar tarefa agendada!
    echo.
    echo Solucao:
    echo   1. Execute este script como Administrador
    echo   2. Ou configure manualmente:
    echo      - Abra "Agendador de Tarefas" do Windows
    echo      - Crie nova tarefa basica
    echo      - Acao: "%SCRIPT_PATH%"
    echo      - Gatilho: Diariamente as 23:00
    echo.
    pause
    exit /b 1
)

echo.
echo =============================================
echo   BACKUP AUTOMATICO CONFIGURADO!
echo =============================================
echo.
echo Tarefa:     %TASK_NAME%
echo Horario:    Todos os dias as %EXEC_TIME%
echo Script:     %SCRIPT_PATH%
echo Pasta:      backups\
echo.
echo Para verificar:
echo   1. Abra "Agendador de Tarefas" do Windows
echo   2. Procure por "%TASK_NAME%"
echo.
echo Para testar agora:
echo   Execute BACKUP_AUTOMATICO.bat
echo.
echo =============================================
echo.

echo Pressione qualquer tecla para sair...
pause >nul
