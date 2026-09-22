-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'LEAD_INQUIRY';

-- AlterTable
ALTER TABLE "RealtorProfile" ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "contactTelegram" TEXT,
ADD COLUMN     "contactWhatsapp" TEXT,
ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoTitle" TEXT,
ADD COLUMN     "sitePublished" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "telegramChannelUrl" TEXT;
