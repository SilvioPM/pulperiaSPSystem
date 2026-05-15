-- CreateTable
CREATE TABLE "Proforma" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" TEXT NOT NULL,
    "clienteId" INTEGER,
    "subtotal" REAL NOT NULL,
    "iva" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "nota" TEXT,
    "validoHasta" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Proforma_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DetalleProforma" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "proformaId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    "cantidad" REAL NOT NULL,
    "precio" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    CONSTRAINT "DetalleProforma_proformaId_fkey" FOREIGN KEY ("proformaId") REFERENCES "Proforma" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DetalleProforma_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Proforma_numero_key" ON "Proforma"("numero");
