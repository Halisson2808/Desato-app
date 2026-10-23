@echo off
setlocal
cd /d "%~dp0"

where node.exe >nul 2>nul
if errorlevel 1 (
  echo Node.js nao foi encontrado.
  echo Instale o Node.js 18 ou superior e tente novamente.
  pause
  exit /b 1
)

rem Se o servidor ja estiver rodando, so abre o app no navegador.
powershell.exe -NoProfile -Command "try { $r = Invoke-RestMethod 'http://127.0.0.1:4173/api/health' -TimeoutSec 2; if ($r.app -eq 'desato') { Start-Process 'http://127.0.0.1:4173/app'; exit 0 } } catch {}; exit 1" >nul 2>nul
if not errorlevel 1 exit /b 0

rem Abre o app no navegador assim que o servidor responder.
start "" /b powershell.exe -NoProfile -Command "for ($i = 0; $i -lt 60; $i++) { try { $r = Invoke-RestMethod 'http://127.0.0.1:4173/api/health' -TimeoutSec 1; if ($r.app -eq 'desato') { Start-Process 'http://127.0.0.1:4173/app'; exit 0 } } catch {}; Start-Sleep -Seconds 1 }"

rem Terminal normal (cmd /k): Ctrl+C para o servidor e volta ao prompt, sem pergunta.
rem Para reiniciar, digite: node server.js  (o npm start tambem funciona, mas o npm faz a pergunta S/N do Windows)
start "Desato App" cmd /k "set HOST=127.0.0.1&& set PORT=4173&& echo App: http://127.0.0.1:4173/app   Admin: http://127.0.0.1:4173/admin&& echo Para parar: Ctrl+C. Para iniciar de novo: node server.js&& echo.&& node server.js"
endlocal
