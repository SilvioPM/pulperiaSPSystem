/*
  Warnings:

  - You are about to alter the column `cantidad` on the `MovInventario` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MovInventario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productoId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "cantidad" REAL NOT NULL,
    "cantidadOriginal" REAL NOT NULL DEFAULT 0,
    "unidadOriginal" TEXT NOT NULL DEFAULT 'unidad',
    "motivo" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MovInventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MovInventario" ("cantidad", "creadoEn", "id", "motivo", "productoId", "tipo") SELECT "cantidad", "creadoEn", "id", "motivo", "productoId", "tipo" FROM "MovInventario";
DROP TABLE "MovInventario";
ALTER TABLE "new_MovInventario" RENAME TO "MovInventario";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
