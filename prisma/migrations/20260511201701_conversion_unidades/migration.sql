/*
  Warnings:

  - You are about to drop the column `unidad` on the `Producto` table. All the data in the column will be lost.
  - You are about to alter the column `stock` on the `Producto` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `stockMinimo` on the `Producto` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Producto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "precio" REAL NOT NULL,
    "precioMayor" REAL NOT NULL DEFAULT 0,
    "costo" REAL NOT NULL DEFAULT 0,
    "stock" REAL NOT NULL DEFAULT 0,
    "stockMinimo" REAL NOT NULL DEFAULT 5,
    "unidadBase" TEXT NOT NULL DEFAULT 'unidad',
    "unidadCompra" TEXT NOT NULL DEFAULT 'unidad',
    "factorConversion" REAL NOT NULL DEFAULT 1,
    "categoriaId" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Producto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Producto" ("activo", "categoriaId", "codigo", "costo", "creadoEn", "id", "nombre", "precio", "stock", "stockMinimo") SELECT "activo", "categoriaId", "codigo", "costo", "creadoEn", "id", "nombre", "precio", "stock", "stockMinimo" FROM "Producto";
DROP TABLE "Producto";
ALTER TABLE "new_Producto" RENAME TO "Producto";
CREATE UNIQUE INDEX "Producto_codigo_key" ON "Producto"("codigo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
