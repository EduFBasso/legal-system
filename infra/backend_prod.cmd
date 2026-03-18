@echo off
:: Backend de PRODUÇÃO — usa Waitress (WSGI multi-thread, Windows-compatível)
:: Este arquivo é usado pelo serviço Windows instalado via INSTALAR_SERVIDOR.ps1

cd /d C:\dev\legal-system\backend
C:\dev\legal-system\.venv\Scripts\python.exe -m waitress ^
    --host=0.0.0.0 ^
    --port=8000 ^
    --threads=8 ^
    config.wsgi:application
