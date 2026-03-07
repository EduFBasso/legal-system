@echo off
REM Reset Database Script (Windows Batch)
REM This script deletes the SQLite database and recreates it with migrations

setlocal enabledelayedexpansion

echo.
echo [93m^=^=^=^= Database Reset Tool ^=^=^=^=[0m
echo.

REM Check if db.sqlite3 exists
if exist db.sqlite3 (
    echo [91m^(Deleting existing database...^)[0m
    del /F /Q db.sqlite3
    echo [92m^(Database deleted^)[0m
) else (
    echo [96m^(Database file not found - fresh start^)[0m
)

echo.
echo [94m^(Running migrations...^)[0m
echo.

REM Activate virtual environment
call ..\..\.venv\Scripts\activate.bat

REM Run migrations
python manage.py migrate

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [92m^=^=^=^= Database Reset Successfully! ^=^=^=^=[0m
    echo.
    echo Database Stats:
    echo  - New empty SQLite database created
    echo  - All migrations applied
    echo  - Ready for fresh data
    echo.
) else (
    echo.
    echo [91mMigration failed![0m
    pause
    exit /b 1
)

echo [96mTip: You can now start fresh or import test data[0m
echo.
pause
