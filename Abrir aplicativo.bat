@echo off
setlocal
cd /d "%~dp0"
title Desato App

where node.exe >nul 2>nul
if errorlevel 1 (
  echo Node.js nao foi encontrado.
  echo Instale o Node.js 18 ou superior e tente novamente.
  pause
  exit /b 1
)

set "HOST=127.0.0.1"
set "PORT=4173"
set "DATA_DIR=%~dp0data"

powershell.exe -NoProfile -Command "try { $r = Invoke-RestMethod 'http://127.0.0.1:4173/api/health' -TimeoutSec 2; if ($r.app -eq 'desato') { Start-Process 'http://127.0.0.1:4173'; exit 0 } } catch {}; exit 1" >nul 2>nul
if not errorlevel 1 exit /b 0

echo Iniciando o aplicativo...
echo Endereco: http://127.0.0.1:4173
echo Mantenha esta janela aberta enquanto usar o aplicativo.
echo Para encerrar, pressione Ctrl+C ou feche esta janela.
echo.

start "" /b powershell.exe -NoProfile -Command "for ($i = 0; $i -lt 60; $i++) { try { $r = Invoke-RestMethod 'http://127.0.0.1:4173/api/health' -TimeoutSec 1; if ($r.app -eq 'desato') { Start-Process 'http://127.0.0.1:4173'; exit 0 } } catch {}; Start-Sleep -Seconds 1 }; Write-Host 'Nao foi possivel abrir automaticamente. Confira o erro nesta janela.'"
node.exe server.js
if errorlevel 1 (
  echo.
  echo O servidor nao conseguiu iniciar. Confira a mensagem acima.
  pause
  exit /b 1
)
endlocal
