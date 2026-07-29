-- CreateEnum
CREATE TYPE "ObjectTuri" AS ENUM ('NOVOSTROYKA', 'IKKILAMCHI', 'HOVLI');

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "ism" TEXT NOT NULL,
    "agentlik" TEXT NOT NULL,
    "suratUrl" TEXT NOT NULL,
    "tel" TEXT NOT NULL,
    "tg" TEXT NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Object" (
    "id" TEXT NOT NULL,
    "sarlavha" TEXT NOT NULL,
    "narxSom" BIGINT NOT NULL,
    "narxUsd" INTEGER NOT NULL,
    "xona" INTEGER NOT NULL,
    "maydonM2" DOUBLE PRECISION NOT NULL,
    "qavat" TEXT,
    "tuman" TEXT NOT NULL,
    "manzil" TEXT NOT NULL,
    "moljal" TEXT NOT NULL,
    "tavsif" TEXT NOT NULL,
    "turi" "ObjectTuri" NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "sana" DATE NOT NULL,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "Object_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rasm" (
    "id" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "base" TEXT NOT NULL,
    "ogUrl" TEXT,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "tartib" INTEGER NOT NULL,

    CONSTRAINT "Rasm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Object_turi_idx" ON "Object"("turi");

-- CreateIndex
CREATE UNIQUE INDEX "Rasm_objectId_tartib_key" ON "Rasm"("objectId", "tartib");

-- AddForeignKey
ALTER TABLE "Object" ADD CONSTRAINT "Object_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rasm" ADD CONSTRAINT "Rasm_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "Object"("id") ON DELETE CASCADE ON UPDATE CASCADE;
