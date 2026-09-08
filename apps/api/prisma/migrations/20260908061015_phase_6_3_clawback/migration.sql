-- AlterEnum
ALTER TYPE "OrgWalletTxType" ADD VALUE 'COMMISSION_REFUND';

-- AlterEnum
ALTER TYPE "WalletTxType" ADD VALUE 'COMMISSION_CLAWBACK';

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3);
