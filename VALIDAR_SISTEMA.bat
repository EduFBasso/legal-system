@echo off
:: ============================================
:: Sistema Juridico - Verificacao Pre-Instalacao
:: Valida se tudo esta pronto para instalacao presencial
:: ============================================

title Sistema Juridico - Verificacao Pre-Instalacao
color 0E
cls

echo.
echo ========================================
echo  Sistema Juridico - Verificacao
echo ========================================
echo.
echo Validando estrutura antes da instalacao presencial...
echo.

set ERRORS=0

:: ============================================
:: 1. Verificar arquivos essenciais
:: ============================================
echo [1/6] Verificando arquivos essenciais...

if not exist "INSTALAR.bat" (
    echo [X] ERRO: INSTALAR.bat nao encontrado
    set /a ERRORS+=1
) else (
    echo [OK] INSTALAR.bat
)

if not exist "INICIAR_SISTEMA.bat" (
    echo [X] ERRO: INICIAR_SISTEMA.bat nao encontrado
    set /a ERRORS+=1
) else (
    echo [OK] INICIAR_SISTEMA.bat
)

if not exist "PARAR_SISTEMA.bat" (
    echo [X] ERRO: PARAR_SISTEMA.bat nao encontrado
    set /a ERRORS+=1
) else (
    echo [OK] PARAR_SISTEMA.bat
)

if not exist "README_INSTALACAO_PARA_CLIENTE.md" (
    echo [X] ERRO: README_INSTALACAO_PARA_CLIENTE.md nao encontrado
    set /a ERRORS+=1
) else (
    echo [OK] README_INSTALACAO_PARA_CLIENTE.md
)

if not exist "LEIA-ME.txt" (
    echo [X] ERRO: LEIA-ME.txt nao encontrado
    set /a ERRORS+=1
) else (
    echo [OK] LEIA-ME.txt
)

if not exist "INSTALACAO_PRESENCIAL_CHECKLIST.md" (
    echo [!] AVISO: INSTALACAO_PRESENCIAL_CHECKLIST.md nao encontrado
) else (
    echo [OK] INSTALACAO_PRESENCIAL_CHECKLIST.md
)

if not exist "DIFERENCIAIS_DO_SISTEMA.md" (
    echo [!] AVISO: DIFERENCIAIS_DO_SISTEMA.md nao encontrado
) else (
    echo [OK] DIFERENCIAIS_DO_SISTEMA.md
)

echo.

:: ============================================
:: 2. Verificar estrutura backend
:: ============================================
echo [2/6] Verificando estrutura backend...

if not exist "backend" (
    echo [X] ERRO: Pasta backend nao encontrada
    set /a ERRORS+=1
    goto skip_backend
)

if not exist "backend\manage.py" (
    echo [X] ERRO: backend\manage.py nao encontrado
    set /a ERRORS+=1
) else (
    echo [OK] backend\manage.py
)

if not exist "backend\requirements.txt" (
    echo [X] ERRO: backend\requirements.txt nao encontrado
    set /a ERRORS+=1
) else (
    echo [OK] backend\requirements.txt
)

if not exist "backend\config" (
    echo [X] ERRO: backend\config\ nao encontrado
    set /a ERRORS+=1
) else (
    echo [OK] backend\config\
)

if not exist "backend\services\pje_comunica.py" (
    echo [X] ERRO: backend\services\pje_comunica.py nao encontrado
    set /a ERRORS+=1
) else (
    echo [OK] backend\services\pje_comunica.py
)

if not exist "backend\apps\publications" (
    echo [X] ERRO: backend\apps\publications\ nao encontrado
    set /a ERRORS+=1
) else (
    echo [OK] backend\apps\publications\
)

:skip_backend
echo.

:: ============================================
:: 3. Verificar estrutura frontend
:: ============================================
echo [3/6] Verificando estrutura frontend...

if not exist "frontend" (
    echo [X] ERRO: Pasta frontend nao encontrada
    set /a ERRORS+=1
    goto skip_frontend
)

if not exist "frontend\package.json" (
    echo [X] ERRO: frontend\package.json nao encontrado
    set /a ERRORS+=1
) else (
    echo [OK] frontend\package.json
)

if not exist "frontend\index.html" (
    echo [X] ERRO: frontend\index.html nao encontrado
    set /a ERRORS+=1
) else (
    echo [OK] frontend\index.html
)

if not exist "frontend\vite.config.js" (
    echo [X] ERRO: frontend\vite.config.js nao encontrado
    set /a ERRORS+=1
) else (
    echo [OK] frontend\vite.config.js
)

if not exist "frontend\src\App.jsx" (
    echo [X] ERRO: frontend\src\App.jsx nao encontrado
    set /a ERRORS+=1
) else (
    echo [OK] frontend\src\App.jsx
)

if not exist "frontend\src\pages\PublicationsPage.jsx" (
    echo [X] ERRO: frontend\src\pages\PublicationsPage.jsx nao encontrado
    set /a ERRORS+=1
) else (
    echo [OK] frontend\src\pages\PublicationsPage.jsx
)

if not exist "frontend\src\components\ContactCard.jsx" (
    echo [X] ERRO: frontend\src\components\ContactCard.jsx nao encontrado
    set /a ERRORS+=1
) else (
    echo [OK] frontend\src\components\ContactCard.jsx
)

:skip_frontend
echo.

:: ============================================
:: 4. Verificar requisitos (Python e Node)
:: ============================================
echo [4/6] Verificando pre-requisitos instalados...

python --version >nul 2>&1
if errorlevel 1 (
    echo [!] AVISO: Python NAO instalado (necessario no computador cliente)
) else (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do echo [OK] Python %%i instalado
)

node --version >nul 2>&1
if errorlevel 1 (
    echo [!] AVISO: Node.js NAO instalado (necessario no computador cliente)
) else (
    for /f "tokens=1" %%i in ('node --version 2^>^&1') do echo [OK] Node.js %%i instalado
)

echo.

:: ============================================
:: 5. Verificar tamanho total
:: ============================================
echo [5/6] Calculando tamanho total do sistema...

:: PowerShell para calcular tamanho
for /f %%i in ('powershell -command "(Get-ChildItem -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB"') do set SIZE=%%i

echo [OK] Tamanho total: ~%SIZE:~0,4% MB
echo.

:: ============================================
:: 6. Testar conectividade com API PJe
:: ============================================
echo [6/6] Testando conectividade com API PJe Comunica...

powershell -command "try { $response = Invoke-WebRequest -Uri 'https://comunicaapi.pje.jus.br/api/v1/' -TimeoutSec 5 -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    echo [!] AVISO: API PJe nao acessivel (pode estar offline ou sem internet)
) else (
    echo [OK] API PJe Comunica acessivel
)

echo.
echo ========================================

:: ============================================
:: Resultado final
:: ============================================
if %ERRORS% GTR 0 (
    color 0C
    echo.
    echo [FALHA] Encontrados %ERRORS% erro(s) criticos!
    echo.
    echo O sistema NAO esta pronto para instalacao.
    echo Corrija os erros acima antes de prosseguir.
    echo.
) else (
    color 0A
    echo.
    echo [SUCESSO] Sistema validado com sucesso!
    echo.
    echo ===== CHECKLIST FINAL =====
    echo [ ] Baixar instaladores offline:
    echo     - Python 3.11+ (python.org)
    echo     - Node.js 20 LTS (nodejs.org)
    echo [ ] Imprimir INSTALACAO_PRESENCIAL_CHECKLIST.md
    echo [ ] Preparar pendrive/HD externo com o sistema
    echo [ ] Testar INSTALAR.bat uma ultima vez
    echo [ ] Testar INICIAR_SISTEMA.bat
    echo.
    echo PRONTO PARA INSTALACAO NO ESCRITORIO!
    echo.
)

echo ========================================
echo.
pause
