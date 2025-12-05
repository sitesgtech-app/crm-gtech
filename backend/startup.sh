#!/bin/sh
echo "Iniciando backend..."
export PORT="${PORT:-8080}"
node dist/index.js
