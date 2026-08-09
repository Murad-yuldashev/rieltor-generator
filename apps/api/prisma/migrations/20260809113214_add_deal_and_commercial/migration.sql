-- CreateEnum
CREATE TYPE "Deal" AS ENUM ('SALE', 'RENT');

-- AlterEnum
ALTER TYPE "ListingType" ADD VALUE 'COMMERCIAL';

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "deal" "Deal" NOT NULL DEFAULT 'SALE',
ALTER COLUMN "rooms" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Listing_deal_idx" ON "Listing"("deal");
