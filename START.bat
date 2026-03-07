@echo off
REM Ejecutable para Windows - Inicia servidor y abre navegador

cd /d "%~dp0src"

echo.
echo ========================================
echo   COMPILE - Juego de Cartas Digital
echo ========================================
echo.
echo Iniciando servidor HTTP...
echo.

REM Intenta Python 3
python --version >nul 2>&1
if %errorlevel% equ 0 (
    python -m http.server 8000
) else (
    python3 --version >nul 2>&1
    if %errorlevel% equ 0 (
        python3 -m http.server 8000
    ) else (
        echo ERROR: No se encontro Python
        echo Descarga desde: https://www.python.org/downloads/
        pause
        exit /b 1
    )
)

pause
