@echo off
cd /d "%~dp0"
set PORT=8765

echo Starting Strike Arena...
where python >nul 2>&1
if %ERRORLEVEL%==0 (
  start "Strike Arena Server" /min cmd /c "python -m http.server %PORT%"
) else (
  where py >nul 2>&1
  if %ERRORLEVEL%==0 (
    start "Strike Arena Server" /min cmd /c "py -m http.server %PORT%"
  ) else (
    where npx >nul 2>&1
    if %ERRORLEVEL%==0 (
      start "Strike Arena Server" /min cmd /c "npx --yes serve -l %PORT% ."
    ) else (
      echo Need Python or Node.js installed to open the game with the 3D CT skin.
      pause
      exit /b 1
    )
  )
)

timeout /t 1 /nobreak >nul
start "" "http://localhost:%PORT%/strike.html"
echo Game opened in your browser.
echo Keep the minimized "Strike Arena Server" window open while you play.
echo Close that server window when you're done.
pause
