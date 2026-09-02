-- CreateEnum
CREATE TYPE "LeadOutcomeStage" AS ENUM ('NEW', 'CONTACTED', 'MEETING', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "LeadLostReason" AS ENUM ('NO_RESPONSE', 'WRONG_NUMBER', 'NOT_SERIOUS', 'BOUGHT_ELSEWHERE', 'OTHER');

-- AlterTable
ALTER TABLE "PropertyRequest" ADD COLUMN     "lostReason" "LeadLostReason",
ADD COLUMN     "outcomeStage" "LeadOutcomeStage",
ADD COLUMN     "outcomeUpdatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "PropertyRequest_deal_type_outcomeStage_idx" ON "PropertyRequest"("deal", "type", "outcomeStage");
