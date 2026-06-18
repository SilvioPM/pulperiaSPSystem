#!/bin/sh
set -e

echo "🚀 Aplicando schema..."
npx prisma db push --accept-data-loss 2>&1

echo "🌱 Sembrando datos iniciales..."
npx prisma db seed 2>&1 || echo "⚠️ Seed ya ejecutado o datos existentes"

echo "✅ Iniciando aplicación..."
exec npx next start
