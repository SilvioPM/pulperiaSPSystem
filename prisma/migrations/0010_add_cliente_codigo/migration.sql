ALTER TABLE "Cliente" ADD COLUMN "codigo" TEXT;
CREATE UNIQUE INDEX "Cliente_codigo_key" ON "Cliente"("codigo");
