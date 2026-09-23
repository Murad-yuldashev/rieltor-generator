-- AlterTable
ALTER TABLE "RealtorProfile" ADD COLUMN     "customDomain" TEXT,
ADD COLUMN     "customDomainToken" TEXT,
ADD COLUMN     "customDomainVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "RealtorProfile_customDomain_idx" ON "RealtorProfile"("customDomain");
