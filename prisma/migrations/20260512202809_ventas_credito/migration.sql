-- CreateTable
CREATE TABLE "Abono" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "facturaId" INTEGER NOT NULL,
    "monto" REAL NOT NULL,
    "nota" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Abono_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Factura" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" TEXT NOT NULL,
    "clienteId" INTEGER,
    "subtotal" REAL NOT NULL,
    "descuento" REAL NOT NULL DEFAULT 0,
    "iva" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "pagoCon" REAL NOT NULL DEFAULT 0,
    "cambio" REAL NOT NULL DEFAULT 0,
    "metodoPago" TEXT NOT NULL DEFAULT 'efectivo',
    "esCredito" BOOLEAN NOT NULL DEFAULT false,
    "saldoPendiente" REAL NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'pagada',
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Factura_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Factura" ("cambio", "clienteId", "creadoEn", "descuento", "estado", "id", "iva", "metodoPago", "numero", "pagoCon", "subtotal", "total") SELECT "cambio", "clienteId", "creadoEn", "descuento", "estado", "id", "iva", "metodoPago", "numero", "pagoCon", "subtotal", "total" FROM "Factura";
DROP TABLE "Factura";
ALTER TABLE "new_Factura" RENAME TO "Factura";
CREATE UNIQUE INDEX "Factura_numero_key" ON "Factura"("numero");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
