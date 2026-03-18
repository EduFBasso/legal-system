@echo off
:: Frontend de PRODUÇÃO — serve o build otimizado com vite preview
:: Muito mais rápido que "npm run dev" (arquivos comprimidos, sem HMR)
:: Requer que "npm run build" tenha sido executado antes

cd /d C:\dev\legal-system\frontend
call "C:\Program Files\nodejs\npm.cmd" run preview
