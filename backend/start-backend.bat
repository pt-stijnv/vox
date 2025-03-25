@echo off
echo Starting Backend Server...
cd %~dp0
call venv\Scripts\activate
uvicorn main:app --reload --port 8000
pause