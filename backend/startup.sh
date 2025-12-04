#!/bin/sh
set -e

echo "Starting deployment script..."

# Verify environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL is not set!"
    exit 1
fi

echo "Applying database schema (db push)..."
# Use direct path to avoid npx overhead and potential issues
./node_modules/.bin/prisma db push --accept-data-loss

if [ $? -ne 0 ]; then
    echo "ERROR: Prisma db push failed!"
    exit 1
fi

echo "Seeding admin user..."
node dist/create-admin.js

if [ $? -ne 0 ]; then
    echo "WARNING: Admin user creation failed, but continuing..."
fi

echo "Starting application server..."
exec node dist/index.js
