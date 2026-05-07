#!/bin/bash
# Ejecutable para Mac/Linux - Inicia servidor y abre navegador

cd "$(dirname "$0")"

echo ""
echo "========================================"
echo "  COMPILE - Juego de Cartas Digital"
echo "========================================"
echo ""
echo "Iniciando servidor Node.js..."
echo ""
echo "Abre tu navegador en: http://localhost:8000"
echo ""
echo "Presiona Ctrl+C para detener el servidor"
echo ""

# Abre el navegador automáticamente después de una pequeña pausa
sleep 2

if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  open "http://localhost:8000"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  xdg-open "http://localhost:8000" 2>/dev/null &
fi

# Inicia el servidor Node.js
node server.js
