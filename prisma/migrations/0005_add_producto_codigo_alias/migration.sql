-- CreateTable: Códigos alias para productos (múltiples códigos de barras por producto)
CREATE TABLE "ProductoCodigo" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "productoId" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductoCodigo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: código único (no puede repetirse entre productos)
CREATE UNIQUE INDEX "ProductoCodigo_codigo_key" ON "ProductoCodigo"("codigo");

-- CreateIndex: índice para búsqueda rápida por producto
CREATE INDEX "ProductoCodigo_productoId_idx" ON "ProductoCodigo"("productoId");

-- AddForeignKey
ALTER TABLE "ProductoCodigo" ADD CONSTRAINT "ProductoCodigo_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
