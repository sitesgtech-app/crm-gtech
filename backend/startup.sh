#!/bin/sh
echo "Iniciando backend..."

echo "Migrando Base de Datos..."
npx prisma db push --accept-data-loss || { echo "Error en migración"; exit 1; }

echo "Creando Admin..."
node dist/create-admin.js || { echo "Error creando admin"; exit 1; }

export PORT="${PORT:-8080}"
echo "Arrancando Servidor..."
node dist/index.js
