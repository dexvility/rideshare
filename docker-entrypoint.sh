#!/bin/sh
set -e

echo "▶ Running database migrations..."
./node_modules/.bin/prisma migrate deploy

echo "▶ Running seed/bootstrap..."
node prisma/seed.js

echo "▶ Starting Next.js..."
exec node server.js
