/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `RealtorProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "RealtorProfile" ADD COLUMN     "brandColor" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "RealtorProfile_slug_key" ON "RealtorProfile"("slug");
