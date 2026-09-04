-- CreateEnum
CREATE TYPE "OrgWalletTxType" AS ENUM ('TOPUP', 'COMMISSION_DEBIT');

-- CreateTable
CREATE TABLE "OrgWallet" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "balanceSom" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgWalletTransaction" (
    "id" TEXT NOT NULL,
    "orgWalletId" TEXT NOT NULL,
    "type" "OrgWalletTxType" NOT NULL,
    "amountSom" BIGINT NOT NULL,
    "fixationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgWalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgWallet_orgId_key" ON "OrgWallet"("orgId");

-- CreateIndex
CREATE INDEX "OrgWalletTransaction_orgWalletId_createdAt_idx" ON "OrgWalletTransaction"("orgWalletId", "createdAt");

-- AddForeignKey
ALTER TABLE "OrgWallet" ADD CONSTRAINT "OrgWallet_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgWalletTransaction" ADD CONSTRAINT "OrgWalletTransaction_orgWalletId_fkey" FOREIGN KEY ("orgWalletId") REFERENCES "OrgWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
