@echo off
title Sistema Juridico - Inicializando
color 0B

echo.
echo ========================================================================
echo              SISTEMA JURIDICO - INICIANDO...
echo ========================================================================
echo.
echo Aguarde, o sistema abrira automaticamente no navegador.
echo.
echo IMPORTANTE: NAO FECHE ESTA JANELA!
echo Para parar o sistema, clique em "PARAR SISTEMA.bat"
echo.
echo ========================================================================
echo.

REM Salvar PIDs para poder parar depois
echo. > .pids

REM Iniciar backend (Django)
echo [1/2] Iniciando servidor backend...
cd backend
start /B python manage.py runserver 8000 > ..\backend.log 2>&1
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq python.exe" /nh ^| findstr /i "python"') do (
    echo %%a >> ..\.pids
    goto :backend_started
)
:backend_started
cd ..

REM Aguardar backend ficar pronto (5 segundos)
timeout /t 5 /nobreak >nul

REM Iniciar frontend (Vite)
echo [2/2] Iniciando servidor frontend...
cd frontend
start /B cmd /c "npm run dev > ..\frontend.log 2>&1"
cd ..

REM Aguardar frontend ficar pronto (8 segundos)
echo.
echo Aguardando servidores iniciarem (pode levar ate 10 segundos)...
timeout /t 8 /nobreak >nul

REM Abrir navegador
echo.
echo Abrindo navegador...
start http://localhost:5173

echo.
echo ========================================================================
echo                    SISTEMA RODANDO!
echo ========================================================================
echo.
echo O sistema esta disponivel em: http://localhost:5173
echo.
echo Para PARAR o sistema, feche esta janela OU execute "PARAR SISTEMA.bat"
echo.
echo ========================================================================
echo.
echo Aguardando... (Pressione Ctrl+C para parar)

REM Manter janela aberta
pause >nul
