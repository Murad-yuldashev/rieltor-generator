-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'MODERATION', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" "ListingStatus" NOT NULL DEFAULT 'PUBLISHED';

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");
