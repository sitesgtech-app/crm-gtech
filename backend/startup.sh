#!/bin/sh
echo "Iniciando backend..."

echo "Migrando Base de Datos..."
npx prisma db push --accept-data-loss

echo "Creando Admin..."
node dist/create-admin.js

export PORT="${PORT:-8080}"
echo "Arrancando Servidor..."
node dist/index.js
