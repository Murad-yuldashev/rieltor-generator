-- CreateEnum
CREATE TYPE "FixationStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "WalletTxType" ADD VALUE 'COMMISSION';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "fixationId" TEXT;

-- AlterTable
ALTER TABLE "Complex" ADD COLUMN     "commissionBps" INTEGER;

-- AlterTable
ALTER TABLE "Unit" ADD COLUMN     "commissionBps" INTEGER;

-- AlterTable
ALTER TABLE "WalletTransaction" ADD COLUMN     "fixationId" TEXT;

-- CreateTable
CREATE TABLE "Fixation" (
    "id" TEXT NOT NULL,
    "realtorId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "propertyRequestId" TEXT NOT NULL,
    "buyerPhone" TEXT NOT NULL,
    "status" "FixationStatus" NOT NULL DEFAULT 'ACTIVE',
    "commissionBps" INTEGER NOT NULL,
    "commissionSom" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "Fixation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Fixation_propertyRequestId_key" ON "Fixation"("propertyRequestId");

-- CreateIndex
CREATE INDEX "Fixation_unitId_status_idx" ON "Fixation"("unitId", "status");

-- CreateIndex
CREATE INDEX "Fixation_realtorId_status_idx" ON "Fixation"("realtorId", "status");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_fixationId_fkey" FOREIGN KEY ("fixationId") REFERENCES "Fixation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixation" ADD CONSTRAINT "Fixation_realtorId_fkey" FOREIGN KEY ("realtorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixation" ADD CONSTRAINT "Fixation_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixation" ADD CONSTRAINT "Fixation_propertyRequestId_fkey" FOREIGN KEY ("propertyRequestId") REFERENCES "PropertyRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
