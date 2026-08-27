-- CreateTable
CREATE TABLE "Presentation" (
    "id" TEXT NOT NULL,
    "realtorId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "clientLabel" TEXT,
    "sourceCollectionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Presentation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresentationItem" (
    "id" TEXT NOT NULL,
    "presentationId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "PresentationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresentationView" (
    "id" TEXT NOT NULL,
    "presentationId" TEXT NOT NULL,
    "listingId" TEXT,
    "durationMs" INTEGER,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PresentationView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Presentation_token_key" ON "Presentation"("token");

-- CreateIndex
CREATE INDEX "PresentationView_presentationId_idx" ON "PresentationView"("presentationId");

-- AddForeignKey
ALTER TABLE "Presentation" ADD CONSTRAINT "Presentation_realtorId_fkey" FOREIGN KEY ("realtorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresentationItem" ADD CONSTRAINT "PresentationItem_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "Presentation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresentationItem" ADD CONSTRAINT "PresentationItem_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresentationView" ADD CONSTRAINT "PresentationView_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "Presentation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
