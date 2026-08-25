-- CreateEnum
CREATE TYPE "SnapshotSource" AS ENUM ('MODELED', 'ACTUAL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PRICE_UPDATE');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "ContactReveal" ADD COLUMN     "requestId" TEXT,
ALTER COLUMN "listingId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TrackedProperty" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "label" TEXT,
    "type" "ListingType" NOT NULL,
    "district" TEXT NOT NULL,
    "rooms" INTEGER,
    "areaM2" DOUBLE PRECISION NOT NULL,
    "floor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackedProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceSnapshot" (
    "id" TEXT NOT NULL,
    "trackedPropertyId" TEXT NOT NULL,
    "estimateSom" BIGINT NOT NULL,
    "capturedAt" DATE NOT NULL,
    "source" "SnapshotSource" NOT NULL,

    CONSTRAINT "PriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "targetId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyRequest" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "deal" "Deal" NOT NULL,
    "type" "ListingType",
    "district" TEXT,
    "roomsMin" INTEGER,
    "priceMaxSom" BIGINT,
    "areaMinM2" DOUBLE PRECISION,
    "note" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrackedProperty_ownerId_idx" ON "TrackedProperty"("ownerId");

-- CreateIndex
CREATE INDEX "PriceSnapshot_trackedPropertyId_capturedAt_idx" ON "PriceSnapshot"("trackedPropertyId", "capturedAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PropertyRequest_status_createdAt_idx" ON "PropertyRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ContactReveal_requestId_createdAt_idx" ON "ContactReveal"("requestId", "createdAt");

-- AddForeignKey
ALTER TABLE "TrackedProperty" ADD CONSTRAINT "TrackedProperty_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceSnapshot" ADD CONSTRAINT "PriceSnapshot_trackedPropertyId_fkey" FOREIGN KEY ("trackedPropertyId") REFERENCES "TrackedProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyRequest" ADD CONSTRAINT "PropertyRequest_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
