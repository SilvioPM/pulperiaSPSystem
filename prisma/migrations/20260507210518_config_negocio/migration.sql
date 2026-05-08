-- CreateTable
CREATE TABLE "Config" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Config_clave_key" ON "Config"("clave");
