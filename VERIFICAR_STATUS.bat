@echo off
title Sistema Juridico - Status
color 0E

echo.
echo ========================================================================
echo              SISTEMA JURIDICO - STATUS DOS SERVICOS
echo ========================================================================
echo.

echo Verificando Backend (Python)...
tasklist /FI "IMAGENAME eq python.exe" 2>NUL | find /I /N "python.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] Backend RODANDO na porta 8000
) else (
    echo [X] Backend PARADO
)

echo.
echo Verificando Frontend (Node.js)...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] Frontend RODANDO na porta 5173
) else (
    echo [X] Frontend PARADO
)

echo.
echo ========================================================================
echo.
echo Para INICIAR o sistema: Execute "INICIAR SISTEMA.bat"
echo Para PARAR o sistema:   Execute "PARAR SISTEMA.bat"
echo.
pause
