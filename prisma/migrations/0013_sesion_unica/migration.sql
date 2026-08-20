-- Sesión única por usuario (multi-sesión): token de sesión en BD para logout remoto
ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "sessionToken" TEXT;

-- Índice para búsqueda rápida por token de sesión
CREATE INDEX IF NOT EXISTS "Usuario_sessionToken_idx" ON "Usuario" ("sessionToken");