@echo off
title Sistema Juridico - Instalacao
color 0A
mode con: cols=80 lines=30

echo.
echo ========================================================================
echo           SISTEMA JURIDICO - INSTALACAO AUTOMATICA
echo ========================================================================
echo.
echo Este processo vai instalar todas as dependencias necessarias.
echo Tempo estimado: 10-15 minutos
echo.
pause

echo.
echo [1/5] Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERRO] Python nao encontrado!
    echo Por favor, instale Python 3.8+ em: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)
echo Python encontrado! OK

echo.
echo [2/5] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERRO] Node.js nao encontrado!
    echo Por favor, instale Node.js 16+ em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo Node.js encontrado! OK

echo.
echo [3/5] Instalando dependencias Python (backend)...
cd backend
python -m pip install --upgrade pip --quiet
python -m pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias Python
    pause
    exit /b 1
)
echo Dependencias Python instaladas! OK

echo.
echo [4/5] Instalando dependencias Node.js (frontend)...
cd ..\frontend
call npm install --silent
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias Node.js
    pause
    exit /b 1
)
echo Dependencias Node.js instaladas! OK

echo.
echo [5/5] Criando banco de dados...
cd ..\backend
python manage.py migrate --no-input
if errorlevel 1 (
    echo [AVISO] Falha ao criar banco de dados
)
echo Banco de dados configurado! OK

cd ..

echo.
echo ========================================================================
echo                       INSTALACAO CONCLUIDA!
echo ========================================================================
echo.
echo Proximos passos:
echo   1. Clique duplo em "INICIAR SISTEMA.bat" para abrir o sistema
echo   2. O sistema abrira automaticamente no navegador
echo   3. Para fechar, clique em "PARAR SISTEMA.bat"
echo.
echo Atalhos criados na pasta do projeto.
echo.
pause
