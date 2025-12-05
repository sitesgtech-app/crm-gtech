#!/bin/sh
echo "Iniciando backend..."

echo "Migrando Base de Datos..."
echo "Migrando Base de Datos..."
# Retry logic for DB connection
MAX_RETRIES=5
COUNT=0
while [ $COUNT -lt $MAX_RETRIES ]; do
  # Use timeout 10 to force failure if it hangs, allowing retry
  timeout 10 npx prisma db push --accept-data-loss && break
  COUNT=$((COUNT+1))
  echo "Fallo al conectar (Intento $COUNT/$MAX_RETRIES). Esperando 5s..."
  sleep 5
done

if [ $COUNT -eq $MAX_RETRIES ]; then
  echo "Error fatal: No se pudo conectar a la base de datos después de $MAX_RETRIES intentos."
  exit 1
fi

echo "Creando Admin..."
node dist/create-admin.js || { echo "Error creando admin"; exit 1; }

export PORT="${PORT:-8080}"
echo "Arrancando Servidor..."
node dist/index.js
