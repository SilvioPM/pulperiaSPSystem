-- Abonos: método de pago y moneda (para conciliar caja/banco en el arqueo)
ALTER TABLE "Abono" ADD COLUMN IF NOT EXISTS "metodo" TEXT NOT NULL DEFAULT 'efectivo';
ALTER TABLE "Abono" ADD COLUMN IF NOT EXISTS "moneda" TEXT NOT NULL DEFAULT 'C$';

-- Caja: abonos desglosados por método de pago
ALTER TABLE "Caja" ADD COLUMN IF NOT EXISTS "abonosEfectivoCs" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Caja" ADD COLUMN IF NOT EXISTS "abonosEfectivoUs" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Caja" ADD COLUMN IF NOT EXISTS "abonosTarjeta" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Caja" ADD COLUMN IF NOT EXISTS "abonosTransfer" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Deuda pendiente de migraciones anteriores (aplicada directo a BD, ahora queda versionada):
-- idempotencia POS
ALTER TABLE "Factura" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Factura_idempotencyKey_key" ON "Factura"("idempotencyKey");

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS "Producto_fechaVencimiento_idx" ON "Producto"("fechaVencimiento");
CREATE INDEX IF NOT EXISTS "Factura_clienteId_estado_idx" ON "Factura"("clienteId", "estado");
CREATE INDEX IF NOT EXISTS "Factura_creadoEn_estado_idx" ON "Factura"("creadoEn", "estado");
CREATE INDEX IF NOT EXISTS "MovInventario_tipo_motivo_creadoEn_idx" ON "MovInventario"("tipo", "motivo", "creadoEn");
CREATE INDEX IF NOT EXISTS "Compra_facturaProveedor_idx" ON "Compra"("facturaProveedor");
CREATE INDEX IF NOT EXISTS "Compra_creadoEn_idx" ON "Compra"("creadoEn");
CREATE INDEX IF NOT EXISTS "Compra_proveedorId_idx" ON "Compra"("proveedorId");
CREATE INDEX IF NOT EXISTS "Compra_estado_idx" ON "Compra"("estado");
CREATE INDEX IF NOT EXISTS "Compra_creadoEn_estado_idx" ON "Compra"("creadoEn", "estado");
CREATE INDEX IF NOT EXISTS "DetalleCompra_compraId_idx" ON "DetalleCompra"("compraId");
CREATE INDEX IF NOT EXISTS "DetalleCompra_productoId_idx" ON "DetalleCompra"("productoId");
CREATE INDEX IF NOT EXISTS "DetalleProforma_proformaId_idx" ON "DetalleProforma"("proformaId");
CREATE INDEX IF NOT EXISTS "DetalleProforma_productoId_idx" ON "DetalleProforma"("productoId");
CREATE INDEX IF NOT EXISTS "Abono_facturaId_idx" ON "Abono"("facturaId");
CREATE INDEX IF NOT EXISTS "Abono_creadoEn_idx" ON "Abono"("creadoEn");
CREATE INDEX IF NOT EXISTS "AbonoCompra_compraId_idx" ON "AbonoCompra"("compraId");
CREATE INDEX IF NOT EXISTS "AbonoCompra_creadoEn_idx" ON "AbonoCompra"("creadoEn");
CREATE INDEX IF NOT EXISTS "MovimientoCaja_cajaId_idx" ON "MovimientoCaja"("cajaId");
CREATE INDEX IF NOT EXISTS "ArqueoDetalle_cajaId_idx" ON "ArqueoDetalle"("cajaId");