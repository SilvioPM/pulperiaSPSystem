-- AlterTable
ALTER TABLE "Compra" ADD COLUMN     "facturaProveedor" TEXT;
CREATE INDEX IF NOT EXISTS "Compra_facturaProveedor_idx" ON "Compra" ("facturaProveedor");
