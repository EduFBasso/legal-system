@echo off
:: ============================================================
::  REINICIAR SISTEMA JURIDICO
::  Execute como Administrador (clique direito > Executar como administrador)
:: ============================================================

echo.
echo  ====================================
echo   REINICIANDO O SISTEMA JURIDICO...
echo  ====================================
echo.

echo [1/4] Parando Frontend...
sc.exe stop LegalSystem-Frontend
timeout /t 3 /nobreak >nul

echo [2/4] Parando Backend...
sc.exe stop LegalSystem-Backend
timeout /t 5 /nobreak >nul

echo [3/4] Iniciando Backend...
sc.exe start LegalSystem-Backend
timeout /t 5 /nobreak >nul

echo [4/4] Iniciando Frontend...
sc.exe start LegalSystem-Frontend
timeout /t 3 /nobreak >nul

echo.
echo  ====================================
echo   VERIFICANDO STATUS DOS SERVICOS:
echo  ====================================
echo.
sc.exe query LegalSystem-Backend | find "STATE"
sc.exe query LegalSystem-Frontend | find "STATE"

echo.
echo  Se os dois serviços mostram "RUNNING", o sistema esta no ar!
echo  Aguarde ~30 segundos e acesse o sistema pelo navegador.
echo.
pause
