-- CreateTable
CREATE TABLE "Lote" (
    "id" SERIAL NOT NULL,
    "productoId" INTEGER NOT NULL,
    "codigoLote" TEXT,
    "cantidad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fechaVencimiento" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lote_productoId_idx" ON "Lote"("productoId");

-- CreateIndex
CREATE INDEX "Lote_fechaVencimiento_idx" ON "Lote"("fechaVencimiento");

-- AddForeignKey
ALTER TABLE "Lote" ADD CONSTRAINT "Lote_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: Add esGenerico column for generic products
ALTER TABLE "Producto" ADD COLUMN "esGenerico" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Add cantidadMinimaMayor for wholesale pricing
ALTER TABLE "Producto" ADD COLUMN "cantidadMinimaMayor" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable: Gastos
CREATE TABLE "Gasto" (
    "id" SERIAL NOT NULL,
    "concepto" TEXT NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'Operativos',
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "metodoPago" TEXT NOT NULL DEFAULT 'efectivo',
    "nota" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Gasto_fecha_idx" ON "Gasto"("fecha");
CREATE INDEX "Gasto_categoria_idx" ON "Gasto"("categoria");
