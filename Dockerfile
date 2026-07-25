FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates gnupg && \
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/postgresql-keyring.gpg] http://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \
    apt-get update && apt-get install -y --no-install-recommends postgresql-client-16 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma/ ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 3000

RUN cat > /usr/local/bin/docker-entrypoint.sh << 'SCRIPT'
#!/bin/sh
set -e
echo "🚀 Aplicando migraciones..."
npx prisma migrate deploy 2>&1 || {
  echo "⚠️ Primera ejecucion — aplicando schema inicial..."
  npx prisma db push --accept-data-loss 2>&1
}
echo "🌱 Sembrando datos iniciales..."
npx prisma db seed 2>&1 || echo "⚠️ Seed ya ejecutado o datos existentes"
echo "💾 Iniciando programador de respaldos semanales..."
SPSYSTEM_BACKUP_DIR="${SPSYSTEM_BACKUP_DIR:-/app/respaldos}" node /app/lib/backup-cron.mjs &
echo "✅ Iniciando aplicacion..."
exec npx next start
SCRIPT
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
