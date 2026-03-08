#!/bin/bash
# Ejecutable para Mac/Linux - Inicia servidor y abre navegador

cd "$(dirname "$0")/src"

echo ""
echo "========================================"
echo "  COMPILE - Juego de Cartas Digital"
echo "========================================"
echo ""
echo "Iniciando servidor HTTP..."
echo ""
echo "Abre tu navegador en: http://localhost:8000"
echo ""
echo "Presiona Ctrl+C para detener el servidor"
echo ""

python3 -m http.server 8000
