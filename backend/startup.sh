#!/bin/sh
set -e

echo "Starting deployment script..."

echo "Applying database schema (db push)..."
# Use direct path to avoid npx overhead and potential issues
./node_modules/.bin/prisma db push --accept-data-loss

echo "Seeding admin user..."
node dist/create-admin.js

echo "Starting application server..."
node dist/index.js
