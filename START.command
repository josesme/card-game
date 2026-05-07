#!/bin/bash
cd "$(dirname "$0")"

echo ""
echo "========================================"
echo "  COMPILE - Juego de Cartas Digital"
echo "========================================"
echo ""
echo "Iniciando servidor Node.js..."
echo ""

# Abre el navegador automáticamente después de una pequeña pausa
sleep 2
open "http://localhost:8000"

# Inicia el servidor Node.js
node server.js
