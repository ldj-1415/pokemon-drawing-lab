@echo off
setlocal
cd /d "%~dp0"
title Pokemon Drawing Lab

echo.
echo ============================================================
echo   Pokemon Drawing Lab
echo   Pokemon Drawing Random Workbench
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 goto NODE_MISSING

where npm.cmd >nul 2>nul
if errorlevel 1 goto NPM_MISSING

if not exist "node_modules\react\package.json" goto INSTALL

goto START

:INSTALL
echo [1/2] First run: installing dependencies...
echo.
call npm.cmd install
if errorlevel 1 goto INSTALL_FAIL
echo.

:START
echo [2/2] Starting local server...
echo.
echo The browser will open automatically.
echo If it does not, open: http://localhost:5173/
echo.
echo Keep this window open while using the app.
echo Closing this window stops the server.
echo.
call npm.cmd run dev -- --open
if errorlevel 1 goto START_FAIL
goto END

:NODE_MISSING
echo [ERROR] Node.js was not found.
echo.
echo Install Node.js 20.19+ or 22.12+ from https://nodejs.org/
echo.
pause
exit /b 1

:NPM_MISSING
echo [ERROR] npm.cmd was not found.
echo Reinstall Node.js and make sure it is available in PATH.
echo.
pause
exit /b 1

:INSTALL_FAIL
echo.
echo [ERROR] Dependency installation failed.
echo Check your network, or run this command manually: npm.cmd install
echo.
pause
exit /b 1

:START_FAIL
echo.
echo [ERROR] The server could not start.
echo Check the messages above, or run manually: npm.cmd run dev
echo.
pause
exit /b 1

:END
endlocal
