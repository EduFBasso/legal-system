@echo off
title Sistema Juridico - Parando
color 0C

echo.
echo ========================================================================
echo              SISTEMA JURIDICO - ENCERRANDO...
echo ========================================================================
echo.

REM Parar todos os processos Python (Django)
echo Parando servidor backend (Django)...
taskkill /F /IM python.exe /T >nul 2>&1

REM Parar todos os processos Node (Vite)
echo Parando servidor frontend (Vite)...
taskkill /F /IM node.exe /T >nul 2>&1

REM Limpar arquivo de PIDs
if exist .pids del /F /Q .pids >nul 2>&1

echo.
echo ========================================================================
echo                SISTEMA ENCERRADO COM SUCESSO!
echo ========================================================================
echo.
echo Voce pode fechar esta janela agora.
echo.
timeout /t 3 >nul
