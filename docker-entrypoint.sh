#!/bin/sh
set -e

echo "⏳ Esperando a PostgreSQL..."
until pg_isready -h db -U spsystem -q 2>/dev/null; do
  sleep 1
done
echo "✅ PostgreSQL listo"

echo "🚀 Aplicando schema..."
npx prisma db push --accept-data-loss 2>&1

echo "🌱 Sembrando datos iniciales..."
npx prisma db seed 2>&1 || echo "⚠️ Seed ya ejecutado o datos existentes"

echo "✅ Iniciando aplicación..."
exec npx next start
