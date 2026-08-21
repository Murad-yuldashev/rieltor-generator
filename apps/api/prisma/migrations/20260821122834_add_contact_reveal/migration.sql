-- CreateTable
CREATE TABLE "ContactReveal" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT,
    "ip" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactReveal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactReveal_listingId_createdAt_idx" ON "ContactReveal"("listingId", "createdAt");
