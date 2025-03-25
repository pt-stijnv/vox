@echo off
echo Starting Frontend Server...
cd %~dp0
cd frontend

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo Starting React development server...
call npm start

pause