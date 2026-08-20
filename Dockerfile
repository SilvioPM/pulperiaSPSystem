FROM node:20-bookworm-slim

# Build-time DATABASE_URL (dummy valid format for Prisma validation during build)
ARG DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV DATABASE_URL=$DATABASE_URL

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

CMD ["sh", "-c", "npx prisma migrate deploy 2>&1; psql \"$DATABASE_URL\" -v ON_ERROR_STOP=1 -f /app/prisma/rls.sql 2>&1; npx prisma db seed 2>&1 || :; SPSYSTEM_BACKUP_DIR=${SPSYSTEM_BACKUP_DIR:-/app/respaldos} node /app/lib/backup-cron.mjs & exec npx next start"]
