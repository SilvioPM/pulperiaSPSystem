#!/bin/sh
set -e

echo "🚀 Aplicando migraciones..."
npx prisma migrate deploy 2>&1 || {
  echo "⚠️ Primera ejecución — aplicando schema inicial..."
  npx prisma db push --accept-data-loss 2>&1
}

echo "🌱 Sembrando datos iniciales..."
npx prisma db seed 2>&1 || echo "⚠️ Seed ya ejecutado o datos existentes"

echo "💾 Iniciando programador de respaldos semanales..."
SPSYSTEM_BACKUP_DIR="${SPSYSTEM_BACKUP_DIR:-/app/respaldos}" node /app/lib/backup-cron.mjs &

echo "✅ Iniciando aplicación..."
exec npx next start
